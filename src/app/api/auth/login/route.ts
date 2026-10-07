import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, recordFailedLogin, resetLoginAttempts, verifyCredentials } from "@/lib/auth/users";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const body = await req.json().catch(() => null);

    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "Invalid request payload. Email and password are required." },
        { status: 400 }
      );
    }

    const { email, password } = body;
    const rateLimitKey = `${ip}:${email.toLowerCase().trim()}`;
    const rateCheck = checkRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please wait ${rateCheck.remainingSeconds || 900} seconds before retrying.`,
        },
        { status: 429 }
      );
    }

    const user = await verifyCredentials(email, password);

    if (!user) {
      recordFailedLogin(rateLimitKey);
      // Generic message to avoid email enumeration
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    resetLoginAttempts(rateLimitKey);
    await setSessionCookie(user);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        classId: user.classId,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
