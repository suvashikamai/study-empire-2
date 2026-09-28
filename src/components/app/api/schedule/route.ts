import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, jsonError, ApiError } from "@/lib/api-helpers";
import { createScheduleEntry, listScheduleForUser } from "@/lib/db/repo/schedule";
import { getSubject } from "@/lib/db/repo/subjects";
import { getTopic } from "@/lib/db/repo/topics";
import { mapScheduleEntry } from "@/lib/mappers";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createSchema = z
  .object({
    subjectId: z.string(),
    topicId: z.string(),
    date: z.string().optional(), // "YYYY-MM-DD", for a one-off entry
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // for a recurring entry
    startTime: z.string().regex(timeRegex, "Use 24h HH:MM"),
    endTime: z.string().regex(timeRegex, "Use 24h HH:MM"),
    recurring: z.boolean(),
  })
  .refine((v) => v.startTime < v.endTime, { message: "End time must be after start time" });

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ entries: listScheduleForUser(user.id).map(mapScheduleEntry) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
    const { subjectId, topicId } = parsed.data;
    if (!getSubject(subjectId, user.id)) throw new ApiError(404, "Subject not found.");
    if (!getTopic(topicId, user.id)) throw new ApiError(404, "Topic not found.");

    const entry = createScheduleEntry(user.id, {
      subjectId,
      topicId,
      date: parsed.data.recurring ? null : parsed.data.date ?? null,
      daysOfWeek: parsed.data.recurring ? parsed.data.daysOfWeek ?? [] : null,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      recurring: parsed.data.recurring,
    });
    return NextResponse.json({ entry: mapScheduleEntry(entry) }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
