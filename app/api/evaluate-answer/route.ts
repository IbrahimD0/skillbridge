import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const EVALUATE_PROMPT = `You are a technical interview coach evaluating a candidate's answer to an interview question.

Score the answer from 0-100 and provide specific feedback.

Return ONLY valid JSON:
{
  "score": 75,
  "strengths": ["Demonstrated understanding of X", "Good use of concrete example"],
  "weaknesses": ["Missing mention of Y", "Could be more specific about Z"],
  "suggestion": "A 1-2 sentence suggestion for improving the answer"
}

Be encouraging but honest. If the answer is empty or off-topic, score it low and explain why.
Do not include any text outside the JSON.`;

function getFallbackEvaluation(
  answer: string,
  question: string,
  targetSkill: string,
  category: string
): { score: number; strengths: string[]; weaknesses: string[]; suggestion: string } {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const lowerAnswer = answer.toLowerCase();

  if (wordCount < 5) {
    return {
      score: 10,
      strengths: [],
      weaknesses: ["Answer is too short to evaluate meaningfully"],
      suggestion: "Try to provide a more detailed response with specific examples from your experience.",
    };
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  let score = 35;

  // Length checks
  if (wordCount > 30) { strengths.push("Good level of detail"); score += 8; }
  if (wordCount > 80) { strengths.push("Thorough response"); score += 7; }

  // Relevance: does answer mention the target skill?
  if (targetSkill && lowerAnswer.includes(targetSkill.toLowerCase())) {
    strengths.push(`Directly addresses ${targetSkill}`);
    score += 10;
  } else if (targetSkill) {
    weaknesses.push(`Doesn't specifically mention ${targetSkill}`);
  }

  // Experience signals
  if (/example|project|built|implemented|used|deployed|created/i.test(answer)) {
    strengths.push("References concrete experience");
    score += 10;
  }
  if (/\d+%|\d+x|\d+ (users|requests|seconds|ms|minutes)/i.test(answer)) {
    strengths.push("Includes quantified results");
    score += 10;
  }

  // Reasoning signals
  if (/because|since|due to|in order to|the reason/i.test(answer)) {
    strengths.push("Explains reasoning clearly");
    score += 5;
  } else {
    weaknesses.push("Could explain reasoning more clearly");
  }

  // Trade-off awareness
  if (/trade-?off|alternative|compared|versus|vs|downside|limitation/i.test(answer)) {
    strengths.push("Considers trade-offs or alternatives");
    score += 5;
  } else {
    weaknesses.push("Consider discussing trade-offs or alternatives");
  }

  // Behavioral question checks (STAR format)
  if (category === "behavioral") {
    const starSignals = [
      { keyword: /situation|context|background/i, label: "Situation" },
      { keyword: /task|goal|objective|challenge/i, label: "Task" },
      { keyword: /action|decided|approach|implemented/i, label: "Action" },
      { keyword: /result|outcome|impact|learned/i, label: "Result" },
    ];
    const found = starSignals.filter((s) => s.keyword.test(answer));
    if (found.length >= 3) {
      strengths.push("Good use of STAR format");
      score += 10;
    } else if (found.length >= 1) {
      weaknesses.push(`STAR format partially used (found: ${found.map((f) => f.label).join(", ")}). Consider adding: ${starSignals.filter((s) => !s.keyword.test(answer)).map((s) => s.label).join(", ")}`);
    } else {
      weaknesses.push("Use the STAR format: describe the Situation, Task, Action, and Result");
    }
  }

  if (wordCount < 20) { weaknesses.push("Could provide more detail"); }

  return {
    score: Math.min(score, 100),
    strengths: strengths.length ? strengths : ["Attempted to answer the question"],
    weaknesses: weaknesses.length ? weaknesses : ["No major issues detected"],
    suggestion: targetSkill
      ? `Try to specifically address ${targetSkill} with concrete examples and measurable outcomes.`
      : "Try to include specific examples, quantified results, and discuss trade-offs to strengthen your answer.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question: string = body.question || "";
    const answer: string = body.answer || "";
    const targetSkill: string = body.target_skill || "";
    const category: string = body.category || "technical";
    const mode: string = body.mode || "fallback";

    if (!answer.trim()) {
      return NextResponse.json({ error: "Answer is required" }, { status: 400 });
    }

    if (mode === "fallback" || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(getFallbackEvaluation(answer, question, targetSkill, category));
    }

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const context = `Interview Question: ${question}
Target Skill: ${targetSkill}
Candidate's Answer: ${answer}`;

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: `${EVALUATE_PROMPT}\n\n${context}` }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const data = JSON.parse(cleaned);
      return NextResponse.json(data);
    } catch (aiError) {
      console.error("AI evaluation failed:", aiError);
      return NextResponse.json(getFallbackEvaluation(answer, question, targetSkill, category));
    }
  } catch (error) {
    console.error("Evaluate answer route error:", error);
    return NextResponse.json({ error: "Failed to evaluate answer." }, { status: 500 });
  }
}
