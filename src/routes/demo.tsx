import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Download, Sparkles } from "lucide-react";
import { buildDemoData, DEMO_NOTICE } from "@/lib/demo-data";
import { BenefitCard } from "@/components/BenefitCard";
import { Button } from "@/components/ui/button";
import {
  formatAmount,
  isObservationStale,
  nextResetAt,
  STATUS_LABELS,
  sumByUnit,
} from "@/lib/benefits";
import { EXPORT_FORMAT_VERSION } from "@/lib/export-format";
import { Wordmark } from "@/components/brand";
import { createKeyAtlasTools } from "@/lib/webmcp/tools";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "데모 · KeyAtlas" },
      {
        name: "description",
        content: "로그인 없이 KeyAtlas의 서비스·혜택 지도와 일정 화면을 둘러보세요.",
      },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  const [data] = useState(() => buildDemoData());
  const webMcpStatus = useDemoWebMCP(data);
  const totals = sumByUnit(data.benefits);
  const stale = data.benefits.filter((benefit) => isObservationStale(benefit));
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
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `keyatlas-demo-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              aria-label="처음으로"
              className="grid size-9 place-items-center rounded-xl border border-border hover:bg-accent"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <Wordmark />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground sm:inline-flex">
              WebMCP {webMcpStatus === "registered" ? "5 tools" : "preview"}
            </span>
            <Button variant="outline" size="sm" onClick={exportDemo} className="rounded-xl">
              <Download className="mr-1.5 size-3.5" />
              데이터
            </Button>
            <Link
              to="/auth"
              search={{ next: undefined }}
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background hover:-translate-y-0.5"
            >
              내 Atlas 만들기 <ArrowUpRight className="ml-1 inline size-3.5" />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="rise grid gap-6 lg:grid-cols-[1fr_0.55fr] lg:items-end">
          <div>
            <span className="inline-flex rounded-full bg-primary/12 px-3 py-1.5 text-xs font-bold text-primary">
              INTERACTIVE DEMO
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              가입하고 잊었던 서비스가
              <br />
              <span className="text-primary">이렇게 다시 보입니다.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              메일과 직접 입력에서 발견한 서비스, 남은 크레딧, 쿠폰, 체험 종료일을 하나의 개인 계정
              지도로 정리한 예시입니다.
            </p>
          </div>
          <div className="rounded-2xl border border-unknown/30 bg-unknown/10 p-4 text-sm leading-6 text-unknown">
            <Sparkles className="mr-2 inline size-4" />
            {DEMO_NOTICE} 이 화면의 변경은 계정에 저장되지 않습니다.
          </div>
        </div>
        <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="찾은 서비스"
            value={`${data.services.length}`}
            detail="메일 + 직접 기록"
            dark
          />
          {Object.entries(totals)
            .slice(0, 2)
            .map(([unit, total]) => (
              <Stat
                key={unit}
                label={`${unit} 기준 남은 혜택`}
                value={formatAmount(total, unit)}
                detail="확인된 값만 합산"
              />
            ))}
          <Stat
            label="다시 확인 필요"
            value={`${stale.length}`}
            detail="관찰 시점이 오래됨"
            warning
          />
        </section>
        <div className="mt-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Account map
            </p>
            <h2 className="mt-2 text-2xl font-bold">발견한 서비스와 혜택</h2>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            수치는 메일이나 화면에서 확인된 값만 표시합니다.
          </p>
        </div>
        <div className="mt-5 space-y-5">
          {data.services.map((service) => {
            const benefits = data.benefits.filter((benefit) => benefit.service_id === service.id);
            const nextReset = benefits
              .map((benefit) => nextResetAt(benefit))
              .filter((date): date is Date => date !== null)
              .sort((a, b) => a.getTime() - b.getTime())[0];
            return (
              <section key={service.id} className="surface-panel overflow-hidden">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-2xl bg-foreground font-bold text-background">
                      {service.name.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold">{service.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {service.plan_name ?? "요금제 모름"} ·{" "}
                        {STATUS_LABELS[service.subscription_status]}
                      </p>
                    </div>
                  </div>
                  {nextReset ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                      다음 리셋{" "}
                      {new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(
                        nextReset,
                      )}
                    </span>
                  ) : null}
                </header>
                <div className="grid gap-4 p-5 md:grid-cols-2 sm:p-6">
                  {benefits.map((benefit) => (
                    <BenefitCard key={benefit.id} benefit={benefit} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <div className="mt-12 rounded-[2rem] bg-primary/12 px-6 py-8 text-center sm:px-10">
          <p className="text-sm font-semibold text-primary">내 계정에서도 확인해보세요</p>
          <h2 className="mt-2 text-2xl font-bold">기억하지 않아도 되는 개인 계정 지도</h2>
          <Link
            to="/auth"
            search={{ next: undefined }}
            className="mt-5 inline-flex rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background"
          >
            Google로 시작하기 <ArrowUpRight className="ml-2 size-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function useDemoWebMCP(data: ReturnType<typeof buildDemoData>) {
  const [status, setStatus] = useState<"registered" | "unsupported" | "error">("unsupported");
  const tools = useMemo(
    () =>
      createKeyAtlasTools({
        services: data.services,
        benefits: data.benefits,
        discoveries: [],
        navigate: (path) => window.location.assign(path),
      }),
    [data],
  );
  useEffect(() => {
    if (!document.modelContext) return;
    const controller = new AbortController();
    Promise.all(
      tools.map((tool) => document.modelContext?.registerTool(tool, { signal: controller.signal })),
    )
      .then(() => setStatus("registered"))
      .catch(() => setStatus("error"));
    return () => controller.abort();
  }, [tools]);
  return status;
}

function Stat({
  label,
  value,
  detail,
  dark,
  warning,
}: {
  label: string;
  value: string;
  detail: string;
  dark?: boolean;
  warning?: boolean;
}) {
  return (
    <div className={dark ? "dark-panel rounded-[1.5rem] p-5" : "surface-panel p-5"}>
      <p
        className={
          dark
            ? "text-xs font-semibold text-sidebar-foreground/55"
            : "text-xs font-semibold text-muted-foreground"
        }
      >
        {label}
      </p>
      <p
        className={`tnum mt-3 text-3xl font-bold ${dark ? "text-sidebar-primary" : warning ? "text-amber-600" : "text-foreground"}`}
      >
        {value}
      </p>
      <p
        className={
          dark ? "mt-2 text-xs text-sidebar-foreground/45" : "mt-2 text-xs text-muted-foreground"
        }
      >
        {detail}
      </p>
    </div>
  );
}
