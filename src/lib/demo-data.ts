/**
 * Demo dataset for signed-out visitors (hackathon judges).
 * This data lives ONLY in the browser. It is never written to the database and
 * never mixed with a signed-in user's records. Every export of it is stamped
 * `"dataset": "demo"`.
 */
import type { BenefitRecord, ServiceRecord } from "./benefits";

export const DEMO_NOTICE =
  "데모 데이터입니다. 저장되지 않으며 실제 계정 데이터와 분리되어 있습니다.";

function iso(daysAgo: number, hours = 9, minutes = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function anchor(daysFromNow: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export interface DemoDataset {
  services: ServiceRecord[];
  benefits: BenefitRecord[];
}

/** Built lazily (never at module scope) to stay Worker-safe. */
export function buildDemoData(): DemoDataset {
  const services: ServiceRecord[] = [
    {
      id: "demo-svc-1",
      name: "스트리밍 플러스",
      provider: "Demo Media",
      plan_name: "스탠다드",
      account_label: "본인 계정",
      timezone: "Asia/Seoul",
      subscription_status: "active",
      trial_ends_at: null,
      notes: null,
    },
    {
      id: "demo-svc-2",
      name: "AI 어시스턴트",
      provider: "Demo Labs",
      plan_name: "무료 체험",
      account_label: "업무용",
      timezone: "Asia/Seoul",
      subscription_status: "trial",
      trial_ends_at: anchor(6),
      notes: "체험 종료 후에도 계정은 유지됩니다.",
    },
    {
      id: "demo-svc-3",
      name: "커피 구독",
      provider: "Demo Coffee",
      plan_name: "월 4잔",
      account_label: null,
      timezone: "Asia/Seoul",
      subscription_status: "active",
      trial_ends_at: null,
      notes: null,
    },
    {
      id: "demo-svc-4",
      name: "디자인 스튜디오",
      provider: "Demo Design",
      plan_name: "Pro 체험",
      account_label: "샘플 Gmail 분석",
      timezone: "Asia/Seoul",
      subscription_status: "trial",
      trial_ends_at: anchor(4),
      notes: "메일에서 확인된 가입 서비스 예시입니다.",
    },
  ];

  const benefits: BenefitRecord[] = [
    {
      id: "demo-b-1",
      service_id: "demo-svc-1",
      name: "동시 시청 기기",
      unit: "개",
      granted_amount: 2,
      remaining_amount: 2,
      monthly_cap: null,
      extra_limit_note: null,
      reset_rule: "none",
      reset_anchor: null,
      observed_at: iso(2, 21, 30),
      observed_precision: "minute",
      observed_timezone: "Asia/Seoul",
      source_kind: "manual",
      source_note: null,
    },
    {
      id: "demo-b-2",
      service_id: "demo-svc-1",
      name: "오프라인 저장",
      unit: "개",
      granted_amount: 100,
      remaining_amount: 0,
      monthly_cap: null,
      extra_limit_note: "기기당 100개 제한이 따로 있습니다.",
      reset_rule: "unknown",
      reset_anchor: null,
      observed_at: iso(5, 12, 0),
      observed_precision: "day",
      observed_timezone: "Asia/Seoul",
      source_kind: "ai_image",
      source_note: "앱 설정 화면 캡처에서 추출",
    },
    {
      id: "demo-b-3",
      service_id: "demo-svc-2",
      name: "고급 모델 요청",
      unit: "회",
      granted_amount: 50,
      remaining_amount: 12,
      monthly_cap: 200,
      extra_limit_note: "월 200회 상한이 별도로 적용됩니다.",
      reset_rule: "daily",
      reset_anchor: anchor(0),
      observed_at: iso(1, 3, 15),
      observed_precision: "minute",
      observed_timezone: "Asia/Seoul",
      source_kind: "ai_text",
      source_note: "요금제 안내문 붙여넣기",
    },
    {
      id: "demo-b-4",
      service_id: "demo-svc-2",
      name: "파일 업로드 용량",
      unit: "GB",
      granted_amount: null,
      remaining_amount: null,
      monthly_cap: null,
      extra_limit_note: "안내문에 수치가 없어 확인하지 못했습니다.",
      reset_rule: "unknown",
      reset_anchor: null,
      observed_at: iso(1, 3, 15),
      observed_precision: "minute",
      observed_timezone: "Asia/Seoul",
      source_kind: "ai_text",
      source_note: "값을 찾지 못해 '모름'으로 기록",
    },
    {
      id: "demo-b-5",
      service_id: "demo-svc-3",
      name: "무료 음료 쿠폰",
      unit: "회",
      granted_amount: 4,
      remaining_amount: 1,
      monthly_cap: 4,
      extra_limit_note: null,
      reset_rule: "monthly",
      reset_anchor: anchor(3),
      observed_at: iso(9, 10, 0),
      observed_precision: "day",
      observed_timezone: "Asia/Seoul",
      source_kind: "manual",
      source_note: null,
    },
    {
      id: "demo-b-6",
      service_id: "demo-svc-4",
      name: "Pro 무료 체험",
      unit: "일",
      granted_amount: 14,
      remaining_amount: null,
      monthly_cap: null,
      extra_limit_note: "메일에 현재 남은 기간이 없어 잔량 확인 필요",
      reset_rule: "none",
      reset_anchor: null,
      observed_at: iso(1, 0, 0),
      observed_precision: "day",
      observed_timezone: "Asia/Seoul",
      source_kind: "email",
      source_note: "근거 메일: 2026-09-19 · Pro 무료 체험이 시작되었습니다 · 신뢰도 높음",
    },
  ];

  return { services, benefits };
}
