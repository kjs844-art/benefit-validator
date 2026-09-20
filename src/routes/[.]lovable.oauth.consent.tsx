import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";
import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id:
      typeof search["authorization_id"] === "string" ? search["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search["authorization_id"]) throw new Error("승인 요청 정보가 없습니다.");
    const { data } = await supabase.auth.getSession();
    // No session: send the user through the app's auth flow and preserve the
    // consent URL as a same-origin relative path so they return here.
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  head: () => ({
    meta: [
      { title: "AI 도구 연결 · 남은혜택" },
      { name: "description", content: "남은혜택 AI 도구 연결을 승인합니다." },
      { property: "og:title", content: "AI 도구 연결 · 남은혜택" },
      { property: "og:description", content: "남은혜택 AI 도구 연결을 승인합니다." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get(
      "authorization_id",
    )!;
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(
      authorizationId,
    );
    if (error) throw new Error(error.message);
    if (!data) throw new Error("승인 요청을 찾을 수 없습니다.");
    // Already-approved client: the provider resolves immediately.
    if ("redirect_url" in data) throw redirect({ href: data.redirect_url });
    return data as OAuthAuthorizationDetails;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Wordmark />
        <div className="surface-panel mt-5 p-6 text-sm">
        <h1 className="font-semibold">승인 요청을 표시할 수 없습니다</h1>
        <p className="mt-2 text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p></div>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details.client?.name ?? "외부 앱";

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
    const target = data?.redirect_url;
    if (!target) {
      setBusy(false);
      setError("이동할 주소가 반환되지 않았습니다. 창을 닫고 다시 시도해 주세요.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Wordmark />
        <div className="surface-panel mt-5 p-6">
        <h1 className="text-lg font-semibold">
          {clientName}를 남은혜택 계정에 연결
        </h1>
        <p className="mt-3 text-xs text-muted-foreground">
          로그인된 계정: {details.user?.email ?? "알 수 없음"}
        </p>
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
      </div>
    </main>
  );
}
