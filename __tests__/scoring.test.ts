import { describe, it, expect } from "vitest";
import { computeMatchScore, computeAllMatches, computeCategoryScores, computeOverallScore } from "../lib/scoring";
import { extractSkillsFallback } from "../lib/fallback";
import type { JobPosting } from "../lib/types";
import { SAMPLE_RESUME as sampleResumeText } from "../data/sample-resume";
import jobsData from "../data/jobs.json";

const sampleJob: JobPosting = {
  id: 99,
  title: "Full Stack Engineer",
  company: "Test Co",
  type: "Full Stack",
  level: "Mid-Level",
  location: "Remote",
  salary: "$120K-$160K",
  description: "Build web apps.",
  required: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL"],
  preferred: ["Next.js", "PostgreSQL", "Docker", "GraphQL"],
};

describe("scoring: computeMatchScore", () => {
  it("computes correct match for sample resume against a full stack job", () => {
    const skills = extractSkillsFallback(sampleResumeText);
    const flat = [
      ...skills.languages, ...skills.frameworks, ...skills.cloud,
      ...skills.tools, ...skills.ml_ai, ...skills.databases, ...skills.soft_skills,
    ];
    const result = computeMatchScore(flat, sampleJob);

    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
    expect(result.matchedSkills).toContain("JavaScript");
    expect(result.matchedSkills).toContain("React");
    expect(result.matchedSkills).toContain("Python");
    expect(result.matchedSkills.length).toBeGreaterThan(0);
    expect(result.missingSkills.length + result.matchedSkills.length).toBe(sampleJob.required.length);
  });

  it("returns 0% match when user has no skills", () => {
    const result = computeMatchScore([], sampleJob);
    expect(result.matchScore).toBe(0);
    expect(result.missingSkills.length).toBe(sampleJob.required.length);
  });

  it("returns high match when user has all required skills", () => {
    const result = computeMatchScore(
      ["JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "Next.js", "PostgreSQL", "Docker", "GraphQL"],
      sampleJob
    );
    expect(result.matchScore).toBe(100);
    expect(result.missingSkills.length).toBe(0);
  });
});

describe("scoring: computeAllMatches", () => {
  it("returns matches for all jobs sorted by score descending", () => {
    const skills = extractSkillsFallback(sampleResumeText);
    const matches = computeAllMatches(skills);

    expect(matches.length).toBe(jobsData.length);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].matchScore).toBeGreaterThanOrEqual(matches[i].matchScore);
    }
  });
});

describe("scoring: category scores", () => {
  it("computes all category scores as numbers 0-100", () => {
    const skills = extractSkillsFallback(sampleResumeText);
    const scores = computeCategoryScores(sampleResumeText, skills, ["Software Engineer"]);

    expect(scores.impact).toBeGreaterThanOrEqual(0);
    expect(scores.impact).toBeLessThanOrEqual(100);
    expect(scores.keywords).toBeGreaterThanOrEqual(0);
    expect(scores.keywords).toBeLessThanOrEqual(100);
    expect(scores.relevance).toBeGreaterThanOrEqual(0);
    expect(scores.relevance).toBeLessThanOrEqual(100);
    expect(scores.formatting).toBeGreaterThanOrEqual(0);
    expect(scores.formatting).toBeLessThanOrEqual(100);
    expect(scores.depth).toBeGreaterThanOrEqual(0);
    expect(scores.depth).toBeLessThanOrEqual(100);
  });

  it("computes overall score as weighted average", () => {
    const scores = { impact: 80, keywords: 60, relevance: 70, formatting: 90, depth: 50 };
    const overall = computeOverallScore(scores);
    const expected = Math.round(80 * 0.25 + 60 * 0.25 + 70 * 0.20 + 90 * 0.15 + 50 * 0.15);
    expect(overall).toBe(expected);
  });
});
