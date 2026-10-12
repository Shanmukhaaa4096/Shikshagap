import { NextResponse } from "next/server";
import { reportQuestion } from "@/lib/db/questionMemory";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questionId, reason } = body;
    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    const result = await reportQuestion(questionId, reason);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
