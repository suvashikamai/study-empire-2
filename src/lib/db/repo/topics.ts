import { db } from "../client";
import { generateId } from "../id";
import type { Difficulty, Priority } from "@/types";

export interface TopicRow {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  description: string | null;
  target_minutes: number;
  completed_minutes: number;
  priority: Priority;
  difficulty: Difficulty;
  completed: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function listTopics(subjectId: string): TopicRow[] {
  return db.prepare("SELECT * FROM topics WHERE subject_id = ? ORDER BY sort_order ASC, created_at ASC").all(subjectId) as unknown as TopicRow[];
}

export function listAllTopicsForUser(userId: string): TopicRow[] {
  return db.prepare("SELECT * FROM topics WHERE user_id = ? ORDER BY created_at ASC").all(userId) as unknown as TopicRow[];
}

export function getTopic(id: string, userId: string): TopicRow | undefined {
  return db.prepare("SELECT * FROM topics WHERE id = ? AND user_id = ?").get(id, userId) as unknown as TopicRow | undefined;
}

export function createTopic(
  userId: string,
  subjectId: string,
  input: { name: string; description?: string; targetMinutes?: number; priority?: Priority; difficulty?: Difficulty },
): TopicRow {
  const id = generateId("topic");
  const order = (db.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 as n FROM topics WHERE subject_id = ?").get(subjectId) as { n: number }).n;
  db.prepare(
    `INSERT INTO topics (id, user_id, subject_id, name, description, target_minutes, priority, difficulty, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, subjectId, input.name, input.description ?? null, input.targetMinutes ?? 60, input.priority ?? "MEDIUM", input.difficulty ?? "MEDIUM", order);
  return getTopic(id, userId)!;
}

export function updateTopic(
  id: string,
  userId: string,
  fields: Partial<{ name: string; description: string | null; targetMinutes: number; priority: Priority; difficulty: Difficulty; completed: boolean; order: number }>,
): TopicRow | undefined {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (fields.name !== undefined) { sets.push("name = ?"); values.push(fields.name); }
  if (fields.description !== undefined) { sets.push("description = ?"); values.push(fields.description); }
  if (fields.targetMinutes !== undefined) { sets.push("target_minutes = ?"); values.push(fields.targetMinutes); }
  if (fields.priority !== undefined) { sets.push("priority = ?"); values.push(fields.priority); }
  if (fields.difficulty !== undefined) { sets.push("difficulty = ?"); values.push(fields.difficulty); }
  if (fields.completed !== undefined) { sets.push("completed = ?"); values.push(fields.completed ? 1 : 0); }
  if (fields.order !== undefined) { sets.push("sort_order = ?"); values.push(fields.order); }
  if (sets.length === 0) return getTopic(id, userId);
  sets.push("updated_at = datetime('now')");
  values.push(id, userId);
  db.prepare(`UPDATE topics SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`).run(...(values as []));
  return getTopic(id, userId);
}

export function deleteTopic(id: string, userId: string): void {
  db.prepare("DELETE FROM topics WHERE id = ? AND user_id = ?").run(id, userId);
}

/** Adds completed minutes to a topic and auto-marks it complete once its
 * target is reached (never un-completes it — consistent with "fair decay"
 * philosophy: progress is never silently taken away). */
export function addTopicProgress(id: string, minutes: number): void {
  db.prepare(
    `UPDATE topics SET
       completed_minutes = completed_minutes + ?,
       completed = CASE WHEN completed_minutes + ? >= target_minutes THEN 1 ELSE completed END,
       updated_at = datetime('now')
     WHERE id = ?`,
  ).run(minutes, minutes, id);
}
