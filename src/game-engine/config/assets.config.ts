// Visual asset mapping for the Empire 3D viewer (spec sections 15 & 32).
//
// This is the ONLY file that maps a building type to a mesh file — the
// renderer and the game engine never hard-code a filename. Swapping or
// adding art later means editing this table, not touching game logic.
//
// Asset provenance: the person using this app supplied a pack of stock/
// generic GLB models. Two of them — a named Marvel character and a named
// Transformers character — are real third-party IP and are deliberately
// EXCLUDED here per the product's own rule (spec 30/49: never ship
// copyrighted characters/logos/artwork). See EXCLUDED_ASSETS below.
//
// To keep the downloadable project small, only the handful of small/
// medium models are bundled under public/models/. The larger set (a
// railway station, an airport, a temple, a police station, and a hotel —
// 35-250MB each) is referenced but NOT bundled; drop your own copies into
// public/models/ using the filenames below and they'll be picked up
// automatically. Until then, the renderer draws a procedural placeholder
// (a simple colored low-poly block) so the city still renders correctly.

export interface AssetDefinition {
  /** Filename expected under /public/models/ */
  file: string;
  /** Whether this file ships with the repo out of the box */
  bundled: boolean;
  /** Fallback procedural shape + tint when the file isn't present */
  placeholder: {
    shape: "box" | "tower" | "dome" | "flat";
    color: string;
    heightScale: number;
  };
}

export const BUILDING_ASSETS: Record<string, AssetDefinition> = {
  house: { file: "autumn_house.glb", bundled: true, placeholder: { shape: "box", color: "#c98b4a", heightScale: 1 } },
  hospital: { file: "hospital.glb", bundled: true, placeholder: { shape: "box", color: "#e0523a", heightScale: 1.3 } },
  office: { file: "corporation_sky_scraper_lp_for_games.glb", bundled: true, placeholder: { shape: "tower", color: "#3d9be0", heightScale: 2.2 } },
  skyscraper: { file: "corporation_sky_scraper_lp_for_games.glb", bundled: true, placeholder: { shape: "tower", color: "#3d9be0", heightScale: 3.2 } },

  // Generic fallback mesh reused until a purpose-built asset is supplied —
  // still a real, distinct low-poly building rather than an empty box.
  shop: { file: "low_poly_building.glb", bundled: true, placeholder: { shape: "box", color: "#f2b13d", heightScale: 0.9 } },
  school: { file: "low_poly_building.glb", bundled: true, placeholder: { shape: "box", color: "#22e07a", heightScale: 1.1 } },
  library: { file: "low_poly_building.glb", bundled: true, placeholder: { shape: "box", color: "#8a5cf6", heightScale: 1.1 } },
  university: { file: "low_poly_building.glb", bundled: true, placeholder: { shape: "tower", color: "#8a5cf6", heightScale: 1.8 } },
  laboratory: { file: "low_poly_building.glb", bundled: true, placeholder: { shape: "box", color: "#3de0d0", heightScale: 1.2 } },
  factory: { file: "low_poly_building.glb", bundled: true, placeholder: { shape: "box", color: "#6c6c76", heightScale: 1.2 } },

  // Not bundled — large external assets. Drop the originals into
  // public/models/ under these exact filenames to activate them.
  temple: { file: "japanese_temple.glb", bundled: false, placeholder: { shape: "dome", color: "#f2b13d", heightScale: 1.4 } },
  railway_station: { file: "railway_station.glb", bundled: false, placeholder: { shape: "flat", color: "#a6a6ae", heightScale: 1.0 } },
  airport: { file: "airport.glb", bundled: false, placeholder: { shape: "flat", color: "#a6a6ae", heightScale: 1.0 } },
  government: { file: "southern_district_police_station.glb", bundled: false, placeholder: { shape: "box", color: "#3d9be0", heightScale: 1.5 } },
  palace: { file: "the_overlook_hotel.glb", bundled: false, placeholder: { shape: "box", color: "#f2b13d", heightScale: 2.0 } },
  castle: { file: "the_overlook_hotel.glb", bundled: false, placeholder: { shape: "box", color: "#a6a6ae", heightScale: 2.4 } },
  town_hall: { file: "futuristic_building.glb", bundled: false, placeholder: { shape: "tower", color: "#22e07a", heightScale: 2.6 } },

  // No purpose-built mesh at all yet — always procedural until you add one.
  farm: { file: "", bundled: false, placeholder: { shape: "flat", color: "#7bbf5e", heightScale: 0.3 } },
  park: { file: "", bundled: false, placeholder: { shape: "flat", color: "#3f8f4f", heightScale: 0.2 } },
  bridge: { file: "", bundled: false, placeholder: { shape: "flat", color: "#8a8a92", heightScale: 0.4 } },
  stadium: { file: "", bundled: false, placeholder: { shape: "dome", color: "#e0523a", heightScale: 1.0 } },
};

/** Small ambient props scattered around the city, unrelated to any specific building. */
export const AMBIENT_ASSETS = {
  aircraft: { file: "airplane_crj-900_cityjet.glb", bundled: true },
};

/**
 * Files intentionally NOT included anywhere in this project: real,
 * named third-party characters (Marvel's Black Widow; Hasbro/Transformers'
 * Shockwave). Using likenesses of copyrighted characters in a commercial-
 * feel product conflicts with this project's own design rule (spec 30/49)
 * and with those rights holders' IP. If you want city "citizens" or NPCs,
 * use a generic/licensed low-poly people pack instead.
 */
export const EXCLUDED_ASSETS = [
  "natasha_romanoff_black_widow.glb",
  "shockwave_transformers_human_alliance.glb",
];

export function resolveAssetPath(buildingType: string): string | null {
  const def = BUILDING_ASSETS[buildingType];
  if (!def || !def.file) return null;
  return `/models/${def.file}`;
}
