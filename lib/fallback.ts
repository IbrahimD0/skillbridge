import type { SkillSet, Annotation, AnalysisResult, TweaksResult } from "./types";
import taxonomy from "../data/skills-taxonomy.json";
import jobsData from "../data/jobs.json";
import { computeCategoryScores, computeOverallScore } from "./scoring";

type TaxonomyCategory = keyof typeof taxonomy;

const BULLET_PATTERN = /^[\-\*\u2022\u2023\u25E6\u25AA]\s|^\d+[\.\)]\s/;

function isBulletLine(line: string): boolean {
  return BULLET_PATTERN.test(line.trim());
}

function stripBulletPrefix(line: string): string {
  return line.trim().replace(/^[\-\*\u2022\u2023\u25E6\u25AA]\s+|^\d+[\.\)]\s+/, "");
}

function matchSkillInText(text: string, name: string, aliases: string[]): boolean {
  const lower = text.toLowerCase();
  const candidates = [name, ...aliases];
  return candidates.some((c) => {
    const pattern = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return pattern.test(lower);
  });
}

export function extractSkillsFallback(resumeText: string): SkillSet {
  const skills: SkillSet = {
    languages: [],
    frameworks: [],
    cloud: [],
    tools: [],
    ml_ai: [],
    databases: [],
    soft_skills: [],
  };

  const categories: TaxonomyCategory[] = ["languages", "frameworks", "cloud", "tools", "ml_ai", "databases", "soft_skills"];

  for (const category of categories) {
    const entries = taxonomy[category];
    for (const entry of entries) {
      if (matchSkillInText(resumeText, entry.name, entry.aliases)) {
        skills[category].push(entry.name);
      }
    }
  }

  return skills;
}

export function extractExperienceYears(resumeText: string): number {
  const yearPatterns = [
    /(\d{4})\s*[-–]\s*present/gi,
    /(\d{4})\s*[-–]\s*(\d{4})/g,
  ];

  const years: number[] = [];
  for (const pattern of yearPatterns) {
    let match;
    while ((match = pattern.exec(resumeText)) !== null) {
      years.push(parseInt(match[1]));
      if (match[2]) years.push(parseInt(match[2]));
    }
  }

  if (years.length < 2) return 0;
  const earliest = Math.min(...years);
  const latest = Math.max(...years);
  return latest > 2000 ? latest - earliest : 0;
}

export function extractEducationLevel(resumeText: string): string {
  const lower = resumeText.toLowerCase();
  if (lower.includes("ph.d") || lower.includes("phd") || lower.includes("doctorate")) return "phd";
  if (lower.includes("master") || lower.includes("m.s.") || lower.includes("m.sc")) return "masters";
  if (lower.includes("bachelor") || lower.includes("b.s.") || lower.includes("b.sc")) return "bachelors";
  return "unknown";
}

export function extractJobTitles(resumeText: string): string[] {
  const titleKeywords = "Engineer|Developer|Analyst|Scientist|Architect|Lead|Manager|Intern|Assistant|Researcher|Designer|Administrator|Consultant|Specialist";
  const titlePatterns = [
    new RegExp(`(?:^|\\n)\\s*([\\w\\s]+(?:${titleKeywords}))\\s*[|,\\-–—]`, "gim"),
    new RegExp(`(?:^|\\n)\\s*([\\w\\s]+(?:${titleKeywords}))\\s+at\\s`, "gim"),
    new RegExp(`(?:^|\\n)\\s*([\\w\\s]+(?:${titleKeywords}))\\s*$`, "gim"),
  ];

  const titles: string[] = [];
  for (const pattern of titlePatterns) {
    let match;
    while ((match = pattern.exec(resumeText)) !== null) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 50 && !titles.includes(title)) {
        titles.push(title);
      }
    }
  }

  return titles.length > 0 ? titles : ["Software Engineer"];
}

function getTopRequiredSkills(): string[] {
  const freqMap: Record<string, number> = {};
  for (const job of jobsData) {
    for (const skill of job.required) {
      const key = skill.toLowerCase();
      freqMap[key] = (freqMap[key] || 0) + 1;
    }
  }
  return Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([skill]) => skill);
}

export function generateAnnotationsFallback(resumeText: string, skills: SkillSet): Annotation[] {
  const lines = resumeText.split("\n").filter((l) => l.trim().length > 0);
  const annotations: Annotation[] = [];
  const metricPattern = /\d+[%xX]|\d+\+|\d+,\d+|\$\d+|\d+K|\d+M/;
  const topSkills = getTopRequiredSkills();
  const actionVerbs = [
    "built", "developed", "designed", "implemented", "created", "led",
    "managed", "optimized", "reduced", "increased", "improved", "deployed",
    "automated", "architected", "migrated", "integrated", "launched", "conducted",
    "published", "collaborated", "participated", "assisted", "worked",
    "established", "maintained", "configured", "orchestrated", "scaled",
    "refactored", "streamlined", "achieved",
  ];

  const flatSkills = [
    ...skills.languages, ...skills.frameworks, ...skills.cloud,
    ...skills.tools, ...skills.ml_ai, ...skills.databases,
  ].map((s) => s.toLowerCase());

  for (const line of lines) {
    const trimmed = line.trim();
    if (!isBulletLine(trimmed)) continue;

    const content = stripBulletPrefix(trimmed);

    if (metricPattern.test(content)) {
      annotations.push({
        line_text: trimmed,
        type: "strong",
        feedback: "Contains quantified metrics. This demonstrates measurable impact and is valued by hiring managers.",
      });
    } else {
      const firstWord = content.split(" ")[0]?.toLowerCase();

      if (actionVerbs.includes(firstWord)) {
        annotations.push({
          line_text: trimmed,
          type: "improve",
          feedback: "Good action verb, but no quantified outcome. Add metrics like percentages, counts, or timeframes to strengthen this bullet.",
        });
      } else {
        annotations.push({
          line_text: trimmed,
          type: "neutral",
          feedback: "Consider starting with a strong action verb (e.g., Built, Designed, Implemented) and adding a measurable outcome.",
        });
      }
    }
  }

  // Check skills line for missing high-frequency keywords
  const skillsSectionMatch = resumeText.match(/skills[\s\S]*$/im);
  if (skillsSectionMatch) {
    const missingTopSkills = topSkills.filter((s) => !flatSkills.includes(s));
    if (missingTopSkills.length > 0) {
      const skillsLine = skillsSectionMatch[0].split("\n").find((l) => l.trim().length > 10);
      if (skillsLine) {
        annotations.push({
          line_text: skillsLine.trim(),
          type: "gap",
          feedback: `Missing high-demand skills: ${missingTopSkills.slice(0, 5).join(", ")}. These appear frequently in target job postings.`,
        });
      }
    }
  }

  return annotations;
}

export function generateSummaryFallback(annotations: Annotation[], skillCount: number): string {
  const strong = annotations.filter((a) => a.type === "strong").length;
  const improve = annotations.filter((a) => a.type === "improve").length;
  const gaps = annotations.filter((a) => a.type === "gap").length;

  return `Your resume has ${strong} strong point${strong !== 1 ? "s" : ""} with quantified impact, ${improve} area${improve !== 1 ? "s" : ""} that could be strengthened with metrics, and ${gaps} skill gap${gaps !== 1 ? "s" : ""} relative to target roles. ${skillCount} relevant technical skills were detected across your resume.`;
}

export function analyzeFallback(resumeText: string): AnalysisResult {
  const skills = extractSkillsFallback(resumeText);
  const jobTitles = extractJobTitles(resumeText);
  const annotations = generateAnnotationsFallback(resumeText, skills);
  const allSkills = [
    ...skills.languages, ...skills.frameworks, ...skills.cloud,
    ...skills.tools, ...skills.ml_ai, ...skills.databases,
  ];
  const categoryScores = computeCategoryScores(resumeText, skills, jobTitles);
  const overallScore = computeOverallScore(categoryScores);
  const summary = generateSummaryFallback(annotations, allSkills.length);

  return {
    skills,
    experience_years: extractExperienceYears(resumeText),
    education_level: extractEducationLevel(resumeText),
    job_titles: jobTitles,
    annotations,
    summary,
    overall_score: overallScore,
    category_scores: categoryScores,
    fallbackUsed: true,
  };
}

export function generateTweaksFallback(
  missingSkills: string[],
  resumeText: string
): TweaksResult {
  const tweaks: string[] = [];

  // Suggest adding top missing skills
  for (const skill of missingSkills.slice(0, 2)) {
    tweaks.push(`Add "${skill}" to your skills section if you have any experience with it, even from coursework or personal projects.`);
  }

  // Find weakest bullet (no metrics, longest = most "wasted space")
  const bullets = resumeText.split("\n").filter((l) => isBulletLine(l.trim()));
  const metricPattern = /\d+[%xX]|\d+\+|\d+,\d+|\$\d+|\d+K|\d+M/;
  const bulletsWithoutMetrics = bullets.filter((b) => !metricPattern.test(b));

  if (bulletsWithoutMetrics.length > 0) {
    const weakest = bulletsWithoutMetrics.sort((a, b) => b.length - a.length)[0];
    const preview = stripBulletPrefix(weakest).slice(0, 60);
    tweaks.push(`Strengthen your bullet "${preview}..." by adding a measurable outcome (e.g., "reduced latency by 40%" or "serving 2M+ daily requests").`);
  }

  // Check if experience section mentions cloud/infra keywords
  const lowerResume = resumeText.toLowerCase();
  if (missingSkills.some((s) => ["Kubernetes", "Terraform", "Docker", "AWS", "GCP", "Azure"].includes(s))) {
    if (!/cloud|infrastructure|deploy|container/i.test(lowerResume)) {
      tweaks.push("Add cloud infrastructure context to your experience bullets -- mention specific services, deployment targets, or infrastructure scale.");
    }
  }

  tweaks.push("Reorder your skills section to lead with the most relevant skills for this specific role.");

  return { tweaks: tweaks.slice(0, 5), fallbackUsed: true };
}
