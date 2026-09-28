import { db } from "../client";
import { generateId } from "../id";

export interface DailyGoalRow {
  id: string;
  user_id: string;
  date: string;
  target_minutes: number;
  completed_minutes: number;
  completed: number;
  created_at: string;
  updated_at: string;
}

export function getOrCreateDailyGoal(userId: string, isoDate: string, defaultTargetMinutes = 60): DailyGoalRow {
  const existing = db.prepare("SELECT * FROM daily_goals WHERE user_id = ? AND date = ?").get(userId, isoDate) as unknown as DailyGoalRow | undefined;
  if (existing) return existing;
  const id = generateId("goal");
  db.prepare(
    `INSERT INTO daily_goals (id, user_id, date, target_minutes) VALUES (?, ?, ?, ?)`,
  ).run(id, userId, isoDate, defaultTargetMinutes);
  return db.prepare("SELECT * FROM daily_goals WHERE id = ?").get(id) as unknown as DailyGoalRow;
}

export function setDailyGoalTarget(userId: string, isoDate: string, targetMinutes: number): DailyGoalRow {
  getOrCreateDailyGoal(userId, isoDate, targetMinutes);
  db.prepare("UPDATE daily_goals SET target_minutes = ?, updated_at = datetime('now') WHERE user_id = ? AND date = ?").run(targetMinutes, userId, isoDate);
  return db.prepare("SELECT * FROM daily_goals WHERE user_id = ? AND date = ?").get(userId, isoDate) as unknown as DailyGoalRow;
}

/** Adds minutes toward today's goal. Returns whether this call is what
 * pushed the goal over the top (used to award the daily-goal XP bonus
 * exactly once). */
export function addDailyGoalProgress(userId: string, isoDate: string, minutes: number): { justCompleted: boolean; row: DailyGoalRow } {
  const goal = getOrCreateDailyGoal(userId, isoDate);
  const wasCompleted = goal.completed === 1;
  const newCompleted = goal.completed_minutes + minutes;
  const nowCompleted = newCompleted >= goal.target_minutes && goal.target_minutes > 0;
  db.prepare(
    `UPDATE daily_goals SET completed_minutes = ?, completed = ?, updated_at = datetime('now') WHERE user_id = ? AND date = ?`,
  ).run(newCompleted, nowCompleted ? 1 : 0, userId, isoDate);
  const row = db.prepare("SELECT * FROM daily_goals WHERE user_id = ? AND date = ?").get(userId, isoDate) as unknown as DailyGoalRow;
  return { justCompleted: !wasCompleted && nowCompleted, row };
}
