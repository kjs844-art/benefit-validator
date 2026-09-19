import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { BenefitCard } from "@/components/BenefitCard";
import { useBenefits, useServices } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import {
  formatAmount,
  isObservationStale,
  nextResetAt,
  STATUS_LABELS,
  sumByUnit,
} from "@/lib/benefits";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "대시보드 · 남은혜택" },
      { name: "description", content: "내 구독 서비스의 남은 혜택과 다시 확인이 필요한 항목." },
      { property: "og:title", content: "대시보드 · 남은혜택" },
      { property: "og:description", content: "내 구독 혜택 잔량 한눈에 보기." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        같은 단위끼리만 합산하며, 값을 모르는 항목은 합계에서 제외됩니다.
      </p>

      {loading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.
        </div>
      ) : serviceList.length === 0 ? (
        <div className="surface-panel mt-6 p-6 text-sm">
          <p className="font-medium">아직 등록된 서비스가 없습니다.</p>
          <p className="mt-1 text-muted-foreground">
            먼저 서비스를 등록하고 혜택을 추가해 보세요. 자료를 붙여넣어 AI로 정리할 수도 있습니다.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              to="/services"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              서비스 등록
            </Link>
            <Link to="/analyze" className="rounded-md border border-border px-3 py-1.5 text-sm">
              AI 분석으로 시작
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {Object.entries(totals).map(([unit, total]) => (
              <div key={unit} className="surface-panel p-4">
                <p className="text-xs text-muted-foreground">단위 {unit} 합계 (아는 값만)</p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {formatAmount(total, unit)}
                </p>
              </div>
            ))}
            <div className="surface-panel p-4">
              <p className="text-xs text-muted-foreground">다시 확인이 필요한 항목</p>
              <p className="mt-1 text-2xl font-semibold text-unknown">{stale.length}건</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {serviceList.map((service) => {
              const list = benefitList.filter((b) => b.service_id === service.id);
              const next = list
                .map((b) => nextResetAt(b))
                .filter((d): d is Date => d !== null)
                .sort((a, b) => a.getTime() - b.getTime())[0];
              return (
                <section key={service.id} className="space-y-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="text-lg font-semibold">{service.name}</h2>
                    <span className="text-xs text-muted-foreground">
                      {service.plan_name ?? "요금제 모름"} ·{" "}
                      {STATUS_LABELS[service.subscription_status]}
                    </span>
                    {next ? (
                      <span className="text-xs text-muted-foreground">
                        다음 리셋{" "}
                        {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(next)}
                      </span>
                    ) : null}
                  </div>
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">등록된 혜택이 없습니다.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {list.map((b) => (
                        <BenefitCard key={b.id} benefit={b} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
