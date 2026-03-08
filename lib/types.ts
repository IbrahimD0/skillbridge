// ============================================================
// SkillBridge Career Navigator - Type Definitions
// This is the SINGLE SOURCE OF TRUTH for all data shapes.
// Every component, API route, and utility imports from here.
// ============================================================

export interface SkillSet {
  languages: string[];
  frameworks: string[];
  cloud: string[];
  tools: string[];
  ml_ai: string[];
  databases: string[];
  soft_skills: string[];
}

export interface Annotation {
  line_text: string;
  type: "strong" | "improve" | "gap" | "neutral";
  feedback: string;
}

export interface CategoryScores {
  impact: number;
  keywords: number;
  relevance: number;
  formatting: number;
  depth: number;
}

export interface AnalysisResult {
  skills: SkillSet;
  experience_years: number;
  education_level: string;
  job_titles: string[];
  annotations: Annotation[];
  summary: string;
  overall_score: number;
  category_scores: CategoryScores;
  fallbackUsed: boolean;
}

export interface JobPosting {
  id: number;
  title: string;
  company: string;
  type: JobType;
  level: string;
  location: string;
  salary: string;
  description: string;
  required: string[];
  preferred: string[];
}

export type JobType = "Cloud/Infra" | "Full Stack" | "ML/AI" | "Backend" | "DevOps";

export interface JobMatch extends JobPosting {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedPreferred: string[];
  missingPreferred: string[];
}

export interface TweaksResult {
  tweaks: string[];
  fallbackUsed: boolean;
}

export interface LearningResource {
  resource: string;
  type: "course" | "docs" | "project";
  estimatedHours: number;
  url: string;
}

export interface SkillTaxonomyEntry {
  name: string;
  aliases: string[];
}

export interface SkillTaxonomy {
  languages: SkillTaxonomyEntry[];
  frameworks: SkillTaxonomyEntry[];
  cloud: SkillTaxonomyEntry[];
  tools: SkillTaxonomyEntry[];
  ml_ai: SkillTaxonomyEntry[];
  databases: SkillTaxonomyEntry[];
  soft_skills: SkillTaxonomyEntry[];
}

export interface RoadmapItem {
  skill: string;
  priority: "high" | "medium" | "low";
  resource: LearningResource;
  appearsInJobCount: number;
}

export type AppStep = "upload" | "review" | "match" | "plan";
export type AnalysisMode = "ai" | "fallback";
