"use client";

import { Zap, Target, FileText, Layout, Award, Star, ChevronRight } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import AnnotatedResume from "./AnnotatedResume";

interface ReviewStepProps {
  result: AnalysisResult;
  resumeText: string;
  onNextStep: () => void;
  onEditResume: () => void;
}

const CATEGORY_ICONS = { impact: Zap, keywords: Target, relevance: FileText, formatting: Layout, depth: Award };
const CATEGORY_LABELS: Record<string, string> = {
  impact: "Impact",
  keywords: "Keywords",
  relevance: "Relevance",
  formatting: "Formatting",
  depth: "Depth",
};

export default function ReviewStep({ result, resumeText, onNextStep, onEditResume }: ReviewStepProps) {
  const allSkills = [
    ...result.skills.languages,
    ...result.skills.frameworks,
    ...result.skills.cloud,
    ...result.skills.tools,
    ...result.skills.ml_ai,
    ...result.skills.databases,
    ...result.skills.soft_skills,
  ];
  const skillCount = allSkills.length;

  const score = result.overall_score;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const categories = [
    { key: "impact", score: result.category_scores.impact },
    { key: "keywords", score: result.category_scores.keywords },
    { key: "relevance", score: result.category_scores.relevance },
    { key: "formatting", score: result.category_scores.formatting },
    { key: "depth", score: result.category_scores.depth },
  ];

  return (
    <div>
      {/* Centered header */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-block rounded-2xl bg-teal-100 px-4 py-2 text-sm font-bold uppercase tracking-wider text-teal-700">
          Analysis Complete
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          {score >= 70
            ? `Strong resume — you scored ${score}. Here's how to reach ${Math.min(score + 16, 100)}.`
            : score >= 40
            ? `You scored ${score}. Let's close the gaps.`
            : `You scored ${score}. There's a clear path forward.`}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar: Score & Metrics */}
        <div className="space-y-6 lg:col-span-4">
          {/* Score card */}
          <div className="flex flex-col items-center rounded-3xl border-2 border-slate-100 border-t-8 border-t-teal-400 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-sm font-extrabold uppercase tracking-widest text-slate-500">
              Resume Score
            </h3>
            <div className="relative mb-4 flex h-40 w-40 items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                <circle cx="80" cy="80" r={radius} className="fill-none stroke-slate-100" strokeWidth="12" />
                <circle
                  cx="80" cy="80" r={radius}
                  className="fill-none stroke-teal-500 transition-all duration-1000 ease-out"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-5xl font-extrabold text-slate-900">{score}</div>
            </div>
            <p className="text-center font-medium text-slate-500">
              You have {skillCount} skills and {result.experience_years}+ years of experience.
            </p>
          </div>

          {/* Skill Breakdown card */}
          <div className="rounded-3xl border-2 border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-extrabold text-slate-900">Skill Breakdown</h3>
            <div className="flex flex-col gap-5">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.key as keyof typeof CATEGORY_ICONS];
                return (
                  <div key={cat.key} className="group">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-teal-500" />
                        <span className="text-sm font-bold text-slate-700">{CATEGORY_LABELS[cat.key]}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{cat.score}/100</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-teal-400 transition-all duration-1000"
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={onEditResume}
            className="w-full rounded-2xl border-2 border-slate-200 border-b-4 bg-white px-6 py-3 font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:translate-y-[2px] active:border-b-2"
          >
            Edit &amp; Re-analyze
          </button>
        </div>

        {/* Main Area: Annotated Resume + Skills */}
        <div className="space-y-6 lg:col-span-8">
          {/* Summary card */}
          <div className="rounded-3xl border-2 border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-extrabold text-slate-900">Summary</h3>
            <p className="leading-relaxed text-slate-600">{result.summary}</p>
          </div>

          {/* Annotated Resume */}
          <div className="rounded-3xl border-2 border-slate-100 bg-white shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between border-b-2 border-slate-100 px-6 py-3">
              <h3 className="text-lg font-extrabold text-slate-900">Your Resume</h3>
              <span className="rounded-xl bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                Click highlighted text for tips
              </span>
            </div>
            <div className="p-6">
              <AnnotatedResume resumeText={resumeText} annotations={result.annotations} />
            </div>
          </div>

          {/* Skills Backpack card */}
          <div className="rounded-3xl border-2 border-slate-100 border-t-8 border-t-sky-400 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-extrabold text-slate-900">
              <Star className="h-5 w-5 text-sky-500" /> Detected Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {allSkills.slice(0, 12).map((skill) => (
                <span key={skill} className="inline-flex items-center rounded-xl bg-sky-100 px-3 py-1 text-sm font-bold text-sky-700">
                  {skill}
                </span>
              ))}
              {skillCount > 12 && (
                <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                  + {skillCount - 12} more
                </span>
              )}
            </div>
          </div>

          {/* CTA button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={onNextStep}
              className="flex items-center gap-2 rounded-2xl bg-teal-500 border-b-4 border-teal-700 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-teal-400 active:translate-y-[4px] active:border-b-0"
            >
              Find My Matches <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
