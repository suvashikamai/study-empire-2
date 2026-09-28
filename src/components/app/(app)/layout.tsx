import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/session";
import { findUserById } from "@/lib/db/repo/users";
import { toSessionUser } from "@/lib/api-helpers";
import { AppShell } from "@/components/AppShell";

// Defense in depth: middleware already redirects unauthenticated requests,
// but every server-rendered page under this layout re-checks too, since
// middleware is a perimeter guard, not a substitute for per-request auth.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = findUserById(userId);
  if (!user) redirect("/login");

  return <AppShell user={toSessionUser(user)}>{children}</AppShell>;
}
