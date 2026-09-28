import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth/validation";
import { hashPassword } from "@/lib/auth/password";
import { createUser, findUserByEmail, findUserByUsername } from "@/lib/db/repo/users";
import { setSessionCookie } from "@/lib/auth/session";
import { EmpireProgressionService } from "@/game-engine/services/EmpireProgressionService";
import { jsonError, toSessionUser, ApiError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
    }
    const { username, email, password, displayName } = parsed.data;

    if (findUserByEmail(email)) throw new ApiError(409, "An account with that email already exists.");
    if (findUserByUsername(username)) throw new ApiError(409, "That username is taken.");

    const passwordHash = await hashPassword(password);
    const user = createUser({ username, email, passwordHash, displayName });

    // First-time-user starter city (spec 47) — created at registration so
    // the very first login already has something to grow.
    EmpireProgressionService.createStarterEmpire(user.id);

    await setSessionCookie(user.id);
    return NextResponse.json({ user: toSessionUser(user) }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
