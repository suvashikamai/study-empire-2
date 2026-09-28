import { db } from "../client";
import { generateId } from "../id";

/** Server-side audit trail for every reward-bearing event. Used for
 * anti-cheat review and to recompute rollups if they ever need auditing
 * (spec 36/40) — never read on the hot path of a normal request. */
export function logActivity(userId: string, type: string, payload: Record<string, unknown>): void {
  db.prepare("INSERT INTO activity_log (id, user_id, type, payload) VALUES (?, ?, ?, ?)").run(
    generateId("log"),
    userId,
    type,
    JSON.stringify(payload),
  );
}
