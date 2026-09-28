import { db, transaction } from "../client";
import { generateId, generateFriendCode } from "../id";

export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  profile_image_url: string | null;
  friend_code: string;
  total_xp: number;
  level: number;
  total_study_minutes: number;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  completed_sessions: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as unknown as UserRow | undefined;
}

export function findUserByUsername(username: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username.toLowerCase()) as unknown as UserRow | undefined;
}

export function findUserByFriendCode(friendCode: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE friend_code = ?").get(friendCode.toUpperCase()) as unknown as UserRow | undefined;
}

export function findUserById(id: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as UserRow | undefined;
}

export function createUser(input: {
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
}): UserRow {
  return transaction(() => {
    const id = generateId("user");

    let friendCode = generateFriendCode();
    // Extremely unlikely collision given the alphabet size, but check anyway
    // since friend_code is UNIQUE (spec 21: friend code must be unique).
    while (db.prepare("SELECT 1 FROM users WHERE friend_code = ?").get(friendCode)) {
      friendCode = generateFriendCode();
    }

    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, display_name, friend_code)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, input.username.toLowerCase(), input.email.toLowerCase(), input.passwordHash, input.displayName, friendCode);

    return findUserById(id)!;
  });
}

export function updateUserProfile(
  id: string,
  fields: Partial<{ displayName: string; profileImageUrl: string | null }>,
): void {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (fields.displayName !== undefined) {
    sets.push("display_name = ?");
    values.push(fields.displayName);
  }
  if (fields.profileImageUrl !== undefined) {
    sets.push("profile_image_url = ?");
    values.push(fields.profileImageUrl);
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...(values as []));
}

/** Applies a rollup delta atomically. Called ONLY from server-side reward
 * services — never directly from an API route body (spec 35/36). */
export function applyUserRewardDelta(
  id: string,
  delta: {
    xp: number;
    studyMinutes: number;
    completedSessions: number;
    completedTasks: number;
    newLevel: number;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string;
  },
): void {
  db.prepare(
    `UPDATE users SET
       total_xp = total_xp + ?,
       total_study_minutes = total_study_minutes + ?,
       completed_sessions = completed_sessions + ?,
       completed_tasks = completed_tasks + ?,
       level = ?,
       current_streak = ?,
       longest_streak = ?,
       last_study_date = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    delta.xp,
    delta.studyMinutes,
    delta.completedSessions,
    delta.completedTasks,
    delta.newLevel,
    delta.currentStreak,
    delta.longestStreak,
    delta.lastStudyDate,
    id,
  );
}

export function searchUsersByHandle(query: string, excludeUserId: string, limit = 10): UserRow[] {
  const like = `%${query.toLowerCase()}%`;
  return db
    .prepare(
      `SELECT * FROM users
       WHERE id != ? AND (username LIKE ? OR friend_code = ?)
       LIMIT ?`,
    )
    .all(excludeUserId, like, query.toUpperCase(), limit) as unknown as UserRow[];
}
