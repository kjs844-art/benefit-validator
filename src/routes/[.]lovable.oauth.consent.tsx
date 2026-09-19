import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthDetails = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string } | null;
  scopes?: string | string[] | null;
};

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id:
      typeof search.authorization_id === "string" ? search.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("승인 요청 정보가 없습니다.");
    const { data } = await supabase.auth.getSession();
    // No session: send the user through the app's auth flow and preserve the
    // consent URL as a same-origin relative path so they return here.
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get(
      "authorization_id",
    )!;
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(
      authorizationId,
    );
    if (error) throw new Error(error.message);
    // Already-approved client: the provider resolves immediately.
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-panel max-w-sm p-6 text-sm">
        <p className="font-semibold">승인 요청을 표시할 수 없습니다</p>
        <p className="mt-2 text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData() as OAuthDetails | null;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: sessionData } = useSessionEmail();
  const clientName = details?.client?.name ?? "외부 앱";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorization_id)
      : await supabase.auth.oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("이동할 주소가 반환되지 않았습니다. 창을 닫고 다시 시도해 주세요.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="surface-panel w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold">
          {clientName}를 남은혜택 계정에 연결
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          연결하면 {clientName}가 로그인된 상태에서 이 앱의 도구를 내 계정으로
          사용할 수 있습니다. 데이터는 내 계정 것만 접근 가능하며, 이 앱의 권한
          정책과 보안 규칙은 그대로 적용됩니다.
        </p>
        {sessionData ? (
          <p className="mt-3 text-xs text-muted-foreground">
            로그인된 계정: {sessionData}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? "처리 중…" : "연결 승인"}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={() => decide(false)}
          >
            연결 취소
          </Button>
        </div>
      </div>
    </main>
  );
}

function useSessionEmail() {
  return useState<{ data: string | null }>(() => ({ data: null })) as never;
}
