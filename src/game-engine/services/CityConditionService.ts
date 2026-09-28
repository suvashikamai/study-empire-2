import * as EmpireRepo from "@/lib/db/repo/empire";
import { DECAY_CONFIG, decayForInactiveDays } from "../config/decay.config";

function daysBetween(aIso: string, bIso: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((new Date(bIso).getTime() - new Date(aIso).getTime()) / msPerDay);
}

export const CityConditionService = {
  /**
   * Lazy decay: call this whenever the empire is read (dashboard, empire
   * screen). It only does work once per calendar day per empire (gated by
   * last_decay_check_at) and only actually reduces condition once the user
   * has been inactive past the grace period — so opening the app doesn't
   * cost you condition, only real inactivity does (spec 17: fair decay).
   */
  reconcile(userId: string): void {
    const empire = EmpireRepo.getEmpireByUserId(userId);
    if (!empire) return;
    const now = new Date().toISOString();

    const daysSinceCheck = daysBetween(empire.last_decay_check_at, now);
    if (daysSinceCheck < 1) return; // already reconciled today

    const daysSinceStudy = daysBetween(empire.last_study_activity_at, now);
    if (daysSinceStudy > DECAY_CONFIG.graceDays) {
      const decayDelta = -Math.min(
        decayForInactiveDays(daysSinceStudy),
        DECAY_CONFIG.decayPerInactiveDayPct * daysSinceCheck,
      );
      EmpireRepo.applyConditionDelta(empire.id, decayDelta);
      const newCondition = Math.max(DECAY_CONFIG.conditionFloorPct, empire.condition_pct + decayDelta);
      EmpireRepo.updateEmpireProgress(userId, { conditionPct: newCondition, lastDecayCheckAt: now });
    } else {
      EmpireRepo.updateEmpireProgress(userId, { lastDecayCheckAt: now });
    }
  },

  /**
   * Recovery: called once per calendar day (the caller ensures "once per
   * day" by checking it's the day's first completed session) from
   * StudyRewardService. Fast enough to feel motivating, per spec 18's
   * "Study -> Progress -> City improves -> Motivation -> Study more" loop.
   */
  applyDailyRecovery(userId: string, dailyGoalAlsoCompleted: boolean): void {
    const empire = EmpireRepo.getEmpireByUserId(userId);
    if (!empire) return;
    const recovery = DECAY_CONFIG.recoveryPerActiveDayPct + (dailyGoalAlsoCompleted ? DECAY_CONFIG.dailyGoalRecoveryBonusPct : 0);
    EmpireRepo.applyConditionDelta(empire.id, recovery);
    const now = new Date().toISOString();
    const newCondition = Math.min(100, empire.condition_pct + recovery);
    EmpireRepo.updateEmpireProgress(userId, {
      conditionPct: newCondition,
      lastStudyActivityAt: now,
      lastDecayCheckAt: now,
    });
  },
};
