import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CalendarClock, LogOut, Mail, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/brand";

const NAV = [
  { to: "/gmail", label: "찾은 혜택", icon: Mail },
  { to: "/schedule", label: "일정", icon: CalendarClock },
  { to: "/settings", label: "설정", icon: Settings },
] as const;

export function AppShell({
  children,
  email,
}: {
  children: ReactNode;
  email?: string | null | undefined;
}) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
        <Link to="/gmail" className="px-2"><Wordmark /></Link>
        <nav className="mt-9 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm" activeProps={{ className: "bg-primary/10 font-medium text-primary" }} inactiveProps={{ className: "text-muted-foreground hover:bg-accent hover:text-foreground" }}>
              <item.icon className="size-4" strokeWidth={1.5} aria-hidden="true" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-border pt-4">
          {email ? <p className="truncate px-2.5 text-xs text-muted-foreground">{email}</p> : null}
          <button type="button" onClick={signOut} className="mt-1.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><LogOut className="size-4" strokeWidth={1.5} />로그아웃</button>
        </div>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3"><Link to="/gmail"><Wordmark /></Link><button type="button" onClick={signOut} className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent">로그아웃</button></div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="shrink-0 rounded-md px-2.5 py-1.5 text-sm" activeProps={{ className: "bg-primary/10 font-medium text-primary" }} inactiveProps={{ className: "text-muted-foreground" }}>{item.label}</Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 lg:px-10 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
