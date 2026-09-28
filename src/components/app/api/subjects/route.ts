import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, jsonError, ApiError } from "@/lib/api-helpers";
import { createSubject, listSubjects } from "@/lib/db/repo/subjects";
import { mapSubject } from "@/lib/mappers";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  description: z.string().trim().max(500).optional(),
  targetHours: z.number().min(0).max(10000).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const subjects = listSubjects(user.id).map(mapSubject);
    return NextResponse.json({ subjects });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
    const subject = createSubject(user.id, parsed.data);
    return NextResponse.json({ subject: mapSubject(subject) }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
