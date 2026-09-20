import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { Chip } from "@/components/figures";
import { PageHeader } from "@/components/page";
import { useAuth } from "@/hooks/useAuth";
import { useBenefits, useServices } from "@/lib/data";
import {
  daysUntil,
  formatAmount,
  formatObservedAt,
  isObservationStale,
  nextResetAt,
  STATUS_LABELS,
} from "@/lib/benefits";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({
    meta: [
      { title: "일정 · 남은혜택" },
      { name: "description", content: "혜택 리셋 예정일과 무료 체험 종료일을 한 줄로 확인합니다." },
      { property: "og:title", content: "일정 · 남은혜택" },
      { property: "og:description", content: "리셋 예정과 체험 종료 일정." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});

const fmt = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  hour12: false,
});

function Group({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description?: string;
  empty?: boolean;
  children?: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {empty ? (
        <p className="mt-3 text-sm text-muted-foreground">해당하는 항목이 없습니다.</p>
      ) : (
        <ul className="surface-panel mt-3 divide-y divide-hairline">{children}</ul>
      )}
    </section>
  );
}

function SchedulePage() {
  const { user } = useAuth();
  const services = useServices();
  const benefits = useBenefits();
  const loading = services.isLoading || benefits.isLoading;

  const serviceName = Object.fromEntries((services.data ?? []).map((s) => [s.id, s.name]));

  const resets = (benefits.data ?? [])
    .map((b) => ({ benefit: b, at: nextResetAt(b) }))
    .filter((x): x is { benefit: (typeof x)["benefit"]; at: Date } => x.at !== null)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const trials = (services.data ?? [])
    .filter((s) => s.trial_ends_at)
    .map((s) => ({ service: s, at: new Date(s.trial_ends_at as string) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const stale = (benefits.data ?? []).filter((b) => isObservationStale(b));

  return (
    <AppShell email={user?.email}>
      <PageHeader
        eyebrow="시점이 중요한 것"
        title="일정"
        description="다시 확인이 필요한 항목과 앞으로의 리셋, 체험 종료만 모았습니다."
      />

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <Group
            title="다시 확인이 필요한 혜택"
            description="리셋 시각이 지났습니다. 기록된 값은 그대로 두었습니다."
            empty={stale.length === 0}
          >
            {stale.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium">{serviceName[b.service_id] ?? "서비스"}</span>
                  <span className="ml-2 text-muted-foreground">{b.name}</span>
                </span>
                <span className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>마지막 확인 {formatObservedAt(b)}</span>
                  <Chip tone="sand">기록된 값 {formatAmount(b.remaining_amount, b.unit)}</Chip>
                </span>
              </li>
            ))}
          </Group>

          <Group
            title="리셋 예정"
            description="리셋 주기와 기준 시각이 입력된 혜택만 표시합니다."
            empty={resets.length === 0}
          >
            {resets.map(({ benefit, at }) => {
              const days = Math.max(0, daysUntil(at));
              return (
                <li
                  key={benefit.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-medium">
                      {serviceName[benefit.service_id] ?? "서비스"}
                    </span>
                    <span className="ml-2 text-muted-foreground">{benefit.name}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{fmt.format(at)}</span>
                    <Chip tone={days <= 3 ? "accent" : "plain"}>
                      <span className="tnum">D-{days}</span>
                    </Chip>
                  </span>
                </li>
              );
            })}
          </Group>

          <Group
            title="무료 체험 종료 예정"
            description="체험이 끝나도 계정이 사라지지는 않습니다. 요금제 전환 여부만 확인하세요."
            empty={trials.length === 0}
          >
            {trials.map(({ service, at }) => {
              const days = Math.max(0, daysUntil(at));
              return (
                <li
                  key={service.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{service.name}</span>
                    <span className="ml-2 text-muted-foreground">
                      {STATUS_LABELS[service.subscription_status]}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{fmt.format(at)}</span>
                    <Chip tone={days <= 3 ? "accent" : "plain"}>
                      <span className="tnum">D-{days}</span>
                    </Chip>
                  </span>
                </li>
              );
            })}
          </Group>
        </div>
      )}
    </AppShell>
  );
}
