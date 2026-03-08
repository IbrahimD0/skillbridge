import type { SkillSet, JobPosting, JobMatch, CategoryScores } from "./types";
import jobsData from "../data/jobs.json";
import taxonomy from "../data/skills-taxonomy.json";

const CATEGORY_WEIGHTS = {
  impact: 0.25,
  keywords: 0.25,
  relevance: 0.2,
  formatting: 0.15,
  depth: 0.15,
};

const ACTION_VERBS = [
  "built", "developed", "designed", "implemented", "created", "led",
  "managed", "optimized", "reduced", "increased", "improved", "deployed",
  "automated", "architected", "migrated", "integrated", "launched",
  "established", "maintained", "configured", "orchestrated", "scaled",
  "refactored", "streamlined", "conducted", "published", "achieved",
];

const BULLET_PATTERN = /^[\-\*\u2022\u2023\u25E6\u25AA]\s|^\d+[\.\)]\s/;

function isBulletLine(line: string): boolean {
  return BULLET_PATTERN.test(line.trim());
}

const DEPTH_SIGNALS = [
  "Kubernetes", "Terraform", "Prometheus", "Grafana", "Ansible",
  "CI/CD", "Docker", "Kafka", "ElasticSearch", "Jenkins",
  "GitHub Actions", "Datadog", "Splunk", "Nginx", "MLflow",
  "infrastructure as code", "microservices", "distributed systems",
];

function flattenSkills(skills: SkillSet): string[] {
  return [
    ...skills.languages,
    ...skills.frameworks,
    ...skills.cloud,
    ...skills.tools,
    ...skills.ml_ai,
    ...skills.databases,
    ...skills.soft_skills,
  ];
}

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim();
}

// Build alias -> canonical name lookup from taxonomy
const aliasToCanonical: Record<string, string> = {};
for (const category of Object.values(taxonomy)) {
  for (const entry of category) {
    const canonical = entry.name.toLowerCase();
    aliasToCanonical[canonical] = canonical;
    for (const alias of entry.aliases) {
      aliasToCanonical[alias.toLowerCase()] = canonical;
    }
  }
}

function resolveSkill(skill: string): string {
  const norm = normalizeSkill(skill);
  return aliasToCanonical[norm] || norm;
}

function skillsMatch(userSkill: string, targetSkill: string): boolean {
  return resolveSkill(userSkill) === resolveSkill(targetSkill);
}

function findMatchingSkills(userSkills: string[], targetSkills: string[]): { matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];

  for (const target of targetSkills) {
    const found = userSkills.some((s) => skillsMatch(s, target));
    if (found) {
      matched.push(target);
    } else {
      missing.push(target);
    }
  }

  return { matched, missing };
}

export function computeMatchScore(userSkills: string[], job: JobPosting): JobMatch {
  const requiredResult = findMatchingSkills(userSkills, job.required);
  const preferredResult = findMatchingSkills(userSkills, job.preferred);

  const requiredRatio = job.required.length > 0
    ? requiredResult.matched.length / job.required.length
    : 1;
  const preferredRatio = job.preferred.length > 0
    ? preferredResult.matched.length / job.preferred.length
    : 1;

  const matchScore = Math.min(100, Math.round((requiredRatio * 0.7 + preferredRatio * 0.3) * 100));

  return {
    ...job,
    matchScore,
    matchedSkills: requiredResult.matched,
    missingSkills: requiredResult.missing,
    matchedPreferred: preferredResult.matched,
    missingPreferred: preferredResult.missing,
  };
}

export function computeAllMatches(userSkills: SkillSet): JobMatch[] {
  const flat = flattenSkills(userSkills);
  const jobs = jobsData as JobPosting[];
  return jobs
    .map((job) => computeMatchScore(flat, job))
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function computeImpactScore(resumeText: string): number {
  const lines = resumeText.split("\n").filter((l) => isBulletLine(l.trim()));
  if (lines.length === 0) return 0;

  const metricPattern = /\d+[%xX]|\d+\+|\d+,\d+|\$\d+|\d+K|\d+M/;
  const withMetrics = lines.filter((l) => metricPattern.test(l)).length;
  const metricRatio = withMetrics / lines.length;

  // Curved scoring: most real resumes have <10% metric bullets
  // 0% → 0, 20% → 40, 35% → 65, 50% → 85, 65%+ → 100
  const curved = Math.min(100, Math.round(metricRatio * 160));

  // Small bonus for action verbs on non-metric bullets (max +10)
  const nonMetricBullets = lines.filter((l) => !metricPattern.test(l));
  const withVerbs = nonMetricBullets.filter((b) => {
    const firstWord = b.trim().replace(/^[\-\*\u2022\u2023\u25E6\u25AA]\s+|^\d+[\.\)]\s+/, "").split(" ")[0]?.toLowerCase();
    return ACTION_VERBS.includes(firstWord);
  }).length;
  const verbBonus = nonMetricBullets.length > 0
    ? Math.round((withVerbs / nonMetricBullets.length) * 10)
    : 0;

  return Math.min(100, curved + verbBonus);
}

export function computeKeywordScore(userSkills: SkillSet): number {
  const jobs = jobsData as JobPosting[];
  const freqMap: Record<string, number> = {};
  for (const job of jobs) {
    for (const skill of job.required) {
      const key = resolveSkill(skill);
      freqMap[key] = (freqMap[key] || 0) + 1;
    }
  }

  const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
  const top25 = sorted.slice(0, 25).map(([skill]) => skill);

  const flat = flattenSkills(userSkills).map((s) => resolveSkill(s));
  const matches = top25.filter((skill) => flat.includes(skill)).length;
  const denominator = Math.min(20, top25.length);
  return Math.min(100, Math.round((matches / denominator) * 100));
}

export function computeRelevanceScore(resumeText: string, jobTitles: string[]): number {
  let score = 0;
  const lower = resumeText.toLowerCase();

  const titleFamilies: Record<string, string[]> = {
    "software engineer": ["software engineer", "swe", "developer", "software developer"],
    "cloud engineer": ["cloud", "infrastructure", "devops", "sre", "platform"],
    "ml engineer": ["machine learning", "ml", "ai", "data scientist", "deep learning"],
    "backend engineer": ["backend", "back-end", "server", "api"],
    "full stack": ["full stack", "fullstack", "full-stack", "frontend", "front-end"],
  };

  for (const title of jobTitles) {
    const normalTitle = title.toLowerCase();
    for (const [, keywords] of Object.entries(titleFamilies)) {
      if (keywords.some((k) => normalTitle.includes(k))) {
        score += 20;
        break;
      }
    }
  }

  const domainKeywords = [
    "infrastructure", "frontend", "backend", "api", "cloud", "ml",
    "data", "security", "web", "deploy", "pipeline", "database",
    "server", "monitor", "automat", "scalab", "distributed",
  ];
  for (const kw of domainKeywords) {
    if (lower.includes(kw)) score += 5;
  }

  return Math.min(100, score);
}

export function computeFormattingScore(resumeText: string): number {
  let score = 0;
  const lower = resumeText.toLowerCase();

  const hasSections = ["education", "experience", "skills"].every((s) => lower.includes(s));
  if (hasSections) score += 30;

  const bullets = resumeText.split("\n").filter((l) => isBulletLine(l.trim()));
  if (bullets.length > 0) {
    const startsWithVerb = bullets.filter((b) => {
      const firstWord = b.trim().replace(/^[\-\*\u2022\u2023\u25E6\u25AA]\s+|^\d+[\.\)]\s+/, "").split(" ")[0]?.toLowerCase();
      return ACTION_VERBS.includes(firstWord);
    });
    if (startsWithVerb.length / bullets.length > 0.5) score += 20;

    const lengths = bullets.map((b) => b.length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
    if (Math.sqrt(variance) < avg * 0.6) score += 20;
  }

  const lines = resumeText.split("\n");
  const longLines = lines.filter((l) => l.length > 200);
  if (longLines.length < lines.length * 0.1) score += 30;

  return Math.min(100, score);
}

export function computeDepthScore(userSkills: SkillSet, resumeText?: string): number {
  const flat = flattenSkills(userSkills).map(normalizeSkill);
  const lower = (resumeText || "").toLowerCase();

  const matches = DEPTH_SIGNALS.filter((signal) => {
    const norm = normalizeSkill(signal);
    // Check both extracted skills and raw resume text
    return flat.some((s) => s === norm) || lower.includes(norm);
  }).length;

  // 6 depth signals = expert-level infrastructure knowledge
  return Math.min(100, Math.round((matches / 6) * 100));
}

export function computeCategoryScores(
  resumeText: string,
  skills: SkillSet,
  jobTitles: string[]
): CategoryScores {
  return {
    impact: computeImpactScore(resumeText),
    keywords: computeKeywordScore(skills),
    relevance: computeRelevanceScore(resumeText, jobTitles),
    formatting: computeFormattingScore(resumeText),
    depth: computeDepthScore(skills, resumeText),
  };
}

export function computeOverallScore(categories: CategoryScores): number {
  return Math.round(
    categories.impact * CATEGORY_WEIGHTS.impact +
    categories.keywords * CATEGORY_WEIGHTS.keywords +
    categories.relevance * CATEGORY_WEIGHTS.relevance +
    categories.formatting * CATEGORY_WEIGHTS.formatting +
    categories.depth * CATEGORY_WEIGHTS.depth
  );
}
