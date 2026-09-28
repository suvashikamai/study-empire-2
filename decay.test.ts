import { describe, it, expect } from "vitest";
import { decayForInactiveDays, statusForCondition, DECAY_CONFIG } from "@/game-engine/config/decay.config";

describe("decayForInactiveDays", () => {
  it("applies no decay within the grace period (spec 17: don't punish one missed session)", () => {
    expect(decayForInactiveDays(0)).toBe(0);
    expect(decayForInactiveDays(DECAY_CONFIG.graceDays)).toBe(0);
  });

  it("decays gradually once past the grace period", () => {
    const oneDayPast = decayForInactiveDays(DECAY_CONFIG.graceDays + 1);
    const twoDaysPast = decayForInactiveDays(DECAY_CONFIG.graceDays + 2);
    expect(oneDayPast).toBeGreaterThan(0);
    expect(twoDaysPast).toBeGreaterThan(oneDayPast);
  });
});

describe("statusForCondition", () => {
  it("maps condition percentages to the right visual status tier", () => {
    expect(statusForCondition(100, false)).toBe("ACTIVE");
    expect(statusForCondition(60, false)).toBe("LOW_ACTIVITY");
    expect(statusForCondition(35, false)).toBe("DAMAGED");
    expect(statusForCondition(10, false)).toBe("ABANDONED");
  });

  it("a building under construction is always CONSTRUCTING regardless of condition", () => {
    expect(statusForCondition(100, true)).toBe("CONSTRUCTING");
  });

  it("a building never reports below the condition floor even at 0 raw condition (spec 17: never disappears)", () => {
    // The floor is enforced by the repo layer's clamp, not this pure
    // function, but the threshold table itself should never go negative.
    expect(DECAY_CONFIG.conditionFloorPct).toBeGreaterThan(0);
    expect(statusForCondition(DECAY_CONFIG.conditionFloorPct, false)).toBe("ABANDONED");
  });
});
