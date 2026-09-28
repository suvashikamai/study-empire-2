import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api-helpers";
import { getOrCreateDailyGoal } from "@/lib/db/repo/dailyGoals";
import { listScheduleForDate } from "@/lib/db/repo/schedule";
import { hasCompletedSessionForScheduleEntryToday } from "@/lib/db/repo/sessions";
import { getSubject } from "@/lib/db/repo/subjects";
import { getTopic } from "@/lib/db/repo/topics";
import { getEmpireByUserId, listBuildings } from "@/lib/db/repo/empire";
import { CityConditionService } from "@/game-engine/services/CityConditionService";
import { QuestService } from "@/game-engine/services/QuestService";
import type { DashboardDTO } from "@/types";

export async function GET() {
  try {
    const user = await requireUser();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekday = now.getDay();

    const goal = getOrCreateDailyGoal(user.id, today);
    CityConditionService.reconcile(user.id);
    const empire = getEmpireByUserId(user.id);
    const buildings = empire ? listBuildings(empire.id) : [];

    const todaysTasks = listScheduleForDate(user.id, today, weekday).map((entry) => {
      const subject = getSubject(entry.subject_id, user.id);
      const topic = getTopic(entry.topic_id, user.id);
      return {
        id: entry.id,
        topicName: topic?.name ?? "Unknown",
        subjectName: subject?.name ?? "Unknown",
        subjectColor: subject?.color ?? "#22e07a",
        startTime: entry.start_time,
        endTime: entry.end_time,
        done: hasCompletedSessionForScheduleEntryToday(entry.id, user.id, today),
      };
    });

    const quests = QuestService.getToday(user.id).map((q) => ({
      key: q.quest_key,
      label: q.template.label,
      progress: q.progress,
      target: q.target,
      completed: !!q.completed,
    }));

    const dashboard: DashboardDTO = {
      displayName: user.display_name,
      today: {
        targetMinutes: goal.target_minutes,
        completedMinutes: goal.completed_minutes,
        progressPct: goal.target_minutes > 0 ? Math.min(100, Math.round((goal.completed_minutes / goal.target_minutes) * 100)) : 0,
      },
      currentStreak: user.current_streak,
      level: user.level,
      totalXp: user.total_xp,
      empireLevel: empire?.town_hall_level ?? 1,
      todaysTasks,
      empireStatus: {
        population: empire?.population ?? 0,
        buildingCount: buildings.filter((b) => b.status !== "CONSTRUCTING").length,
        conditionPct: Math.round(empire?.condition_pct ?? 100),
      },
      quests,
    };

    return NextResponse.json(dashboard);
  } catch (err) {
    return jsonError(err);
  }
}
