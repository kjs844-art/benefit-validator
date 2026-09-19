import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "로그인 · 남은혜택" },
      { name: "description", content: "남은혜택 계정으로 로그인하거나 새 계정을 만듭니다." },
      { property: "og:title", content: "로그인 · 남은혜택" },
      { property: "og:description", content: "구독 혜택 잔량을 기록하는 남은혜택 계정 로그인." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/dashboard" });
    });
  }, [router]);

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
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("가입 확인 메일을 보냈습니다. 메일의 링크를 눌러 주세요.");
          return;
        }
        toast.success("가입이 완료되었습니다.");
        router.navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        router.navigate({ to: "/dashboard" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← 남은혜택 소개로
        </Link>
        <div className="surface-panel mt-4 p-6">
          <h1 className="text-xl font-semibold">
            {mode === "signin" ? "로그인" : "새 계정 만들기"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            내 혜택 데이터는 내 계정에서만 보입니다.
          </p>
          <form className="mt-5 space-y-4" onSubmit={submit}>
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
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">비밀번호 (8자 이상)</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={72}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "처리 중…" : mode === "signin" ? "로그인" : "가입하기"}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "계정이 없으신가요? 가입하기" : "이미 계정이 있으신가요? 로그인"}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          로그인 없이 둘러보려면{" "}
          <Link to="/demo" className="underline underline-offset-4">
            데모 체험
          </Link>
          을 이용하세요.
        </p>
      </div>
    </div>
  );
}
