import { NextRequest, NextResponse } from "next/server";
import { runMemoryUpkeep } from "@/lib/db/questionMemory";

/**
 * Step 11: Protected cron route for automated question memory upkeep.
 * Configured in vercel.json cron.
 * Secured with CRON_SECRET via Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // In production, CRON_SECRET must be set and match the request header
  if (cronSecret && cronSecret.trim().length > 0) {
    const authHeader = req.headers.get("authorization");
    const expected = `Bearer ${cronSecret}`;
    if (authHeader !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runMemoryUpkeep(5000);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    console.error("[MemoryUpkeepError]", err);
    return NextResponse.json(
      { error: "Internal server error during memory upkeep" },
      { status: 500 }
    );
  }
}
