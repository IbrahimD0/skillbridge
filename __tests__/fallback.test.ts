import { describe, it, expect } from "vitest";
import {
  extractSkillsFallback,
  analyzeFallback,
  generateTweaksFallback,
  extractExperienceYears,
  extractEducationLevel,
} from "../lib/fallback";
import type { AnalysisResult, TweaksResult } from "../lib/types";
import { SAMPLE_RESUME as sampleResumeText } from "../data/sample-resume";

function assertAnalysisShape(result: AnalysisResult) {
  expect(result.skills).toBeDefined();
  expect(Array.isArray(result.skills.languages)).toBe(true);
  expect(Array.isArray(result.skills.frameworks)).toBe(true);
  expect(Array.isArray(result.skills.cloud)).toBe(true);
  expect(Array.isArray(result.skills.tools)).toBe(true);
  expect(Array.isArray(result.skills.ml_ai)).toBe(true);
  expect(Array.isArray(result.skills.databases)).toBe(true);
  expect(Array.isArray(result.skills.soft_skills)).toBe(true);
  expect(Array.isArray(result.annotations)).toBe(true);
  expect(typeof result.summary).toBe("string");
  expect(typeof result.overall_score).toBe("number");
  expect(result.overall_score).toBeGreaterThanOrEqual(0);
  expect(result.overall_score).toBeLessThanOrEqual(100);
  expect(typeof result.category_scores.impact).toBe("number");
  expect(typeof result.fallbackUsed).toBe("boolean");
}

describe("fallback: empty input", () => {
  it("returns valid empty result for empty string", () => {
    const result = analyzeFallback("");
    assertAnalysisShape(result);
    expect(result.skills.languages.length).toBe(0);
    expect(result.skills.frameworks.length).toBe(0);
    expect(result.overall_score).toBeLessThanOrEqual(15);
    expect(result.annotations.length).toBe(0);
    expect(result.fallbackUsed).toBe(true);
  });
});

describe("fallback: garbage input", () => {
  it("returns valid empty result for nonsense text", () => {
    const result = analyzeFallback("hello world this is not a resume at all xyz123");
    assertAnalysisShape(result);
    expect(result.fallbackUsed).toBe(true);
  });
});

describe("fallback: valid resume", () => {
  it("extracts expected skills from sample resume", () => {
    const skills = extractSkillsFallback(sampleResumeText);
    expect(skills.languages).toContain("Python");
    expect(skills.languages).toContain("JavaScript");
    expect(skills.languages).toContain("TypeScript");
    expect(skills.languages).toContain("SQL");
    expect(skills.frameworks).toContain("React");
    expect(skills.frameworks).toContain("Node.js");
    expect(skills.cloud).toContain("AWS");
    expect(skills.tools).toContain("Docker");
    expect(skills.tools).toContain("Git");
  });

  it("produces full analysis with correct shape", () => {
    const result = analyzeFallback(sampleResumeText);
    assertAnalysisShape(result);
    expect(result.skills.languages.length).toBeGreaterThan(0);
    expect(result.annotations.length).toBeGreaterThan(0);
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.overall_score).toBeGreaterThan(0);
    expect(result.fallbackUsed).toBe(true);
  });

  it("extracts experience years", () => {
    const years = extractExperienceYears(sampleResumeText);
    expect(years).toBeGreaterThanOrEqual(1);
  });

  it("extracts education level", () => {
    const level = extractEducationLevel(sampleResumeText);
    expect(level).toBe("masters");
  });
});

describe("fallback: tweaks generation", () => {
  it("generates tweaks for missing skills", () => {
    const result: TweaksResult = generateTweaksFallback(
      ["Kubernetes", "Terraform", "Go"],
      sampleResumeText
    );
    expect(Array.isArray(result.tweaks)).toBe(true);
    expect(result.tweaks.length).toBeGreaterThan(0);
    expect(result.tweaks.length).toBeLessThanOrEqual(4);
    expect(result.fallbackUsed).toBe(true);
  });

  it("handles empty missing skills", () => {
    const result = generateTweaksFallback([], sampleResumeText);
    expect(Array.isArray(result.tweaks)).toBe(true);
    expect(result.fallbackUsed).toBe(true);
  });
});
