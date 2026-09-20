import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/brand";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search["next"] === "string" ? search["next"] : "";
    return {
      next: raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://") ? raw : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "로그인 · KeyAtlas." },
      { name: "description", content: "Google 계정으로 KeyAtlas를 시작하세요." },
    ],
  }),
  component: AuthPage,
});
const schema = z.object({
  email: z.string().trim().email("이메일 형식이 올바르지 않습니다.").max(255),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(72),
});

function AuthPage() {
  const router = useRouter();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  function finishAuth() {
    if (next) router.history.push(next);
    else router.navigate({ to: "/gmail" });
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finishAuth();
    }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function socialSignIn(provider: "google") {
    setBusy(true);
    try {
      const redirect_uri = next
        ? `${window.location.origin}${next}`
        : `${window.location.origin}/auth`;
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri });
      if (result.error) throw result.error;
      if (!result.redirected) finishAuth();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google 로그인에 실패했습니다.");
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "입력을 확인해 주세요.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: next ? `${window.location.origin}${next}` : window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("가입 확인 메일을 보냈습니다.");
          return;
        }
        toast.success("가입이 완료되었습니다.");
        finishAuth();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        finishAuth();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "로그인에 실패했습니다.";
      toast.error(
        message.includes("Invalid login credentials")
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[0.9fr_1.1fr]">
      <div className="dark-panel hidden flex-col justify-between p-10 lg:flex xl:p-16">
        <Link to="/">
          <Wordmark className="text-sidebar-foreground" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sidebar-primary">
            Your digital account atlas
          </p>
          <h1 className="mt-5 max-w-md text-5xl font-bold leading-[1.05]">
            가입하고 잊었던 서비스를
            <br />
            다시 찾는 곳.
          </h1>
          <div className="mt-9 space-y-4 text-sm text-sidebar-foreground/65">
            <p>
              <Check className="mr-2 inline size-4 text-sidebar-primary" />
              가입·환영 메일에서 서비스 흔적 찾기
            </p>
            <p>
              <Check className="mr-2 inline size-4 text-sidebar-primary" />
              남은 크레딧과 쿠폰을 한눈에
            </p>
            <p>
              <Check className="mr-2 inline size-4 text-sidebar-primary" />
              확인된 메일 근거와 날짜를 함께
            </p>
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/40">
          Google 로그인과 Gmail 조회 권한은 별도로 승인됩니다.
        </p>
      </div>
      <div className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            소개로 돌아가기
          </Link>
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">
              {mode === "signin" ? "Welcome back" : "Get started"}
            </p>
            <h2 className="mt-2 text-4xl font-bold">
              {mode === "signin" ? "내 Atlas로 돌아가기" : "내 계정 지도를 만들어볼까요?"}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Google 계정으로 시작하면 가장 빠릅니다.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => socialSignIn("google")}
            disabled={busy}
            className="mt-8 h-13 w-full rounded-2xl bg-foreground text-background hover:bg-foreground/90"
          >
            <span className="mr-3 grid size-6 place-items-center rounded-md bg-white text-xs font-bold text-blue-600">
              G
            </span>
            {busy ? "연결 중…" : "Google로 계속하기"}
          </Button>
          <div className="my-7 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            또는 이메일로
            <span className="h-px flex-1 bg-border" />
          </div>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                required
                className="h-12 rounded-xl bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">
                비밀번호 <span className="font-normal text-muted-foreground">(8자 이상)</span>
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={72}
                required
                className="h-12 rounded-xl bg-card"
              />
            </div>
            <Button type="submit" className="h-12 w-full rounded-xl" disabled={busy}>
              {busy ? "처리 중…" : mode === "signin" ? "로그인" : "가입하기"}
            </Button>
          </form>
          <button
            type="button"
            className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "계정이 없으신가요? 가입하기" : "이미 계정이 있으신가요? 로그인"}
          </button>
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="rounded-xl bg-muted/60 p-3">
              <LockKeyhole className="mb-2 size-4 text-primary" />
              데이터 암호화
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <ShieldCheck className="mb-2 size-4 text-primary" />
              읽기 전용 분석
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            로그인 없이{" "}
            <Link to="/demo" className="font-semibold text-foreground underline underline-offset-4">
              데모 체험
            </Link>
            도 가능합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
