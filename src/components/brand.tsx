import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Brand mark: a container with the remaining portion filled in. That is the
 * whole product in one glyph, so it is drawn here rather than borrowed from an
 * icon set (a logo is brand, not iconography).
 */
export function Mark({ className }: { className?: string | undefined }) {
  const clip = useId();
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn("size-5 text-primary", className)}
      fill="none"
    >
      <defs>
        <clipPath id={clip}>
          <rect x="2" y="2" width="16" height="16" rx="4.5" />
        </clipPath>
      </defs>
      <rect x="2" y="11" width="16" height="7" fill="currentColor" clipPath={`url(#${clip})`} />
      <rect
        x="2"
        y="2"
        width="16"
        height="16"
        rx="4.5"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string | undefined;
  markClassName?: string | undefined;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", className)}>
      <Mark className={markClassName} />
      남은혜택
    </span>
  );
}
