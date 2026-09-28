// Building damage / recovery tuning (spec sections 17 & 18).
//
// Explicit design constraint from the spec: "Do NOT punish users
// excessively for missing one session... use a fair decay system" and
// "buildings should not simply disappear." So: a grace period before any
// decay starts, a slow decay rate, a floor so a building is always
// recoverable rather than destroyed, and a recovery rate faster than decay
// so getting back on track feels rewarding.

export const DECAY_CONFIG = {
  /** Days of inactivity allowed before condition starts dropping. */
  graceDays: 1,

  /** Condition points lost per inactive day beyond the grace period. */
  decayPerInactiveDayPct: 3,

  /** A building can decay down to this floor, never lower — "abandoned but
   * still standing," never deleted. */
  conditionFloorPct: 15,

  /** Condition points recovered for each completed session on a given day
   * (applied once per building per day, not per session, so spamming short
   * sessions can't game recovery speed). */
  recoveryPerActiveDayPct: 8,

  /** Extra recovery when the user also hit their full daily goal. */
  dailyGoalRecoveryBonusPct: 4,

  thresholds: {
    active: 85,
    lowActivity: 55,
    damaged: 30,
    // below `damaged` => ABANDONED
  },
} as const;

export type BuildingStatusName = "ACTIVE" | "LOW_ACTIVITY" | "DAMAGED" | "ABANDONED" | "CONSTRUCTING";

export function statusForCondition(conditionPct: number, isConstructing: boolean): BuildingStatusName {
  if (isConstructing) return "CONSTRUCTING";
  if (conditionPct >= DECAY_CONFIG.thresholds.active) return "ACTIVE";
  if (conditionPct >= DECAY_CONFIG.thresholds.lowActivity) return "LOW_ACTIVITY";
  if (conditionPct >= DECAY_CONFIG.thresholds.damaged) return "DAMAGED";
  return "ABANDONED";
}

/** Pure function: given how many whole days have passed since the empire's
 * last study activity, how much condition should be lost. Called against
 * the *empire's* condition (a single headline number) — individual
 * buildings track their own condition too but drift together via the same
 * formula, called per-building by DecayService. */
export function decayForInactiveDays(daysInactive: number): number {
  const decayableDays = Math.max(0, daysInactive - DECAY_CONFIG.graceDays);
  return decayableDays * DECAY_CONFIG.decayPerInactiveDayPct;
}
