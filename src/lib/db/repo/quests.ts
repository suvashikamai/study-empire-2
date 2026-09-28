import { db } from "../client";
import { generateId } from "../id";

export interface QuestProgressRow {
  id: string;
  user_id: string;
  date: string;
  quest_key: string;
  progress: number;
  target: number;
  completed: number;
  reward_claimed: number;
}

export function listQuestsForDate(userId: string, isoDate: string): QuestProgressRow[] {
  return db.prepare("SELECT * FROM quest_progress WHERE user_id = ? AND date = ?").all(userId, isoDate) as unknown as QuestProgressRow[];
}

export function ensureQuestRow(userId: string, isoDate: string, questKey: string, target: number): QuestProgressRow {
  const existing = db
    .prepare("SELECT * FROM quest_progress WHERE user_id = ? AND date = ? AND quest_key = ?")
    .get(userId, isoDate, questKey) as unknown as QuestProgressRow | undefined;
  if (existing) return existing;
  const id = generateId("quest");
  db.prepare("INSERT INTO quest_progress (id, user_id, date, quest_key, target) VALUES (?, ?, ?, ?, ?)").run(id, userId, isoDate, questKey, target);
  return db.prepare("SELECT * FROM quest_progress WHERE id = ?").get(id) as unknown as QuestProgressRow;
}

export function incrementQuestProgress(userId: string, isoDate: string, questKey: string, amount: number): QuestProgressRow {
  const row = db.prepare("SELECT * FROM quest_progress WHERE user_id = ? AND date = ? AND quest_key = ?").get(userId, isoDate, questKey) as unknown as QuestProgressRow | undefined;
  if (!row) throw new Error(`Quest row missing for ${questKey}; call ensureQuestRow first`);
  const newProgress = Math.min(row.target, row.progress + amount);
  const completed = newProgress >= row.target;
  db.prepare("UPDATE quest_progress SET progress = ?, completed = ? WHERE id = ?").run(newProgress, completed ? 1 : 0, row.id);
  return db.prepare("SELECT * FROM quest_progress WHERE id = ?").get(row.id) as unknown as QuestProgressRow;
}
