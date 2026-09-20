import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "남은혜택 — 잊고 있던 무료 혜택 찾기" },
      {
        name: "description",
        content:
          "가입해 두고 잊은 무료 체험·크레딧·쿠폰을 Gmail에서 찾아, 근거와 함께 있는 그대로 보여드립니다.",
      },
      { property: "og:title", content: "남은혜택 — 잊고 있던 무료 혜택 찾기" },
      {
        property: "og:description",
        content: "잊고 있던 무료 체험·크레딧·쿠폰, 메일에서 찾아 한눈에.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const MOCK_CARDS = [
  {
    service: "디자인 스튜디오",
    kind: "Pro 무료 체험",
    value: "14일",
    sub: "남은 기간 확인 필요",
    evidence: "근거 메일 · 09.19",
    ratio: null as number | null,
    unknown: true,
  },
  {
    service: "AI 어시스턴트",
    kind: "고급 모델 크레딧",
    value: "12 / 50회",
    sub: "월 상한 200회",
    evidence: "근거 메일 · 09.18",
    ratio: 0.24,
    unknown: false,
  },
  {
    service: "커피 구독",
    kind: "무료 음료 쿠폰",
    value: "1 / 4회",
    sub: "매월 리셋",
    evidence: "근거 메일 · 09.10",
    ratio: 0.25,
    unknown: false,
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
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
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="rise font-mono text-xs tracking-[0.18em] text-primary">
              잊고 지낸 무료 혜택 찾기
            </p>
            <h1 className="rise-1 mt-4 text-4xl font-bold leading-[1.15] sm:text-6xl">
              가입하고 잊은
              <br />
              혜택, 메일이
              <br />
              기억합니다.
            </h1>
            <p className="rise-2 mt-5 text-base text-muted-foreground">
              무료 체험·크레딧·쿠폰, 있는 그대로.
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
                내 메일로 찾기
              </Link>
            </div>
          </div>

          <div aria-hidden="true" className="rise-2 relative hidden lg:block">
            <div className="space-y-4">
              {MOCK_CARDS.map((card, i) => (
                <div
                  key={card.service}
                  className="surface-panel p-4"
                  style={{
                    transform: `translateX(${i * 18}px) rotate(${i === 1 ? 0.6 : -0.4}deg)`,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{card.service}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {card.evidence}
                    </p>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <h2 className="text-base font-bold">{card.kind}</h2>
                    <p
                      className={
                        card.unknown
                          ? "tnum text-xl font-bold text-unknown"
                          : "tnum text-xl font-bold text-primary"
                      }
                    >
                      {card.value}
                    </p>
                  </div>
                  {card.ratio !== null ? (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${card.ratio * 100}%` }}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-unknown">{card.sub}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
