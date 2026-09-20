import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_oklch(0.4_0.15_157)]",
        className,
      )}
      aria-hidden="true"
    >
      <span className="absolute left-2 top-2 size-2 rounded-full bg-current opacity-60" />
      <span className="absolute bottom-2 right-2 size-3 rounded-[5px] border-2 border-current" />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5 font-bold tracking-[-0.04em]", className)}
    >
      <Mark />
      <span>
        KeyAtlas<span className="ml-1 text-primary">.</span>
      </span>
    </span>
  );
}
