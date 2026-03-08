"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Rocket, ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SampleTemplate } from "@/data/sample-resume";

interface UploadStepProps {
  initialText: string;
  onAnalyze: (text: string) => void;
  isLoading: boolean;
  loadingPhase: string;
  sampleResume: string;
  sampleTemplates: SampleTemplate[];
}

const MAX_LENGTH = 5000;

export default function UploadStep({ initialText, onAnalyze, isLoading, loadingPhase, sampleResume, sampleTemplates }: UploadStepProps) {
  const [text, setText] = useState(initialText);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  function handleSubmit() {
    if (text.trim().length === 0) return;
    onAnalyze(text);
  }

  async function handleFileUpload(file: File) {
    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Failed to parse file");
        return;
      }

      setText(data.text);
    } catch {
      setUploadError("Failed to upload file. Try pasting your resume text instead.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center space-y-8 py-20 text-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-8 border-slate-100" />
          <div className="absolute inset-0 animate-spin rounded-full border-8 border-teal-500 border-t-transparent" />
          <Rocket className="h-12 w-12 animate-pulse text-teal-500" />
        </div>
        <div>
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">{loadingPhase}</h2>
          <p className="text-lg font-medium text-slate-500">Analyzing your resume</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center">
      <div className="mb-10 pt-8 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          Ready to find your next role?
        </h1>
        <p className="text-lg font-medium text-slate-500">
          Drop your resume below and we&apos;ll match you to roles.
        </p>
      </div>

      {/* File upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        className={`group w-full cursor-pointer rounded-[2rem] border-4 border-dashed bg-white p-12 transition-all ${
          isDragOver
            ? "border-teal-400 bg-teal-50"
            : "border-slate-200 hover:border-teal-400 hover:bg-teal-50"
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4 rounded-full bg-sky-100 p-4 transition-transform group-hover:scale-110">
            <UploadCloud className="h-10 w-10 text-sky-600" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-800">
            {uploading ? "Parsing file..." : "Drag & Drop your resume"}
          </h3>
          <p className="mb-4 text-sm font-medium text-slate-500">PDF, TXT, or MD files accepted</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer rounded-2xl border-2 border-slate-200 border-b-4 bg-white px-6 py-3 font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:translate-y-[2px] active:border-b-2"
          >
            Browse Files
          </label>
          {uploadError && (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-2 font-medium text-rose-600">{uploadError}</p>
          )}
        </div>
      </div>

      {/* OR divider */}
      <div className="my-8 flex w-full items-center gap-4 text-sm font-bold uppercase tracking-widest text-slate-300">
        <div className="h-px flex-1 bg-slate-200" />
        OR
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Textarea */}
      <div className="w-full">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="Paste your resume text here..."
          rows={8}
          className="w-full resize-none rounded-3xl border-2 border-slate-200 p-6 font-medium text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/20"
        />
        <div className="mt-2 flex justify-between px-2 text-xs font-medium text-slate-400">
          <span>
            {wordCount} words
            {wordCount > 0 && wordCount < 30 && (
              <span className="ml-2 text-amber-600">Resume seems short. Consider adding more detail.</span>
            )}
          </span>
          <span className={text.length > MAX_LENGTH * 0.9 ? "text-amber-600" : ""}>
            {text.length.toLocaleString()}/{MAX_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex w-full flex-col gap-4 sm:flex-row">
        <button
          onClick={handleSubmit}
          disabled={text.trim().length === 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-500 border-b-4 border-teal-700 px-6 py-4 text-lg font-bold text-white transition-all hover:bg-teal-400 active:translate-y-[4px] active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4"
        >
          Analyze Resume
        </button>
        <div className="relative flex-1">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 border-b-4 bg-white px-6 py-4 text-lg font-bold text-teal-600 transition-all hover:border-teal-200 hover:bg-teal-50 active:translate-y-[4px] active:border-b-2"
          >
            <FileText className="h-5 w-5" /> Try a Sample
            <ChevronDown className={`h-4 w-4 transition-transform ${showTemplates ? "rotate-180" : ""}`} />
          </button>

          {showTemplates && (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border-2 border-slate-100 bg-white shadow-xl">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Choose a resume to see how our scoring works</p>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {sampleTemplates.map((template) => {
                  const ScoreIcon = template.expectedScore === "high" ? TrendingUp : template.expectedScore === "low" ? TrendingDown : Minus;
                  const scoreColor = template.expectedScore === "high" ? "bg-emerald-100 text-emerald-700" : template.expectedScore === "low" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
                  const scoreBorder = template.expectedScore === "high" ? "border-emerald-500" : template.expectedScore === "low" ? "border-rose-500" : "border-amber-500";
                  return (
                    <button
                      key={template.id}
                      onClick={() => { setText(template.text); setShowTemplates(false); }}
                      className={`group flex w-full items-start gap-4 border-l-4 px-5 py-4 text-left transition-all hover:bg-slate-50 ${scoreBorder}`}
                    >
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${scoreColor}`}>
                        <ScoreIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 group-hover:text-teal-600">{template.name}</h4>
                          <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${scoreColor}`}>
                            {template.expectedScore}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500 leading-snug">{template.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
