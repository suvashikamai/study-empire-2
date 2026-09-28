// Study Performance Score rules (spec section 11) and the XP -> Empire XP ->
// Construction Points pipeline (spec section 16). Every number that affects
// scoring lives here so balance changes never require touching a service or
// an API route.
//
// Design constraint from the spec: "Do NOT create an unfair system where
// users lose huge amounts of progress" — so penalties are capped small
// percentages, never a loss of already-earned totals.

export const XP_RULES = {
  /** Base XP per planned minute of a session that's actually completed. */
  xpPerCompletedMinute: 1.6,

  /** Flat bonus for finishing a session at all (spec: "+100 XP" example). */
  sessionCompletionBonus: 100,

  /** Bonus for studying the full planned duration or slightly over. */
  fullDurationBonusPct: 0.15,

  /** Bonus for staying within the planned schedule window. */
  scheduleAdherenceBonus: 40,

  /** Small, capped reduction — never zeroes out a session's XP. */
  excessiveBreakPenaltyPct: 0.1,
  maxPlannedBreaksBeforePenalty: 3,

  dailyGoalBonus: 250,
  weeklyGoalBonus: 1000,

  streak7DayBonus: 500,
  streak30DayBonus: 5000,
  streak100DayBonus: 20000,

  /** Abandoned sessions earn no completion XP, but never claw back XP
   * already awarded for prior sessions (spec 11: fair decay, not punitive). */
  abandonedSessionXp: 0,

  /** How much of a session's final XP also becomes Empire XP (spec 16: a
   * 60-minute session yields +100 Empire XP alongside +50 Construction
   * Points — i.e. Empire XP mirrors Study XP 1:1 by default). */
  empireXpRatio: 1.0,
  constructionPointsRatio: 0.5,
} as const;

/** Minimum realistic seconds-per-minute a session must actually run for to
 * count as legitimate — used by the anti-cheat check in StudyRewardService
 * (spec 36: "Prevent impossible study durations"). */
export const ANTI_CHEAT = {
  minSecondsPerClaimedMinute: 55, // allows minor clock drift, not fast-forwarding
  maxSingleSessionMinutes: 6 * 60, // 6 hours — anything longer is rejected
  minGapBetweenSessionsSeconds: 5,
};

export interface SessionRewardInput {
  plannedMinutes: number;
  actualMinutes: number;
  breaksTaken: number;
  completedOnTime: boolean; // finished within the scheduled window
  status: "COMPLETED" | "ABANDONED";
}

export interface SessionRewardResult {
  xp: number;
  empireXp: number;
  constructionPoints: number;
  breakdown: { label: string; amount: number }[];
}

export function computeSessionReward(input: SessionRewardInput): SessionRewardResult {
  if (input.status === "ABANDONED") {
    return { xp: XP_RULES.abandonedSessionXp, empireXp: 0, constructionPoints: 0, breakdown: [] };
  }

  const breakdown: { label: string; amount: number }[] = [];
  const effectiveMinutes = Math.min(input.actualMinutes, input.plannedMinutes * 1.25);

  const base = Math.round(effectiveMinutes * XP_RULES.xpPerCompletedMinute);
  breakdown.push({ label: "Study time", amount: base });

  breakdown.push({ label: "Session completed", amount: XP_RULES.sessionCompletionBonus });

  if (input.actualMinutes >= input.plannedMinutes) {
    const bonus = Math.round(base * XP_RULES.fullDurationBonusPct);
    breakdown.push({ label: "Full duration bonus", amount: bonus });
  }

  if (input.completedOnTime) {
    breakdown.push({ label: "Schedule adherence", amount: XP_RULES.scheduleAdherenceBonus });
  }

  let subtotal = breakdown.reduce((sum, b) => sum + b.amount, 0);

  if (input.breaksTaken > XP_RULES.maxPlannedBreaksBeforePenalty) {
    const penalty = -Math.round(subtotal * XP_RULES.excessiveBreakPenaltyPct);
    breakdown.push({ label: "Excessive breaks", amount: penalty });
    subtotal += penalty;
  }

  const xp = Math.max(0, subtotal);
  return {
    xp,
    empireXp: Math.round(xp * XP_RULES.empireXpRatio),
    constructionPoints: Math.round(xp * XP_RULES.constructionPointsRatio),
    breakdown,
  };
}

/** User level curve: level N requires N*(N-1)/2 * 300 cumulative XP — i.e. a
 * gently increasing amount per level. Deterministic and cheap to invert. */
export function xpRequiredForLevel(level: number): number {
  return Math.round(((level - 1) * level) / 2) * 300;
}

export function computeLevelFromXp(totalXp: number): number {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= totalXp) level += 1;
  return level;
}

export function xpProgressWithinLevel(totalXp: number): { level: number; currentLevelXp: number; xpForNextLevel: number } {
  const level = computeLevelFromXp(totalXp);
  const floor = xpRequiredForLevel(level);
  const ceil = xpRequiredForLevel(level + 1);
  return { level, currentLevelXp: totalXp - floor, xpForNextLevel: ceil - floor };
}

export function streakBonusForDay(streakDays: number): number {
  if (streakDays === 100) return XP_RULES.streak100DayBonus;
  if (streakDays === 30) return XP_RULES.streak30DayBonus;
  if (streakDays === 7) return XP_RULES.streak7DayBonus;
  return 0;
}
