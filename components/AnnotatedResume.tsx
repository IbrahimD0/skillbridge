"use client";

import { useState } from "react";
import type { Annotation } from "@/lib/types";

interface AnnotatedResumeProps {
  resumeText: string;
  annotations: Annotation[];
}

const TYPE_COLORS: Record<Annotation["type"], { bg: string; highlight: string; badge: string; badgeText: string }> = {
  strong: { bg: "bg-emerald-100", highlight: "border-b-2 border-emerald-400", badge: "bg-emerald-100", badgeText: "text-emerald-800" },
  improve: { bg: "bg-amber-100", highlight: "border-b-2 border-amber-400", badge: "bg-amber-100", badgeText: "text-amber-800" },
  gap: { bg: "bg-rose-100", highlight: "border-b-2 border-rose-400", badge: "bg-rose-100", badgeText: "text-rose-800" },
  neutral: { bg: "bg-slate-50", highlight: "", badge: "bg-slate-100", badgeText: "text-slate-600" },
};

const TYPE_LABELS: Record<Annotation["type"], string> = {
  strong: "Strong",
  improve: "Improve",
  gap: "Gap",
  neutral: "Info",
};

export default function AnnotatedResume({ resumeText, annotations }: AnnotatedResumeProps) {
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const lines = resumeText.split("\n");

  function findAnnotation(line: string): Annotation | undefined {
    const trimmed = line.trim();
    if (trimmed.length < 3) return undefined;
    return annotations.find((a) => {
      const annotTrimmed = a.line_text.trim();
      if (annotTrimmed.length < 3) return false;
      return trimmed === annotTrimmed || trimmed.includes(annotTrimmed) || annotTrimmed.includes(trimmed);
    });
  }

  return (
    <div className="paper-texture rounded-2xl border border-amber-200/60 px-8 py-6 shadow-inner">
      <div className="space-y-0 font-mono text-[0.9rem] leading-[1.75rem] text-slate-700">
        {lines.map((line, i) => {
          const annotation = findAnnotation(line);
          const isExpanded = expandedLine === i;

          if (!annotation) {
            return (
              <div key={i} className="min-h-[1.75rem]">
                {line || "\u00A0"}
              </div>
            );
          }

          const colors = TYPE_COLORS[annotation.type];
          return (
            <div key={i}>
              <button
                onClick={() => setExpandedLine(isExpanded ? null : i)}
                className={`min-h-[1.75rem] cursor-pointer rounded-sm px-1 text-left transition-all ${colors.bg} ${colors.highlight} hover:brightness-[0.97]`}
              >
                {line}
              </button>
              {isExpanded && (
                <div className="my-2 ml-4 rounded-2xl border-2 border-slate-100 bg-white p-4 text-sm shadow-md">
                  <span className={`mr-2 inline-block rounded-xl px-2.5 py-0.5 text-xs font-bold ${colors.badge} ${colors.badgeText}`}>
                    {TYPE_LABELS[annotation.type]}
                  </span>
                  <span className="font-sans text-slate-600">{annotation.feedback}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
