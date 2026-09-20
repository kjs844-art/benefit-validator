import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { BenefitCard } from "@/components/BenefitCard";
import { ServiceHeading } from "@/components/ServiceHeading";
import { Amount, StatStrip } from "@/components/figures";
import { EmptyState, PageHeader } from "@/components/page";
import { useBenefits, useServices } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { isObservationStale, nextResetAt, sumByUnit } from "@/lib/benefits";
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
      <PageHeader
        eyebrow="한눈에 보기"
        title="대시보드"
        description="확인된 혜택을 있는 그대로 모았습니다. 모르는 값은 채우지 않고 모름으로 둡니다."
      />

      {loading ? (
        <div className="mt-6 space-y-8">
          <Skeleton className="h-24 rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      ) : error ? (
        <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.
        </p>
      ) : serviceList.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="아직 등록된 서비스가 없습니다."
            description="서비스를 하나 등록하고 혜택을 추가해 보세요. 안내문을 붙여넣거나 화면을 캡처해 AI로 정리할 수도 있습니다."
            actions={
              <>
                <Link
                  to="/services"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  서비스 등록
                </Link>
                <Link
                  to="/analyze"
                  className="rounded-md border border-input px-4 py-2 text-sm font-semibold hover:bg-accent"
                >
                  AI 분석으로 시작
                </Link>
              </>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <StatStrip
              items={[
                ...Object.entries(totals).map(([unit, total]) => ({
                  label: `${unit} 합계`,
                  value: <Amount value={total} unit={unit} tone="primary" size="lg" />,
                  hint: "아는 값만 더합니다",
                })),
                {
                  label: "다시 확인 필요",
                  value: (
                    <span className="figure-num text-3xl text-unknown">
                      {stale.length}
                      <span className="ml-1.5 font-sans text-sm font-normal text-muted-foreground">
                        건
                      </span>
                    </span>
                  ),
                  hint: "리셋 시각이 지난 항목",
                },
              ]}
            />
          </div>

          <div className="mt-12 space-y-10">
            {serviceList.map((service) => {
              const list = benefitList.filter((b) => b.service_id === service.id);
              const next = list
                .map((b) => nextResetAt(b))
                .filter((d): d is Date => d !== null)
                .sort((a, b) => a.getTime() - b.getTime())[0];
              return (
                <section key={service.id}>
                  <ServiceHeading service={service} next={next} />
                  {list.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">등록된 혜택이 없습니다.</p>
                  ) : (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
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
