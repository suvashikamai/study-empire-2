// Shared domain types. Kept separate from Prisma's generated types because
// the API layer returns shaped/derived data (e.g. computed progress
// percentages) that isn't a 1:1 mirror of a database row.

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type BuildingStatus =
  | "CONSTRUCTING"
  | "ACTIVE"
  | "LOW_ACTIVITY"
  | "DAMAGED"
  | "ABANDONED";

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  friendCode: string;
  profileImageUrl: string | null;
  level: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyMinutes: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  targetHours: number;
  archived: boolean;
  completedHours: number;
  progressPct: number;
  xpEarned: number;
  topicCount: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string | null;
  targetMinutes: number;
  completedMinutes: number;
  priority: Priority;
  difficulty: Difficulty;
  completed: boolean;
  progressPct: number;
  order: number;
}

export interface ScheduleEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicId: string;
  topicName: string;
  date: string | null;
  daysOfWeek: number[] | null;
  startTime: string;
  endTime: string;
  recurring: boolean;
}

export interface StudySessionDTO {
  id: string;
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  plannedMinutes: number;
  actualMinutes: number;
  breaksTaken: number;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  xpAwarded: number;
  constructionPointsAwarded: number;
}

export interface EmpireDTO {
  townHallLevel: number;
  townHallName: string;
  empireXp: number;
  empireXpForNextLevel: number;
  population: number;
  populationCap: number;
  conditionPct: number;
  empireRatingPct: number;
  buildings: BuildingInstanceDTO[];
}

export interface BuildingInstanceDTO {
  id: string;
  buildingType: string;
  buildingName: string;
  level: number;
  status: BuildingStatus;
  constructionPoints: number;
  constructionPointsRequired: number;
  progressPct: number;
  conditionPct: number;
  visualAsset: string | null;
  positionX: number;
  positionY: number;
}

export interface DashboardDTO {
  displayName: string;
  today: {
    targetMinutes: number;
    completedMinutes: number;
    progressPct: number;
  };
  currentStreak: number;
  level: number;
  totalXp: number;
  empireLevel: number;
  todaysTasks: {
    id: string;
    topicName: string;
    subjectName: string;
    subjectColor: string;
    startTime: string;
    endTime: string;
    done: boolean;
  }[];
  empireStatus: {
    population: number;
    buildingCount: number;
    conditionPct: number;
  };
  quests: {
    key: string;
    label: string;
    progress: number;
    target: number;
    completed: boolean;
  }[];
}

export interface AchievementDTO {
  key: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}
