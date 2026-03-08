import { NextRequest, NextResponse } from "next/server";
import { generateTweaksWithAI } from "@/lib/ai";
import { generateTweaksFallback } from "@/lib/fallback";
import type { AnalysisMode } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resume: string = body.resume;
    const job = body.job;
    const missingSkills: string[] = body.missing_skills || [];
    const matchedSkills: string[] = body.matched_skills || [];
    const mode: AnalysisMode = body.mode || "fallback";

    if (!resume || !job) {
      return NextResponse.json({ error: "Resume and job are required" }, { status: 400 });
    }

    if (mode === "fallback") {
      const result = generateTweaksFallback(missingSkills, resume);
      return NextResponse.json(result);
    }

    try {
      const result = await generateTweaksWithAI(
        resume,
        job.title,
        job.description,
        matchedSkills,
        missingSkills
      );
      return NextResponse.json(result);
    } catch (aiError) {
      console.error("AI tweaks failed, falling back:", aiError);
      const result = generateTweaksFallback(missingSkills, resume);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Tweaks route error:", error);
    return NextResponse.json({ error: "Failed to generate tweaks. Please try again." }, { status: 500 });
  }
}
