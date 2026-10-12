import { NextRequest, NextResponse } from "next/server";
import { finalizeAssessment } from "@/lib/agents/orchestrator";
import type { SessionMemory } from "@/lib/types";

// Rate limiting (shared or identical to agent route: max 40 requests/min per IP)
const finishRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkFinishRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = finishRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    finishRateLimits.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  if (record.count >= 40) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    if (!checkFinishRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 65536) {
      return NextResponse.json(
        { error: "Request payload exceeds allowed limit (64KB)." },
        { status: 413 }
      );
    }

    const body = await req.json();
    const memory: SessionMemory | undefined = body?.memory;

    if (!memory || !Array.isArray(memory.topics)) {
      return NextResponse.json(
        { error: "Invalid session memory provided." },
        { status: 400 }
      );
    }

    if (memory.grade && ![3, 4, 5].includes(memory.grade)) {
      return NextResponse.json(
        { error: "Invalid grade. Only grades 3, 4, and 5 are currently enabled." },
        { status: 400 }
      );
    }

    const result = await finalizeAssessment(memory);

    return NextResponse.json({
      success: true,
      recommendations: result.recommendations,
      summary: result.summary,
    });
  } catch (error) {
    console.error("Assessment finish error:", error);
    return NextResponse.json(
      { error: "Internal server error while finalizing assessment." },
      { status: 500 }
    );
  }
}
