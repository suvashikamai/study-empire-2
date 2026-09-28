// Password hashing (spec section 4: "Never store passwords directly").
// bcrypt with a work factor of 12 — deliberately slow, resistant to offline
// brute force. Swap for the managed auth provider's own hashing (spec's
// "Firebase Authentication or equivalent") if/when Phase 2 migrates off the
// self-hosted flow in this file.
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
