import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Check, Mail, Minus, ScanText, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "남은혜택 - 받아 두고 잊은 무료 혜택 찾기" },
      {
        name: "description",
        content:
          "가입할 때 받은 무료 체험, 크레딧, 쿠폰을 메일과 캡처에서 찾아 근거와 함께 있는 그대로 보여 줍니다.",
      },
      { property: "og:title", content: "남은혜택 - 받아 두고 잊은 무료 혜택 찾기" },
      {
        property: "og:description",
        content: "받아 두고 잊은 무료 체험과 크레딧, 한 곳에 모아 둡니다.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const HOW = [
  {
    icon: Mail,
    title: "Gmail에서 찾기",
    body: "읽기 전용으로 연결하면 최근 2년치 가입, 체험, 결제 안내 메일에서 혜택 후보를 찾습니다. 근거가 된 메일 제목과 날짜를 항목마다 함께 남깁니다.",
  },
  {
    icon: ScanText,
    title: "안내문과 캡처로 정리하기",
    body: "네이버나 카카오 메일처럼 직접 연결되지 않는 곳은 본문을 붙여넣거나 화면을 캡처해 올리면 항목으로 정리됩니다. 저장하기 전에 값을 직접 고칠 수 있습니다.",
  },
  {
    icon: CalendarClock,
    title: "다시 확인할 시점 알기",
    body: "매월 리셋되는 쿠폰, 곧 끝나는 무료 체험처럼 시점이 중요한 항목을 따로 모아 둡니다. 기한이 지나면 값을 고치지 않고 다시 확인하라고만 알려 줍니다.",
  },
];

const RULES = [
  {
    title: "0과 모름을 구분합니다",
    body: "자료에 잔량이 적혀 있지 않으면 0으로 적지 않고 모름으로 남깁니다.",
  },
  {
    title: "단위가 다르면 합치지 않습니다",
    body: "쿠폰 3회와 크레딧 500은 하나의 합계에 들어가지 않습니다. 단위별로만 더합니다.",
  },
  {
    title: "확인한 시점을 함께 적습니다",
    body: "날짜만 있는 자료에 없는 시각을 붙이지 않습니다. 기록된 정밀도 그대로 보여 줍니다.",
  },
  {
    title: "리셋 시각이 지나도 값을 올리지 않습니다",
    body: "기록된 숫자는 그대로 두고, 다시 확인이 필요하다는 표시만 더합니다.",
  },
];

const DOES = [
  "Gmail 읽기 전용 연결과 혜택 메일 분석",
  "붙여넣은 안내문과 화면 캡처를 AI로 정리",
  "서비스와 혜택 직접 기록, 수정, 삭제",
  "리셋 예정과 무료 체험 종료 일정 모아 보기",
  "내 데이터 JSON 내보내기",
  "MCP 서버로 다른 AI 도구에서 조회",
];

const DOES_NOT = [
  "각 사이트에 대신 로그인해 잔량 자동 조회",
  "백그라운드 자동 동기화",
  "이메일과 푸시 알림 발송",
  "네이버, 카카오 메일 직접 연결",
  "가족이나 팀과 함께 보기",
];

function Landing() {
  return (
    <div className="page-top min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
        <Link to="/" className="text-[0.95rem]">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/demo"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            데모 보기
          </Link>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            시작하기
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-14 lg:px-8">
        <div>
          <p className="rise eyebrow">구독 혜택 기록</p>
          <h1 className="rise-1 mt-5 text-[2.1rem] leading-[1.28] sm:text-5xl sm:leading-[1.25]">
            받아 두고 잊은 무료 혜택을
            <br />
            <span className="text-muted-foreground">한 곳에 모아 둡니다.</span>
          </h1>
          <p className="rise-2 mt-6 max-w-xl leading-relaxed text-muted-foreground">
            구글, 네이버, 카카오 계정으로 가입할 때마다 따라오는 크레딧과 무료 체험. 어디에 무엇이
            얼마나 남았는지 기록하고, 다시 확인해야 할 시점까지 함께 알려 드립니다.
          </p>
          <div className="rise-3 mt-8 flex flex-wrap gap-3">
            <Link
              to="/demo"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              데모 보기
            </Link>
            <Link
              to="/auth"
              className="rounded-md border border-input px-5 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              시작하기
            </Link>
          </div>
          <p className="rise-3 mt-6 flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-primary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            메일은 사용자가 분석을 누른 순간에만, 읽기 전용으로 확인합니다. 본문은 저장하지
            않습니다.
          </p>
        </div>

        <div className="rise-2">
          <div className="surface-panel overflow-hidden p-1.5">
            <img
              src="/preview-demo.png"
              alt="남은혜택 데모 화면. 단위별 남은 양 합계와 서비스별 혜택 카드가 보입니다."
              width={1280}
              height={980}
              className="w-full rounded-md"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:px-8">
          <div>
            <p className="eyebrow">찾는 방법</p>
            <h2 className="mt-4 text-2xl sm:text-3xl">
              기억에 기대지 않고
              <br />
              기록에서 찾습니다.
            </h2>
          </div>
          <div className="divide-y divide-hairline">
            {HOW.map((item) => (
              <div key={item.title} className="flex gap-5 py-6 first:pt-0 last:pb-0">
                <item.icon
                  className="mt-1 size-5 shrink-0 text-primary"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-base">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-hairline bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:px-8">
          <div>
            <p className="eyebrow">기록 원칙</p>
            <h2 className="mt-4 text-2xl sm:text-3xl">모르는 값은 모른다고 적습니다.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              혜택 정보는 추측이 한 번 섞이면 믿을 수 없게 됩니다. 그래서 채워 넣는 대신 비워 두는
              쪽을 택했습니다.
            </p>
          </div>
          <dl className="divide-y divide-hairline">
            {RULES.map((rule) => (
              <div
                key={rule.title}
                className="grid gap-2 py-5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:gap-8"
              >
                <dt className="font-semibold">{rule.title}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{rule.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <p className="eyebrow">제출 시점 기준</p>
        <h2 className="mt-4 text-2xl sm:text-3xl">지금 되는 것과 아직 안 되는 것.</h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-2 sm:gap-16">
          <div>
            <h3 className="text-sm text-primary">지금 되는 것</h3>
            <ul className="mt-4 space-y-3">
              {DOES.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed">
                  <Check
                    className="mt-1 size-4 shrink-0 text-primary"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm text-muted-foreground">아직 안 되는 것</h3>
            <ul className="mt-4 space-y-3">
              {DOES_NOT.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <Minus className="mt-1 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-8 px-5 py-20 lg:px-8">
          <div>
            <h2 className="text-2xl sm:text-3xl">로그인 없이 먼저 둘러보세요.</h2>
            <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">
              데모는 샘플 데이터로 실제 화면을 그대로 보여 줍니다. 계정에 저장되는 내용은 없습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/demo"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              데모 보기
            </Link>
            <Link
              to="/auth"
              className="rounded-md border border-input px-5 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              시작하기
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground lg:px-8">
          <Wordmark className="text-foreground" />
          <p>기록은 사용자 계정 안에서만 보입니다.</p>
        </div>
      </footer>
    </div>
  );
}
