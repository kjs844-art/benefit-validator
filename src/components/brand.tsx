import { useId } from "react";
import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  const clip = useId();
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={cn("size-5 text-primary", className)} fill="none">
      <defs>
        <clipPath id={clip}>
          <rect x="2" y="2" width="16" height="16" rx="4.5" />
        </clipPath>
      </defs>
      <rect x="2" y="11" width="16" height="7" fill="currentColor" clipPath={`url(#${clip})`} />
      <rect x="2" y="2" width="16" height="16" rx="4.5" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.6" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("inline-flex items-center gap-2 font-bold", className)}><Mark />남은혜택</span>;
}