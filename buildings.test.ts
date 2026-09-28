import { describe, it, expect } from "vitest";
import { BUILDING_CONFIG, getBuildingLevelConfig, listUnlockedBuildingTypes } from "@/game-engine/config/buildings.config";

describe("building progression config", () => {
  it("every building type's levels have strictly increasing requirements", () => {
    for (const type of Object.values(BUILDING_CONFIG)) {
      for (let i = 1; i < type.levels.length; i++) {
        expect(type.levels[i].requiredXp).toBeGreaterThan(type.levels[i - 1].requiredXp);
        expect(type.levels[i].constructionPointsRequired).toBeGreaterThan(type.levels[i - 1].constructionPointsRequired);
      }
    }
  });

  it("getBuildingLevelConfig returns null past a building's max level (never crashes)", () => {
    const house = BUILDING_CONFIG.house;
    expect(getBuildingLevelConfig("house", house.maxLevel)).not.toBeNull();
    expect(getBuildingLevelConfig("house", house.maxLevel + 1)).toBeNull();
  });

  it("getBuildingLevelConfig returns null for an unknown building type instead of throwing", () => {
    expect(getBuildingLevelConfig("not_a_real_building", 1)).toBeNull();
  });

  it("listUnlockedBuildingTypes grows monotonically with Town Hall level", () => {
    const atLevel1 = listUnlockedBuildingTypes(1);
    const atLevel10 = listUnlockedBuildingTypes(10);
    expect(atLevel10.length).toBeGreaterThanOrEqual(atLevel1.length);
    for (const type of atLevel1) {
      expect(atLevel10).toContain(type);
    }
  });
});
