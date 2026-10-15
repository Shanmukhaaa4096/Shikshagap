/**
 * src/app/api/auth/profile/route.ts
 *
 * GET: Retrieves authenticated teacher's profile.
 * PUT: Updates permitted profile fields (fullName, institutionName, gradesTaught, subjectsTaught, designation).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session.ts";
import { findTeacherById, updateTeacherProfile } from "@/lib/auth/accountStore.ts";
import { guardRequest, createGuardResponse } from "@/lib/server/guard.ts";

const ProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  institutionName: z.string().trim().min(2).max(150).optional(),
  gradesTaught: z.array(z.string()).min(1).optional(),
  subjectsTaught: z.array(z.string()).optional(),
  designation: z
    .enum(["teacher", "senior_teacher", "headmaster", "principal", "coordinator", "other"])
    .optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const guard = await guardRequest(req, { route: "/api/auth/profile" });
  if (!guard.ok) return createGuardResponse(guard);

  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacher = await findTeacherById(session.user.id);
  if (!teacher) {
    // Demo accounts or legacy session fallback
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        institutionName: session.user.schoolId,
        gradesTaught: session.user.gradesTaught || ["class_3", "class_4", "class_5"],
        subjectsTaught: session.user.subjectsTaught || ["Mathematics"],
        designation: session.user.designation || "teacher",
        phone: session.user.phone || "",
        phoneVerified: true,
        emailVerified: true,
        status: "active",
      },
    });
  }

  return NextResponse.json({
    user: {
      id: teacher.id,
      email: teacher.email,
      fullName: teacher.fullName,
      institutionName: teacher.institutionName,
      gradesTaught: teacher.gradesTaught,
      subjectsTaught: teacher.subjectsTaught,
      designation: teacher.designation,
      phone: teacher.phone,
      phoneVerified: teacher.phoneVerified,
      emailVerified: teacher.emailVerified,
      status: teacher.status,
      preferences: teacher.preferences,
      createdAt: teacher.createdAt,
    },
  });
}

export async function PUT(req: NextRequest) {
  const guard = await guardRequest(req, { route: "/api/auth/profile" });
  if (!guard.ok) return createGuardResponse(guard);

  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }

  const teacher = await findTeacherById(session.user.id);
  if (!teacher) {
    return NextResponse.json({ error: "Profile update not available for demo sessions." }, { status: 400 });
  }

  const updated = await updateTeacherProfile(session.user.id, parsed.data);
  return NextResponse.json({ success: true, user: updated });
}
