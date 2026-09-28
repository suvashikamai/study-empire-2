import type { SubjectRow } from "./db/repo/subjects";
import type { TopicRow } from "./db/repo/topics";
import type { ScheduleEntryRow } from "./db/repo/schedule";
import type { EmpireRow, BuildingInstanceRow } from "./db/repo/empire";
import { getSubjectStats } from "./db/repo/subjects";
import { getSubject } from "./db/repo/subjects";
import { getTopic } from "./db/repo/topics";
import { getTownHallLevelConfig } from "@/game-engine/config/townhall.config";
import { getBuildingLevelConfig, BUILDING_CONFIG } from "@/game-engine/config/buildings.config";
import { resolveAssetPath } from "@/game-engine/config/assets.config";
import { TownHallService } from "@/game-engine/services/TownHallService";
import type { Subject, Topic, ScheduleEntry, EmpireDTO, BuildingInstanceDTO } from "@/types";

export function mapSubject(row: SubjectRow): Subject {
  const stats = getSubjectStats(row.id);
  const progressPct = row.target_hours > 0 ? Math.min(100, Math.round((stats.completedMinutes / 60 / row.target_hours) * 100)) : 0;
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    description: row.description,
    targetHours: row.target_hours,
    archived: !!row.archived,
    completedHours: Math.round((stats.completedMinutes / 60) * 10) / 10,
    progressPct,
    xpEarned: stats.xpEarned,
    topicCount: stats.topicCount,
  };
}

export function mapTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    description: row.description,
    targetMinutes: row.target_minutes,
    completedMinutes: row.completed_minutes,
    priority: row.priority,
    difficulty: row.difficulty,
    completed: !!row.completed,
    progressPct: row.target_minutes > 0 ? Math.min(100, Math.round((row.completed_minutes / row.target_minutes) * 100)) : 0,
    order: row.sort_order,
  };
}

export function mapScheduleEntry(row: ScheduleEntryRow): ScheduleEntry {
  const subject = getSubject(row.subject_id, row.user_id);
  const topic = getTopic(row.topic_id, row.user_id);
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: subject?.name ?? "Unknown",
    subjectColor: subject?.color ?? "#22e07a",
    topicId: row.topic_id,
    topicName: topic?.name ?? "Unknown",
    date: row.date,
    daysOfWeek: row.days_of_week ? JSON.parse(row.days_of_week) : null,
    startTime: row.start_time,
    endTime: row.end_time,
    recurring: !!row.recurring,
  };
}

export function mapBuilding(row: BuildingInstanceRow): BuildingInstanceDTO {
  const typeConfig = BUILDING_CONFIG[row.building_type];
  const levelConfig = getBuildingLevelConfig(row.building_type, row.level);
  return {
    id: row.id,
    buildingType: row.building_type,
    buildingName: levelConfig?.name ?? typeConfig?.displayName ?? row.building_type,
    level: row.level,
    status: row.status,
    constructionPoints: row.construction_points,
    constructionPointsRequired: row.construction_points_required,
    progressPct: Math.round((row.construction_points / row.construction_points_required) * 100),
    conditionPct: Math.round(row.condition_pct),
    visualAsset: resolveAssetPath(row.building_type),
    positionX: row.position_x,
    positionY: row.position_y,
  };
}

export function mapEmpire(row: EmpireRow, buildings: BuildingInstanceRow[]): EmpireDTO {
  const cfg = getTownHallLevelConfig(row.town_hall_level);
  const rating = TownHallService.computeEmpireRating(row.condition_pct, row.population, cfg.populationCap);
  return {
    townHallLevel: row.town_hall_level,
    townHallName: cfg.name,
    empireXp: row.empire_xp,
    empireXpForNextLevel: getTownHallLevelConfig(row.town_hall_level + 1).empireXpRequired,
    population: row.population,
    populationCap: cfg.populationCap,
    conditionPct: Math.round(row.condition_pct),
    empireRatingPct: rating,
    buildings: buildings.map(mapBuilding),
  };
}
