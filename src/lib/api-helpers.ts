import { NextResponse } from "next/server";
import { getSessionUserId } from "./auth/session";
import { findUserById, type UserRow } from "./db/repo/users";
import type { SessionUser } from "@/types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Never show raw backend errors to users (spec 52) — this maps any thrown
 * error to a safe JSON response and an appropriate status code. */
export function jsonError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export async function requireUser(): Promise<UserRow> {
  const userId = await getSessionUserId();
  if (!userId) throw new ApiError(401, "You need to be signed in.");
  const user = findUserById(userId);
  if (!user) throw new ApiError(401, "Session is no longer valid.");
  return user;
}

export function toSessionUser(user: UserRow): SessionUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    friendCode: user.friend_code,
    profileImageUrl: user.profile_image_url,
    level: user.level,
    totalXp: user.total_xp,
    currentStreak: user.current_streak,
    longestStreak: user.longest_streak,
    totalStudyMinutes: user.total_study_minutes,
  };
}
