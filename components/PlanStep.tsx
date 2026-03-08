"use client";

import { useState, useEffect } from "react";
import { Target, FileText, Mic, Star, Lock, Zap, Keyboard, CheckCircle, AlertCircle } from "lucide-react";
import type { JobMatch, TweaksResult, AnalysisMode, RoadmapItem, LearningResource } from "@/lib/types";
import learningResources from "@/data/learning-resources.json";

interface PlanStepProps {
  job: JobMatch;
  resumeText: string;
  mode: AnalysisMode;
  allMatches: JobMatch[];
  onBack: () => void;
}

interface AIRoadmapItem {
  skill: string;
  priority: string;
  reason: string;
  resource: string;
  resourceType: string;
  url: string;
  estimatedHours: number;
  prerequisite: string;
  projectIdea: string;
}

interface AIRoadmap {
  roadmap: AIRoadmapItem[];
  totalWeeks: number;
  summary: string;
}

interface InterviewQuestion {
  question: string;
  category: string;
  targetSkill: string;
  difficulty: string;
  hint: string;
  isGapQuestion: boolean;
}

interface AnswerEvaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
}

export default function PlanStep({ job, resumeText, mode, allMatches }: PlanStepProps) {
  const [tweaks, setTweaks] = useState<TweaksResult | null>(null);
  const [tweaksLoading, setTweaksLoading] = useState(false);
  const [aiRoadmap, setAiRoadmap] = useState<AIRoadmap | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [interview, setInterview] = useState<{ questions: InterviewQuestion[] } | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"roadmap" | "tweaks" | "interview">("roadmap");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evaluations, setEvaluations] = useState<Record<number, AnswerEvaluation>>({});
  const [evaluatingIndex, setEvaluatingIndex] = useState<number | null>(null);
  const [checkedTweaks, setCheckedTweaks] = useState<Record<number, boolean>>({});
  const [expandedRoadmapItem, setExpandedRoadmapItem] = useState<number | null>(null);
  const [completedRoadmapItems, setCompletedRoadmapItems] = useState<Record<number, boolean>>({});

  const allSkills = [...job.matchedSkills, ...job.matchedPreferred];
  const allMissing = [...job.missingSkills, ...job.missingPreferred];
  const completionPct = job.required.length > 0
    ? Math.round((job.matchedSkills.length / job.required.length) * 100)
    : 0;

  // Fetch tweaks
  useEffect(() => {
    let cancelled = false;
    setTweaksLoading(true);

    fetch("/api/tweaks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resume: resumeText,
        job: { title: job.title, description: job.description, required: job.required, preferred: job.preferred },
        matched_skills: job.matchedSkills,
        missing_skills: job.missingSkills,
        mode,
      }),
    })
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setTweaks(data); })
      .catch(() => { if (!cancelled) setTweaks({ tweaks: ["Unable to generate suggestions. Try again."], fallbackUsed: true }); })
      .finally(() => { if (!cancelled) setTweaksLoading(false); });

    return () => { cancelled = true; };
  }, [job, resumeText, mode]);

  // Fetch AI roadmap
  useEffect(() => {
    let cancelled = false;
    setRoadmapLoading(true);

    fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_skills: allSkills,
        missing_skills: allMissing,
        job_title: job.title,
        mode,
      }),
    })
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setAiRoadmap(data); })
      .catch(() => { if (!cancelled) setAiRoadmap(null); })
      .finally(() => { if (!cancelled) setRoadmapLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id, mode]);

  // Fetch interview questions
  useEffect(() => {
    let cancelled = false;
    setInterviewLoading(true);

    fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matched_skills: job.matchedSkills,
        missing_skills: job.missingSkills,
        job_title: job.title,
        mode,
      }),
    })
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setInterview(data); })
      .catch(() => { if (!cancelled) setInterview(null); })
      .finally(() => { if (!cancelled) setInterviewLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id, mode]);

  const handleEvaluateAnswer = async (questionIndex: number, question: InterviewQuestion) => {
    const answer = answers[questionIndex]?.trim();
    if (!answer) return;

    setEvaluatingIndex(questionIndex);
    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          answer,
          target_skill: question.targetSkill,
          category: question.category,
          mode,
        }),
      });
      const data = await res.json();
      setEvaluations((prev) => ({ ...prev, [questionIndex]: data }));
    } catch {
      setEvaluations((prev) => ({
        ...prev,
        [questionIndex]: {
          score: 0,
          strengths: [],
          weaknesses: ["Failed to evaluate. Try again."],
          suggestion: "",
        },
      }));
    } finally {
      setEvaluatingIndex(null);
    }
  };

  // Static roadmap fallback
  const resources = learningResources as Record<string, LearningResource>;
  const staticRoadmap: RoadmapItem[] = allMissing.map((skill) => {
    const appearsIn = allMatches.filter((m) =>
      m.required.includes(skill) || m.preferred.includes(skill)
    ).length;
    const priority: RoadmapItem["priority"] = job.missingSkills.includes(skill)
      ? appearsIn > allMatches.length * 0.5 ? "high" : "medium"
      : "low";
    const resource: LearningResource = resources[skill] || {
      resource: `Learn ${skill}`,
      type: "docs" as const,
      estimatedHours: 10,
      url: "#",
    };
    return { skill, priority, resource, appearsInJobCount: appearsIn };
  }).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  const TABS = [
    { id: "roadmap" as const, label: "Learning Roadmap", Icon: Target },
    { id: "tweaks" as const, label: "Resume Tweaks", Icon: FileText },
    { id: "interview" as const, label: "Mock Interview", Icon: Mic },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Centered header */}
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900">
          Plan for {job.title}
        </h1>
        <div className="inline-flex items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white px-4 py-2 shadow-sm">
          <div className="h-3 w-32 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${completionPct}%` }} />
          </div>
          <span className="text-sm font-bold text-slate-600">
            {completionPct}% Ready{allMissing.length > 0 ? <> &middot; {allMissing.length} skills to learn</> : null}
          </span>
        </div>
      </div>

      {/* Pill tabs */}
      <div className="mb-8 flex justify-center overflow-x-auto pb-2">
        <div className="flex gap-1 rounded-3xl border-2 border-slate-100 bg-white p-2 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-slate-800 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <tab.Icon className="h-5 w-5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="min-h-[500px] rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-sm">

        {/* ROADMAP TAB */}
        {activeTab === "roadmap" && (
          <div className="mx-auto max-w-2xl py-4">
            {roadmapLoading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-lg font-medium text-slate-500">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal-100 border-t-teal-500" />
                Building your learning plan...
              </div>
            ) : aiRoadmap?.roadmap ? (
              <div className="border-l-4 border-slate-200 ml-6 space-y-10">
                {aiRoadmap.roadmap.map((item, i) => {
                  const isDone = !!completedRoadmapItems[i];
                  const isUnlocked = i === 0 || !!completedRoadmapItems[i - 1];
                  const isExpanded = expandedRoadmapItem === i;
                  return (
                    <div key={i} className="relative">
                      <div className={`absolute -left-[30px] top-4 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white shadow-md transition-all ${
                        isDone ? "bg-emerald-500" :
                        isUnlocked ? "bg-teal-500" :
                        "bg-slate-200"
                      }`}>
                        {isDone ? <CheckCircle className="h-6 w-6 text-white" /> :
                         isUnlocked ? (i === 0 ? <Star className="h-6 w-6 text-white" fill="currentColor" /> : <Target className="h-6 w-6 text-white" />) :
                         <Lock className="h-5 w-5 text-slate-400" />}
                      </div>
                      <div
                        onClick={() => isUnlocked && setExpandedRoadmapItem(isExpanded ? null : i)}
                        className={`ml-12 rounded-3xl border-2 p-6 text-left transition-all ${
                          isDone ? "border-emerald-200 bg-emerald-50/30" :
                          isUnlocked ? "cursor-pointer border-teal-200 ring-4 ring-teal-500/10 hover:border-teal-300 hover:shadow-lg" :
                          "pointer-events-none select-none border-slate-200 opacity-50"
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <h4 className={`text-xl font-extrabold ${isDone ? "text-emerald-700 line-through decoration-emerald-300" : isUnlocked ? "text-slate-900" : "text-slate-400"}`}>{item.skill}</h4>
                          {isDone ? (
                            <span className="rounded-xl bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">Done!</span>
                          ) : !isUnlocked ? (
                            <span className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-sm font-bold text-slate-400">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          ) : (
                            <span className={`rounded-xl px-3 py-1 text-sm font-bold ${
                              item.priority === "high" ? "bg-rose-100 text-rose-700" :
                              item.priority === "medium" ? "bg-sky-100 text-sky-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {item.priority === "high" ? "Priority" : item.priority}
                            </span>
                          )}
                        </div>
                        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
                          Estimated: {item.estimatedHours} hours &middot; {item.resourceType}
                        </p>
                        <p className={isDone ? "text-slate-400" : "text-slate-600"}>{item.reason}</p>
                        {isExpanded && isUnlocked && !isDone && (
                          <div className="mt-4 space-y-2 border-t-2 border-slate-100 pt-4">
                            {item.projectIdea && (
                              <p className="font-medium text-teal-600">Project: {item.projectIdea}</p>
                            )}
                            {item.prerequisite && (
                              <p className="text-sm text-slate-500">Prerequisite: {item.prerequisite}</p>
                            )}
                            {item.url && item.url !== "#" && (
                              <p className="text-sm font-bold text-sky-600">Resource: {item.resource}</p>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompletedRoadmapItems((prev) => ({ ...prev, [i]: true }));
                                setExpandedRoadmapItem(null);
                              }}
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 px-6 py-3 font-bold text-white transition-all hover:bg-emerald-400 active:translate-y-[4px] active:border-b-0"
                            >
                              <CheckCircle className="h-5 w-5" /> Mark as Done
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Static fallback roadmap */
              <div className="border-l-4 border-slate-200 ml-6 space-y-10">
                {staticRoadmap.map((item, i) => {
                  const isDone = !!completedRoadmapItems[i];
                  const isUnlocked = i === 0 || !!completedRoadmapItems[i - 1];
                  const isExpanded = expandedRoadmapItem === i;
                  return (
                    <div key={item.skill} className="relative">
                      <div className={`absolute -left-[30px] top-4 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white shadow-md transition-all ${
                        isDone ? "bg-emerald-500" :
                        isUnlocked ? "bg-teal-500" :
                        "bg-slate-200"
                      }`}>
                        {isDone ? <CheckCircle className="h-6 w-6 text-white" /> :
                         isUnlocked ? (i === 0 ? <Star className="h-6 w-6 text-white" fill="currentColor" /> : <Target className="h-6 w-6 text-white" />) :
                         <Lock className="h-5 w-5 text-slate-400" />}
                      </div>
                      <div
                        onClick={() => isUnlocked && setExpandedRoadmapItem(isExpanded ? null : i)}
                        className={`ml-12 rounded-3xl border-2 p-6 text-left transition-all ${
                          isDone ? "border-emerald-200 bg-emerald-50/30" :
                          isUnlocked ? "cursor-pointer border-teal-200 ring-4 ring-teal-500/10 hover:border-teal-300 hover:shadow-lg" :
                          "pointer-events-none select-none border-slate-200 opacity-50"
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <h4 className={`text-xl font-extrabold ${isDone ? "text-emerald-700 line-through decoration-emerald-300" : isUnlocked ? "text-slate-900" : "text-slate-400"}`}>
                            {item.skill}
                          </h4>
                          {isDone ? (
                            <span className="rounded-xl bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">Done!</span>
                          ) : !isUnlocked ? (
                            <span className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-sm font-bold text-slate-400">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          ) : (
                            <span className={`rounded-xl px-3 py-1 text-sm font-bold ${
                              item.priority === "high" ? "bg-rose-100 text-rose-700" :
                              item.priority === "medium" ? "bg-sky-100 text-sky-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {item.priority}
                            </span>
                          )}
                        </div>
                        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
                          Estimated: {item.resource.estimatedHours} hours
                        </p>
                        <p className={isDone ? "text-slate-400" : "text-slate-500"}>{item.resource.resource} ({item.resource.type})</p>
                        <p className="mt-1 text-sm text-slate-400">Appears in {item.appearsInJobCount} of your top matches</p>
                        {isExpanded && isUnlocked && !isDone && (
                          <div className="mt-4 space-y-2 border-t-2 border-slate-100 pt-4">
                            {item.resource.url && item.resource.url !== "#" && (
                              <p className="text-sm font-bold text-sky-600">Resource: {item.resource.resource}</p>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompletedRoadmapItems((prev) => ({ ...prev, [i]: true }));
                                setExpandedRoadmapItem(null);
                              }}
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 px-6 py-3 font-bold text-white transition-all hover:bg-emerald-400 active:translate-y-[4px] active:border-b-0"
                            >
                              <CheckCircle className="h-5 w-5" /> Mark as Done
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TWEAKS TAB */}
        {activeTab === "tweaks" && (
          <div className="mx-auto max-w-3xl">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-extrabold text-slate-900">
              <Target className="text-amber-500" /> Action Items for your Resume
            </h3>

            {tweaksLoading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-lg font-medium text-slate-500">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal-100 border-t-teal-500" />
                Generating suggestions...
              </div>
            ) : tweaks ? (
              <div className="space-y-4">
                {tweaks.tweaks.map((tweak, i) => {
                  const isChecked = !!checkedTweaks[i];
                  return (
                    <button
                      key={i}
                      onClick={() => setCheckedTweaks((prev) => ({ ...prev, [i]: !prev[i] }))}
                      className={`flex w-full items-start gap-5 rounded-3xl border-2 p-6 text-left transition-all ${
                        isChecked
                          ? "border-teal-200 bg-teal-50/50"
                          : "border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 transition-all ${
                        isChecked
                          ? "border-teal-500 bg-teal-500"
                          : "border-slate-300 hover:border-teal-400"
                      }`}>
                        {isChecked && (
                          <CheckCircle className="h-5 w-5 animate-check-pop text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-base font-medium leading-relaxed transition-all ${
                          isChecked ? "text-slate-400 line-through" : "text-slate-700"
                        }`}>{tweak}</p>
                      </div>
                    </button>
                  );
                })}
                {tweaks.fallbackUsed && (
                  <p className="mt-4 text-center text-sm font-medium text-slate-400">Generated using rule-based analysis</p>
                )}
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-3">
                  <span className="text-sm font-bold text-slate-500">
                    {Object.values(checkedTweaks).filter(Boolean).length} / {tweaks.tweaks.length} completed
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Lock className="h-3 w-3" /> Saves with database
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* INTERVIEW TAB */}
        {activeTab === "interview" && (
          <div>
            {interviewLoading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-lg font-medium text-slate-500">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal-100 border-t-teal-500" />
                Preparing questions...
              </div>
            ) : interview?.questions ? (
              <div className="space-y-6">
                {interview.questions.map((q, i) => (
                  <div key={i}>
                    {/* Question card - dark theme */}
                    <button
                      onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                      className="relative w-full overflow-hidden rounded-3xl bg-slate-800 p-8 text-left text-white shadow-xl transition-all hover:shadow-2xl"
                    >
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-400 to-sky-500" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <span className="mb-3 block text-sm font-bold uppercase tracking-widest text-slate-300">
                            Question {i + 1} of {interview.questions.length}
                          </span>
                          <h3 className="text-xl font-extrabold leading-tight md:text-2xl">
                            &ldquo;{q.question}&rdquo;
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                              q.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-200" :
                              q.difficulty === "hard" ? "bg-rose-500/20 text-rose-200" :
                              "bg-amber-500/20 text-amber-200"
                            }`}>
                              {q.difficulty}
                            </span>
                            <span className="rounded-xl bg-slate-600 px-2.5 py-1 text-xs font-bold text-slate-100">{q.targetSkill}</span>
                            {q.isGapQuestion && (
                              <span className="rounded-xl bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-200">gap area</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded answer area */}
                    {expandedQuestion === i && (
                      <div className="mt-3 rounded-3xl border-2 border-slate-100 bg-white p-8">
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Hint</p>
                        <p className="mb-6 leading-relaxed text-slate-600">{q.hint}</p>

                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Your Answer</label>
                        <textarea
                          value={answers[i] || ""}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                          placeholder="Type your answer here..."
                          rows={5}
                          className="mb-4 w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-medium text-slate-700 transition-all placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/20"
                        />
                        <button
                          onClick={() => handleEvaluateAnswer(i, q)}
                          disabled={!answers[i]?.trim() || evaluatingIndex === i}
                          className="flex items-center gap-2 rounded-2xl bg-sky-500 border-b-4 border-sky-700 px-6 py-3 font-bold text-white transition-all hover:bg-sky-400 active:translate-y-[4px] active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Keyboard className="h-5 w-5" />
                          {evaluatingIndex === i ? "Evaluating..." : "Check Answer"}
                        </button>

                        {evaluations[i] && (
                          <div className="mt-6 space-y-4 rounded-2xl border-2 border-slate-100 p-6">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-slate-700">Score:</span>
                              <span className={`rounded-xl px-4 py-1.5 text-base font-extrabold ${
                                evaluations[i].score >= 70 ? "bg-emerald-100 text-emerald-700" :
                                evaluations[i].score >= 40 ? "bg-amber-100 text-amber-700" :
                                "bg-rose-100 text-rose-700"
                              }`}>
                                {evaluations[i].score}/100
                              </span>
                            </div>
                            {evaluations[i].strengths.length > 0 && (
                              <div>
                                <p className="mb-2 text-sm font-bold text-emerald-600">Strengths:</p>
                                <ul className="space-y-1.5">
                                  {evaluations[i].strengths.map((s, si) => (
                                    <li key={si} className="flex gap-2 text-slate-600">
                                      <span className="font-bold text-emerald-500">+</span> {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {evaluations[i].weaknesses.length > 0 && (
                              <div>
                                <p className="mb-2 text-sm font-bold text-rose-600">Areas to Improve:</p>
                                <ul className="space-y-1.5">
                                  {evaluations[i].weaknesses.map((w, wi) => (
                                    <li key={wi} className="flex gap-2 text-slate-600">
                                      <span className="font-bold text-rose-500">-</span> {w}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {evaluations[i].suggestion && (
                              <div className="rounded-2xl border-l-4 border-sky-400 bg-sky-50 p-4">
                                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-sky-700">
                                  <Zap className="mr-1 inline h-3 w-3" />Suggestion
                                </p>
                                <p className="font-medium text-sky-900">{evaluations[i].suggestion}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-lg font-medium text-slate-500">Unable to generate questions. Try refreshing.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
