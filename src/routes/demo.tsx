import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { buildDemoData, DEMO_NOTICE } from "@/lib/demo-data";
import { BenefitCard } from "@/components/BenefitCard";
import { ServiceHeading } from "@/components/ServiceHeading";
import { Wordmark } from "@/components/brand";
import { Amount, StatStrip } from "@/components/figures";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { isObservationStale, nextResetAt, sumByUnit } from "@/lib/benefits";
import { EXPORT_FORMAT_VERSION } from "@/lib/export-format";

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
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 lg:px-8">
          <Link to="/" className="text-[0.95rem]">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportDemo}>
              JSON 내보내기
            </Button>
            <Link
              to="/auth"
              className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-12">
        <PageHeader
          eyebrow="데모"
          title="데모 대시보드"
          description="샘플 데이터로 실제 화면을 그대로 보여 드립니다. 여기서 한 조작은 계정에 저장되지 않습니다."
        />

        <p className="mt-6 rounded-md border border-unknown/35 bg-unknown/10 px-4 py-3 text-sm leading-relaxed text-unknown">
          {DEMO_NOTICE}
        </p>

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
          {data.services.map((service) => {
            const benefits = data.benefits.filter((b) => b.service_id === service.id);
            const next = benefits
              .map((b) => nextResetAt(b))
              .filter((d): d is Date => d !== null)
              .sort((a, b) => a.getTime() - b.getTime())[0];
            return (
              <section key={service.id}>
                <ServiceHeading service={service} next={next} />
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {benefits.map((b) => (
                    <BenefitCard key={b.id} benefit={b} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-12 border-t border-hairline pt-6 text-xs leading-relaxed text-muted-foreground">
          데모 데이터는 예시이며 실제 서비스 계정과 연결되어 있지 않습니다. 내 계정에서 쓰려면{" "}
          <Link to="/auth" className="text-foreground underline underline-offset-4">
            시작하기
          </Link>
          에서 로그인해 주세요.
        </p>
      </main>
    </div>
  );
}
