import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api-helpers";
import { QuestService } from "@/game-engine/services/QuestService";

export async function GET() {
  try {
    const user = await requireUser();
    const quests = QuestService.getToday(user.id).map((q) => ({
      key: q.quest_key,
      label: q.template.label,
      progress: q.progress,
      target: q.target,
      completed: !!q.completed,
      xpReward: q.template.xpReward,
      empirePointsReward: q.template.empirePointsReward,
    }));
    return NextResponse.json({ quests });
  } catch (err) {
    return jsonError(err);
  }
}
