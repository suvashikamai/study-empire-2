import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { findUserById } from "@/lib/db/repo/users";
import { toSessionUser } from "@/lib/api-helpers";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ user: null });
  const user = findUserById(userId);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: toSessionUser(user) });
}
