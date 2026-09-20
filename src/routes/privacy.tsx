import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/brand";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "개인정보처리방침 · KeyAtlas" },
      {
        name: "description",
        content: "KeyAtlas의 계정, Gmail 읽기 권한, 분석 결과 보관과 삭제에 관한 개인정보처리방침입니다.",
      },
      { property: "og:title", content: "개인정보처리방침 · KeyAtlas" },
      {
        property: "og:description",
        content: "KeyAtlas의 계정, Gmail 읽기 권한, 분석 결과 보관과 삭제에 관한 개인정보처리방침입니다.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <Link to="/" aria-label="KeyAtlas 처음 화면">
            <Wordmark />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> 돌아가기
          </Link>
        </div>

        <article className="py-10 sm:py-14">
          <p className="text-sm font-semibold text-primary">2026년 9월 20일 시행</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">개인정보처리방침</h1>
          <div className="mt-10 space-y-9 text-sm leading-7 text-muted-foreground sm:text-base">
            <section>
              <h2 className="text-xl font-bold text-foreground">1. 수집하는 정보</h2>
              <p className="mt-3">KeyAtlas는 계정 운영을 위해 이메일 주소와 사용자 식별자를 처리합니다. 사용자가 Gmail 연결을 승인하면 가입, 무료 체험, 쿠폰, 크레딧, 포인트, 결제 및 만료 관련 메일을 읽기 전용으로 조회합니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">2. 이용 목적</h2>
              <p className="mt-3">조회한 정보는 메일에서 확인된 가입 서비스와 혜택을 분류하고, 근거 날짜·제목·신뢰도와 함께 사용자에게 표시하는 데 사용합니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">3. Gmail 데이터 처리</h2>
              <p className="mt-3">Gmail 권한은 읽기 전용입니다. KeyAtlas는 메일을 발송·수정·삭제하지 않으며, 메일 원문 전체를 저장하지 않습니다. 분석 결과에는 서비스명, 혜택 종류와 수량, 기간, 만료일, 근거 메일의 날짜와 제목 등 필요한 최소 정보만 저장합니다. 현재 잔량이 명시되지 않은 경우 숫자를 추측하지 않습니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">3-1. Google 사용자 데이터 제한된 사용</h2>
              <p className="mt-3">KeyAtlas가 Google API로 수신한 정보의 사용 및 다른 앱으로의 전송은 제한된 사용 요건을 포함한 Google API 서비스 사용자 데이터 정책을 준수합니다. Google 사용자 데이터는 사용자에게 혜택 조회 기능을 제공하는 목적으로만 사용하며, 광고 목적으로 사용하거나 제3자에게 판매하지 않고, AI 모델 학습에 사용하지 않습니다. 사람이 열람하지 않으며, 예외는 사용자의 명시적 동의, 보안 목적, 법령 준수, 익명 집계 처리에 한합니다.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">4. 보관과 삭제</h2>
              <p className="mt-3">계정 및 분석 결과는 서비스 제공 기간 동안 보관됩니다. 사용자는 앱에서 Gmail 연결을 해제하고 저장된 메일 분석 결과를 삭제할 수 있습니다. 연결 해제 시 저장된 Gmail 연결 자격 정보도 삭제됩니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">5. 제3자 처리</h2>
              <p className="mt-3">서비스 운영에는 Google Gmail API, Lovable Cloud 및 AI 분석 서비스가 사용됩니다. AI 분석 요청에는 관련 메일의 필요한 부분만 전달하며 모델 학습용 저장을 요청하지 않습니다. 법령상 요구되는 경우를 제외하고 개인정보를 판매하지 않습니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">6. 보호 조치</h2>
              <p className="mt-3">사용자별 접근 통제, 서버 측 권한 확인, 연결 정보 암호화 및 사용자별 데이터 분리를 적용합니다. 비밀번호, OAuth 토큰과 서버 비밀키는 데이터 내보내기에 포함하지 않습니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">7. 문의</h2>
              <p className="mt-3">개인정보 관련 문의: <a className="font-semibold text-foreground underline underline-offset-4" href="mailto:kjs844@gmail.com">kjs844@gmail.com</a></p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}