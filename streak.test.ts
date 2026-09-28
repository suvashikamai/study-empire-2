import { describe, it, expect } from "vitest";
import { computeStreakUpdate } from "@/game-engine/services/StreakService";

describe("computeStreakUpdate", () => {
  it("starts a new streak at 1 for a first-ever session", () => {
    const r = computeStreakUpdate({ currentStreak: 0, longestStreak: 0, lastStudyDate: null }, "2026-01-05T10:00:00Z");
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(1);
    expect(r.isNewDay).toBe(true);
  });

  it("increments the streak for consecutive calendar days", () => {
    const r = computeStreakUpdate({ currentStreak: 4, longestStreak: 4, lastStudyDate: "2026-01-04" }, "2026-01-05T10:00:00Z");
    expect(r.currentStreak).toBe(5);
    expect(r.longestStreak).toBe(5);
  });

  it("does not increment the streak twice for the same day", () => {
    const r = computeStreakUpdate({ currentStreak: 5, longestStreak: 5, lastStudyDate: "2026-01-05" }, "2026-01-05T20:00:00Z");
    expect(r.currentStreak).toBe(5);
    expect(r.isNewDay).toBe(false);
  });

  it("resets the streak to 1 after a missed day, but keeps the longest-streak record (spec 5: longest streak is never lost)", () => {
    const r = computeStreakUpdate({ currentStreak: 12, longestStreak: 12, lastStudyDate: "2026-01-01" }, "2026-01-05T10:00:00Z");
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(12);
  });
});
