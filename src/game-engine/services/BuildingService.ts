import * as EmpireRepo from "@/lib/db/repo/empire";
import { BUILDING_CONFIG, getBuildingLevelConfig, listUnlockedBuildingTypes } from "../config/buildings.config";

/** Order + per-type cap that new construction projects are picked from.
 * This is what makes the city visibly diversify as it grows (spec 12) —
 * tune freely, it never touches game logic elsewhere. */
const CONSTRUCTION_PLAN: { type: string; cap: number }[] = [
  { type: "house", cap: 6 },
  { type: "library", cap: 1 },
  { type: "shop", cap: 3 },
  { type: "school", cap: 1 },
  { type: "farm", cap: 2 },
  { type: "park", cap: 2 },
  { type: "hospital", cap: 1 },
  { type: "office", cap: 2 },
  { type: "university", cap: 1 },
  { type: "laboratory", cap: 1 },
  { type: "railway_station", cap: 1 },
  { type: "stadium", cap: 1 },
  { type: "factory", cap: 2 },
  { type: "government", cap: 1 },
  { type: "airport", cap: 1 },
  { type: "bridge", cap: 1 },
  { type: "temple", cap: 1 },
  { type: "palace", cap: 1 },
  { type: "castle", cap: 1 },
  { type: "skyscraper", cap: 2 },
];

function nextGridPosition(index: number): { x: number; y: number } {
  const gridWidth = 6;
  return { x: index % gridWidth, y: Math.floor(index / gridWidth) };
}

export const BuildingService = {
  config: BUILDING_CONFIG,
  levelConfig: getBuildingLevelConfig,
  unlockedTypes: listUnlockedBuildingTypes,

  /**
   * Returns the empire's current construction project, starting a new one
   * if none is in progress. This is what makes "study -> construction
   * progress" automatic (spec 16) without the user manually picking every
   * building — they can still see what's being built on the Empire screen.
   */
  getOrStartConstructionProject(empireId: string, townHallLevel: number) {
    const existing = EmpireRepo.listBuildings(empireId).find((b) => b.status === "CONSTRUCTING");
    if (existing) return existing;

    const unlocked = new Set(listUnlockedBuildingTypes(townHallLevel));
    const existingCounts = new Map<string, number>();
    for (const b of EmpireRepo.listBuildings(empireId)) {
      existingCounts.set(b.building_type, (existingCounts.get(b.building_type) ?? 0) + 1);
    }

    for (const plan of CONSTRUCTION_PLAN) {
      if (!unlocked.has(plan.type)) continue;
      const count = existingCounts.get(plan.type) ?? 0;
      if (count >= plan.cap) continue;
      const levelCfg = getBuildingLevelConfig(plan.type, 1);
      if (!levelCfg) continue;
      const totalBuildings = EmpireRepo.listBuildings(empireId).length;
      const pos = nextGridPosition(totalBuildings);
      return EmpireRepo.createBuilding(empireId, {
        buildingType: plan.type,
        constructionPointsRequired: levelCfg.constructionPointsRequired,
        positionX: pos.x,
        positionY: pos.y,
      });
    }
    // Every planned type is at cap for this Town Hall tier — nothing left
    // to build until the next Town Hall level unlocks more types.
    return null;
  },

  /** Feeds construction points into the current project, completing and
   * rotating to the next project if it finishes. Returns whichever
   * buildings were touched, for the caller to report "X completed!". */
  channelConstructionPoints(empireId: string, townHallLevel: number, points: number): { completed: string[] } {
    let remaining = points;
    const completed: string[] = [];
    let guard = 0;
    while (remaining > 0 && guard < 25) {
      guard += 1;
      const project = this.getOrStartConstructionProject(empireId, townHallLevel);
      if (!project) break;
      const needed = project.construction_points_required - project.construction_points;
      const applied = Math.min(needed, remaining);
      const updated = EmpireRepo.addBuildingConstructionPoints(project.id, applied);
      remaining -= applied;
      if (updated.status === "ACTIVE" && updated.construction_points >= updated.construction_points_required) {
        completed.push(updated.building_type);
      } else {
        break; // project still in progress, don't loop further this call
      }
    }
    return { completed };
  },

  /** Upgrades a completed building to its next level, if the empire meets
   * that level's XP + Town Hall requirements (spec 14: multi-stage
   * progression). Server-validated — never trust a client-submitted level. */
  tryUpgrade(empireId: string, buildingId: string, empireXp: number, townHallLevel: number): boolean {
    const building = EmpireRepo.getBuilding(buildingId, empireId);
    if (!building || building.status === "CONSTRUCTING") return false;
    const nextLevel = getBuildingLevelConfig(building.building_type, building.level + 1);
    if (!nextLevel) return false; // already max level
    if (empireXp < nextLevel.requiredXp || townHallLevel < nextLevel.requiredTownHall) return false;
    EmpireRepo.upgradeBuilding(buildingId, nextLevel.level, nextLevel.constructionPointsRequired);
    return true;
  },
};
