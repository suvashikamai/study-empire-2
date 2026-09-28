// Town Hall progression (spec section 13).
//
// IMPORTANT: levels are NOT hard-coded to a small max. TOWN_HALL_TABLE only
// defines the flavor/curated levels (1-12); getTownHallLevelConfig()
// generates every level beyond that procedurally from a formula, so the
// system never runs out of levels. Nothing outside this file knows the
// difference between a "curated" and a "generated" level.

export interface TownHallLevelConfig {
  level: number;
  name: string;
  empireXpRequired: number; // cumulative empire XP to REACH this level
  populationCap: number;
  npcCount: number;
  buildingUnlocks: string[]; // buildingType keys newly available at this level
  roadComplexity: number; // 1-5, used by the city renderer for road density
  resourceMultiplier: number; // multiplies construction-point generation
}

const CURATED: Omit<TownHallLevelConfig, "level">[] = [
  { name: "Small Settlement", empireXpRequired: 0, populationCap: 100, npcCount: 4, buildingUnlocks: ["house", "road", "library"], roadComplexity: 1, resourceMultiplier: 1.0 },
  { name: "Village", empireXpRequired: 800, populationCap: 500, npcCount: 8, buildingUnlocks: ["farm", "shop"], roadComplexity: 1, resourceMultiplier: 1.1 },
  { name: "Town", empireXpRequired: 2200, populationCap: 2000, npcCount: 14, buildingUnlocks: ["school", "park"], roadComplexity: 2, resourceMultiplier: 1.2 },
  { name: "Large Town", empireXpRequired: 5000, populationCap: 10000, npcCount: 22, buildingUnlocks: ["hospital", "office"], roadComplexity: 2, resourceMultiplier: 1.35 },
  { name: "City", empireXpRequired: 10000, populationCap: 50000, npcCount: 32, buildingUnlocks: ["university", "railway_station"], roadComplexity: 3, resourceMultiplier: 1.5 },
  { name: "Advanced City", empireXpRequired: 18000, populationCap: 150000, npcCount: 44, buildingUnlocks: ["laboratory", "stadium"], roadComplexity: 3, resourceMultiplier: 1.7 },
  { name: "Metropolis", empireXpRequired: 30000, populationCap: 400000, npcCount: 60, buildingUnlocks: ["airport", "government"], roadComplexity: 4, resourceMultiplier: 1.9 },
  { name: "Mega City", empireXpRequired: 48000, populationCap: 900000, npcCount: 80, buildingUnlocks: ["skyscraper", "factory"], roadComplexity: 4, resourceMultiplier: 2.15 },
  { name: "Advanced Civilization", empireXpRequired: 72000, populationCap: 2000000, npcCount: 100, buildingUnlocks: ["palace", "temple"], roadComplexity: 5, resourceMultiplier: 2.45 },
  { name: "Empire", empireXpRequired: 105000, populationCap: 5000000, npcCount: 130, buildingUnlocks: ["castle", "bridge"], roadComplexity: 5, resourceMultiplier: 2.8 },
  { name: "Grand Empire", empireXpRequired: 150000, populationCap: 12000000, npcCount: 160, buildingUnlocks: [], roadComplexity: 5, resourceMultiplier: 3.2 },
  { name: "Legendary Empire", empireXpRequired: 210000, populationCap: 28000000, npcCount: 200, buildingUnlocks: [], roadComplexity: 5, resourceMultiplier: 3.65 },
];

const LAST_CURATED_LEVEL = CURATED.length; // 12
const LAST_CURATED_XP = CURATED[CURATED.length - 1].empireXpRequired;

/**
 * Empire XP required to reach a level beyond the curated table. Growth
 * compounds ~1.42x per level on top of the last curated requirement, which
 * keeps late-game progression meaningful without needing new hand-authored
 * rows. Tune this single formula to rebalance the whole late game.
 */
function generatedXpRequirement(level: number): number {
  const stepsBeyond = level - LAST_CURATED_LEVEL;
  return Math.round(LAST_CURATED_XP * Math.pow(1.42, stepsBeyond));
}

export function getTownHallLevelConfig(level: number): TownHallLevelConfig {
  if (level < 1) level = 1;
  if (level <= LAST_CURATED_LEVEL) {
    return { level, ...CURATED[level - 1] };
  }
  const stepsBeyond = level - LAST_CURATED_LEVEL;
  return {
    level,
    name: `Empire Tier ${stepsBeyond + 1}`,
    empireXpRequired: generatedXpRequirement(level),
    populationCap: Math.round(28_000_000 * Math.pow(1.6, stepsBeyond)),
    npcCount: Math.min(400, 200 + stepsBeyond * 20),
    buildingUnlocks: [],
    roadComplexity: 5,
    resourceMultiplier: Number((3.65 * Math.pow(1.08, stepsBeyond)).toFixed(2)),
  };
}

/** Given total empire XP, find the highest Town Hall level it qualifies for. */
export function resolveTownHallLevelFromXp(empireXp: number): number {
  let level = 1;
  // Curated table first (cheap linear scan, table is tiny)
  for (const entry of CURATED) {
    if (empireXp >= entry.empireXpRequired) {
      level = CURATED.indexOf(entry) + 1;
    } else {
      break;
    }
  }
  if (level < LAST_CURATED_LEVEL) return level;

  // Walk generated levels until XP no longer qualifies. Empire XP growth is
  // slow enough relative to session rewards that this loop is always short
  // in practice (bounded by how many levels a single session could cross).
  let probe = LAST_CURATED_LEVEL;
  while (empireXp >= generatedXpRequirement(probe + 1)) {
    probe += 1;
  }
  return probe;
}
