import { describe, it, expect } from "vitest";
import { getTownHallLevelConfig, resolveTownHallLevelFromXp } from "@/game-engine/config/townhall.config";

describe("Town Hall progression", () => {
  it("is never capped — levels far beyond the curated table still resolve (spec 13)", () => {
    const farLevel = getTownHallLevelConfig(50);
    expect(farLevel.level).toBe(50);
    expect(farLevel.empireXpRequired).toBeGreaterThan(0);
    expect(farLevel.populationCap).toBeGreaterThan(0);
  });

  it("XP requirement strictly increases with level, including past the curated table", () => {
    let prevXp = -1;
    for (let level = 1; level <= 40; level++) {
      const xp = getTownHallLevelConfig(level).empireXpRequired;
      expect(xp).toBeGreaterThan(prevXp);
      prevXp = xp;
    }
  });

  it("resolveTownHallLevelFromXp round-trips with getTownHallLevelConfig", () => {
    for (const level of [1, 5, 12, 15, 25]) {
      const requiredXp = getTownHallLevelConfig(level).empireXpRequired;
      expect(resolveTownHallLevelFromXp(requiredXp)).toBe(level);
      // Level 1 requires 0 XP, so there's no lower level to drop below —
      // only check the "one less than required" boundary above level 1.
      if (level > 1) {
        expect(resolveTownHallLevelFromXp(requiredXp - 1)).toBeLessThan(level);
      }
    }
  });

  it("a brand-new empire (0 XP) is Town Hall level 1", () => {
    expect(resolveTownHallLevelFromXp(0)).toBe(1);
  });
});
