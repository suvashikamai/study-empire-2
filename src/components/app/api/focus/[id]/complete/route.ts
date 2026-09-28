import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, jsonError, ApiError } from "@/lib/api-helpers";
import { StudyRewardService, SessionError } from "@/game-engine/services/StudyRewardService";

const completeSchema = z.object({
  clientClaimedMinutes: z.number().min(0).max(1000),
  breaksTaken: z.number().int().min(0).max(50).default(0),
  completed: z.boolean(), // "Did you complete your study session?" Yes/No (spec 9)
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const parsed = completeSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input.");

    try {
      const result = StudyRewardService.completeSession(user.id, params.id, parsed.data);
      return NextResponse.json(result);
    } catch (e) {
      if (e instanceof SessionError) throw new ApiError(400, e.message);
      throw e;
    }
  } catch (err) {
    return jsonError(err);
  }
}
