import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, jsonError, ApiError } from "@/lib/api-helpers";
import { deleteTopic, getTopic, updateTopic } from "@/lib/db/repo/topics";
import { mapTopic } from "@/lib/mappers";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  targetMinutes: z.number().int().min(5).max(6000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  completed: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
    const topic = updateTopic(params.id, user.id, parsed.data);
    if (!topic) throw new ApiError(404, "Topic not found.");
    return NextResponse.json({ topic: mapTopic(topic) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    deleteTopic(params.id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
