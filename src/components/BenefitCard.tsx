import {
  formatAmount,
  formatObservedAt,
  isObservationStale,
  nextResetAt,
  remainingRatio,
  RESET_RULE_LABELS,
  SOURCE_KIND_LABELS,
  type BenefitRecord,
} from "@/lib/benefits";
import { Amount, Chip, DetailRow, Meter } from "@/components/figures";
import { Button } from "@/components/ui/button";

/**
 * One benefit, laid out like a line on a statement: what is left reads first
 * and largest, what was granted sits beside it for scale, and the provenance
 * (when it was seen, where it came from) sits below a rule in label size.
 */
export function BenefitCard({
  benefit,
  serviceName,
  onEdit,
  onDelete,
}: {
  benefit: BenefitRecord;
  serviceName?: string | undefined;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
}) {
  const ratio = remainingRatio(benefit);
  const stale = isObservationStale(benefit);
  const next = nextResetAt(benefit);

  return (
    <article className="surface-panel surface-panel-hover flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {serviceName ? (
            <p className="truncate text-xs text-muted-foreground">{serviceName}</p>
          ) : null}
          <h3 className="mt-0.5 text-base">{benefit.name}</h3>
        </div>
        <Chip>{RESET_RULE_LABELS[benefit.reset_rule]}</Chip>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="eyebrow">남은 양</p>
          <div className="mt-1.5">
            <Amount value={benefit.remaining_amount} unit={benefit.unit} tone="primary" size="lg" />
          </div>
        </div>
        <div>
          <p className="eyebrow">지급량</p>
          <div className="mt-1.5">
            <Amount value={benefit.granted_amount} unit={benefit.unit} size="md" />
          </div>
        </div>
      </div>

      {ratio !== null ? (
        <div className="mt-4">
          <Meter ratio={ratio} label={`${benefit.name} 남은 비율`} />
        </div>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          지급량과 남은 양을 모두 알 때만 비율을 계산합니다.
        </p>
      )}

      <dl className="mt-4 border-t border-hairline pt-3">
        <DetailRow label="확인 시점">{formatObservedAt(benefit)}</DetailRow>
        {benefit.monthly_cap !== null ? (
          <DetailRow label="월 상한">{formatAmount(benefit.monthly_cap, benefit.unit)}</DetailRow>
        ) : null}
        {benefit.extra_limit_note ? (
          <DetailRow label="추가 제한">{benefit.extra_limit_note}</DetailRow>
        ) : null}
        {next ? (
          <DetailRow label="다음 리셋">
            {new Intl.DateTimeFormat("ko-KR", {
              dateStyle: "medium",
              timeStyle: "short",
              hour12: false,
              timeZone: benefit.observed_timezone,
            }).format(next)}
          </DetailRow>
        ) : null}
        <DetailRow label="출처">
          {SOURCE_KIND_LABELS[benefit.source_kind]}
          {benefit.source_note ? `, ${benefit.source_note}` : ""}
        </DetailRow>
      </dl>

      {stale ? (
        <p className="mt-4 rounded-md border border-unknown/35 bg-unknown/10 px-3 py-2 text-xs leading-relaxed text-unknown">
          리셋 시각이 지났습니다. 기록된 값은 그대로 두었으니 실제 값을 다시 확인해 주세요.
        </p>
      ) : null}

      {onEdit || onDelete ? (
        <div className="mt-auto flex gap-2 pt-4">
          {onEdit ? (
            <Button size="sm" variant="outline" onClick={onEdit}>
              수정
            </Button>
          ) : null}
          {onDelete ? (
            <Button size="sm" variant="ghost" onClick={onDelete}>
              삭제
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
