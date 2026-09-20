import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  CalendarClock,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Mail,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/brand";
import { useKeyAtlasWebMCP } from "@/lib/webmcp/useKeyAtlasWebMCP";

const NAV = [
  { to: "/gmail", label: "Overview", korean: "대시보드", icon: LayoutDashboard },
  { to: "/services", label: "Services", korean: "내 서비스", icon: Sparkles },
  { to: "/analyze", label: "Analyze", korean: "자료 분석", icon: FileSearch },
  { to: "/schedule", label: "Timeline", korean: "일정", icon: CalendarClock },
  { to: "/settings", label: "Settings", korean: "설정", icon: Settings },
] as const;

export function AppShell({
  children,
  email,
}: {
  children: ReactNode;
  email?: string | null | undefined;
}) {
  const router = useRouter();
  const webMcp = useKeyAtlasWebMCP();
  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", search: { next: undefined } });
  }
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="dark-panel sticky top-0 hidden h-screen flex-col border-r border-sidebar-border px-5 py-6 lg:flex">
        <Link to="/gmail" className="px-2">
          <Wordmark className="text-sidebar-foreground" />
        </Link>
        <div className="mt-12 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/45">
          Workspace
        </div>
        <nav className="mt-3 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-sidebar-foreground/60"
              activeProps={{
                className:
                  "group flex items-center gap-3 rounded-2xl bg-sidebar-primary px-3 py-3 text-sm font-semibold text-sidebar-primary-foreground shadow-[0_12px_24px_-14px_oklch(0.75_0.16_157)]",
              }}
              inactiveProps={{
                className:
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              }}
            >
              <item.icon className="size-[18px]" strokeWidth={1.8} />
              <span>{item.korean}</span>
              <span className="ml-auto text-[10px] opacity-45">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="size-2 rounded-full bg-sidebar-primary" />
            Gmail 연결 상태
          </div>
          <p className="mt-2 text-xs leading-relaxed text-sidebar-foreground/55">
            읽기 전용으로 혜택 메일을 찾고 있어요.
          </p>
          <Link
            to="/gmail"
            className="mt-3 flex items-center gap-1 text-xs font-semibold text-sidebar-primary hover:underline"
          >
            <Plus className="size-3" /> 다시 분석하기
          </Link>
        </div>
        <div className="mt-3 flex items-center justify-between px-2 text-[10px] text-sidebar-foreground/40">
          <span>WebMCP</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full ${webMcp.status === "registered" ? "bg-sidebar-primary" : "bg-sidebar-foreground/25"}`}
            />
            {webMcp.status === "registered"
              ? `${webMcp.toolCount} tools ready`
              : webMcp.status === "unsupported"
                ? "browser preview"
                : "checking"}
          </span>
        </div>
        <div className="mt-4 border-t border-sidebar-border pt-4">
          {email ? (
            <p className="truncate px-2 text-xs text-sidebar-foreground/50">{email}</p>
          ) : null}
          <button
            type="button"
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
            로그아웃
          </button>
        </div>
      </aside>
      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <Link to="/gmail">
              <Wordmark />
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-xl px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              로그아웃
            </button>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto [scrollbar-width:none]">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="shrink-0 rounded-xl px-3 py-1.5 text-sm text-muted-foreground"
                activeProps={{
                  className:
                    "shrink-0 rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground",
                }}
              >
                {item.korean}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
