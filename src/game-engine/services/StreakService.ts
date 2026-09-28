// Streak calculation — pure logic, no DB access, so it's trivially unit
// testable (see tests/streak.test.ts).

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  streakBonusXp: number;
  isNewDay: boolean;
}

/**
 * Given the user's prior streak state and the date of a just-completed
 * session, returns the updated streak. Studying multiple times on the same
 * day does not increment the streak further (isNewDay = false the 2nd+
 * time); studying on the very next calendar day increments it; any longer
 * gap resets it to 1.
 */
export function computeStreakUpdate(
  prior: { currentStreak: number; longestStreak: number; lastStudyDate: string | null },
  completedAtIso: string,
): StreakUpdateResult {
  const today = toIsoDate(new Date(completedAtIso));

  if (prior.lastStudyDate === today) {
    return { currentStreak: prior.currentStreak, longestStreak: prior.longestStreak, streakBonusXp: 0, isNewDay: false };
  }

  const gap = prior.lastStudyDate ? daysBetween(prior.lastStudyDate, today) : null;
  const currentStreak = gap === 1 ? prior.currentStreak + 1 : 1;
  const longestStreak = Math.max(prior.longestStreak, currentStreak);

  return { currentStreak, longestStreak, streakBonusXp: 0, isNewDay: true };
}
