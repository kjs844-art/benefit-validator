import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/brand";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "서비스 이용약관 · KeyAtlas" },
      { name: "description", content: "KeyAtlas 서비스의 이용 조건과 사용자 책임을 안내합니다." },
      { property: "og:title", content: "서비스 이용약관 · KeyAtlas" },
      { property: "og:description", content: "KeyAtlas 서비스의 이용 조건과 사용자 책임을 안내합니다." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">서비스 이용약관</h1>
          <div className="mt-10 space-y-9 text-sm leading-7 text-muted-foreground sm:text-base">
            <section>
              <h2 className="text-xl font-bold text-foreground">1. 서비스</h2>
              <p className="mt-3">KeyAtlas는 사용자가 승인한 이메일에서 확인된 가입 서비스, 무료 체험, 쿠폰, 크레딧, 포인트, 결제 및 만료 정보를 찾아 정리하는 서비스입니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">2. 계정과 권한</h2>
              <p className="mt-3">사용자는 본인 계정만 연결해야 하며 계정 보안을 유지할 책임이 있습니다. Gmail 연결은 선택 사항이며 언제든 해제할 수 있습니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">3. 결과의 범위</h2>
              <p className="mt-3">표시되는 내용은 이메일에서 확인된 정보에 한정됩니다. 모든 가입 사이트나 모든 혜택을 보장하지 않으며, 메일에 명시되지 않은 현재 잔량은 확인 필요로 표시됩니다. 결제 취소나 구독 해지 전에는 해당 서비스의 공식 화면에서 최종 확인해야 합니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">4. 금지 행위</h2>
              <p className="mt-3">타인의 계정이나 정보를 무단으로 연결하거나, 서비스 운영을 방해하거나, 법령을 위반하는 방식으로 이용해서는 안 됩니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">5. 서비스 변경</h2>
              <p className="mt-3">안전성, 관련 서비스 정책 또는 운영상 필요에 따라 기능이 변경되거나 일시 중단될 수 있습니다. 중요한 변경 사항은 서비스 화면을 통해 안내합니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">6. 책임의 범위</h2>
              <p className="mt-3">KeyAtlas는 정보 정리를 돕는 도구이며 각 서비스의 실제 잔액, 사용 가능 여부, 가격 또는 만료 정책을 결정하지 않습니다. 사용자의 최종 확인 없이 이루어진 결제·해지 등 외부 서비스의 결정에 대해서는 책임을 지지 않습니다.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">7. 문의</h2>
              <p className="mt-3">서비스 관련 문의: <a className="font-semibold text-foreground underline underline-offset-4" href="mailto:kjs844@gmail.com">kjs844@gmail.com</a></p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}