import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, jsonError, ApiError } from "@/lib/api-helpers";
import { getSubject } from "@/lib/db/repo/subjects";
import { createTopic, listTopics } from "@/lib/db/repo/topics";
import { mapTopic } from "@/lib/mappers";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  targetMinutes: z.number().int().min(5).max(6000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const subject = getSubject(params.id, user.id);
    if (!subject) throw new ApiError(404, "Subject not found.");
    return NextResponse.json({ topics: listTopics(subject.id).map(mapTopic) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const subject = getSubject(params.id, user.id);
    if (!subject) throw new ApiError(404, "Subject not found.");
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
    const topic = createTopic(user.id, subject.id, parsed.data);
    return NextResponse.json({ topic: mapTopic(topic) }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
