// Data-driven building progression (spec sections 14 & 15).
//
// Every building type is a list of level definitions. Nothing about a
// building's stats, cost, or unlock rules lives in a component or in
// BuildingService — it all comes from BUILDING_CONFIG so a new building can
// be added by appending one object here, per spec 44 ("Do NOT hard-code
// building progression inside React components").

export interface BuildingLevelConfig {
  level: number;
  name: string;
  requiredXp: number; // empire XP required to unlock construction/upgrade
  requiredTownHall: number;
  constructionPointsRequired: number;
  upgradeCostResources: number;
}

export interface BuildingTypeConfig {
  key: string;
  category: "residential" | "civic" | "infrastructure" | "landmark" | "economy";
  displayName: string;
  description: string;
  maxLevel: number;
  levels: BuildingLevelConfig[];
}

function generateLevels(
  key: string,
  stageNames: string[],
  baseXp: number,
  baseCp: number,
  baseCost: number,
  townHallStart: number,
): BuildingLevelConfig[] {
  return stageNames.map((name, i) => ({
    level: i + 1,
    name,
    requiredXp: Math.round(baseXp * Math.pow(1.55, i)),
    requiredTownHall: Math.min(12, townHallStart + Math.floor(i / 2)),
    constructionPointsRequired: Math.round(baseCp * Math.pow(1.6, i)),
    upgradeCostResources: Math.round(baseCost * Math.pow(1.7, i)),
  }));
}

export const BUILDING_CONFIG: Record<string, BuildingTypeConfig> = {
  house: {
    key: "house",
    category: "residential",
    displayName: "House",
    description: "Homes for your citizens. More houses, more population.",
    maxLevel: 7,
    levels: generateLevels(
      "house",
      ["Small Wooden House", "Improved House", "Stone House", "Modern House", "Luxury House", "High-Rise Apartment", "Advanced Residential Tower"],
      120, 200, 80, 1,
    ),
  },
  farm: {
    key: "farm",
    category: "economy",
    displayName: "Farm",
    description: "Produces resources that fund construction.",
    maxLevel: 5,
    levels: generateLevels("farm", ["Small Plot", "Terraced Farm", "Mechanized Farm", "Agro Complex", "Vertical Farm"], 150, 220, 90, 1),
  },
  shop: {
    key: "shop",
    category: "economy",
    displayName: "Shop",
    description: "Local commerce that grows with your city.",
    maxLevel: 5,
    levels: generateLevels("shop", ["Market Stall", "Corner Shop", "Retail Store", "Shopping Plaza", "Shopping District"], 180, 260, 100, 1),
  },
  school: {
    key: "school",
    category: "civic",
    displayName: "School",
    description: "Primary education for your growing population.",
    maxLevel: 5,
    levels: generateLevels("school", ["One-Room Schoolhouse", "Community School", "Modern School", "School Campus", "Education Complex"], 300, 350, 150, 3),
  },
  library: {
    key: "library",
    category: "civic",
    displayName: "Library",
    description: "Knowledge infrastructure — unlocked from day one.",
    maxLevel: 5,
    levels: generateLevels("library", ["Reading Room", "Public Library", "Central Library", "Grand Library", "Knowledge Archive"], 200, 220, 90, 1),
  },
  university: {
    key: "university",
    category: "civic",
    displayName: "University",
    description: "Higher education — a major consistency milestone.",
    maxLevel: 5,
    levels: generateLevels("university", ["Lecture Hall", "College Building", "University Campus", "Research University", "Elite University"], 1000, 900, 400, 5),
  },
  laboratory: {
    key: "laboratory",
    category: "civic",
    displayName: "Laboratory",
    description: "Research facility for advanced empires.",
    maxLevel: 5,
    levels: generateLevels("laboratory", ["Study Lab", "Research Lab", "Science Center", "Innovation Hub", "Advanced Research Institute"], 1500, 1000, 500, 6,
    ),
  },
  hospital: {
    key: "hospital",
    category: "civic",
    displayName: "Hospital",
    description: "Keeps your population healthy and your city functioning.",
    maxLevel: 5,
    levels: generateLevels("hospital", ["Clinic", "Community Hospital", "General Hospital", "Medical Center", "Advanced Medical Campus"], 700, 650, 300, 4),
  },
  office: {
    key: "office",
    category: "economy",
    displayName: "Office",
    description: "Employment and economic output.",
    maxLevel: 5,
    levels: generateLevels("office", ["Small Office", "Office Block", "Business Tower", "Corporate Campus", "Headquarters"], 900, 700, 350, 5),
  },
  factory: {
    key: "factory",
    category: "economy",
    displayName: "Factory",
    description: "Boosts resource production at scale.",
    maxLevel: 5,
    levels: generateLevels("factory", ["Workshop", "Small Factory", "Industrial Plant", "Automated Factory", "Mega Factory"], 1100, 900, 400, 6),
  },
  park: {
    key: "park",
    category: "landmark",
    displayName: "Park",
    description: "Boosts city condition recovery rate.",
    maxLevel: 4,
    levels: generateLevels("park", ["Green Patch", "Community Park", "Central Park", "Botanical Gardens"], 250, 200, 80, 2),
  },
  temple: {
    key: "temple",
    category: "landmark",
    displayName: "Temple / Monument",
    description: "A cultural landmark for your empire.",
    maxLevel: 3,
    levels: generateLevels("temple", ["Shrine", "Temple", "Grand Monument"], 2000, 1200, 600, 6),
  },
  railway_station: {
    key: "railway_station",
    category: "infrastructure",
    displayName: "Railway Station",
    description: "Connects your city — unlocked at City tier.",
    maxLevel: 4,
    levels: generateLevels("railway_station", ["Local Halt", "Regional Station", "Central Station", "High-Speed Rail Hub"], 2500, 1800, 700, 5),
  },
  airport: {
    key: "airport",
    category: "infrastructure",
    displayName: "Airport",
    description: "A major infrastructure milestone — Metropolis tier.",
    maxLevel: 3,
    levels: generateLevels("airport", ["Airstrip", "Regional Airport", "International Airport"], 6000, 3500, 1500, 7),
  },
  bridge: {
    key: "bridge",
    category: "infrastructure",
    displayName: "Bridge",
    description: "Expands your city's buildable area.",
    maxLevel: 3,
    levels: generateLevels("bridge", ["Footbridge", "Road Bridge", "Suspension Bridge"], 1800, 1200, 500, 5),
  },
  stadium: {
    key: "stadium",
    category: "landmark",
    displayName: "Stadium",
    description: "A gathering place that lifts empire rating.",
    maxLevel: 3,
    levels: generateLevels("stadium", ["Sports Field", "Community Stadium", "Grand Arena"], 3500, 2200, 900, 6),
  },
  government: {
    key: "government",
    category: "civic",
    displayName: "Government Building",
    description: "Civic administration for an advanced empire.",
    maxLevel: 3,
    levels: generateLevels("government", ["Town Office", "City Hall Annex", "Government Complex"], 4000, 2800, 1100, 7),
  },
  palace: {
    key: "palace",
    category: "landmark",
    displayName: "Palace",
    description: "A grand landmark for late-game empires.",
    maxLevel: 3,
    levels: generateLevels("palace", ["Manor", "Estate", "Palace"], 8000, 4500, 1800, 8),
  },
  castle: {
    key: "castle",
    category: "landmark",
    displayName: "Castle",
    description: "A defensive landmark and empire centerpiece.",
    maxLevel: 3,
    levels: generateLevels("castle", ["Fortified Keep", "Walled Castle", "Grand Castle"], 9000, 5000, 2000, 8),
  },
  skyscraper: {
    key: "skyscraper",
    category: "economy",
    displayName: "Skyscraper",
    description: "The pinnacle of urban development.",
    maxLevel: 4,
    levels: generateLevels("skyscraper", ["Tower", "High-Rise", "Supertall Tower", "Megatall Spire"], 7000, 4000, 1700, 8),
  },
};

export function getBuildingLevelConfig(buildingType: string, level: number): BuildingLevelConfig | null {
  const type = BUILDING_CONFIG[buildingType];
  if (!type) return null;
  return type.levels.find((l) => l.level === level) ?? null;
}

export function listUnlockedBuildingTypes(townHallLevel: number): string[] {
  return Object.values(BUILDING_CONFIG)
    .filter((t) => (t.levels[0]?.requiredTownHall ?? 1) <= townHallLevel)
    .map((t) => t.key);
}
