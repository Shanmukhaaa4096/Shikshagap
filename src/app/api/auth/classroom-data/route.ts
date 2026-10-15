/**
 * src/app/api/auth/classroom-data/route.ts
 *
 * Secure, server-verified persistence and retrieval for teacher classroom progress.
 * Strictly derives teacher identity from authenticated session to guarantee data isolation.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { saveTeacherClassData, loadTeacherClassData } from "@/lib/auth/accountStore";
import { guardRequest, createGuardResponse } from "@/lib/server/guard";

export async function GET(req: NextRequest) {
  const guard = await guardRequest(req, { route: "/api/auth/classroom-data" });
  if (!guard.ok) return createGuardResponse(guard);

  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId") || "class_5a";

  const data = await loadTeacherClassData(session.user.id, classId);
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await guardRequest(req, { route: "/api/auth/classroom-data" });
  if (!guard.ok) return createGuardResponse(guard);

  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.classId || !body.data) {
    return NextResponse.json(
      { error: "Invalid payload. classId and data are required." },
      { status: 400 }
    );
  }

  await saveTeacherClassData(session.user.id, body.classId, body.data);
  return NextResponse.json({ success: true, message: "Classroom data saved securely." });
}
