import { db } from "../client";
import { generateId } from "../id";
import type { SessionStatus } from "@/types";

export interface StudySessionRow {
  id: string;
  user_id: string;
  subject_id: string;
  topic_id: string;
  schedule_entry_id: string | null;
  planned_minutes: number;
  actual_minutes: number;
  breaks_taken: number;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  xp_awarded: number;
  construction_points_awarded: number;
  created_at: string;
}

export function getSession(id: string, userId: string): StudySessionRow | undefined {
  return db.prepare("SELECT * FROM study_sessions WHERE id = ? AND user_id = ?").get(id, userId) as unknown as StudySessionRow | undefined;
}

/** The caller's currently open (IN_PROGRESS) session, if any. Only one
 * active session per user is allowed — this is also an anti-cheat guard
 * against submitting overlapping sessions (spec 36). */
export function getActiveSession(userId: string): StudySessionRow | undefined {
  return db
    .prepare("SELECT * FROM study_sessions WHERE user_id = ? AND status = 'IN_PROGRESS' ORDER BY started_at DESC LIMIT 1")
    .get(userId) as unknown as StudySessionRow | undefined;
}

export function startSession(
  userId: string,
  input: { subjectId: string; topicId: string; plannedMinutes: number; scheduleEntryId?: string | null },
): StudySessionRow {
  const id = generateId("sess");
  db.prepare(
    `INSERT INTO study_sessions (id, user_id, subject_id, topic_id, schedule_entry_id, planned_minutes)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, input.subjectId, input.topicId, input.scheduleEntryId ?? null, input.plannedMinutes);
  return getSession(id, userId)!;
}

export function finalizeSession(
  id: string,
  userId: string,
  result: {
    actualMinutes: number;
    breaksTaken: number;
    status: "COMPLETED" | "ABANDONED";
    xpAwarded: number;
    constructionPointsAwarded: number;
  },
): StudySessionRow {
  db.prepare(
    `UPDATE study_sessions SET
       actual_minutes = ?, breaks_taken = ?, status = ?, ended_at = datetime('now'),
       xp_awarded = ?, construction_points_awarded = ?
     WHERE id = ? AND user_id = ?`,
  ).run(result.actualMinutes, result.breaksTaken, result.status, result.xpAwarded, result.constructionPointsAwarded, id, userId);
  return getSession(id, userId)!;
}

export function listRecentSessions(userId: string, limit = 20): StudySessionRow[] {
  return db.prepare("SELECT * FROM study_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT ?").all(userId, limit) as unknown as StudySessionRow[];
}

export function sumMinutesForDate(userId: string, isoDate: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(actual_minutes), 0) as minutes FROM study_sessions
       WHERE user_id = ? AND status = 'COMPLETED' AND date(started_at) = ?`,
    )
    .get(userId, isoDate) as { minutes: number };
  return row.minutes;
}

export function sumMinutesForWeek(userId: string, isoWeekStart: string, isoWeekEndExclusive: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(actual_minutes), 0) as minutes FROM study_sessions
       WHERE user_id = ? AND status = 'COMPLETED' AND date(started_at) >= ? AND date(started_at) < ?`,
    )
    .get(userId, isoWeekStart, isoWeekEndExclusive) as { minutes: number };
  return row.minutes;
}

export function hasCompletedSessionForScheduleEntryToday(scheduleEntryId: string, userId: string, isoDate: string): boolean {
  return !!db
    .prepare(
      `SELECT 1 FROM study_sessions
       WHERE schedule_entry_id = ? AND user_id = ? AND status = 'COMPLETED' AND date(started_at) = ? LIMIT 1`,
    )
    .get(scheduleEntryId, userId, isoDate);
}

export function countCompletedOnDate(userId: string, isoDate: string): number {
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM study_sessions WHERE user_id = ? AND status = 'COMPLETED' AND date(started_at) = ?`)
    .get(userId, isoDate) as { c: number };
  return row.c;
}
