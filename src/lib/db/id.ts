import crypto from "node:crypto";

/** Short, URL-safe unique id (not cryptographically sequential like cuid,
 * but sufficient as a primary key generator for this scale). */
export function generateId(prefix?: string): string {
  const id = crypto.randomBytes(12).toString("base64url");
  return prefix ? `${prefix}_${id}` : id;
}

/** Deterministic 6-character shareable friend code, collision-checked by
 * the caller (see repo/users.ts). */
export function generateFriendCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return `#${code}`;
}
