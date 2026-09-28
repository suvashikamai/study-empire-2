import { db } from "../client";
import { generateId } from "../id";
import type { BuildingStatus } from "@/types";
import { DECAY_CONFIG, statusForCondition } from "@/game-engine/config/decay.config";

export interface EmpireRow {
  id: string;
  user_id: string;
  town_hall_level: number;
  empire_xp: number;
  population: number;
  condition_pct: number;
  last_study_activity_at: string;
  last_decay_check_at: string;
  created_at: string;
  updated_at: string;
}

export interface BuildingInstanceRow {
  id: string;
  empire_id: string;
  building_type: string;
  level: number;
  status: BuildingStatus;
  construction_points: number;
  construction_points_required: number;
  condition_pct: number;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export function getEmpireByUserId(userId: string): EmpireRow | undefined {
  return db.prepare("SELECT * FROM empires WHERE user_id = ?").get(userId) as unknown as EmpireRow | undefined;
}

export function createEmpire(userId: string): EmpireRow {
  const id = generateId("empire");
  db.prepare("INSERT INTO empires (id, user_id) VALUES (?, ?)").run(id, userId);
  return getEmpireByUserId(userId)!;
}

export function updateEmpireProgress(
  userId: string,
  fields: Partial<{
    townHallLevel: number;
    empireXp: number;
    population: number;
    conditionPct: number;
    lastStudyActivityAt: string;
    lastDecayCheckAt: string;
  }>,
): void {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (fields.townHallLevel !== undefined) { sets.push("town_hall_level = ?"); values.push(fields.townHallLevel); }
  if (fields.empireXp !== undefined) { sets.push("empire_xp = ?"); values.push(fields.empireXp); }
  if (fields.population !== undefined) { sets.push("population = ?"); values.push(fields.population); }
  if (fields.conditionPct !== undefined) { sets.push("condition_pct = ?"); values.push(fields.conditionPct); }
  if (fields.lastStudyActivityAt !== undefined) { sets.push("last_study_activity_at = ?"); values.push(fields.lastStudyActivityAt); }
  if (fields.lastDecayCheckAt !== undefined) { sets.push("last_decay_check_at = ?"); values.push(fields.lastDecayCheckAt); }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  values.push(userId);
  db.prepare(`UPDATE empires SET ${sets.join(", ")} WHERE user_id = ?`).run(...(values as []));
}

export function listBuildings(empireId: string): BuildingInstanceRow[] {
  return db.prepare("SELECT * FROM building_instances WHERE empire_id = ? ORDER BY created_at ASC").all(empireId) as unknown as BuildingInstanceRow[];
}

export function getBuilding(id: string, empireId: string): BuildingInstanceRow | undefined {
  return db.prepare("SELECT * FROM building_instances WHERE id = ? AND empire_id = ?").get(id, empireId) as unknown as BuildingInstanceRow | undefined;
}

export function findBuildingByType(empireId: string, buildingType: string): BuildingInstanceRow | undefined {
  return db
    .prepare("SELECT * FROM building_instances WHERE empire_id = ? AND building_type = ? ORDER BY level DESC LIMIT 1")
    .get(empireId, buildingType) as unknown as BuildingInstanceRow | undefined;
}

export function createBuilding(
  empireId: string,
  input: { buildingType: string; constructionPointsRequired: number; positionX: number; positionY: number },
): BuildingInstanceRow {
  const id = generateId("bld");
  db.prepare(
    `INSERT INTO building_instances (id, empire_id, building_type, construction_points_required, position_x, position_y)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, empireId, input.buildingType, input.constructionPointsRequired, input.positionX, input.positionY);
  return getBuilding(id, empireId)!;
}

export function addBuildingConstructionPoints(id: string, points: number): BuildingInstanceRow {
  const row = db.prepare("SELECT * FROM building_instances WHERE id = ?").get(id) as unknown as BuildingInstanceRow;
  const newPoints = row.construction_points + points;
  const complete = newPoints >= row.construction_points_required;
  db.prepare(
    `UPDATE building_instances SET
       construction_points = ?,
       status = CASE WHEN ? THEN 'ACTIVE' ELSE status END,
       updated_at = datetime('now')
     WHERE id = ?`,
  ).run(Math.min(newPoints, row.construction_points_required), complete ? 1 : 0, id);
  return db.prepare("SELECT * FROM building_instances WHERE id = ?").get(id) as unknown as BuildingInstanceRow;
}

export function upgradeBuilding(id: string, newLevel: number, newPointsRequired: number): void {
  db.prepare(
    `UPDATE building_instances SET level = ?, construction_points = 0, construction_points_required = ?,
       status = 'CONSTRUCTING', updated_at = datetime('now') WHERE id = ?`,
  ).run(newLevel, newPointsRequired, id);
}

export function setBuildingCondition(id: string, conditionPct: number, status: BuildingStatus): void {
  db.prepare("UPDATE building_instances SET condition_pct = ?, status = ?, updated_at = datetime('now') WHERE id = ?").run(conditionPct, status, id);
}

export function setAllBuildingsCondition(empireId: string, conditionDeltaPct: number, minPct: number, maxPct: number): void {
  db.prepare(
    `UPDATE building_instances SET
       condition_pct = MIN(?, MAX(?, condition_pct + ?)),
       updated_at = datetime('now')
     WHERE empire_id = ? AND status != 'CONSTRUCTING'`,
  ).run(maxPct, minPct, conditionDeltaPct, empireId);
}

/** Applies a condition delta to the empire row itself AND every non-
 * constructing building, then recomputes each building's status from its
 * new condition. Positive delta = recovery, negative = decay. Buildings
 * floor at DECAY_CONFIG.conditionFloorPct — they degrade, they never get
 * deleted (spec 17: "buildings should not simply disappear"). */
export function applyConditionDelta(empireId: string, deltaPct: number): void {
  const floor = DECAY_CONFIG.conditionFloorPct;
  setAllBuildingsCondition(empireId, deltaPct, floor, 100);
  const buildings = listBuildings(empireId).filter((b) => b.status !== "CONSTRUCTING");
  for (const b of buildings) {
    const status = statusForCondition(b.condition_pct, false) as BuildingStatus;
    if (status !== b.status) {
      db.prepare("UPDATE building_instances SET status = ? WHERE id = ?").run(status, b.id);
    }
  }
}
