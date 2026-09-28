import { db } from "../client";
import { generateId } from "../id";

export interface SubjectRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  target_hours: number;
  archived: number;
  created_at: string;
  updated_at: string;
}

export function listSubjects(userId: string, includeArchived = false): SubjectRow[] {
  if (includeArchived) {
    return db.prepare("SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at ASC").all(userId) as unknown as SubjectRow[];
  }
  return db
    .prepare("SELECT * FROM subjects WHERE user_id = ? AND archived = 0 ORDER BY created_at ASC")
    .all(userId) as unknown as SubjectRow[];
}

export function getSubject(id: string, userId: string): SubjectRow | undefined {
  return db.prepare("SELECT * FROM subjects WHERE id = ? AND user_id = ?").get(id, userId) as unknown as SubjectRow | undefined;
}

export function createSubject(userId: string, input: { name: string; color?: string; icon?: string; description?: string; targetHours?: number }): SubjectRow {
  const id = generateId("subj");
  db.prepare(
    `INSERT INTO subjects (id, user_id, name, color, icon, description, target_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, input.name, input.color ?? "#22e07a", input.icon ?? "book", input.description ?? null, input.targetHours ?? 0);
  return getSubject(id, userId)!;
}

export function updateSubject(
  id: string,
  userId: string,
  fields: Partial<{ name: string; color: string; icon: string; description: string | null; targetHours: number; archived: boolean }>,
): SubjectRow | undefined {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (fields.name !== undefined) { sets.push("name = ?"); values.push(fields.name); }
  if (fields.color !== undefined) { sets.push("color = ?"); values.push(fields.color); }
  if (fields.icon !== undefined) { sets.push("icon = ?"); values.push(fields.icon); }
  if (fields.description !== undefined) { sets.push("description = ?"); values.push(fields.description); }
  if (fields.targetHours !== undefined) { sets.push("target_hours = ?"); values.push(fields.targetHours); }
  if (fields.archived !== undefined) { sets.push("archived = ?"); values.push(fields.archived ? 1 : 0); }
  if (sets.length === 0) return getSubject(id, userId);
  sets.push("updated_at = datetime('now')");
  values.push(id, userId);
  db.prepare(`UPDATE subjects SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`).run(...(values as []));
  return getSubject(id, userId);
}

export function deleteSubject(id: string, userId: string): void {
  db.prepare("DELETE FROM subjects WHERE id = ? AND user_id = ?").run(id, userId);
}

/** Completed study minutes + XP earned, aggregated from study_sessions. */
export function getSubjectStats(subjectId: string): { completedMinutes: number; xpEarned: number; topicCount: number } {
  const stats = db
    .prepare(
      `SELECT COALESCE(SUM(actual_minutes), 0) as minutes, COALESCE(SUM(xp_awarded), 0) as xp
       FROM study_sessions WHERE subject_id = ? AND status = 'COMPLETED'`,
    )
    .get(subjectId) as { minutes: number; xp: number };
  const topicCount = (db.prepare("SELECT COUNT(*) as c FROM topics WHERE subject_id = ?").get(subjectId) as { c: number }).c;
  return { completedMinutes: stats.minutes, xpEarned: stats.xp, topicCount };
}
