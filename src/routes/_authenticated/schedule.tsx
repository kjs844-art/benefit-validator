import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CalendarDays, Clock3, RefreshCcw, Sparkles } from "lucide-react";
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
      { title: "타임라인 · KeyAtlas" },
      {
        name: "description",
        content: "무료체험 종료, 혜택 리셋, 재확인 일정을 한곳에서 확인합니다.",
      },
    ],
  }),
  component: SchedulePage,
});

const dateTime = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" });

function EventRow({
  icon,
  eyebrow,
  title,
  detail,
  at,
  tone = "primary",
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  detail: string;
  at?: Date;
  tone?: "primary" | "warning" | "muted";
}) {
  const badge =
    tone === "warning"
      ? "bg-amber-400/15 text-amber-700"
      : tone === "muted"
        ? "bg-muted text-muted-foreground"
        : "bg-primary/15 text-primary";
  return (
    <li className="group flex gap-4 rounded-2xl border border-transparent p-3 transition hover:border-border hover:bg-card sm:p-4">
      <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${badge}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
            <h3 className="mt-1 font-bold">{title}</h3>
          </div>
          {at ? (
            <div className="text-right">
              <p className="tnum text-sm font-bold">D-{Math.max(0, daysUntil(at))}</p>
              <p className="text-xs text-muted-foreground">{dateOnly.format(at)}</p>
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

function SchedulePage() {
  const { user } = useAuth();
  const services = useServices();
  const benefits = useBenefits();
  const loading = services.isLoading || benefits.isLoading;
  const serviceName = Object.fromEntries(
    (services.data ?? []).map((service) => [service.id, service.name]),
  );
  const resets = (benefits.data ?? [])
    .map((benefit) => ({ benefit, at: nextResetAt(benefit) }))
    .filter((item): item is { benefit: (typeof item)["benefit"]; at: Date } => item.at !== null)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const trials = (services.data ?? [])
    .filter((service) => service.trial_ends_at)
    .map((service) => ({ service, at: new Date(service.trial_ends_at as string) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const stale = (benefits.data ?? []).filter((benefit) => isObservationStale(benefit));
  const nextSevenDays = [...resets.map((item) => item.at), ...trials.map((item) => item.at)].filter(
    (at) => daysUntil(at) >= 0 && daysUntil(at) <= 7,
  ).length;

  return (
    <AppShell email={user?.email}>
      <div className="rise flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-primary">Upcoming signals</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">놓치지 않을 타임라인</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            체험 종료와 혜택 리셋, 오래된 잔량 기록을 날짜순으로 모았습니다.
          </p>
        </div>
        <Link
          to="/services"
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent"
        >
          서비스 관리
        </Link>
      </div>
      {loading ? (
        <Skeleton className="mt-8 h-64 rounded-3xl" />
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="surface-panel p-5">
              <p className="text-xs font-semibold text-muted-foreground">7일 안에 다가옴</p>
              <p className="tnum mt-3 text-4xl font-bold">{nextSevenDays}</p>
              <p className="mt-2 text-xs text-muted-foreground">종료 또는 리셋</p>
            </div>
            <div className="surface-panel p-5">
              <p className="text-xs font-semibold text-muted-foreground">확인이 오래됨</p>
              <p className="tnum mt-3 text-4xl font-bold text-amber-600">{stale.length}</p>
              <p className="mt-2 text-xs text-muted-foreground">현재 잔량 재확인 필요</p>
            </div>
            <div className="dark-panel rounded-[1.5rem] p-5">
              <p className="text-xs font-semibold text-sidebar-foreground/55">추적 중인 일정</p>
              <p className="tnum mt-3 text-4xl font-bold text-sidebar-primary">
                {resets.length + trials.length}
              </p>
              <p className="mt-2 text-xs text-sidebar-foreground/50">체험 종료 + 혜택 리셋</p>
            </div>
          </div>
          <div className="mt-7 grid gap-5 xl:grid-cols-2">
            <section className="surface-panel p-4 sm:p-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="grid size-10 place-items-center rounded-xl bg-rose-400/15 text-rose-600">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <h2 className="font-bold">체험 종료</h2>
                  <p className="text-xs text-muted-foreground">자동 결제 전 확인할 일정</p>
                </div>
              </div>
              {trials.length === 0 ? (
                <Empty text="예정된 무료체험 종료가 없습니다." />
              ) : (
                <ul className="mt-3 space-y-1">
                  {trials.map(({ service, at }) => (
                    <EventRow
                      key={service.id}
                      icon={<Clock3 className="size-4" />}
                      eyebrow={STATUS_LABELS[service.subscription_status]}
                      title={service.name}
                      detail={`${dateTime.format(at)} 종료 예정 · 결제 전환 여부를 서비스에서 확인하세요.`}
                      at={at}
                      tone="warning"
                    />
                  ))}
                </ul>
              )}
            </section>
            <section className="surface-panel p-4 sm:p-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <RefreshCcw className="size-5" />
                </div>
                <div>
                  <h2 className="font-bold">혜택 리셋</h2>
                  <p className="text-xs text-muted-foreground">다시 채워지는 크레딧과 쿠폰</p>
                </div>
              </div>
              {resets.length === 0 ? (
                <Empty text="리셋 규칙이 기록된 혜택이 없습니다." />
              ) : (
                <ul className="mt-3 space-y-1">
                  {resets.map(({ benefit, at }) => (
                    <EventRow
                      key={benefit.id}
                      icon={<Sparkles className="size-4" />}
                      eyebrow={serviceName[benefit.service_id] ?? "서비스"}
                      title={benefit.name}
                      detail={`${dateTime.format(at)} 리셋 예정 · 현재 기록 ${formatAmount(benefit.remaining_amount, benefit.unit)}`}
                      at={at}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
          <section className="surface-panel mt-5 p-4 sm:p-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="grid size-10 place-items-center rounded-xl bg-amber-400/15 text-amber-700">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h2 className="font-bold">다시 확인할 기록</h2>
                <p className="text-xs text-muted-foreground">마지막 관찰 시점이 오래된 혜택</p>
              </div>
            </div>
            {stale.length === 0 ? (
              <Empty text="모든 기록이 최신 상태입니다." />
            ) : (
              <ul className="mt-3 grid gap-2 lg:grid-cols-2">
                {stale.map((benefit) => (
                  <EventRow
                    key={benefit.id}
                    icon={<AlertCircle className="size-4" />}
                    eyebrow={serviceName[benefit.service_id] ?? "서비스"}
                    title={benefit.name}
                    detail={`마지막 확인 ${formatObservedAt(benefit)} · 기록된 값 ${formatAmount(benefit.remaining_amount, benefit.unit)}`}
                    tone="muted"
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
