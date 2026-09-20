import type { ReactNode } from "react";
import { STATUS_LABELS, type ServiceRecord } from "@/lib/benefits";
import { Chip } from "@/components/figures";

const dateFmt = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" });

/**
 * The heading above one service's benefits. Metadata is separated by spacing
 * rather than a run of middle dots, so the line stays readable when a service
 * carries a plan name, an account label and a reset date at once.
 */
export function ServiceHeading({
  service,
  next,
  actions,
}: {
  service: ServiceRecord;
  next?: Date | null | undefined;
  actions?: ReactNode;
}) {
  const live = service.subscription_status === "active" || service.subscription_status === "trial";
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline pb-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base">{service.name}</h2>
          <Chip tone={live ? "accent" : "plain"}>{STATUS_LABELS[service.subscription_status]}</Chip>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{service.plan_name ?? "요금제 모름"}</span>
          {service.account_label ? <span>{service.account_label}</span> : null}
          {next ? <span>다음 리셋 {dateFmt.format(next)}</span> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
