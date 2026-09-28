import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail, findUserByUsername } from "@/lib/db/repo/users";
import { setSessionCookie } from "@/lib/auth/session";
import { jsonError, toSessionUser, ApiError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Enter your email/username and password.");
    }
    const { emailOrUsername, password } = parsed.data;

    const user = emailOrUsername.includes("@")
      ? findUserByEmail(emailOrUsername)
      : findUserByUsername(emailOrUsername);

    // Deliberately identical error for "no such user" and "wrong password"
    // so login can't be used to enumerate registered emails/usernames.
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new ApiError(401, "Incorrect email/username or password.");
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ user: toSessionUser(user) });
  } catch (err) {
    return jsonError(err);
  }
}
