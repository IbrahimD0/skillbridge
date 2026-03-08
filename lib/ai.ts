import Anthropic from "@anthropic-ai/sdk";
import type { SkillSet, Annotation, AnalysisResult, TweaksResult } from "./types";
import { computeCategoryScores, computeOverallScore } from "./scoring";

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SKILL_EXTRACTION_PROMPT = `You are a resume parser. Extract all technical skills, tools, programming languages, frameworks, cloud platforms, databases, and relevant soft skills from this resume.

Return ONLY valid JSON in this exact format:
{
  "skills": {
    "languages": ["Python", "JavaScript"],
    "frameworks": ["React", "Next.js"],
    "cloud": ["AWS", "S3"],
    "tools": ["Git", "Docker"],
    "ml_ai": ["PyTorch"],
    "databases": ["PostgreSQL"],
    "soft_skills": ["leadership"]
  },
  "experience_years": 2,
  "education_level": "masters",
  "job_titles": ["Software Engineer", "Intern"]
}

Do not include any text outside the JSON object.`;

const ANNOTATION_PROMPT = `You are a resume reviewer for software engineering roles. Analyze each bullet point in this resume.

For each notable line, assess whether it is:
- "strong": has quantified impact, relevant keywords, concrete achievements
- "improve": uses action verbs but lacks metrics or specificity
- "gap": missing critical skills or has significant weaknesses
- "neutral": informational, neither strong nor weak

Return ONLY valid JSON:
{
  "annotations": [
    {
      "line_text": "exact text from the resume line",
      "type": "strong",
      "feedback": "1-2 sentence contextual explanation"
    }
  ],
  "summary": "2-3 sentence overall assessment of the resume"
}

Only annotate bullet points (lines starting with -). Limit to the 12 most notable lines. Do not include any text outside the JSON.`;

const TWEAKS_PROMPT = `Given this resume and job posting, suggest 3-4 specific, actionable changes the candidate should make to improve their match for this role. Be concrete and reference specific lines or sections to change.

Return ONLY valid JSON:
{
  "tweaks": [
    "Specific actionable suggestion referencing the resume"
  ]
}

Do not include any text outside the JSON.`;

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

interface SkillExtractionResponse {
  skills: SkillSet;
  experience_years: number;
  education_level: string;
  job_titles: string[];
}

interface AnnotationResponse {
  annotations: Annotation[];
  summary: string;
}

export async function analyzeWithAI(resumeText: string): Promise<AnalysisResult> {
  const client = getClient();

  const [skillsResponse, annotationResponse] = await Promise.all([
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: `${SKILL_EXTRACTION_PROMPT}\n\nResume:\n${resumeText}` }],
    }),
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: `${ANNOTATION_PROMPT}\n\nResume:\n${resumeText}` }],
    }),
  ]);

  const skillsText = skillsResponse.content[0].type === "text" ? skillsResponse.content[0].text : "";
  const annotationText = annotationResponse.content[0].type === "text" ? annotationResponse.content[0].text : "";

  const skillsData = parseJSON<SkillExtractionResponse>(skillsText);
  const annotationData = parseJSON<AnnotationResponse>(annotationText);

  const categoryScores = computeCategoryScores(resumeText, skillsData.skills, skillsData.job_titles);
  const overallScore = computeOverallScore(categoryScores);

  return {
    skills: skillsData.skills,
    experience_years: skillsData.experience_years,
    education_level: skillsData.education_level,
    job_titles: skillsData.job_titles,
    annotations: annotationData.annotations,
    summary: annotationData.summary,
    overall_score: overallScore,
    category_scores: categoryScores,
    fallbackUsed: false,
  };
}

export async function generateTweaksWithAI(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  matchedSkills: string[],
  missingSkills: string[]
): Promise<TweaksResult> {
  const client = getClient();

  const context = `Job Title: ${jobTitle}
Job Description: ${jobDescription}
Skills the candidate HAS that match: ${matchedSkills.join(", ")}
Skills the candidate is MISSING: ${missingSkills.join(", ")}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: `${TWEAKS_PROMPT}\n\n${context}\n\nResume:\n${resumeText}` }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const data = parseJSON<{ tweaks: string[] }>(text);

  return { tweaks: data.tweaks.slice(0, 4), fallbackUsed: false };
}
