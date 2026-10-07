import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getServerSession } from "@/lib/auth/session";
import { logAuditEvent, hashIp } from "@/lib/server/store";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  
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
