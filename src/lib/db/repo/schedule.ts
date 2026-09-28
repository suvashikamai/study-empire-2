import { db } from "../client";
import { generateId } from "../id";

export interface ScheduleEntryRow {
  id: string;
  user_id: string;
  subject_id: string;
  topic_id: string;
  date: string | null;
  days_of_week: string | null;
  start_time: string;
  end_time: string;
  recurring: number;
  created_at: string;
  updated_at: string;
}

export function listScheduleForUser(userId: string): ScheduleEntryRow[] {
  return db.prepare("SELECT * FROM schedule_entries WHERE user_id = ? ORDER BY start_time ASC").all(userId) as unknown as ScheduleEntryRow[];
}

export function getScheduleEntry(id: string, userId: string): ScheduleEntryRow | undefined {
  return db.prepare("SELECT * FROM schedule_entries WHERE id = ? AND user_id = ?").get(id, userId) as unknown as ScheduleEntryRow | undefined;
}

export function createScheduleEntry(
  userId: string,
  input: {
    subjectId: string;
    topicId: string;
    date?: string | null;
    daysOfWeek?: number[] | null;
    startTime: string;
    endTime: string;
    recurring: boolean;
  },
): ScheduleEntryRow {
  const id = generateId("sched");
  db.prepare(
    `INSERT INTO schedule_entries (id, user_id, subject_id, topic_id, date, days_of_week, start_time, end_time, recurring)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    userId,
    input.subjectId,
    input.topicId,
    input.date ?? null,
    input.daysOfWeek ? JSON.stringify(input.daysOfWeek) : null,
    input.startTime,
    input.endTime,
    input.recurring ? 1 : 0,
  );
  return getScheduleEntry(id, userId)!;
}

export function deleteScheduleEntry(id: string, userId: string): void {
  db.prepare("DELETE FROM schedule_entries WHERE id = ? AND user_id = ?").run(id, userId);
}

/** Entries relevant to a specific calendar date: either a one-off entry for
 * that exact date, or a recurring entry whose daysOfWeek includes that
 * date's weekday. */
export function listScheduleForDate(userId: string, isoDate: string, weekday: number): ScheduleEntryRow[] {
  const all = listScheduleForUser(userId);
  return all.filter((e) => {
    if (e.date) return e.date.slice(0, 10) === isoDate;
    if (e.recurring && e.days_of_week) {
      const days: number[] = JSON.parse(e.days_of_week);
      return days.includes(weekday);
    }
    return false;
  });
}
