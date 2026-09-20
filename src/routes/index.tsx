import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Check,
  Clock3,
  CreditCard,
  Mail,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Wordmark } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "남은혜택. — 놓치기 전에 확인하세요" },
      {
        name: "description",
        content: "Gmail에서 무료체험, 크레딧, 쿠폰, 결제 예정 정보를 찾아 한눈에 확인하세요.",
      },
    ],
  }),
  component: Landing,
});

const PREVIEW = [
  { name: "Figma", type: "Professional 무료 체험", value: "D-03", tone: "coral", icon: Sparkles },
  { name: "ChatGPT", type: "고급 모델 크레딧", value: "12 / 50", tone: "mint", icon: CreditCard },
  { name: "Notion", type: "AI 응답 크레딧", value: "83% 남음", tone: "blue", icon: Clock3 },
];

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how">작동 방식</a>
          <a href="#privacy">개인정보 보호</a>
          <Link to="/demo" className="hover:text-foreground">
            데모 보기
          </Link>
        </nav>
        <Link
          to="/auth"
          search={{ next: undefined }}
          className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:-translate-y-0.5"
        >
          시작하기 <ArrowUpRight className="ml-1 inline size-4" />
        </Link>
      </header>
      <main>
        <section className="hero-glow relative border-b border-border/60">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:pb-28 lg:pt-24">
            <div className="relative z-10">
              <div className="rise inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-accent-foreground">
                <span className="size-1.5 rounded-full bg-primary" />내 혜택을 검증하는 가장 쉬운
                방법
              </div>
              <h1 className="rise-1 mt-6 max-w-xl text-5xl font-bold leading-[1.04] sm:text-7xl">
                무료인 줄 알았던 것들,
                <br />
                <span className="text-primary">이제 놓치지 마세요.</span>
              </h1>
              <p className="rise-2 mt-7 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">
                Gmail에서 무료체험, 크레딧, 쿠폰, 결제 예정 메일을 찾아서 당신이 확인해야 할 순간만
                알려드립니다.
              </p>
              <div className="rise-3 mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/auth"
                  search={{ next: undefined }}
                  className="rounded-2xl bg-foreground px-5 py-3.5 text-sm font-bold text-background shadow-xl shadow-foreground/10 hover:-translate-y-1"
                >
                  Google로 무료 시작하기 <ArrowUpRight className="ml-1 inline size-4" />
                </Link>
                <Link
                  to="/demo"
                  className="rounded-2xl border border-border bg-card/60 px-5 py-3.5 text-sm font-bold hover:-translate-y-1 hover:bg-card"
                >
                  데모 먼저 보기
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span>
                  <Check className="mr-1 inline size-3 text-primary" />
                  읽기 전용 연결
                </span>
                <span>
                  <Check className="mr-1 inline size-3 text-primary" />
                  메일 원문 저장 안 함
                </span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-xl lg:pl-6">
              <div className="absolute -inset-10 rounded-full bg-primary/10 blur-3xl" />
              <div className="dark-panel relative overflow-hidden rounded-[2rem] p-5 shadow-2xl shadow-foreground/20 sm:p-7">
                <div className="absolute right-0 top-0 size-56 rounded-full bg-primary/20 blur-3xl" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-sidebar-foreground/55">
                      Sunday, September 20
                    </p>
                    <h2 className="mt-1 text-xl font-bold">좋은 아침이에요, 민수님.</h2>
                  </div>
                  <div className="grid size-10 place-items-center rounded-xl bg-sidebar-accent">
                    <Mail className="size-4 text-sidebar-primary" />
                  </div>
                </div>
                <div className="relative mt-7 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-sidebar-accent/90 p-3">
                    <p className="text-[10px] text-sidebar-foreground/50">확인된 서비스</p>
                    <p className="tnum mt-2 text-2xl font-bold">08</p>
                  </div>
                  <div className="rounded-2xl bg-sidebar-accent/90 p-3">
                    <p className="text-[10px] text-sidebar-foreground/50">곧 종료</p>
                    <p className="tnum mt-2 text-2xl font-bold text-sidebar-primary">02</p>
                  </div>
                  <div className="rounded-2xl bg-sidebar-accent/90 p-3">
                    <p className="text-[10px] text-sidebar-foreground/50">확인 필요</p>
                    <p className="tnum mt-2 text-2xl font-bold text-amber-300">03</p>
                  </div>
                </div>
                <div className="relative mt-5 space-y-3">
                  {PREVIEW.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.name}
                        className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar/50 p-3"
                      >
                        <div
                          className={`grid size-9 place-items-center rounded-xl ${item.tone === "coral" ? "bg-rose-400/15 text-rose-300" : item.tone === "mint" ? "bg-sidebar-primary/15 text-sidebar-primary" : "bg-sky-400/15 text-sky-300"}`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="truncate text-[11px] text-sidebar-foreground/50">
                            {item.type}
                          </p>
                        </div>
                        <p className="tnum text-sm font-bold">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="relative mt-5 flex items-center gap-2 rounded-xl bg-rose-400/10 px-3 py-2.5 text-xs text-rose-200">
                  <TriangleAlert className="size-3.5" />
                  Figma 체험판 종료까지 3일 남았어요.
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="how" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Simple by design
              </p>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                복잡한 구독 관리를
                <br />한 화면으로.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
                우리는 추측하지 않습니다. 메일에서 확인된 사실과 확인이 필요한 빈 곳을 구분해
                보여드립니다.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="surface-panel p-5">
                <span className="tnum text-4xl font-bold text-primary">01</span>
                <h3 className="mt-12 font-bold">Google로 시작</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  계정을 만들고 내 대시보드를 준비합니다.
                </p>
              </div>
              <div className="surface-panel p-5">
                <span className="tnum text-4xl font-bold text-primary">02</span>
                <h3 className="mt-12 font-bold">Gmail 읽기 전용 연결</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  혜택 관련 메일만 필요한 순간에 분석합니다.
                </p>
              </div>
              <div className="surface-panel p-5">
                <span className="tnum text-4xl font-bold text-primary">03</span>
                <h3 className="mt-12 font-bold">놓치기 전에 확인</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  종료·결제·잔량 상태를 우선순위로 보여줍니다.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section
          id="privacy"
          className="dark-panel mx-5 mb-10 overflow-hidden rounded-[2rem] sm:mx-8 lg:mx-auto lg:max-w-7xl"
        >
          <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_0.7fr] lg:items-center lg:px-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sidebar-primary">
                Privacy first
              </p>
              <h2 className="mt-4 text-3xl font-bold text-sidebar-foreground">
                당신의 메일은
                <br />
                당신의 것으로 남습니다.
              </h2>
            </div>
            <div className="space-y-3 text-sm text-sidebar-foreground/65">
              <p>
                <Check className="mr-2 inline size-4 text-sidebar-primary" />
                Gmail은 읽기 전용으로만 연결됩니다.
              </p>
              <p>
                <Check className="mr-2 inline size-4 text-sidebar-primary" />
                메일 원문 전체를 저장하지 않습니다.
              </p>
              <p>
                <Check className="mr-2 inline size-4 text-sidebar-primary" />
                확인된 근거와 날짜를 함께 표시합니다.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl items-center justify-between px-5 py-8 text-xs text-muted-foreground sm:px-8 lg:px-12">
        <Wordmark className="scale-90 origin-left" />
        <span>© 2026 남은혜택. 개인 혜택을 잊지 않도록.</span>
      </footer>
    </div>
  );
}
