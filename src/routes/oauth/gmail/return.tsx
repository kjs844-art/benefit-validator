import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Wordmark } from "@/components/brand";

export const Route = createFileRoute("/oauth/gmail/return")({
  head: () => ({
    meta: [
      { title: "Gmail 연결 완료 · KeyAtlas" },
      { name: "description", content: "Gmail 읽기 전용 연결을 완료합니다." },
      { property: "og:title", content: "Gmail 연결 완료 · KeyAtlas" },
      { property: "og:description", content: "Gmail 읽기 전용 연결을 완료합니다." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GmailReturnPage,
});

function GmailReturnPage() {
  const [message, setMessage] = useState("Gmail 연결을 마무리하고 있습니다…");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success") === "true";
    const code = params.get("code");
    const type = success ? "appUserConnectorOAuthComplete" : "appUserConnectorOAuthFailed";
    if (!success) setMessage(params.get("error") ?? "Gmail 연결을 완료하지 못했습니다.");
    window.opener?.postMessage({ type, connectorId: "google_mail", code }, window.location.origin);
    window.close();
  }, []);
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <Wordmark />
        <div className="surface-panel mt-5 flex items-center gap-3 p-6">
          <LoaderCircle
            className="size-5 animate-spin text-primary"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </main>
  );
}
