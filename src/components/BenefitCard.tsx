import {
  formatAmount,
  formatObservedAt,
  isObservationStale,
  isUnknown,
  nextResetAt,
  remainingRatio,
  RESET_RULE_LABELS,
  SOURCE_KIND_LABELS,
  type BenefitRecord,
} from "@/lib/benefits";
import { Badge } from "@/components/ui/badge";
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
    <div className="surface-panel surface-panel-hover flex h-full flex-col p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {serviceName ? (
            <p className="text-xs text-muted-foreground">{serviceName}</p>
          ) : null}
          <h3 className="text-base font-bold">{benefit.name}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{RESET_RULE_LABELS[benefit.reset_rule]}</Badge>
          <Badge variant="outline">{SOURCE_KIND_LABELS[benefit.source_kind]}</Badge>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">마지막 확인 시점의 남은 양</dt>
          <dd
            className={
              isUnknown(benefit.remaining_amount)
                ? "tnum text-xl font-bold text-unknown"
                : "tnum text-xl font-bold text-primary"
            }
          >
            {formatAmount(benefit.remaining_amount, benefit.unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">지급량(총 제공량)</dt>
          <dd className="tnum text-xl font-bold">
            {formatAmount(benefit.granted_amount, benefit.unit)}
          </dd>
        </div>
      </dl>

      {ratio !== null ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          지급량 또는 남은 양을 모르기 때문에 비율은 계산하지 않습니다.
        </p>
      )}

      <div className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
        <p>확인 시점: {formatObservedAt(benefit)}</p>
        {benefit.monthly_cap !== null ? (
          <p>월 상한: {formatAmount(benefit.monthly_cap, benefit.unit)}</p>
        ) : null}
        {benefit.extra_limit_note ? <p>추가 제한: {benefit.extra_limit_note}</p> : null}
        {next ? (
          <p>
            다음 리셋 예정:{" "}
            {new Intl.DateTimeFormat("ko-KR", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: benefit.observed_timezone,
            }).format(next)}
          </p>
        ) : null}
        {benefit.source_note ? <p>출처 메모: {benefit.source_note}</p> : null}
      </div>

      {stale ? (
        <p className="mt-3 rounded-md border border-unknown/40 bg-unknown/10 px-3 py-2 text-xs leading-relaxed text-unknown">
          리셋 시각이 지났습니다. 잔량이 자동으로 늘어나지는 않으므로, 실제 값을 다시 확인해 주세요.
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
    </div>
  );
}
