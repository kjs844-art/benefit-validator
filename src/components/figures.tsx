import type { ReactNode } from "react";
import { isUnknown } from "@/lib/benefits";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 });

const SIZES = {
  sm: { num: "text-sm", unit: "text-xs", unknown: "text-sm" },
  md: { num: "text-xl", unit: "text-xs", unknown: "text-base" },
  lg: { num: "text-3xl", unit: "text-sm", unknown: "text-xl" },
} as const;

/**
 * A recorded amount. The number is set in the mono face and the unit stays in
 * the sans face at label size, so figures line up down a column and the unit
 * never competes with the value.
 *
 * `null` is not zero: an unknown amount renders as 모름 in sand, never as a
 * number, and never in the accent colour reserved for values we actually hold.
 */
export function Amount({
  value,
  unit,
  tone = "plain",
  size = "md",
  className,
}: {
  value: number | null;
  unit?: string | undefined;
  tone?: "plain" | "primary" | undefined;
  size?: keyof typeof SIZES | undefined;
  className?: string | undefined;
}) {
  const sz = SIZES[size];
  if (isUnknown(value)) {
    return <span className={cn("font-medium text-unknown", sz.unknown, className)}>모름</span>;
  }
  // A measured zero is still a known value, but nothing is left, so it does not
  // get the accent colour that means "you still have this".
  const accent = tone === "primary" && (value as number) > 0;
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className={cn("figure-num", sz.num, accent ? "text-primary" : "text-foreground")}>
        {nf.format(value as number)}
      </span>
      {unit ? <span className={cn("text-muted-foreground", sz.unit)}>{unit}</span> : null}
    </span>
  );
}

/** Thin remaining bar. Only drawn when both granted and remaining are known. */
export function Meter({ ratio, label }: { ratio: number; label?: string | undefined }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full bg-white/10"
      role="img"
      aria-label={label ?? `남은 비율 ${pct}%`}
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

const CHIP = {
  plain: "border-border bg-secondary/70 text-muted-foreground",
  accent: "border-primary/30 bg-primary/10 text-primary",
  sand: "border-unknown/30 bg-unknown/10 text-unknown",
} as const;

/** Status chips are the one pill shape in the system. */
export function Chip({
  tone = "plain",
  children,
  className,
}: {
  tone?: keyof typeof CHIP | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        CHIP[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Totals live in one panel split by hairlines rather than in a row of separate
 * cards. Separate cards would imply each number is its own object; they are
 * readings off the same ledger.
 */
export function StatStrip({
  items,
}: {
  items: { label: string; value: ReactNode; hint?: string | undefined }[];
}) {
  return (
    <div className="surface-panel flex flex-col divide-y divide-hairline sm:flex-row sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 flex-1 px-5 py-4">
          <p className="eyebrow truncate">{item.label}</p>
          <div className="mt-2">{item.value}</div>
          {item.hint ? <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

/** Label / value pair used inside cards, aligned on a fixed label column. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-1.5">
      <dt className="text-xs leading-6 text-muted-foreground">{label}</dt>
      <dd className="text-xs leading-6 text-foreground/80">{children}</dd>
    </div>
  );
}
