import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisMode } from "@/lib/types";

const INTERVIEW_PROMPT = `You are a technical interview coach. Based on the candidate's skills and target role, generate 5 technical interview questions they should prepare for.

Mix question types:
- 2 questions on skills they HAVE (to test depth)
- 2 questions on skills they're MISSING (to expose gaps they should study)
- 1 behavioral/system design question relevant to the role

For each question, provide a brief hint on what a good answer covers.

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "The actual interview question",
      "category": "technical" | "behavioral" | "system-design",
      "targetSkill": "Kubernetes",
      "difficulty": "medium",
      "hint": "A good answer should cover X, Y, and Z",
      "isGapQuestion": false
    }
  ]
}

Do not include any text outside the JSON.`;

const MATCHED_TEMPLATES = [
  { q: `Explain how you've used {skill} in a production environment. What challenges did you face?`, hint: `Discuss a specific project, the problem you solved, trade-offs you made, and measurable outcomes.`, difficulty: "medium" },
  { q: `Describe the most challenging bug you encountered while working with {skill}. How did you debug it?`, hint: `Walk through your debugging process, tools you used, root cause, and what you learned.`, difficulty: "hard" },
  { q: `How would you optimize a {skill} application for performance? Walk me through your approach.`, hint: `Mention profiling, bottleneck identification, specific optimization techniques, and how you'd measure improvement.`, difficulty: "hard" },
  { q: `Compare {skill} with an alternative you've used. When would you choose each?`, hint: `Show depth by discussing trade-offs: performance, developer experience, ecosystem, and use-case fit.`, difficulty: "medium" },
];

const MISSING_TEMPLATES = [
  { q: `What do you know about {skill}? How would you approach learning it for this role?`, hint: `Show awareness of what {skill} does, where it fits in the stack, and a concrete plan to learn it.`, difficulty: "medium" },
  { q: `How does {skill} compare to tools you've already used? What problem does it solve?`, hint: `Demonstrate that you understand the category of tool and can transfer knowledge from similar tech you know.`, difficulty: "medium" },
  { q: `If you had 2 weeks to get productive with {skill}, what would your learning plan look like?`, hint: `Mention official docs, tutorials, a hands-on project, and specific milestones you'd aim for.`, difficulty: "easy" },
  { q: `Describe a scenario where {skill} would be the right choice over alternatives. Why?`, hint: `Show you understand the problem space even if you haven't used the tool directly.`, difficulty: "hard" },
];

const BEHAVIORAL_TEMPLATES = [
  { q: `Tell me about a time you had to make a technical decision under uncertainty in a {role} context.`, hint: "Use STAR format: Situation, Task, Action, Result. Focus on your reasoning process." },
  { q: `Describe a time you disagreed with a teammate on a technical approach. How did you resolve it?`, hint: "Show collaboration, active listening, and how you reached a decision. Focus on the outcome." },
  { q: `Tell me about a project that failed or didn't go as planned. What did you learn?`, hint: "Be honest about what went wrong, what you'd do differently, and how it changed your approach." },
];

function pickTemplate<T>(templates: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return templates[Math.abs(hash) % templates.length];
}

function getFallbackQuestions(matchedSkills: string[], missingSkills: string[], jobTitle: string) {
  const questions = [];

  for (const skill of matchedSkills.slice(0, 2)) {
    const tmpl = pickTemplate(MATCHED_TEMPLATES, skill);
    questions.push({
      question: tmpl.q.replace(/\{skill\}/g, skill),
      category: "technical",
      targetSkill: skill,
      difficulty: tmpl.difficulty,
      hint: tmpl.hint.replace(/\{skill\}/g, skill),
      isGapQuestion: false,
    });
  }

  for (const skill of missingSkills.slice(0, 2)) {
    const tmpl = pickTemplate(MISSING_TEMPLATES, skill);
    questions.push({
      question: tmpl.q.replace(/\{skill\}/g, skill),
      category: "technical",
      targetSkill: skill,
      difficulty: tmpl.difficulty,
      hint: tmpl.hint.replace(/\{skill\}/g, skill),
      isGapQuestion: true,
    });
  }

  const bTmpl = pickTemplate(BEHAVIORAL_TEMPLATES, jobTitle);
  questions.push({
    question: bTmpl.q.replace(/\{role\}/g, jobTitle),
    category: "behavioral",
    targetSkill: "problem-solving",
    difficulty: "medium",
    hint: bTmpl.hint,
    isGapQuestion: false,
  });

  return { questions };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const matchedSkills: string[] = body.matched_skills || [];
    const missingSkills: string[] = body.missing_skills || [];
    const jobTitle: string = body.job_title || "";
    const mode: AnalysisMode = body.mode || "fallback";

    if (mode === "fallback" || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(getFallbackQuestions(matchedSkills, missingSkills, jobTitle));
    }

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const context = `Target Role: ${jobTitle}
Skills the candidate HAS: ${matchedSkills.join(", ")}
Skills the candidate is MISSING: ${missingSkills.join(", ")}`;

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: `${INTERVIEW_PROMPT}\n\n${context}` }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const data = JSON.parse(cleaned);
      return NextResponse.json(data);
    } catch (aiError) {
      console.error("AI interview failed:", aiError);
      return NextResponse.json(getFallbackQuestions(matchedSkills, missingSkills, jobTitle));
    }
  } catch (error) {
    console.error("Interview route error:", error);
    return NextResponse.json({ error: "Failed to generate questions." }, { status: 500 });
  }
}
