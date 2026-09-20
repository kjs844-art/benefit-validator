/**
 * Shared, browser-safe domain logic for 남은혜택.
 *
 * Accuracy rules encoded here (see README "정확성 규칙"):
 * - `null` means UNKNOWN, `0` means measured zero. Never coalesce one to the other.
 * - Granted amount and remaining balance are separate fields and never mixed.
 * - Amounts with different units are never summed.
 * - `observedAt` is the moment the value was seen, never "now".
 * - A passed reset time NEVER increases a stored balance; it only marks the
 *   observation as possibly outdated ("리셋 시각 경과").
 */

export type ResetRule =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom"
  | "unknown";

export type SourceKind = "manual" | "ai_text" | "ai_image" | "email" | "import" | "mcp";
export type ObservedPrecision = "minute" | "day";

export type SubscriptionStatus =
  | "active"
  | "trial"
  | "trial_ended"
  | "paused"
  | "cancelled"
  | "unknown";

export interface BenefitRecord {
  id: string;
  service_id: string;
  name: string;
  unit: string;
  granted_amount: number | null;
  remaining_amount: number | null;
  monthly_cap: number | null;
  extra_limit_note: string | null;
  reset_rule: ResetRule;
  reset_anchor: string | null;
  observed_at: string;
  observed_precision: ObservedPrecision;
  observed_timezone: string;
  source_kind: SourceKind;
  source_note: string | null;
}

export interface ServiceRecord {
  id: string;
  name: string;
  provider: string | null;
  plan_name: string | null;
  account_label: string | null;
  timezone: string;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  notes: string | null;
}

export const RESET_RULE_LABELS: Record<ResetRule, string> = {
  none: "리셋 없음",
  daily: "매일 리셋",
  weekly: "매주 리셋",
  monthly: "매월 리셋",
  yearly: "매년 리셋",
  custom: "직접 지정",
  unknown: "리셋 주기 모름",
};

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  manual: "직접 입력",
  ai_text: "AI 분석 (텍스트)",
  ai_image: "AI 분석 (이미지)",
  email: "메일 분석",
  import: "가져오기",
  mcp: "AI 도구",
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "이용 중",
  trial: "무료 체험 중",
  trial_ended: "무료 체험 종료 (계정은 유지)",
  paused: "일시 중지",
  cancelled: "해지됨",
  unknown: "상태 모름",
};

/** UNKNOWN-safe display. `null` → "모름", `0` → "0". */
export function formatAmount(value: number | null, unit?: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "모름";
  const n = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(value);
  return unit ? `${n} ${unit}` : n;
}

export function isUnknown(value: number | null): boolean {
  return value === null || value === undefined || Number.isNaN(value as number);
}

/** Percentage of remaining vs granted — only when BOTH are known and granted > 0. */
export function remainingRatio(b: Pick<BenefitRecord, "granted_amount" | "remaining_amount">):
  | number
  | null {
  if (isUnknown(b.granted_amount) || isUnknown(b.remaining_amount)) return null;
  const granted = b.granted_amount as number;
  if (granted <= 0) return null;
  const ratio = (b.remaining_amount as number) / granted;
  return Math.max(0, Math.min(1, ratio));
}

/** Only sums benefits sharing the exact same unit, and only known values. */
export function sumByUnit(benefits: BenefitRecord[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const b of benefits) {
    if (isUnknown(b.remaining_amount)) continue;
    totals[b.unit] = (totals[b.unit] ?? 0) + (b.remaining_amount as number);
  }
  return totals;
}

/** Observed timestamp formatted at its recorded precision — no fake clock time. */
export function formatObservedAt(b: Pick<BenefitRecord, "observed_at" | "observed_precision" | "observed_timezone">): string {
  const d = new Date(b.observed_at);
  if (Number.isNaN(d.getTime())) return "확인 시점 모름";
  const opts: Intl.DateTimeFormatOptions =
    b.observed_precision === "day"
      ? { year: "numeric", month: "2-digit", day: "2-digit", timeZone: b.observed_timezone }
      : {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: b.observed_timezone,
        };
  const text = new Intl.DateTimeFormat("ko-KR", opts).format(d);
  return b.observed_precision === "day" ? `${text} (날짜만 기록됨)` : `${text} (${b.observed_timezone})`;
}

/** Next reset instant, computed from the anchor. Returns null when unknown. */
export function nextResetAt(b: Pick<BenefitRecord, "reset_rule" | "reset_anchor">, from: Date = new Date()): Date | null {
  if (b.reset_rule === "none" || b.reset_rule === "unknown") return null;
  if (!b.reset_anchor) return null;
  const anchor = new Date(b.reset_anchor);
  if (Number.isNaN(anchor.getTime())) return null;
  if (b.reset_rule === "custom") return anchor > from ? anchor : null;

  const next = new Date(anchor.getTime());
  const guard = 5000;
  let i = 0;
  while (next <= from && i < guard) {
    if (b.reset_rule === "daily") next.setUTCDate(next.getUTCDate() + 1);
    else if (b.reset_rule === "weekly") next.setUTCDate(next.getUTCDate() + 7);
    else if (b.reset_rule === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
    else if (b.reset_rule === "yearly") next.setUTCFullYear(next.getUTCFullYear() + 1);
    else return null;
    i += 1;
  }
  return next;
}

/**
 * True when a reset boundary has passed since the observation.
 * The stored balance is NOT changed — the value is only flagged as outdated.
 */
export function isObservationStale(b: BenefitRecord, now: Date = new Date()): boolean {
  const observed = new Date(b.observed_at);
  if (Number.isNaN(observed.getTime())) return false;
  const nextAfterObservation = nextResetAt(b, observed);
  if (!nextAfterObservation) return false;
  return nextAfterObservation <= now;
}

export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

export const UNITS = [
  "회",
  "건",
  "개",
  "크레딧",
  "포인트",
  "GB",
  "MB",
  "분",
  "시간",
  "원",
  "%",
] as const;
