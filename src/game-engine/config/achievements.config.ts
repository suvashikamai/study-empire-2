// Achievement definitions (spec section 25). Purely data — AchievementService
// evaluates each user against this list; adding an achievement never touches
// service code.

export type AchievementCriteria =
  | { type: "SESSIONS_COMPLETED"; count: number }
  | { type: "STREAK_DAYS"; days: number }
  | { type: "HOURS_STUDIED"; hours: number }
  | { type: "BUILDING_CONSTRUCTED"; buildingType: string }
  | { type: "ANY_BUILDING_CONSTRUCTED" }
  | { type: "TOWN_HALL_LEVEL"; level: number };

export interface AchievementConfig {
  key: string;
  name: string;
  description: string;
  icon: string;
  criteria: AchievementCriteria;
}

export const ACHIEVEMENTS: AchievementConfig[] = [
  { key: "first_session", name: "First Study Session", description: "Complete your first focus session.", icon: "play", criteria: { type: "SESSIONS_COMPLETED", count: 1 } },
  { key: "scholar_7", name: "7 Day Scholar", description: "Maintain a 7-day study streak.", icon: "flame", criteria: { type: "STREAK_DAYS", days: 7 } },
  { key: "scholar_30", name: "30 Day Scholar", description: "Maintain a 30-day study streak.", icon: "flame", criteria: { type: "STREAK_DAYS", days: 30 } },
  { key: "century_streak", name: "Century Streak", description: "Maintain a 100-day study streak.", icon: "flame", criteria: { type: "STREAK_DAYS", days: 100 } },
  { key: "hours_100", name: "100 Hours Studied", description: "Reach 100 total hours of study time.", icon: "clock", criteria: { type: "HOURS_STUDIED", hours: 100 } },
  { key: "hours_500", name: "500 Hours Studied", description: "Reach 500 total hours of study time.", icon: "clock", criteria: { type: "HOURS_STUDIED", hours: 500 } },
  { key: "study_legend", name: "Study Legend", description: "Reach 1000 total hours of study time.", icon: "crown", criteria: { type: "HOURS_STUDIED", hours: 1000 } },
  { key: "first_building", name: "First Building", description: "Construct your first building.", icon: "hammer", criteria: { type: "ANY_BUILDING_CONSTRUCTED" } },
  { key: "first_university", name: "First University", description: "Construct a University.", icon: "graduation-cap", criteria: { type: "BUILDING_CONSTRUCTED", buildingType: "university" } },
  { key: "first_railway", name: "First Railway Station", description: "Construct a Railway Station.", icon: "train", criteria: { type: "BUILDING_CONSTRUCTED", buildingType: "railway_station" } },
  { key: "first_airport", name: "First Airport", description: "Construct an Airport.", icon: "plane", criteria: { type: "BUILDING_CONSTRUCTED", buildingType: "airport" } },
  { key: "empire_builder", name: "Empire Builder", description: "Reach Town Hall level 5.", icon: "castle", criteria: { type: "TOWN_HALL_LEVEL", level: 5 } },
  { key: "master_scholar", name: "Master Scholar", description: "Reach Town Hall level 10.", icon: "castle", criteria: { type: "TOWN_HALL_LEVEL", level: 10 } },
];
