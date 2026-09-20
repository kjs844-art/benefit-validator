import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  completeGmailConnect,
  deleteGmailDiscoveries,
  disconnectGmail,
  getGmailConnection,
  getGmailDiscoveries,
  scanGmail,
  startGmailConnect,
} from "@/lib/gmail.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/gmail")({
  head: () => ({
    meta: [
      { title: "Gmail 메일 분석 · 남은혜택" },
      { name: "description", content: "Gmail에서 확인된 가입 서비스와 혜택 안내를 읽기 전용으로 분석합니다." },
      { property: "og:title", content: "Gmail 메일 분석 · 남은혜택" },
      { property: "og:description", content: "메일에서 확인된 가입 서비스와 혜택을 검토합니다." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GmailPage,
});

function waitForOAuth(popup: Window) {
  return new Promise<string>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        event.data?.connectorId !== "google_mail"
      ) return;
      cleanup();
      if (event.data?.type === "appUserConnectorOAuthComplete" && typeof event.data?.code === "string") {
        resolve(event.data.code);
        return;
      }
      popup.close();
      reject(new Error("Gmail 연결을 완료하지 못했습니다."));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("Gmail 연결 창이 닫혔습니다."));
    }, 500);
  });
}

function GmailPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const start = useServerFn(startGmailConnect);
  const complete = useServerFn(completeGmailConnect);
  const statusFn = useServerFn(getGmailConnection);
  const discoveriesFn = useServerFn(getGmailDiscoveries);
  const scan = useServerFn(scanGmail);
  const disconnect = useServerFn(disconnectGmail);
  const deleteDiscoveries = useServerFn(deleteGmailDiscoveries);
  const status = useQuery({ queryKey: ["gmail-connection"], queryFn: () => statusFn({}) });
  const discoveries = useQuery({ queryKey: ["gmail-discoveries"], queryFn: () => discoveriesFn({}) });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const popup = window.open("", "gmail-connect", "width=600,height=720");
      if (!popup) throw new Error("팝업을 허용한 뒤 다시 시도해 주세요.");
      try {
        const { authorizationUrl } = await start({});
        const completion = waitForOAuth(popup);
        popup.location.href = authorizationUrl;
        const code = await completion;
        await complete({ data: { code } });
      } catch (error) {
        popup.close();
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
      toast.success("Gmail 읽기 전용 연결이 완료됐습니다.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const scanMutation = useMutation({
    mutationFn: () => scan({}),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["gmail-discoveries"] });
      if (result.reconnectRequired) {
        await queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
        toast.error("Gmail 접근을 다시 승인해 주세요.");
      } else if (result.discoveries.length === 0) {
        toast.message("분석할 혜택 메일을 찾지 못했습니다.");
      } else {
        toast.success(`${result.discoveries.length}건을 확인했습니다.`);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnect({}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
      toast.success("Gmail 연결을 해제했습니다.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDiscoveries({}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gmail-discoveries"] });
      toast.success("저장된 메일 분석 결과를 삭제했습니다.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell email={user?.email}>
      <h1 className="text-2xl font-bold">Gmail 메일 분석</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        읽기 권한으로 최근 2년의 가입·체험·혜택·결제 안내 후보만 확인합니다. 메일을 보내거나 수정·삭제하지
        않으며, 원문 전체는 저장하지 않습니다.
      </p>

      <section className="surface-panel mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Gmail 연결</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {status.isLoading
                ? "연결 상태 확인 중…"
                : status.data?.connected
                  ? `${status.data.email ?? "Gmail 계정"} · 읽기 전용 연결됨`
                  : status.data?.reconnectRequired
                    ? "읽기 권한을 다시 승인해야 합니다."
                    : "아직 연결되지 않았습니다."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {status.data?.connected ? (
              <>
                <Button onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending}>
                  {scanMutation.isPending ? "메일 확인 중…" : "혜택 메일 분석"}
                </Button>
                <Button variant="outline" onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}>
                  연결 해제
                </Button>
              </>
            ) : (
              <Button onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending}>
                {status.data?.reconnectRequired ? "Gmail 다시 연결" : "Gmail 읽기 전용 연결"}
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">메일에서 확인된 가입 서비스</h2>
            <p className="mt-1 text-sm text-muted-foreground">현재 잔량이 메일에 없으면 추측하지 않고 잔량 확인 필요로 표시합니다.</p>
          </div>
          {(discoveries.data?.length ?? 0) > 0 ? (
            <Button variant="outline" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              분석 결과 모두 삭제
            </Button>
          ) : null}
        </div>
        {discoveries.isLoading ? <p className="mt-4 text-sm text-muted-foreground">결과를 불러오는 중…</p> : null}
        {!discoveries.isLoading && discoveries.data?.length === 0 ? (
          <p className="surface-panel mt-4 p-5 text-sm text-muted-foreground">저장된 메일 분석 결과가 없습니다.</p>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(discoveries.data ?? []).map((item) => (
            <article key={item.id} className="surface-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs text-muted-foreground">{item.service_name}</p><h3 className="font-semibold">{item.benefit_name}</h3></div>
                <span className="text-xs text-muted-foreground">신뢰도 {item.confidence}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">지급된 양</dt><dd>{item.granted_amount === null ? "명시 없음" : `${item.granted_amount} ${item.unit}`}</dd></div>
                <div><dt className="text-xs text-muted-foreground">현재 잔량</dt><dd className={item.remaining_amount === null ? "text-unknown" : "text-primary"}>{item.remaining_amount === null ? "잔량 확인 필요" : `${item.remaining_amount} ${item.unit}`}</dd></div>
                <div><dt className="text-xs text-muted-foreground">무료 체험</dt><dd>{item.trial_days === null ? "명시 없음" : `${item.trial_days}일`}</dd></div>
                <div><dt className="text-xs text-muted-foreground">남은 기간</dt><dd>{item.remaining_days === null ? "확인 필요" : `${item.remaining_days}일`}</dd></div>
              </dl>
              {item.expires_at ? <p className="mt-3 text-xs text-muted-foreground">만료일: {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(item.expires_at))}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">근거: {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(item.evidence_date))} · {item.evidence_subject}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}