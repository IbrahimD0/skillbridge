"use client";

import { useState, useCallback } from "react";
import { Flame, ArrowLeft } from "lucide-react";
import type { AppStep, AnalysisMode, AnalysisResult, JobMatch } from "@/lib/types";
import { computeAllMatches } from "@/lib/scoring";
import UploadStep from "@/components/UploadStep";
import ReviewStep from "@/components/ReviewStep";
import MatchStep from "@/components/MatchStep";
import PlanStep from "@/components/PlanStep";
import Toast from "@/components/Toast";
import { SAMPLE_RESUME, SAMPLE_TEMPLATES } from "@/data/sample-resume";

const LOADING_PHASES = [
  "Scanning your resume...",
  "Extracting skills and experience...",
  "Matching you to roles...",
  "Preparing your roadmap...",
];

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");
  const [mode, setMode] = useState<AnalysisMode>("ai");
  const [resumeText, setResumeText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState("");
  const [toast, setToast] = useState({ message: "", visible: false });
  const [showModeConfirm, setShowModeConfirm] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  async function runAnalysis(text: string, analysisMode: AnalysisMode) {
    setResumeText(text);
    setIsLoading(true);

    for (let i = 0; i < LOADING_PHASES.length; i++) {
      setLoadingPhase(LOADING_PHASES[i]);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: text, mode: analysisMode }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const result: AnalysisResult = await res.json();

      if (result.fallbackUsed && analysisMode === "ai") {
        showToast("AI unavailable - using rule-based analysis");
        setMode("fallback");
      }

      setAnalysisResult(result);
      const matches = computeAllMatches(result.skills);
      setJobMatches(matches);
      setStep("review");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleModeToggle() {
    const newMode = mode === "ai" ? "fallback" : "ai";

    if (analysisResult) {
      setShowModeConfirm(true);
      return;
    }

    setMode(newMode);
    showToast(`Switched to ${newMode === "ai" ? "AI" : "rule-based"} mode`);
  }

  function confirmModeSwitch() {
    const newMode = mode === "ai" ? "fallback" : "ai";
    setMode(newMode);
    setShowModeConfirm(false);
    showToast(`Switched to ${newMode === "ai" ? "AI" : "rule-based"} mode. Re-analyzing...`);
    runAnalysis(resumeText, newMode);
  }

  function handleEditResume() {
    setStep("upload");
  }

  function handleSelectJob(job: JobMatch) {
    setSelectedJob(job);
    setStep("plan");
  }

  function goBack() {
    if (step === "review") setStep("upload");
    else if (step === "match") setStep("review");
    else if (step === "plan") setStep("match");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 selection:bg-teal-200 selection:text-teal-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b-2 border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <button onClick={() => setStep("upload")} className="flex items-center gap-2">
            <img src="/logo.svg" alt="SkillBridge" className="h-10 w-10 rounded-xl" />
            <span className="text-2xl font-extrabold tracking-tight text-slate-800">SkillBridge</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Streak */}
            <div className="hidden items-center gap-2 rounded-2xl border-2 border-amber-100 bg-amber-50 px-4 py-2 font-extrabold text-amber-500 sm:flex">
              <Flame className="h-5 w-5" fill="currentColor" />
              <span>1 Day Streak!</span>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-2">
              <span className={`rounded-2xl border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                mode === "ai"
                  ? "border-teal-100 bg-teal-50 text-teal-700"
                  : "border-slate-200 bg-slate-100 text-slate-600"
              }`}>
                {mode === "ai" ? "AI" : "Rules"}
              </span>
              <button
                onClick={handleModeToggle}
                className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
                  mode === "ai" ? "bg-teal-500" : "bg-slate-300"
                }`}
                aria-label="Toggle analysis mode"
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    mode === "ai" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mode switch confirmation dialog */}
      {showModeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="animate-bounce-in mx-4 max-w-sm rounded-3xl border-2 border-slate-100 bg-white p-8 shadow-xl">
            <h3 className="text-xl font-extrabold text-slate-900">Switch Mode?</h3>
            <p className="mt-3 text-slate-500 font-medium">
              Re-analyze with {mode === "ai" ? "rule-based" : "AI"} mode? This will refresh your results.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModeConfirm(false)}
                className="rounded-2xl border-2 border-slate-200 border-b-4 px-5 py-3 font-bold text-slate-600 transition-all active:translate-y-[2px] active:border-b-2 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmModeSwitch}
                className="rounded-2xl bg-teal-500 border-b-4 border-teal-700 px-5 py-3 font-bold text-white transition-all active:translate-y-[4px] active:border-b-0 hover:bg-teal-400"
              >
                Re-analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-12 sm:px-6">
        {step !== "upload" && (
          <button
            onClick={goBack}
            className="group mb-8 flex items-center gap-2 font-bold text-slate-400 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" /> Back
          </button>
        )}

        <div className="animate-fade-in-up">
          {step === "upload" && (
            <UploadStep
              initialText={resumeText}
              onAnalyze={(text) => runAnalysis(text, mode)}
              isLoading={isLoading}
              loadingPhase={loadingPhase}
              sampleResume={SAMPLE_RESUME}
              sampleTemplates={SAMPLE_TEMPLATES}
            />
          )}

          {step === "review" && analysisResult && (
            <ReviewStep
              result={analysisResult}
              resumeText={resumeText}
              onNextStep={() => setStep("match")}
              onEditResume={handleEditResume}
            />
          )}

          {step === "match" && (
            <MatchStep
              matches={jobMatches}
              onSelectJob={handleSelectJob}
              onBack={() => setStep("review")}
            />
          )}

          {step === "plan" && selectedJob && (
            <PlanStep
              job={selectedJob}
              resumeText={resumeText}
              mode={mode}
              allMatches={jobMatches}
              onBack={() => setStep("match")}
            />
          )}
        </div>
      </main>

      {/* Responsible AI disclaimer */}
      <footer className="border-t-2 border-slate-200 bg-white px-4 py-4">
        <p className="mx-auto max-w-5xl text-center text-xs font-medium leading-relaxed text-slate-400">
          AI suggestions are informational and not career advice. Results may contain inaccuracies.
          Skills matching is approximate based on keyword analysis.
          All data is synthetic -- no personal information is stored or transmitted beyond the current session.
        </p>
      </footer>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
