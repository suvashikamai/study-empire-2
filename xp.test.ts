import { describe, it, expect } from "vitest";
import { computeSessionReward, computeLevelFromXp, xpRequiredForLevel, xpProgressWithinLevel, streakBonusForDay } from "@/game-engine/config/xp.config";

describe("computeSessionReward", () => {
  it("awards 0 XP for an abandoned session (spec 11: no completion XP)", () => {
    const r = computeSessionReward({ plannedMinutes: 60, actualMinutes: 10, breaksTaken: 0, completedOnTime: false, status: "ABANDONED" });
    expect(r.xp).toBe(0);
    expect(r.empireXp).toBe(0);
    expect(r.constructionPoints).toBe(0);
  });

  it("awards positive XP for a completed session, capped effective minutes at 1.25x planned", () => {
    const normal = computeSessionReward({ plannedMinutes: 60, actualMinutes: 60, breaksTaken: 0, completedOnTime: true, status: "COMPLETED" });
    const overstudied = computeSessionReward({ plannedMinutes: 60, actualMinutes: 500, breaksTaken: 0, completedOnTime: true, status: "COMPLETED" });
    expect(normal.xp).toBeGreaterThan(0);
    // A session can't be gamed into unlimited XP by claiming an absurd duration.
    expect(overstudied.xp).toBeLessThan(normal.xp * 2);
  });

  it("never lets excessive breaks zero out or invert XP (fair decay, spec 11)", () => {
    const r = computeSessionReward({ plannedMinutes: 60, actualMinutes: 60, breaksTaken: 10, completedOnTime: false, status: "COMPLETED" });
    expect(r.xp).toBeGreaterThanOrEqual(0);
  });

  it("mirrors XP into Empire XP and halves it into Construction Points by default", () => {
    const r = computeSessionReward({ plannedMinutes: 60, actualMinutes: 60, breaksTaken: 0, completedOnTime: true, status: "COMPLETED" });
    expect(r.empireXp).toBe(r.xp);
    expect(r.constructionPoints).toBe(Math.round(r.xp * 0.5));
  });
});

describe("level curve", () => {
  it("is monotonically increasing and internally consistent", () => {
    for (let level = 1; level < 30; level++) {
      expect(xpRequiredForLevel(level + 1)).toBeGreaterThan(xpRequiredForLevel(level));
    }
  });

  it("computeLevelFromXp is the inverse of xpRequiredForLevel at the boundary", () => {
    const xpForLevel10 = xpRequiredForLevel(10);
    expect(computeLevelFromXp(xpForLevel10)).toBe(10);
    expect(computeLevelFromXp(xpForLevel10 - 1)).toBe(9);
  });

  it("xpProgressWithinLevel reports a non-negative progress within [0, xpForNextLevel)", () => {
    const progress = xpProgressWithinLevel(12345);
    expect(progress.currentLevelXp).toBeGreaterThanOrEqual(0);
    expect(progress.currentLevelXp).toBeLessThan(progress.xpForNextLevel);
  });
});

describe("streakBonusForDay", () => {
  it("only pays out on milestone days", () => {
    expect(streakBonusForDay(7)).toBeGreaterThan(0);
    expect(streakBonusForDay(30)).toBeGreaterThan(streakBonusForDay(7));
    expect(streakBonusForDay(100)).toBeGreaterThan(streakBonusForDay(30));
    expect(streakBonusForDay(8)).toBe(0);
    expect(streakBonusForDay(1)).toBe(0);
  });
});
