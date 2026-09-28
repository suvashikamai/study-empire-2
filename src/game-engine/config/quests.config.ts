// Daily quest templates (spec section 27). QuestService picks a rotating
// subset of these each day per user, seeded by date + userId so the set is
// stable across requests within a day but varies day to day.

export interface QuestTemplate {
  key: string;
  label: string;
  target: number; // interpreted per `metric`
  metric: "MINUTES_STUDIED" | "SESSIONS_COMPLETED" | "TOPICS_COMPLETED" | "SCHEDULE_ADHERENCE";
  xpReward: number;
  empirePointsReward: number;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  { key: "study_60", label: "Study for 60 minutes", target: 60, metric: "MINUTES_STUDIED", xpReward: 500, empirePointsReward: 100 },
  { key: "study_120", label: "Study for 120 minutes", target: 120, metric: "MINUTES_STUDIED", xpReward: 900, empirePointsReward: 180 },
  { key: "complete_topic", label: "Complete a topic", target: 1, metric: "TOPICS_COMPLETED", xpReward: 400, empirePointsReward: 90 },
  { key: "two_sessions", label: "Complete 2 focus sessions", target: 2, metric: "SESSIONS_COMPLETED", xpReward: 450, empirePointsReward: 90 },
  { key: "stay_on_schedule", label: "Maintain your planned schedule", target: 1, metric: "SCHEDULE_ADHERENCE", xpReward: 350, empirePointsReward: 70 },
];

/** Deterministic pick of `count` quests for a given user+date, so the same
 * day always shows the same missions on refresh. */
export function pickDailyQuests(userId: string, dateKey: string, count = 3): QuestTemplate[] {
  const seed = hashString(`${userId}:${dateKey}`);
  const pool = [...QUEST_TEMPLATES];
  const picked: QuestTemplate[] = [];
  let s = seed;
  while (picked.length < Math.min(count, pool.length)) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const idx = s % pool.length;
    const [item] = pool.splice(idx, 1);
    picked.push(item);
  }
  return picked;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}
