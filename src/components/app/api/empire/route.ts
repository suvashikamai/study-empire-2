import { NextResponse } from "next/server";
import { requireUser, jsonError, ApiError } from "@/lib/api-helpers";
import { getEmpireByUserId, listBuildings } from "@/lib/db/repo/empire";
import { CityConditionService } from "@/game-engine/services/CityConditionService";
import { mapEmpire } from "@/lib/mappers";

export async function GET() {
  try {
    const user = await requireUser();
    CityConditionService.reconcile(user.id);
    const empire = getEmpireByUserId(user.id);
    if (!empire) throw new ApiError(404, "Empire not found.");
    const buildings = listBuildings(empire.id);
    return NextResponse.json({ empire: mapEmpire(empire, buildings) });
  } catch (err) {
    return jsonError(err);
  }
}
