import * as AchievementsRepo from "@/lib/db/repo/achievements";
import * as EmpireRepo from "@/lib/db/repo/empire";
import { findUserById } from "@/lib/db/repo/users";
import { ACHIEVEMENTS, type AchievementConfig } from "../config/achievements.config";

function meetsCriteria(
  config: AchievementConfig,
  ctx: { totalStudyMinutes: number; currentStreak: number; completedSessions: number; townHallLevel: number; buildingTypes: Set<string> },
): boolean {
  const c = config.criteria;
  switch (c.type) {
    case "SESSIONS_COMPLETED":
      return ctx.completedSessions >= c.count;
    case "STREAK_DAYS":
      return ctx.currentStreak >= c.days;
    case "HOURS_STUDIED":
      return ctx.totalStudyMinutes / 60 >= c.hours;
    case "ANY_BUILDING_CONSTRUCTED":
      return ctx.buildingTypes.size > 0;
    case "BUILDING_CONSTRUCTED":
      return ctx.buildingTypes.has(c.buildingType);
    case "TOWN_HALL_LEVEL":
      return ctx.townHallLevel >= c.level;
    default:
      return false;
  }
}

export const AchievementService = {
  all: ACHIEVEMENTS,

  /** Evaluates every achievement definition against the user's current
   * state and unlocks any newly-met ones. Cheap enough (achievements list
   * is small, all inputs are already-loaded rollups) to call after every
   * completed session. Returns newly unlocked achievements for a toast/
   * notification (spec 38). */
  evaluateAndUnlock(userId: string): AchievementConfig[] {
    const user = findUserById(userId);
    const empire = EmpireRepo.getEmpireByUserId(userId);
    if (!user || !empire) return [];

    const buildingTypes = new Set(
      EmpireRepo.listBuildings(empire.id)
        .filter((b) => b.status !== "CONSTRUCTING")
        .map((b) => b.building_type),
    );

    const ctx = {
      totalStudyMinutes: user.total_study_minutes,
      currentStreak: user.current_streak,
      completedSessions: user.completed_sessions,
      townHallLevel: empire.town_hall_level,
      buildingTypes,
    };

    const newlyUnlocked: AchievementConfig[] = [];
    for (const achievement of ACHIEVEMENTS) {
      if (AchievementsRepo.hasAchievement(userId, achievement.key)) continue;
      if (meetsCriteria(achievement, ctx)) {
        AchievementsRepo.unlockAchievement(userId, achievement.key);
        newlyUnlocked.push(achievement);
      }
    }
    return newlyUnlocked;
  },
};
