// The orchestrator for "a study session just ended" — the single most
// important server-authoritative code path in the app (spec 35/36: the
// server, never the client, decides XP/Empire XP/Building level/Streak).
//
// Every number that reaches the client here was computed from data the
// server itself measured (wall-clock elapsed time, DB rollups) — never
// trusted verbatim from the request body.

import * as SessionsRepo from "@/lib/db/repo/sessions";
import * as TopicsRepo from "@/lib/db/repo/topics";
import * as DailyGoalsRepo from "@/lib/db/repo/dailyGoals";
import * as UsersRepo from "@/lib/db/repo/users";
import { logActivity } from "@/lib/db/repo/activity";
import { computeSessionReward, xpProgressWithinLevel, streakBonusForDay, XP_RULES, ANTI_CHEAT } from "../config/xp.config";
import { computeStreakUpdate } from "./StreakService";
import { EmpireProgressionService } from "./EmpireProgressionService";
import { CityConditionService } from "./CityConditionService";
import { QuestService } from "./QuestService";
import { AchievementService } from "./AchievementService";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function mondayOfWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDay(); // 0 Sun - 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}
function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export class SessionError extends Error {}

export const StudyRewardService = {
  startSession(userId: string, input: { subjectId: string; topicId: string; plannedMinutes: number; scheduleEntryId?: string | null }) {
    const active = SessionsRepo.getActiveSession(userId);
    if (active) throw new SessionError("You already have a focus session in progress.");
    const plannedMinutes = Math.max(5, Math.min(ANTI_CHEAT.maxSingleSessionMinutes, Math.round(input.plannedMinutes)));
    return SessionsRepo.startSession(userId, { ...input, plannedMinutes });
  },

  /**
   * Completes (or abandons) a session. `clientClaimedMinutes` is whatever
   * the focus-timer UI displayed, but the server clamps it to the actual
   * wall-clock time elapsed since the session started (spec 36: "Prevent
   * impossible study durations") — a client cannot claim more study time
   * than physically passed.
   */
  completeSession(
    userId: string,
    sessionId: string,
    input: { clientClaimedMinutes: number; breaksTaken: number; completed: boolean },
  ) {
    const session = SessionsRepo.getSession(sessionId, userId);
    if (!session) throw new SessionError("Session not found.");
    if (session.status !== "IN_PROGRESS") throw new SessionError("This session was already finalized.");

    const wallClockMinutes = Math.max(
      0,
      (Date.now() - new Date(session.started_at + "Z").getTime()) / 60000,
    );
    const actualMinutes = Math.max(0, Math.min(input.clientClaimedMinutes, wallClockMinutes, ANTI_CHEAT.maxSingleSessionMinutes));
    const status: "COMPLETED" | "ABANDONED" = input.completed && actualMinutes >= session.planned_minutes * 0.5 ? "COMPLETED" : "ABANDONED";

    const completedOnTime = status === "COMPLETED" && actualMinutes <= session.planned_minutes * 1.3;
    const reward = computeSessionReward({
      plannedMinutes: session.planned_minutes,
      actualMinutes: Math.round(actualMinutes),
      breaksTaken: input.breaksTaken,
      completedOnTime,
      status,
    });

    if (status === "ABANDONED") {
      const finalized = SessionsRepo.finalizeSession(sessionId, userId, {
        actualMinutes: Math.round(actualMinutes),
        breaksTaken: input.breaksTaken,
        status,
        xpAwarded: 0,
        constructionPointsAwarded: 0,
      });
      logActivity(userId, "SESSION_ABANDONED", { sessionId, actualMinutes });
      return { session: finalized, xpAwarded: 0, empireXp: 0, constructionPoints: 0, leveledUp: false, townHallLeveledUp: false, completedBuildings: [], newlyUnlockedAchievements: [], questsCompleted: [], streak: null as null | ReturnType<typeof computeStreakUpdate> };
    }

    // --- Everything below only runs for a genuinely COMPLETED session ---

    let xp = reward.xp;
    const today = todayIso();

    const user = UsersRepo.findUserById(userId)!;
    const { justCompleted: dailyGoalJustCompleted } = DailyGoalsRepo.addDailyGoalProgress(userId, today, Math.round(actualMinutes));
    if (dailyGoalJustCompleted) xp += XP_RULES.dailyGoalBonus;

    // Weekly goal: 7x today's daily target, crossed cumulatively this week.
    const goalRow = DailyGoalsRepo.getOrCreateDailyGoal(userId, today);
    const weekStart = mondayOfWeek(today);
    const weekEndExclusive = addDaysIso(weekStart, 7);
    const weeklyTarget = goalRow.target_minutes * 7;
    const minutesBeforeThisSession = SessionsRepo.sumMinutesForWeek(userId, weekStart, weekEndExclusive) - 0; // already includes this session's row? not yet finalized, so it does NOT include it
    const minutesAfterThisSession = minutesBeforeThisSession + Math.round(actualMinutes);
    const weeklyGoalJustCompleted = weeklyTarget > 0 && minutesBeforeThisSession < weeklyTarget && minutesAfterThisSession >= weeklyTarget;
    if (weeklyGoalJustCompleted) xp += XP_RULES.weeklyGoalBonus;

    const streak = computeStreakUpdate(
      { currentStreak: user.current_streak, longestStreak: user.longest_streak, lastStudyDate: user.last_study_date },
      new Date().toISOString(),
    );
    if (streak.isNewDay) xp += streakBonusForDay(streak.currentStreak);

    TopicsRepo.addTopicProgress(session.topic_id, Math.round(actualMinutes));
    const topicAfter = TopicsRepo.getTopic(session.topic_id, userId);
    const topicJustCompleted = !!topicAfter?.completed;

    const finalized = SessionsRepo.finalizeSession(sessionId, userId, {
      actualMinutes: Math.round(actualMinutes),
      breaksTaken: input.breaksTaken,
      status: "COMPLETED",
      xpAwarded: xp,
      constructionPointsAwarded: reward.constructionPoints,
    });

    const { level: newLevel } = xpProgressWithinLevel(user.total_xp + xp);
    const leveledUp = newLevel > user.level;

    UsersRepo.applyUserRewardDelta(userId, {
      xp,
      studyMinutes: Math.round(actualMinutes),
      completedSessions: 1,
      completedTasks: topicJustCompleted ? 1 : 0,
      newLevel,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastStudyDate: today,
    });

    const empireResult = EmpireProgressionService.applyStudyReward(userId, reward.empireXp, reward.constructionPoints);

    const isFirstCompletedSessionToday = SessionsRepo.countCompletedOnDate(userId, today) === 1;
    if (isFirstCompletedSessionToday) {
      CityConditionService.applyDailyRecovery(userId, dailyGoalJustCompleted);
    }

    const questsCompleted = QuestService.recordSessionContribution(userId, {
      minutesStudied: Math.round(actualMinutes),
      sessionsCompleted: 1,
      topicsCompleted: topicJustCompleted ? 1 : 0,
      onSchedule: completedOnTime,
    });
    if (questsCompleted.length > 0) {
      const questXp = questsCompleted.reduce((sum, q) => sum + q.xpReward, 0);
      const freshUser = UsersRepo.findUserById(userId)!;
      const { level: levelAfterQuests } = xpProgressWithinLevel(freshUser.total_xp + questXp);
      UsersRepo.applyUserRewardDelta(userId, {
        xp: questXp,
        studyMinutes: 0,
        completedSessions: 0,
        completedTasks: 0,
        newLevel: levelAfterQuests,
        currentStreak: freshUser.current_streak,
        longestStreak: freshUser.longest_streak,
        lastStudyDate: today,
      });
      xp += questXp;
    }

    const newlyUnlockedAchievements = AchievementService.evaluateAndUnlock(userId);

    logActivity(userId, "SESSION_COMPLETED", {
      sessionId,
      actualMinutes: Math.round(actualMinutes),
      xpAwarded: xp,
      empireXp: reward.empireXp,
      constructionPoints: reward.constructionPoints,
      dailyGoalJustCompleted,
      weeklyGoalJustCompleted,
    });

    return {
      session: finalized,
      xpAwarded: xp,
      empireXp: reward.empireXp,
      constructionPoints: reward.constructionPoints,
      leveledUp,
      townHallLeveledUp: empireResult.townHallLeveledUp,
      completedBuildings: empireResult.completedBuildings,
      newlyUnlockedAchievements,
      questsCompleted,
      streak,
      dailyGoalJustCompleted,
      weeklyGoalJustCompleted,
    };
  },
};
