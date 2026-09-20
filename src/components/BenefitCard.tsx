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

export function BenefitCard({
  benefit,
  serviceName,
  onEdit,
  onDelete,
}: {
  benefit: BenefitRecord;
  serviceName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const ratio = remainingRatio(benefit);
  const stale = isObservationStale(benefit);
  const next = nextResetAt(benefit);

  return (
    <article className="surface-panel surface-panel-hover flex h-full flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {serviceName ? (
            <p className="text-xs text-muted-foreground">{serviceName}</p>
          ) : null}
          <h3 className="text-base font-semibold">{benefit.name}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip>{RESET_RULE_LABELS[benefit.reset_rule]}</Chip>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">남은 양</dt>
          <dd><Amount value={benefit.remaining_amount} unit={benefit.unit} tone="primary" size="lg" /></dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">지급량(총 제공량)</dt>
          <dd><Amount value={benefit.granted_amount} unit={benefit.unit} /></dd>
        </div>
      </dl>

      {ratio !== null ? (
        <div className="mt-3"><Meter ratio={ratio} label={`${benefit.name} 남은 비율`} /></div>
      ) : (
        <div className="mt-3 h-1.5 rounded-full bg-muted" />
      )}

      <dl className="mt-4 border-t border-border pt-3">
        <DetailRow label="확인 시점">{formatObservedAt(benefit)}</DetailRow>
        {benefit.monthly_cap !== null ? (
          <DetailRow label="월 상한">{formatAmount(benefit.monthly_cap, benefit.unit)}</DetailRow>
        ) : null}
        {benefit.extra_limit_note ? <DetailRow label="추가 제한">{benefit.extra_limit_note}</DetailRow> : null}
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
        <DetailRow label="출처">{SOURCE_KIND_LABELS[benefit.source_kind]}{benefit.source_note ? `, ${benefit.source_note}` : ""}</DetailRow>
      </dl>

      {stale ? (
        <p className="mt-3 rounded-md border border-unknown/40 bg-unknown/10 px-3 py-2 text-xs leading-relaxed text-unknown">
          리셋 시각이 지났습니다. 실제 값을 다시 확인해 주세요.
        </p>
      ) : null}

      {(onEdit || onDelete) && (
        <div className="mt-auto flex gap-2 pt-3">
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
      )}
    </article>
  );
}
