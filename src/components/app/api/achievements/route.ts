import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api-helpers";
import { listUnlockedAchievements } from "@/lib/db/repo/achievements";
import { AchievementService } from "@/game-engine/services/AchievementService";
import type { AchievementDTO } from "@/types";

export async function GET() {
  try {
    const user = await requireUser();
    const unlocked = listUnlockedAchievements(user.id);
    const unlockedMap = new Map(unlocked.map((u) => [u.achievement_key, u.unlocked_at]));
    const achievements: AchievementDTO[] = AchievementService.all.map((a) => ({
      key: a.key,
      name: a.name,
      description: a.description,
      icon: a.icon,
      unlocked: unlockedMap.has(a.key),
      unlockedAt: unlockedMap.get(a.key) ?? null,
    }));
    return NextResponse.json({ achievements });
  } catch (err) {
    return jsonError(err);
  }
}
