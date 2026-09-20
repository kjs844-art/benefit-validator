import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { exportMyData } from "@/lib/export.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "설정 · 남은혜택" },
      { name: "description", content: "내 서비스·혜택 데이터를 JSON 파일로 내보냅니다." },
      { property: "og:title", content: "설정 · 남은혜택" },
      { property: "og:description", content: "내 데이터 내보내기와 계정 정보." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

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
      const a = document.createElement("a");
      a.href = url;
      a.download = `namun-hyetaek-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        `서비스 ${payload.counts.services}건, 혜택 ${payload.counts.benefits}건, 메일 분석 ${payload.counts.email_discoveries}건을 내보냈습니다.`,
      );
    } catch (e) {
      toast.error(`내보내기 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell email={user?.email}>
      <h1 className="text-2xl font-bold">설정</h1>

      <section className="surface-panel mt-5 p-5">
        <h2 className="text-lg font-semibold">내 데이터 내보내기</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          내 서비스·혜택·메일 분석 기록을 JSON 파일로 저장합니다. 단위, 시간대, 출처 종류, 근거 메일의
          날짜와 제목, 마지막 확인 시점이 보존되며 내보낸 시각과 파일 형식 버전이 함께 기록됩니다.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          <li>· 다른 사용자의 데이터는 포함되지 않습니다.</li>
          <li>· 비밀번호, 로그인 토큰, 서버 비밀키는 포함되지 않습니다.</li>
          <li>
            · 이 기능은 <strong>내 데이터</strong>만 내보냅니다. 앱의 소스 코드나 로그인 시스템 자체를
            옮기는 기능이 아닙니다 (이전 방법은 DEPLOYMENT.md 참고).
          </li>
        </ul>
        <Button className="mt-4" onClick={download} disabled={busy}>
          {busy ? "준비 중…" : "JSON 내려받기"}
        </Button>
      </section>

      <section className="surface-panel mt-4 p-5">
        <h2 className="text-lg font-semibold">계정</h2>
        <p className="mt-2 text-sm text-muted-foreground">로그인 이메일: {user?.email ?? "-"}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Gmail은 사용자가 별도로 승인한 경우에만 읽기 전용으로 연결됩니다. 메일을 보내거나 수정·삭제하지
          않으며, 백그라운드 자동 동기화 없이 사용자가 분석 버튼을 누를 때만 확인합니다.
        </p>
      </section>
    </AppShell>
  );
}
