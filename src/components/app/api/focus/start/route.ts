import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, jsonError, ApiError } from "@/lib/api-helpers";
import { getTopic } from "@/lib/db/repo/topics";
import { getSubject } from "@/lib/db/repo/subjects";
import { StudyRewardService, SessionError } from "@/game-engine/services/StudyRewardService";

const startSchema = z.object({
  subjectId: z.string(),
  topicId: z.string(),
  plannedMinutes: z.number().int().min(5).max(360),
  scheduleEntryId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = startSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
    if (!getSubject(parsed.data.subjectId, user.id)) throw new ApiError(404, "Subject not found.");
    if (!getTopic(parsed.data.topicId, user.id)) throw new ApiError(404, "Topic not found.");

    try {
      const session = StudyRewardService.startSession(user.id, parsed.data);
      return NextResponse.json({ session }, { status: 201 });
    } catch (e) {
      if (e instanceof SessionError) throw new ApiError(409, e.message);
      throw e;
    }
  } catch (err) {
    return jsonError(err);
  }
}
