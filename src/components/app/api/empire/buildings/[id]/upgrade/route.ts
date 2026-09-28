import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError, ApiError } from "@/lib/api-helpers";
import { getEmpireByUserId, listBuildings } from "@/lib/db/repo/empire";
import { BuildingService } from "@/game-engine/services/BuildingService";
import { mapBuilding } from "@/lib/mappers";

/** Manual upgrade action (spec 22/31: "users should be able to upgrade
 * existing buildings"). Server re-validates the Empire XP + Town Hall
 * requirement from BUILDING_CONFIG — the client only triggers the intent,
 * it never supplies the resulting level (spec 35/36). */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const empire = getEmpireByUserId(user.id);
    if (!empire) throw new ApiError(404, "Empire not found.");

    const ok = BuildingService.tryUpgrade(empire.id, params.id, empire.empire_xp, empire.town_hall_level);
    if (!ok) throw new ApiError(400, "This building can't be upgraded yet — check its Empire XP and Town Hall requirements.");

    const building = listBuildings(empire.id).find((b) => b.id === params.id)!;
    return NextResponse.json({ building: mapBuilding(building) });
  } catch (err) {
    return jsonError(err);
  }
}
