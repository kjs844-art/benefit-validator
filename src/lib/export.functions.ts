/**
 * 내 데이터 내보내기 (JSON).
 *
 * 범위: 로그인한 본인의 서비스·혜택 데이터만.
 * 제외: 비밀번호, 인증 토큰, 서버 비밀키, 다른 사용자의 데이터.
 * 보존: 단위, 시간대, 출처 종류, 관찰(마지막 확인) 시점과 그 정밀도.
 *
 * 이 기능은 "내 데이터"만 내보냅니다. 앱 소스 코드나 인증 시스템 자체를
 * 옮기는 기능이 아닙니다 (DEPLOYMENT.md 참고).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const EXPORT_FORMAT_VERSION = "namun-hyetaek.export.v1";

export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // RLS 는 이미 본인 행만 허용하지만, 소유권 조건을 서버에서도 한 번 더 명시합니다.
    const [{ data: services, error: sErr }, { data: benefits, error: bErr }] = await Promise.all([
      supabase
        .from("services")
        .select(
          "id, name, provider, plan_name, account_label, timezone, subscription_status, trial_ends_at, notes, created_at, updated_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("benefits")
        .select(
          "id, service_id, name, unit, granted_amount, remaining_amount, monthly_cap, extra_limit_note, reset_rule, reset_anchor, observed_at, observed_precision, observed_timezone, source_kind, source_note, created_at, updated_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

    if (sErr || bErr) throw new Error("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");

    return {
      format: EXPORT_FORMAT_VERSION,
      dataset: "user" as const,
      exported_at: new Date().toISOString(),
      scope: "본인 계정의 서비스·혜택 데이터만 포함합니다. 비밀번호·토큰·서버 비밀키는 포함되지 않습니다.",
      counts: { services: services?.length ?? 0, benefits: benefits?.length ?? 0 },
      services: services ?? [],
      benefits: benefits ?? [],
    };
  });
