import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { guardRequest, createGuardResponse } from "@/lib/server/guard";

export async function GET(req: NextRequest) {
  const guard = await guardRequest(req, { route: "/api/auth/me" });
  if (!guard.ok) {
    return createGuardResponse(guard);
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
  });
}
