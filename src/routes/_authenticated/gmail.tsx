import { createFileRoute, Link } from "@tanstack/react-router";
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
import {
  Check,
  ChevronRight,
  FileSearch,
  Link2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

const CATEGORY_LABELS = {
  trial: "무료 체험",
  coupon: "쿠폰·프로모션",
  credit: "크레딧",
  point: "포인트",
  storage: "저장 용량",
  receipt: "구독·결제",
  expiration: "만료 예정",
  membership: "가입 서비스",
  other: "기타 혜택",
} as const;
export const Route = createFileRoute("/_authenticated/gmail")({
  head: () => ({
    meta: [
      { title: "Overview · KeyAtlas." },
      { name: "description", content: "Gmail에서 확인된 가입 서비스와 혜택을 검토합니다." },
    ],
  }),
  component: GmailPage,
});

function waitForOAuth(popup: Window) {
  return new Promise<string>((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        event.data?.connectorId !== "google_mail"
      )
        return;
      cleanup();
      if (
        event.data?.type === "appUserConnectorOAuthComplete" &&
        typeof event.data?.code === "string"
      )
        return resolve(event.data.code);
      popup.close();
      reject(new Error("Gmail 연결을 완료하지 못했습니다."));
    };
    window.addEventListener("message", onMessage);
    const poll = window.setInterval(() => {
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
  const discoveries = useQuery({
    queryKey: ["gmail-discoveries"],
    queryFn: () => discoveriesFn({}),
  });
  const scanMutation = useMutation({
    mutationFn: () => scan({}),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["gmail-discoveries"] });
      if (result.reconnectRequired) {
        await queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
        toast.error("Google 연결을 다시 승인해 주세요.");
      } else if (result.discoveries.length === 0) toast.message("혜택 메일을 찾지 못했습니다.");
      else toast.success(`${result.discoveries.length}건을 찾았습니다.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
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
      toast.success("Google 계정이 연결됐습니다.");
      await scanMutation.mutateAsync();
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
  const connected = status.data?.connected;
  return (
    <AppShell email={user?.email}>
      <div className="rise flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-primary">Your account atlas</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">잊고 있던 서비스를 다시 찾으세요.</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            가입과 환영, 체험, 크레딧, 쿠폰, 결제 메일에서 확인된 흔적을 모았습니다. 현재 잔량이
            명시되지 않은 정보는 추측하지 않고 확인 필요로 표시합니다.
          </p>
        </div>
        {connected ? (
          <Button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            className="rounded-xl"
          >
            <RefreshCw className="mr-2 size-4" />
            {scanMutation.isPending ? "찾는 중…" : "다시 찾기"}
          </Button>
        ) : null}
      </div>
      <section className="rise-1 dark-panel relative mt-9 overflow-hidden rounded-[1.75rem] p-6 sm:p-8">
        <div className="absolute -right-10 -top-16 size-56 rounded-full bg-sidebar-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-sidebar-primary">
              <span className="size-2 rounded-full bg-sidebar-primary" />
              Evidence connection
            </div>
            <h2 className="mt-4 text-2xl font-bold text-sidebar-foreground">
              계정 메일에서 가입 흔적 찾기
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-7 text-sidebar-foreground/60">
              Google 로그인과 별도로 Gmail 읽기 권한을 승인하면 최근 가입·혜택 관련 메일을
              분석합니다. 메일을 보내거나 수정하지 않습니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-sidebar-foreground/55">
              <span>
                <ShieldCheck className="mr-1 inline size-3.5 text-sidebar-primary" />
                읽기 전용
              </span>
              <span>
                <FileSearch className="mr-1 inline size-3.5 text-sidebar-primary" />
                근거 저장
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {connected ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-xl bg-sidebar-primary/15 px-3 py-2 text-xs font-semibold text-sidebar-primary">
                  <Check className="size-3.5" />
                  {status.data?.email ?? "연결됨"}
                </span>
                <Button
                  variant="outline"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  className="rounded-xl border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  연결 해제
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  className="rounded-xl bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                >
                  <Link2 className="mr-2 size-4" />
                  {status.data?.reconnectRequired ? "Google 다시 연결" : "Google 연결하기"}
                </Button>
                <Link
                  to="/analyze"
                  className="inline-flex items-center rounded-xl border border-sidebar-border px-4 py-2 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  메일 붙여넣어 찾기
                </Link>
              </>
            )}

          </div>
        </div>
      </section>
      <section className="rise-2 mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Discovered account traces
            </p>
            <h2 className="mt-2 text-2xl font-bold">메일 근거로 찾은 서비스와 혜택</h2>
          </div>
          {(discoveries.data?.length ?? 0) > 0 ? (
            <Button
              variant="ghost"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="text-muted-foreground"
            >
              분석 결과 삭제
            </Button>
          ) : null}
        </div>
        {discoveries.isLoading ? (
          <p className="mt-5 text-sm text-muted-foreground">결과를 불러오는 중…</p>
        ) : null}
        {!discoveries.isLoading && discoveries.data?.length === 0 ? (
          <div className="surface-panel mt-5 p-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Mail className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold">아직 발견된 혜택이 없어요.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Gmail 읽기 전용 연결을 승인하고 첫 번째 조회를 시작해보세요.
            </p>
          </div>
        ) : null}
        <div className="mt-6 space-y-8">
          {Object.entries(CATEGORY_LABELS).map(([kind, label]) => {
            const items = (discoveries.data ?? []).filter((item) => item.benefit_kind === kind);
            if (!items.length) return null;
            return (
              <section key={kind}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{label}</h3>
                  <span className="tnum rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {items.length}
                  </span>
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {items.map((item) => (
                    <article key={item.id} className="surface-panel surface-panel-hover p-5">
                      <div className="flex items-start gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-background">
                          <Sparkles className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">{item.service_name}</p>
                              <h3 className="mt-1 font-bold">{item.benefit_name}</h3>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              신뢰도 {item.confidence}
                            </span>
                          </div>
                          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <dt className="text-xs text-muted-foreground">지급된 양</dt>
                              <dd className="mt-1 font-semibold">
                                {item.granted_amount === null
                                  ? "명시 없음"
                                  : `${item.granted_amount} ${item.unit}`}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted-foreground">현재 잔량</dt>
                              <dd
                                className={`mt-1 font-semibold ${item.remaining_amount === null ? "text-amber-700" : "text-primary"}`}
                              >
                                {item.remaining_amount === null
                                  ? "확인 필요"
                                  : `${item.remaining_amount} ${item.unit}`}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted-foreground">무료 체험</dt>
                              <dd className="mt-1 font-semibold">
                                {item.trial_days === null ? "명시 없음" : `${item.trial_days}일`}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted-foreground">남은 기간</dt>
                              <dd className="mt-1 font-semibold">
                                {item.remaining_days === null
                                  ? "확인 필요"
                                  : `${item.remaining_days}일`}
                              </dd>
                            </div>
                          </dl>
                          {item.expires_at ? (
                            <p className="mt-5 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                              <TriangleAlert className="mr-1 inline size-3.5" />
                              만료일:{" "}
                              {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(
                                new Date(item.expires_at),
                              )}
                            </p>
                          ) : null}
                          <p className="mt-3 flex items-start gap-1 text-xs leading-5 text-muted-foreground">
                            <ChevronRight className="mt-0.5 size-3.5 shrink-0" />
                            근거:{" "}
                            {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(
                              new Date(item.evidence_date),
                            )}{" "}
                            · {item.evidence_subject}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
