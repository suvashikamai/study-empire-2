// JWT-based session, delivered as an httpOnly, sameSite=lax cookie so it's
// inaccessible to client-side JS (mitigates XSS token theft) and not sent
// cross-site (mitigates CSRF on state-changing requests). Uses `jose`
// because it works identically in the Node runtime (route handlers) and the
// Edge runtime (middleware.ts), unlike jsonwebtoken.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "se_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "replace-with-a-long-random-string") {
    throw new Error(
      "AUTH_SECRET is not set to a real value. Generate one with `openssl rand -base64 48` and put it in .env",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // user id
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await createSessionToken(userId);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function clearSessionCookie(): void {
  cookies().set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Reads + verifies the session cookie from a Route Handler / Server
 * Component context. Returns null if absent or invalid — callers decide
 * whether that's a 401 or an anonymous view. */
export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  return payload?.sub ?? null;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
