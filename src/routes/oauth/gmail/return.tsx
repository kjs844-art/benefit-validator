import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oauth/gmail/return")({
  head: () => ({
    meta: [
      { title: "Gmail 연결 완료 · 남은혜택" },
      { name: "description", content: "Gmail 읽기 전용 연결을 완료합니다." },
      { property: "og:title", content: "Gmail 연결 완료 · 남은혜택" },
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
  return <main className="grid min-h-screen place-items-center p-6"><p>{message}</p></main>;
}