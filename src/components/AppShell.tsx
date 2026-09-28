"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./icons";
import type { SessionUser } from "@/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "home" as const },
  { href: "/study", label: "Study", icon: "book" as const },
  { href: "/schedule", label: "Schedule", icon: "calendar" as const },
  { href: "/empire", label: "Empire", icon: "castle" as const },
  { href: "/profile", label: "Profile", icon: "user" as const },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-base-950">
      {/* Desktop sidebar (spec 30: sidebar navigation on desktop) */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 border-r border-base-800 bg-base-950 px-4 py-6">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <Icon name="castle" className="h-5 w-5 text-base-950" />
          </div>
          <span className="font-bold text-lg tracking-tight">Study Empire</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-base-800 text-text-primary" : "text-text-secondary hover:bg-base-800 hover:text-text-primary"
                }`}
              >
                <Icon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-base-800 pt-4 px-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-base-700 flex items-center justify-center text-sm font-semibold">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.displayName}</div>
              <div className="text-xs text-text-muted">Level {user.level}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full justify-start px-2">
            <Icon name="logout" className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">{children}</div>
      </main>

      {/* Mobile bottom nav (spec 39: mobile-first) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-base-900/95 backdrop-blur border-t border-base-800 px-2 py-2 flex justify-around z-20">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium min-w-[56px] ${
                active ? "text-accent" : "text-text-muted"
              }`}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
