import { getTownHallLevelConfig, resolveTownHallLevelFromXp } from "../config/townhall.config";

export const TownHallService = {
  levelConfig: getTownHallLevelConfig,
  resolveLevelFromXp: resolveTownHallLevelFromXp,

  /** Population is derived, not stored-and-incremented, so it can never
   * drift from the rules (spec 19: depends on Town Hall level, residential
   * buildings, and consistency/condition). */
  computePopulation(townHallLevel: number, houseCount: number, conditionPct: number): number {
    const cfg = getTownHallLevelConfig(townHallLevel);
    const basePop = cfg.populationCap * 0.15;
    const housingPop = Math.min(cfg.populationCap * 0.85, houseCount * (cfg.populationCap * 0.04));
    const raw = basePop + housingPop;
    const conditionFactor = Math.max(0.3, conditionPct / 100); // a struggling city still has SOME population
    return Math.round(Math.min(cfg.populationCap, raw) * conditionFactor);
  },

  /** 0-100 "Empire Rating" shown on the dashboard/empire screen — a simple
   * blend of city condition and how close population is to this tier's cap,
   * which rewards both consistency (condition) and growth (population). */
  computeEmpireRating(conditionPct: number, population: number, populationCap: number): number {
    const popScore = Math.min(1, population / Math.max(1, populationCap)) * 100;
    return Math.round(conditionPct * 0.6 + popScore * 0.4);
  },
};
