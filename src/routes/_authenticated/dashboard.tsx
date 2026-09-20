import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Plus,
  RefreshCw,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BenefitCard } from "@/components/BenefitCard";
import { useBenefits, useServices } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { formatAmount, isObservationStale, sumByUnit } from "@/lib/benefits";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/gmail" });
  },
  head: () => ({
    meta: [
      { title: "대시보드 · 남은혜택." },
      { name: "description", content: "내 혜택의 중요한 순간을 한눈에 확인합니다." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const services = useServices();
  const benefits = useBenefits();
  const loading = services.isLoading || benefits.isLoading;
  const error = services.error ?? benefits.error;
  const serviceList = services.data ?? [];
  const benefitList = benefits.data ?? [];
  const totals = sumByUnit(benefitList);
  const stale = benefitList.filter((b) => isObservationStale(b));
  return (
    <AppShell email={user?.email}>
      <div className="rise flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-primary">Sunday, September 20</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">좋은 아침이에요.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            오늘 확인해야 할 혜택을 정리해두었어요.
          </p>
        </div>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:-translate-y-0.5"
        >
          <Plus className="size-4" /> 혜택 추가
        </Link>
      </div>
      {loading ? (
        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="mt-9 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm">
          데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.
        </div>
      ) : serviceList.length === 0 ? (
        <div className="surface-panel mt-9 p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="size-5" />
          </div>
          <h2 className="mt-5 text-2xl font-bold">아직 발견된 혜택이 없어요.</h2>
          <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
            Google 계정을 연결하면 Gmail의 혜택 메일을 읽기 전용으로 분석해 첫 번째 대시보드를
            만들어드려요.
          </p>
          <Link
            to="/gmail"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
          >
            Google 연결하기 <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <>
          <section className="rise-1 mt-9 grid gap-4 sm:grid-cols-3">
            <div className="dark-panel rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-sidebar-foreground/55">확인된 서비스</p>
                <WalletCards className="size-4 text-sidebar-primary" />
              </div>
              <p className="tnum mt-5 text-4xl font-bold">
                {serviceList.length}
                <span className="ml-1 text-base font-medium text-sidebar-foreground/50">개</span>
              </p>
              <p className="mt-2 text-xs text-sidebar-foreground/50">메일에서 발견된 서비스</p>
            </div>
            <div className="surface-panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">다시 확인 필요</p>
                <RefreshCw className="size-4 text-amber-600" />
              </div>
              <p className="tnum mt-5 text-4xl font-bold text-amber-700">
                {stale.length}
                <span className="ml-1 text-base font-medium text-muted-foreground">건</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">오래된 관찰값</p>
            </div>
            <div className="surface-panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">혜택 총 잔량</p>
                <Sparkles className="size-4 text-primary" />
              </div>
              <p className="tnum mt-5 truncate text-3xl font-bold text-primary">
                {Object.entries(totals)
                  .slice(0, 1)
                  .map(([unit, total]) => formatAmount(total, unit))
                  .join(" · ") || "확인 필요"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">아는 값만 단위별 합산</p>
            </div>
          </section>
          <section className="rise-2 mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Needs attention
                </p>
                <h2 className="mt-2 text-2xl font-bold">먼저 확인할 것</h2>
              </div>
              <Link
                to="/schedule"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                전체 일정 <ArrowRight className="ml-1 inline size-4" />
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="surface-panel flex items-center gap-3 border-rose-200 bg-rose-50/50 p-4">
                <div className="grid size-10 place-items-center rounded-xl bg-rose-100 text-rose-600">
                  <CircleAlert className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">무료체험 종료</p>
                  <p className="text-xs text-muted-foreground">다가오는 항목을 확인하세요</p>
                </div>
              </div>
              <div className="surface-panel flex items-center gap-3 p-4">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <CalendarClock className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">다음 리셋</p>
                  <p className="text-xs text-muted-foreground">혜택이 곧 갱신됩니다</p>
                </div>
              </div>
              <div className="surface-panel flex items-center gap-3 p-4">
                <div className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <RefreshCw className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">잔량 확인 필요</p>
                  <p className="text-xs text-muted-foreground">메일에 현재 잔량이 없어요</p>
                </div>
              </div>
            </div>
          </section>
          <section className="rise-3 mt-10">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Your services
                </p>
                <h2 className="mt-2 text-2xl font-bold">내 서비스</h2>
              </div>
              <Link
                to="/services"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                관리하기 <ArrowRight className="ml-1 inline size-4" />
              </Link>
            </div>
            <div className="mt-5 space-y-8">
              {serviceList.map((service) => {
                const list = benefitList.filter((b) => b.service_id === service.id);
                return (
                  <section key={service.id}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <div className="grid size-9 place-items-center rounded-xl bg-foreground text-sm font-bold text-background">
                        {service.name.slice(0, 1)}
                      </div>
                      <h3 className="font-bold">{service.name}</h3>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {service.plan_name ?? "요금제 모름"}
                      </span>
                    </div>
                    {list.length === 0 ? (
                      <p className="text-sm text-muted-foreground">등록된 혜택이 없습니다.</p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {list.map((b) => (
                          <BenefitCard key={b.id} benefit={b} />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
