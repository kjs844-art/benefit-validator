import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  appUserReconnectRequired,
  authorizeAppUserOAuth,
  callAsAppUser,
  disconnectAppUser,
  exchangeAppUserOAuthCode,
} from "@/integrations/lovable/appUserConnector";
import {
  deleteConnectionKeyForUser,
  getConnectionKeyForUser,
  saveConnectionKeyForUser,
} from "@/server/appUserConnections.server";
import { DAILY_AI_LIMIT } from "./ai.functions";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "google_mail";
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.readonly",
];

const GmailDiscovery = z.object({
  service_name: z.string(),
  benefit_kind: z.enum(["membership", "trial", "coupon", "credit", "point", "storage", "receipt", "expiration", "other"]),
  benefit_name: z.string(),
  unit: z.string(),
  granted_amount: z.number().nullable(),
  remaining_amount: z.number().nullable(),
  trial_days: z.number().int().nullable(),
  remaining_days: z.number().int().nullable(),
  expires_at: z.string().nullable(),
  evidence_message_index: z.number().int().min(0),
  confidence: z.enum(["high", "medium", "low"]),
});

const GmailResult = z.object({ discoveries: z.array(GmailDiscovery), warnings: z.array(z.string()) });
export type GmailDiscoveryResult = z.infer<typeof GmailDiscovery> & {
  id: string;
  evidence_date: string;
  evidence_subject: string;
};

type GmailMessage = {
  id?: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailPart;
};
type GmailPart = {
  mimeType?: string;
  headers?: Array<{ name?: string; value?: string }>;
  body?: { data?: string };
  parts?: GmailPart[];
};

function decodeBase64Url(value?: string) {
  if (!value) return "";
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function textFromPart(part?: GmailPart): string {
  if (!part) return "";
  if (part.mimeType === "text/plain") return decodeBase64Url(part.body?.data);
  const plain = part.parts?.find((item) => item.mimeType === "text/plain");
  if (plain) return textFromPart(plain);
  return (part.parts ?? []).map(textFromPart).filter(Boolean).join("\n");
}

function header(message: GmailMessage, name: string) {
  return message.payload?.headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

async function gmailRequest(connectionAPIKey: string, path: string) {
  const response = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: CONNECTOR_ID,
    path,
    requiredScopes: GMAIL_SCOPES,
  });
  if (await appUserReconnectRequired(response)) return { reconnectRequired: true as const, response };
  if (!response.ok) {
    const body = await response.text();
    console.error(`Gmail request failed [${response.status}]: ${body}`);
    throw new Error(`Gmail 요청에 실패했습니다 (${response.status}).`);
  }
  return { reconnectRequired: false as const, response };
}

export const startGmailConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientAPIKey = process.env["GOOGLE_MAIL_APP_USER_CONNECTOR_CLIENT_API_KEY"];
    if (!clientAPIKey) throw new Error("Gmail OAuth 클라이언트 설정이 필요합니다.");
    const request = getRequest();
    if (!request) throw new Error("Gmail 연결 요청을 시작할 수 없습니다.");
    const requestUrl = new URL(request.url);
    const forwardedHost = requestUrl.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const origin = forwardedHost ? `https://${forwardedHost}` : requestUrl.origin;
    const storedKey = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey,
      returnUrl: new URL("/oauth/gmail/return", origin).toString(),
      connectionAPIKey: storedKey ?? undefined,
      credentialsConfiguration: { scopes: GMAIL_SCOPES },
    });
    return { authorizationUrl };
  });

export const completeGmailConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().min(1).max(2048) }).parse(input))
  .handler(async ({ data, context }) => {
    const result = await exchangeAppUserOAuthCode(GATEWAY_BASE_URL, data.code);
    if (result.connectorId !== CONNECTOR_ID) throw new Error("잘못된 메일 연결 응답입니다.");
    await saveConnectionKeyForUser(context.userId, CONNECTOR_ID, result.connectionAPIKey);
    return { ok: true };
  });

export const getGmailConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!key) return { connected: false, reconnectRequired: false, email: null };
    const result = await gmailRequest(key, "/gmail/v1/users/me/profile");
    if (result.reconnectRequired) return { connected: false, reconnectRequired: true, email: null };
    const profile = (await result.response.json()) as { emailAddress?: string };
    return { connected: true, reconnectRequired: false, email: profile.emailAddress ?? null };
  });

export const disconnectGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (key) {
      await disconnectAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: CONNECTOR_ID });
      await deleteConnectionKeyForUser(context.userId, CONNECTOR_ID);
    }
    return { ok: true };
  });

export const deleteGmailDiscoveries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("email_discoveries").delete().eq("user_id", context.userId);
    if (error) throw new Error("메일 분석 결과를 삭제하지 못했습니다.");
    return { ok: true };
  });

export const scanGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!key) throw new Error("먼저 Gmail을 연결해 주세요.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: remaining, error: quotaError } = await supabaseAdmin.rpc("consume_ai_quota", {
      _user_id: context.userId,
      _daily_limit: DAILY_AI_LIMIT,
    });
    if (quotaError) throw new Error("AI 사용량을 확인하지 못했습니다.");
    if (typeof remaining === "number" && remaining < 0) throw new Error(`오늘의 AI 분석 한도(${DAILY_AI_LIMIT}회)를 모두 사용했습니다.`);

    const query = "newer_than:2y {subject:가입 subject:welcome subject:trial subject:체험 subject:coupon subject:쿠폰 subject:credit subject:크레딧 subject:포인트 subject:receipt subject:영수증 subject:subscription subject:구독 subject:만료}";
    const listed = await gmailRequest(key, `/gmail/v1/users/me/messages?maxResults=30&q=${encodeURIComponent(query)}`);
    if (listed.reconnectRequired) return { reconnectRequired: true, discoveries: [], warnings: [] };
    const listBody = (await listed.response.json()) as { messages?: Array<{ id?: string }> };
    const ids = (listBody.messages ?? []).flatMap((message) => (message.id ? [message.id] : []));
    if (ids.length === 0) return { reconnectRequired: false, discoveries: [], warnings: ["최근 2년 메일에서 분석 후보를 찾지 못했습니다."] };

    const messages: Array<{ id: string; date: string; subject: string; body: string }> = [];
    for (const id of ids) {
      const fetched = await gmailRequest(key, `/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full`);
      if (fetched.reconnectRequired) return { reconnectRequired: true, discoveries: [], warnings: [] };
      const message = (await fetched.response.json()) as GmailMessage;
      const subject = header(message, "Subject") || "제목 없음";
      const body = (textFromPart(message.payload) || message.snippet || "").replace(/\s+/g, " ").slice(0, 3000);
      const timestamp = message.internalDate ? Number(message.internalDate) : Number.NaN;
      const date = Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date(header(message, "Date")).toISOString();
      messages.push({ id, date, subject, body });
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI 설정이 완료되지 않았습니다.");
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const material = messages.map((message, index) => `[메일 ${index}]\n수신일: ${message.date}\n제목: ${message.subject}\n내용: ${message.body}`).join("\n\n");
    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      system: `Gmail 읽기 전용 분석 결과를 구조화한다. 회원가입, 무료 체험, 쿠폰·프로모션, 크레딧·포인트·용량 지급, 구독·결제 영수증, 혜택 만료만 추출한다. 현재 잔량이나 남은 기간은 메일에 명시된 경우에만 숫자로 기록하고, 지급량으로부터 계산하거나 추측하지 않는다. 명시되지 않으면 remaining_amount와 remaining_days는 null이다. 동일 혜택은 중복 생성하지 않는다. 근거 메일 번호를 evidence_message_index에 기록한다. 원문 속 이름·주소·결제수단 등 개인정보는 결과에 포함하지 않는다. 설명은 한국어로 쓴다.`,
      prompt: material,
      output: Output.object({ schema: GmailResult }),
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false } },
    });
    const extracted = await result.output;
    const rows = extracted.discoveries.flatMap((item) => {
      const evidence = messages[item.evidence_message_index];
      if (!evidence) return [];
      return [{
        user_id: context.userId,
        service_name: item.service_name,
        benefit_kind: item.benefit_kind,
        benefit_name: item.benefit_name,
        unit: item.unit,
        granted_amount: item.granted_amount,
        remaining_amount: item.remaining_amount,
        trial_days: item.trial_days,
        remaining_days: item.remaining_days,
        expires_at: item.expires_at,
        evidence_date: evidence.date,
        evidence_subject: evidence.subject.slice(0, 500),
        confidence: item.confidence,
        source_provider: "gmail",
        source_message_id_hash: createHash("sha256").update(evidence.id).digest("hex"),
      }];
    });
    if (rows.length) {
      const { error } = await context.supabase.from("email_discoveries").upsert(rows, {
        onConflict: "user_id,source_provider,source_message_id_hash,benefit_name",
      });
      if (error) throw new Error("분석 결과를 저장하지 못했습니다.");
    }
    const { data: saved, error: readError } = await context.supabase
      .from("email_discoveries")
      .select("id,service_name,benefit_kind,benefit_name,unit,granted_amount,remaining_amount,trial_days,remaining_days,expires_at,evidence_date,evidence_subject,confidence")
      .eq("user_id", context.userId)
      .order("evidence_date", { ascending: false });
    if (readError) throw new Error("분석 결과를 불러오지 못했습니다.");
    return { reconnectRequired: false, discoveries: saved ?? [], warnings: extracted.warnings };
  });