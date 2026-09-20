import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/benefits";

export function Amount({ value, unit, size = "md", tone = "plain" }: { value: number | null; unit: string; size?: "md" | "lg"; tone?: "plain" | "primary" }) {
  const unknown = value === null;
  return <span className={cn("tnum font-semibold", size === "lg" ? "text-2xl" : "text-lg", unknown ? "text-unknown" : tone === "primary" && value > 0 ? "text-primary" : "text-foreground")}>{formatAmount(value, unit)}</span>;
}

export function Meter({ ratio, label }: { ratio: number; label: string }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="meter" aria-label={label} aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${ratio * 100}%` }} /></div>;
}

export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "accent" | "unknown" }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs", tone === "accent" ? "border-primary/30 bg-primary/10 text-primary" : tone === "unknown" ? "border-unknown/30 bg-unknown/10 text-unknown" : "border-border text-muted-foreground")}>{children}</span>;
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid grid-cols-[5rem_1fr] gap-3 py-1 text-xs leading-relaxed"><dt className="text-muted-foreground">{label}</dt><dd>{children}</dd></div>;
}