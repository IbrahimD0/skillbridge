import { NextRequest, NextResponse } from "next/server";
import { analyzeWithAI } from "@/lib/ai";
import { analyzeFallback } from "@/lib/fallback";
import type { AnalysisMode } from "@/lib/types";

const MAX_RESUME_LENGTH = 5000;

const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all previous/i,
  /^system:/im,
  /^assistant:/im,
  /you are now/i,
  /disregard/i,
];

function sanitize(text: string): string {
  let sanitized = text.trim().slice(0, MAX_RESUME_LENGTH);
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[redacted]");
  }
  return sanitized;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resume: string = body.resume;
    const mode: AnalysisMode = body.mode || "fallback";

    if (!resume || typeof resume !== "string" || resume.trim().length === 0) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
    }

    const sanitized = sanitize(resume);

    if (mode === "fallback") {
      const result = analyzeFallback(sanitized);
      return NextResponse.json(result);
    }

    // AI mode with auto-fallback
    try {
      const result = await analyzeWithAI(sanitized);
      return NextResponse.json(result);
    } catch (aiError) {
      console.error("AI analysis failed, falling back to rule-based:", aiError);
      const result = analyzeFallback(sanitized);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Analyze route error:", error);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
