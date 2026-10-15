/**
 * src/app/api/auth/account/route.ts
 *
 * DELETE: Permanently deletes teacher account, credentials, and associated classroom data
 * in compliance with India's DPDP Act 2023.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession, clearSessionCookie } from "@/lib/auth/session.ts";
import { findTeacherById, deleteTeacherAccount } from "@/lib/auth/accountStore.ts";
import { logAuditEvent, hashIp } from "@/lib/server/store.ts";
import { getClientIp } from "@/lib/server/security.ts";
import { guardRequest, createGuardResponse } from "@/lib/server/guard.ts";

const DeleteAccountSchema = z.object({
  confirmPassword: z.string().min(1, "Password confirmation is required to delete your account"),
});

export async function DELETE(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/auth/account" });
    if (!guard.ok) return createGuardResponse(guard);

    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const ipHashed = hashIp(ip);

    const body = await req.json().catch(() => null);
    const parsed = DeleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Password confirmation is required to permanently delete your account." },
        { status: 400 }
      );
    }

    const teacher = await findTeacherById(session.user.id);
    if (!teacher) {
      return NextResponse.json(
        { error: "Account deletion is not supported for standard demo accounts." },
        { status: 400 }
      );
    }

    // Verify confirmation password
    const isPasswordValid = await bcrypt.compare(parsed.data.confirmPassword, teacher.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Incorrect password. Account deletion aborted." },
        { status: 403 }
      );
    }

    // Delete account and private records
    await deleteTeacherAccount(teacher.id);

    // Invalidate session cookie
    await clearSessionCookie();

    logAuditEvent({
      userId: teacher.id,
      userRole: "teacher",
      schoolId: teacher.institutionName,
      action: "logout",
      ipHash: ipHashed,
      details: "Teacher account and associated classroom records permanently deleted under DPDP 2023",
    });

    return NextResponse.json({
      success: true,
      message: "Your account and all associated classroom data have been permanently deleted.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
