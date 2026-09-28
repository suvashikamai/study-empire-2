import * as QuestsRepo from "@/lib/db/repo/quests";
import { pickDailyQuests, QUEST_TEMPLATES } from "../config/quests.config";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const QuestService = {
  /** Ensures today's quest rows exist and returns them with their template
   * metadata joined in (spec 27: daily missions). */
  getToday(userId: string) {
    const dateKey = todayKey();
    const templates = pickDailyQuests(userId, dateKey, 3);
    const rows = templates.map((t) => QuestsRepo.ensureQuestRow(userId, dateKey, t.key, t.target));
    return rows.map((row, i) => ({ ...row, template: templates[i] }));
  },

  /** Called from StudyRewardService after a session completes. Increments
   * every quest whose metric this session contributes to; returns quests
   * that just flipped to completed (for reward XP + a toast). */
  recordSessionContribution(
    userId: string,
    contribution: { minutesStudied: number; sessionsCompleted: number; topicsCompleted: number; onSchedule: boolean },
  ) {
    const dateKey = todayKey();
    const templates = pickDailyQuests(userId, dateKey, 3);
    const justCompleted: { key: string; xpReward: number; empirePointsReward: number }[] = [];

    for (const t of templates) {
      QuestsRepo.ensureQuestRow(userId, dateKey, t.key, t.target);
      let amount = 0;
      if (t.metric === "MINUTES_STUDIED") amount = contribution.minutesStudied;
      if (t.metric === "SESSIONS_COMPLETED") amount = contribution.sessionsCompleted;
      if (t.metric === "TOPICS_COMPLETED") amount = contribution.topicsCompleted;
      if (t.metric === "SCHEDULE_ADHERENCE") amount = contribution.onSchedule ? 1 : 0;
      if (amount <= 0) continue;

      const before = QuestsRepo.listQuestsForDate(userId, dateKey).find((q) => q.quest_key === t.key);
      const wasCompleted = before?.completed === 1;
      const after = QuestsRepo.incrementQuestProgress(userId, dateKey, t.key, amount);
      if (!wasCompleted && after.completed === 1) {
        justCompleted.push({ key: t.key, xpReward: t.xpReward, empirePointsReward: t.empirePointsReward });
      }
    }
    return justCompleted;
  },

  templates: QUEST_TEMPLATES,
};
