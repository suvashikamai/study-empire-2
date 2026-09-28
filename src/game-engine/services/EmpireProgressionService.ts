import * as EmpireRepo from "@/lib/db/repo/empire";
import { TownHallService } from "./TownHallService";
import { BuildingService } from "./BuildingService";
import { getBuildingLevelConfig } from "../config/buildings.config";

export const EmpireProgressionService = {
  /** First-time-user starter city (spec 47): a small settlement that
   * already exists so the very first study session has something to grow,
   * rather than an empty screen. */
  createStarterEmpire(userId: string) {
    const empire = EmpireRepo.createEmpire(userId);

    const starter: { type: string; level: number }[] = [
      { type: "house", level: 1 },
      { type: "house", level: 1 },
      { type: "house", level: 1 },
      { type: "library", level: 1 },
    ];

    starter.forEach((s, i) => {
      const levelCfg = getBuildingLevelConfig(s.type, s.level);
      if (!levelCfg) return;
      const building = EmpireRepo.createBuilding(empire.id, {
        buildingType: s.type,
        constructionPointsRequired: levelCfg.constructionPointsRequired,
        positionX: i % 6,
        positionY: Math.floor(i / 6),
      });
      // Starter buildings are already standing, not under construction.
      EmpireRepo.addBuildingConstructionPoints(building.id, levelCfg.constructionPointsRequired);
    });

    const population = TownHallService.computePopulation(1, 3, 100);
    EmpireRepo.updateEmpireProgress(userId, { population });
    return EmpireRepo.getEmpireByUserId(userId)!;
  },

  /**
   * The core of the "real study = empire progress" loop (spec 3 & 16).
   * Adds Empire XP, recomputes Town Hall level (and thus which building
   * types are unlocked), feeds Construction Points into the current
   * project, and recomputes population/condition-derived numbers.
   * Returns what changed so the API layer can report it to the client.
   */
  applyStudyReward(userId: string, empireXp: number, constructionPoints: number) {
    const empire = EmpireRepo.getEmpireByUserId(userId);
    if (!empire) throw new Error("Empire not found for user");

    const newEmpireXp = empire.empire_xp + empireXp;
    const previousTownHallLevel = empire.town_hall_level;
    const newTownHallLevel = TownHallService.resolveLevelFromXp(newEmpireXp);
    const townHallLeveledUp = newTownHallLevel > previousTownHallLevel;

    const { completed: completedBuildings } = BuildingService.channelConstructionPoints(
      empire.id,
      newTownHallLevel,
      constructionPoints,
    );

    const houseCount = EmpireRepo.listBuildings(empire.id).filter((b) => b.building_type === "house" && b.status !== "CONSTRUCTING").length;
    const refreshedCondition = EmpireRepo.getEmpireByUserId(userId)!.condition_pct;
    const population = TownHallService.computePopulation(newTownHallLevel, houseCount, refreshedCondition);

    EmpireRepo.updateEmpireProgress(userId, {
      empireXp: newEmpireXp,
      townHallLevel: newTownHallLevel,
      population,
    });

    return { townHallLeveledUp, newTownHallLevel, completedBuildings, population };
  },
};
