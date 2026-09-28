import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api-helpers";
import { deleteScheduleEntry } from "@/lib/db/repo/schedule";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    deleteScheduleEntry(params.id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
