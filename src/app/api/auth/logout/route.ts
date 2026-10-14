import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getServerSession } from "@/lib/auth/session";
import { logAuditEvent, hashIp } from "@/lib/server/store";
import { getClientIp } from "@/lib/server/security";
import { guardRequest, createGuardResponse } from "@/lib/server/guard";

export async function POST(req: NextRequest) {
  const guard = await guardRequest(req, { route: "/api/auth/logout" });
  if (!guard.ok) {
    return createGuardResponse(guard);
  }

  const session = await getServerSession();
  const ip = getClientIp(req);
  
  if (session) {
    logAuditEvent({
      userId: session.user.id,
      userRole: session.user.role,
      schoolId: session.user.schoolId,
      action: "logout",
      ipHash: hashIp(ip),
      details: "User initiated session termination",
    });
  }

  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
