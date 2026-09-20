import {
  formatAmount,
  formatObservedAt,
  isObservationStale,
  nextResetAt,
  RESET_RULE_LABELS,
  SOURCE_KIND_LABELS,
  type BenefitRecord,
  remainingRatio,
} from "@/lib/benefits";
import { Amount, Chip, DetailRow, Meter } from "@/components/figures";
import { Button } from "@/components/ui/button";
import { CircleAlert, RotateCcw } from "lucide-react";

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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {serviceName ?? "Benefit"}
          </p>
          <h3 className="mt-1 truncate text-lg font-bold">{benefit.name}</h3>
        </div>
        <Chip>{RESET_RULE_LABELS[benefit.reset_rule]}</Chip>
      </div>
      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">현재 잔량</p>
          <Amount value={benefit.remaining_amount} unit={benefit.unit} tone="primary" size="lg" />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">총 제공량</p>
          <p className="tnum text-sm font-semibold">
            {formatAmount(benefit.granted_amount, benefit.unit)}
          </p>
        </div>
      </div>
      {ratio !== null ? (
        <div className="mt-4">
          <Meter ratio={ratio} label={`${benefit.name} 남은 비율`} />
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <CircleAlert className="size-3.5" />
          현재 잔량을 확인할 수 없어요.
        </div>
      )}
      <dl className="mt-5 space-y-2 border-t border-border/70 pt-4">
        <DetailRow label="확인 시점">{formatObservedAt(benefit)}</DetailRow>
        {benefit.monthly_cap !== null ? (
          <DetailRow label="월 상한">{formatAmount(benefit.monthly_cap, benefit.unit)}</DetailRow>
        ) : null}
        {next ? (
          <DetailRow label="다음 리셋">
            <span className="inline-flex items-center gap-1">
              <RotateCcw className="size-3 text-primary" />
              {new Intl.DateTimeFormat("ko-KR", {
                dateStyle: "medium",
                timeStyle: "short",
                hour12: false,
                timeZone: benefit.observed_timezone,
              }).format(next)}
            </span>
          </DetailRow>
        ) : null}
        <DetailRow label="출처">
          {SOURCE_KIND_LABELS[benefit.source_kind]}
          {benefit.source_note ? `, ${benefit.source_note}` : ""}
        </DetailRow>
      </dl>
      {stale ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          리셋 시각이 지났습니다. 실제 값을 다시 확인해 주세요.
        </p>
      ) : null}
      {onEdit || onDelete ? (
        <div className="mt-auto flex gap-2 pt-4">
          {onEdit ? (
            <Button size="sm" variant="outline" onClick={onEdit} className="rounded-lg">
              수정
            </Button>
          ) : null}
          {onDelete ? (
            <Button size="sm" variant="ghost" onClick={onDelete} className="rounded-lg">
              삭제
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
