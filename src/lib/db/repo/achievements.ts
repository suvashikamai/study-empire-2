import { db } from "../client";
import { generateId } from "../id";

export interface UserAchievementRow {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
}

export function listUnlockedAchievements(userId: string): UserAchievementRow[] {
  return db.prepare("SELECT * FROM user_achievements WHERE user_id = ?").all(userId) as unknown as UserAchievementRow[];
}

export function hasAchievement(userId: string, key: string): boolean {
  return !!db.prepare("SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_key = ?").get(userId, key);
}

export function unlockAchievement(userId: string, key: string): boolean {
  if (hasAchievement(userId, key)) return false;
  db.prepare("INSERT INTO user_achievements (id, user_id, achievement_key) VALUES (?, ?, ?)").run(generateId("ach"), userId, key);
  return true;
}
