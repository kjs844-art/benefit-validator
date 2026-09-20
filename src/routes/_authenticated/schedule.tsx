import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
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

const fmt = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" });

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
      <h1 className="text-2xl font-bold">일정</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        다시 확인이 필요한 항목과 리셋 예정만 모았습니다.
      </p>

      {loading ? (
        <Skeleton className="mt-6 h-40" />
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground">다시 확인이 필요한 혜택</h2>
            {stale.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">없습니다.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {stale.map((b) => (
                  <li key={b.id} className="surface-panel p-3 text-sm">
                    <span className="font-medium">{serviceName[b.service_id] ?? "서비스"}</span> ·{" "}
                    {b.name} — 마지막 확인 {formatObservedAt(b)} · 기록된 값{" "}
                    {formatAmount(b.remaining_amount, b.unit)}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground">리셋 예정</h2>
            {resets.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                리셋 주기와 기준 시각이 입력된 혜택이 없습니다.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {resets.map(({ benefit, at }) => (
                  <li key={benefit.id} className="surface-panel p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <span className="font-medium">
                          {serviceName[benefit.service_id] ?? "서비스"}
                        </span>{" "}
                        · {benefit.name}
                      </span>
                      <span className="text-muted-foreground">
                        {fmt.format(at)} (D-{Math.max(0, daysUntil(at))})
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground">무료 체험 종료 예정</h2>
            {trials.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">없습니다.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {trials.map(({ service, at }) => (
                  <li key={service.id} className="surface-panel p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-muted-foreground">
                        {fmt.format(at)} · 현재 상태 {STATUS_LABELS[service.subscription_status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      무료 체험이 끝나도 계정이 종료되는 것은 아닙니다. 요금제 전환 여부만 확인하세요.
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
