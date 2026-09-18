/**
 * AI 자료 분석 서버 함수.
 *
 * - 인증 필수 (requireSupabaseAuth): 비로그인 호출은 401.
 * - 호출 한도는 서버에서 강제 (public.consume_ai_quota, 사용자별 하루 20회).
 * - LOVABLE_API_KEY 는 서버 핸들러 안에서만 읽습니다.
 * - 모델은 값을 만들어내지 않고, 모르면 null 을 반환하도록 지시합니다.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export const DAILY_AI_LIMIT = 20;

const AnalyzeInput = z.object({
  text: z.string().max(20000).optional(),
  /** data URL (image/png|jpeg|webp) of a screenshot, optional */
  imageDataUrl: z.string().max(8_000_000).optional(),
  /** ISO date the material is from, when the user knows it */
  materialDate: z.string().max(40).optional(),
  timezone: z.string().max(64).default("Asia/Seoul"),
});

const ExtractedBenefit = z.object({
  service_name: z.string(),
  plan_name: z.string().nullable(),
  benefit_name: z.string(),
  unit: z.string(),
  granted_amount: z.number().nullable(),
  remaining_amount: z.number().nullable(),
  monthly_cap: z.number().nullable(),
  extra_limit_note: z.string().nullable(),
  reset_rule: z.enum(["none", "daily", "weekly", "monthly", "yearly", "custom", "unknown"]),
  observed_date: z.string().nullable(),
  observed_time: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  note: z.string().nullable(),
});

const ExtractionResult = z.object({
  benefits: z.array(ExtractedBenefit),
  warnings: z.array(z.string()),
});

export type ExtractedBenefit = z.infer<typeof ExtractedBenefit>;
export type ExtractionResult = z.infer<typeof ExtractionResult>;

const SYSTEM_PROMPT = `너는 구독 서비스 혜택 잔량을 정리하는 보조 도구다. 다음 규칙을 반드시 지켜라.

1. 자료에 없는 값은 절대 추측하지 말고 null 로 둔다. 0 은 "자료에 0 이라고 적혀 있을 때"만 쓴다.
2. 지급량(granted_amount)과 현재 남은 양(remaining_amount)을 절대 섞지 않는다. 한쪽만 적혀 있으면 다른 쪽은 null.
3. 단위(unit)는 자료에 적힌 그대로 쓴다. 단위가 다른 항목을 합치지 않는다.
4. 같은 혜택이 여러 번 언급되면 하나의 항목으로만 만든다.
5. 자료에 날짜만 있으면 observed_time 은 null 로 둔다. 시각을 지어내지 않는다.
6. 무료 체험 종료는 계정 종료가 아니다. 그런 내용은 note 에만 적는다.
7. 월 상한 등 추가 제한은 monthly_cap 또는 extra_limit_note 에 남긴다.
8. 확실하지 않으면 confidence 를 low 로 하고 warnings 에 이유를 적는다.
모든 설명 문구는 한국어로 쓴다.`;

export const analyzeMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI 설정이 완료되지 않았습니다 (LOVABLE_API_KEY 없음).");

    if (!data.text?.trim() && !data.imageDataUrl) {
      throw new Error("분석할 텍스트나 이미지를 입력해 주세요.");
    }

    // --- server-side rate limit (service role only) ---
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: remaining, error: quotaError } = await supabaseAdmin.rpc("consume_ai_quota", {
      _user_id: context.userId,
      _daily_limit: DAILY_AI_LIMIT,
    });
    if (quotaError) throw new Error("사용량 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    if (typeof remaining === "number" && remaining < 0) {
      throw new Error(`오늘의 AI 분석 한도(${DAILY_AI_LIMIT}회)를 모두 사용했습니다. 내일 다시 시도해 주세요.`);
    }

    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const parts: Array<Record<string, unknown>> = [];
    const header = [
      data.materialDate ? `자료 기준 날짜: ${data.materialDate}` : "자료 기준 날짜: 알 수 없음",
      `사용자 시간대: ${data.timezone}`,
    ].join("\n");
    parts.push({ type: "text", text: header });
    if (data.text?.trim()) parts.push({ type: "text", text: data.text.trim() });
    if (data.imageDataUrl) parts.push({ type: "image", image: data.imageDataUrl });

    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: parts as never }],
        output: Output.object({ schema: ExtractionResult }),
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      return (await result.output) as ExtractionResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("429")) throw new Error("AI 요청이 몰리고 있습니다. 잠시 후 다시 시도해 주세요.");
      if (message.includes("402")) throw new Error("AI 크레딧이 부족합니다. 워크스페이스 크레딧을 충전해 주세요.");
      console.error("analyzeMaterial failed", error);
      throw new Error("AI 분석에 실패했습니다. 자료를 줄여서 다시 시도해 보세요.");
    }
  });

/** 오늘 남은 AI 호출 수 (표시용). 한도 자체는 분석 시점에 서버에서 강제됩니다. */
export const getAiUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await context.supabase
      .from("ai_usage")
      .select("call_count")
      .eq("user_id", context.userId)
      .eq("usage_date", today)
      .maybeSingle();
    const used = data?.call_count ?? 0;
    return { used, limit: DAILY_AI_LIMIT, remaining: Math.max(0, DAILY_AI_LIMIT - used) };
  });
