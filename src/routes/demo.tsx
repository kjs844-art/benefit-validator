import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { buildDemoData, DEMO_NOTICE } from "@/lib/demo-data";
import { BenefitCard } from "@/components/BenefitCard";
import { Button } from "@/components/ui/button";
import { formatAmount, isObservationStale, nextResetAt, STATUS_LABELS, sumByUnit } from "@/lib/benefits";
import { EXPORT_FORMAT_VERSION } from "@/lib/export-format";
import { Wordmark } from "@/components/brand";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "데모 체험 · 남은혜택" },
      {
        name: "description",
        content: "로그인 없이 샘플 혜택 화면을 둘러볼 수 있는 데모입니다.",
      },
      { property: "og:title", content: "데모 체험 · 남은혜택" },
      { property: "og:description", content: "로그인 없이 남은혜택 화면을 둘러보세요." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  const [data] = useState(() => buildDemoData());
  const serviceName = useMemo(
    () => Object.fromEntries(data.services.map((s) => [s.id, s.name])),
    [data.services],
  );
  const totals = sumByUnit(data.benefits);
  const stale = data.benefits.filter((b) => isObservationStale(b));

  function exportDemo() {
    const payload = {
      format: EXPORT_FORMAT_VERSION,
      dataset: "demo",
      demo: true,
      notice: DEMO_NOTICE,
      exported_at: new Date().toISOString(),
      services: data.services,
      benefits: data.benefits,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `namun-hyetaek-demo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/"><Wordmark /></Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportDemo}>
              데모 데이터 내보내기
            </Button>
            <Link
              to="/auth"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              내 계정 시작
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div className="rounded-lg border border-unknown/40 bg-unknown/10 px-4 py-3 text-sm text-unknown">
          {DEMO_NOTICE} 이 화면에서 입력한 내용은 계정에 저장되지 않습니다.
        </div>

        <section>
           <h1 className="text-2xl font-bold">데모 대시보드</h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Object.entries(totals).map(([unit, total]) => (
              <div key={unit} className="surface-panel surface-panel-hover p-4">
                <p className="text-xs text-muted-foreground">단위 {unit} 합계 (아는 값만)</p>
                <p className="tnum mt-1 text-2xl font-bold text-primary">{formatAmount(total, unit)}</p>
              </div>
            ))}
            <div className="surface-panel surface-panel-hover p-4">
              <p className="text-xs text-muted-foreground">다시 확인이 필요한 항목</p>
              <p className="tnum mt-1 text-2xl font-bold text-unknown">{stale.length}건</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">메일에서 확인된 가입 서비스</h2>
          {data.services.map((service) => {
            const benefits = data.benefits.filter((b) => b.service_id === service.id);
            const nextResets = benefits
              .map((b) => nextResetAt(b))
              .filter((d): d is Date => d !== null)
              .sort((a, b) => a.getTime() - b.getTime());
            return (
              <div key={service.id} className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-lg font-semibold">{service.name}</h2>
                  <span className="text-xs text-muted-foreground">
                    {service.plan_name ?? "요금제 모름"} · {STATUS_LABELS[service.subscription_status]}
                  </span>
                  {nextResets[0] ? (
                    <span className="text-xs text-muted-foreground">
                      다음 리셋 {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(nextResets[0])}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {benefits.map((b) => (
                    <BenefitCard key={b.id} benefit={b} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

      </main>
    </div>
  );
}
