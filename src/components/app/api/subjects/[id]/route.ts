import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, jsonError, ApiError } from "@/lib/api-helpers";
import { deleteSubject, getSubject, updateSubject } from "@/lib/db/repo/subjects";
import { mapSubject } from "@/lib/mappers";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  color: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  targetHours: z.number().min(0).max(10000).optional(),
  archived: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const subject = getSubject(params.id, user.id);
    if (!subject) throw new ApiError(404, "Subject not found.");
    return NextResponse.json({ subject: mapSubject(subject) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
    const subject = updateSubject(params.id, user.id, parsed.data);
    if (!subject) throw new ApiError(404, "Subject not found.");
    return NextResponse.json({ subject: mapSubject(subject) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    deleteSubject(params.id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
