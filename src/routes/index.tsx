import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "남은혜택 — 구독 혜택 잔량 기록" },
      {
        name: "description",
        content:
          "구독 서비스의 남은 혜택을 직접 기록하고, 붙여넣은 자료나 캡처에서 AI로 정리해 한눈에 확인하세요.",
      },
      { property: "og:title", content: "남은혜택 — 구독 혜택 잔량 기록" },
      {
        property: "og:description",
        content: "구독 혜택의 남은 양과 리셋 일정을 정확하게 기록하는 개인 기록 도구.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const POINTS = [
  {
    no: "01",
    title: "모름과 0을 구분합니다",
    body: "값을 모를 때는 '모름'으로 남기고, 0은 실제로 0일 때만 기록합니다. 숫자를 지어내지 않습니다.",
  },
  {
    no: "02",
    title: "확인 시점을 그대로 보존합니다",
    body: "자료에 날짜만 있으면 날짜만 기록합니다. 리셋 시각이 지나도 잔량을 임의로 늘리지 않고 '다시 확인 필요'로 표시합니다.",
  },
  {
    no: "03",
    title: "자동 조회는 하지 않습니다",
    body: "외부 계정에 접속해 잔량을 몰래 가져오지 않습니다. 직접 입력, 자료 붙여넣기, 본인이 승인한 Gmail 읽기 전용 연결로만 기록합니다.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="font-display text-lg font-bold tracking-tight">남은혜택</span>
        <div className="flex gap-2 text-sm">
          <Link
            to="/demo"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            데모 체험
          </Link>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:opacity-90"
          >
            로그인
          </Link>
        </div>
      </header>

      <section className="hero-glow">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-14 sm:pt-24">
          <p className="rise font-mono text-xs tracking-[0.18em] text-primary">
            구독 혜택 잔량 기록 도구
          </p>
          <h1 className="rise-1 mt-4 max-w-3xl text-4xl font-bold leading-[1.15] sm:text-6xl">
            남은 혜택이 얼마인지, 언제 확인한 값인지까지 함께 기록합니다.
          </h1>
          <p className="rise-2 mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            구독 서비스의 쿠폰·크레딧·용량을 직접 입력하거나, 결제 안내문과 화면 캡처를
            붙여넣어 AI로 정리하세요. 값을 확인한 시점과 출처가 함께 남습니다.
          </p>
          <div className="rise-3 mt-8 flex flex-wrap gap-3">
            <Link
              to="/demo"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              로그인 없이 데모 보기
            </Link>
            <Link
              to="/auth"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              내 계정 시작하기
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-20 sm:grid-cols-3">
        {POINTS.map((p) => (
          <div key={p.title} className="surface-panel surface-panel-hover p-5">
            <p className="font-mono text-xs text-primary">{p.no}</p>
            <h2 className="mt-2 text-base font-bold">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-muted-foreground">
          남은혜택은 개인이 직접 기록하는 도구입니다. 메일 분석은 본인이 승인한 읽기 전용
          연결에서만 이루어지며, 잔량을 자동으로 조회하지 않습니다.
        </div>
      </footer>
    </div>
  );
}
