import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Check, Database, Download, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { exportMyData } from "@/lib/export.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "설정 · KeyAtlas" },
      {
        name: "description",
        content: "KeyAtlas의 Google 계정, 데이터 출처, WebMCP와 내보내기 설정을 확인합니다.",
      },
    ],
  }),
  component: SettingsPage,
});

function InfoRow({
  icon,
  title,
  description,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex gap-4 border-b border-border py-5 last:border-0">
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-muted text-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">{title}</h3>
          <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {status}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  const { user } = useAuth();
  const exportFn = useServerFn(exportMyData);
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const payload = await exportFn({});
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `keyatlas-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(
        `서비스 ${payload.counts.services}건, 혜택 ${payload.counts.benefits}건, 메일 분석 ${payload.counts.email_discoveries}건을 내보냈습니다.`,
      );
    } catch (error) {
      toast.error(`내보내기 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppShell email={user?.email}>
      <div className="rise">
        <p className="text-sm font-semibold text-primary">Privacy & access</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">내 데이터와 연결</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          KeyAtlas가 무엇을 볼 수 있고 무엇을 볼 수 없는지, 내 데이터가 어디에 사용되는지 투명하게
          확인하세요.
        </p>
      </div>
      <div className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-panel p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">계정과 데이터 출처</h2>
              <p className="text-xs text-muted-foreground">
                로그인과 조회 권한은 분리되어 있습니다.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <InfoRow
              icon={<Check className="size-4" />}
              title="Google 로그인"
              status="연결됨"
              description={`현재 ${user?.email ?? "Google 계정"}으로 KeyAtlas에 로그인했습니다. 로그인은 본인 확인용이며, 이것만으로 Google로 가입한 모든 외부 사이트 목록을 읽을 수는 없습니다.`}
            />
            <InfoRow
              icon={<Mail className="size-4" />}
              title="Gmail 읽기 전용 분석"
              status="별도 승인"
              description="사용자가 승인하고 조회 버튼을 눌렀을 때만 가입·환영·체험·크레딧·쿠폰·영수증·만료 메일의 근거를 분석합니다. 메일을 보내거나 수정·삭제하지 않습니다."
            />
            <InfoRow
              icon={<Database className="size-4" />}
              title="서비스별 공식 API"
              status="선택형"
              description="서비스가 공식 잔량 API를 제공하는 경우에만 별도 커넥터로 정확한 크레딧을 조회할 수 있습니다. Google 계정이 타사 서비스의 잔량을 대신 제공하지는 않습니다."
            />
          </div>
        </section>
        <div className="space-y-5">
          <section className="dark-panel rounded-[1.75rem] p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-sidebar-primary/15 text-sidebar-primary">
                <Bot className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-sidebar-foreground">WebMCP 준비</h2>
                <p className="text-xs text-sidebar-foreground/45">브라우저 AI 에이전트용</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-sidebar-foreground/65">
              지원 브라우저에서는 KeyAtlas가 5개의 구조화된 도구를 등록합니다. 에이전트는 현재
              로그인 사용자의 요약·서비스·발견 혜택·일정을 읽고 화면을 이동할 수 있습니다.
            </p>
            <div className="mt-5 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4 text-xs leading-6 text-sidebar-foreground/55">
              <ShieldCheck className="mr-2 inline size-4 text-sidebar-primary" />
              메일 본문과 제목은 WebMCP 결과에 포함하지 않습니다. 변경·삭제·결제 도구도 노출하지
              않습니다.
            </div>
          </section>
          <section className="surface-panel p-6">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-muted">
                <Download className="size-5" />
              </div>
              <div>
                <h2 className="font-bold">내 데이터 내보내기</h2>
                <p className="text-xs text-muted-foreground">이동 가능한 JSON 백업</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              내 서비스, 혜택, 메일 분석 결과와 확인 시점을 저장합니다. 비밀번호·OAuth 토큰·서버
              비밀키는 포함하지 않습니다.
            </p>
            <Button className="mt-5 w-full rounded-xl" onClick={download} disabled={busy}>
              {busy ? "준비 중…" : "JSON 백업 내려받기"}
            </Button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
