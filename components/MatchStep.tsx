"use client";

import { useState } from "react";
import { Search, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import type { JobMatch, JobType } from "@/lib/types";

interface MatchStepProps {
  matches: JobMatch[];
  onSelectJob: (job: JobMatch) => void;
  onBack: () => void;
}

const FILTER_TYPES: (JobType | "All")[] = ["All", "Cloud/Infra", "Full Stack", "ML/AI", "Backend", "DevOps"];

export default function MatchStep({ matches, onSelectJob }: MatchStepProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<JobType | "All">("All");

  const filtered = matches.filter((job) => {
    const matchesSearch = search.length === 0 ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.required.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === "All" || job.type === filter;
    return matchesSearch && matchesFilter;
  });

  const avgMatch = filtered.length > 0
    ? Math.round(filtered.reduce((s, j) => s + j.matchScore, 0) / filtered.length)
    : 0;

  return (
    <div>
      {/* Centered header */}
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900">
          Your Job Matches
        </h1>
        <p className="text-lg font-medium text-slate-500">
          {filtered.length} roles matched based on your skills &middot; {avgMatch}% avg match
        </p>

        {/* Search */}
        <div className="relative mx-auto mt-8 max-w-lg">
          <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles or companies..."
            className="w-full rounded-full border-2 border-slate-200 bg-white py-4 pl-14 pr-6 text-lg font-medium text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/20"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
        {FILTER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`whitespace-nowrap rounded-2xl border-2 px-6 py-3 font-bold transition-all active:scale-95 ${
              filter === type
                ? "border-slate-800 bg-slate-800 text-white shadow-md"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            {type === "All" ? "All Roles" : type}
          </button>
        ))}
      </div>

      {/* Job cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((job) => (
          <button
            key={job.id}
            onClick={() => onSelectJob(job)}
            className="group flex h-full cursor-pointer flex-col rounded-3xl border-2 border-slate-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-2 hover:border-teal-200 hover:shadow-xl"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold leading-tight text-slate-900 transition-colors group-hover:text-teal-600">
                  {job.title}
                </h3>
                <p className="mt-1 text-sm font-bold uppercase tracking-wider text-slate-400">
                  {job.company}
                </p>
              </div>
              <div className={`rounded-xl px-3 py-1 text-sm font-extrabold ${
                job.matchScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                job.matchScore >= 40 ? "bg-amber-100 text-amber-700" :
                "bg-rose-100 text-rose-700"
              }`}>
                {job.matchScore}% Match
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2 text-xs font-medium text-slate-400">
              <span>{job.location}</span>
              <span>&middot;</span>
              <span>{job.salary}</span>
              <span>&middot;</span>
              <span>{job.level}</span>
            </div>

            <div className="my-4 flex-grow space-y-4">
              {/* You Have */}
              {job.matchedSkills.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <CheckCircle className="h-3 w-3 text-emerald-500" /> You Have
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {job.matchedSkills.map((skill) => (
                      <span key={skill} className="inline-flex items-center rounded-xl bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing */}
              {job.missingSkills.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <AlertCircle className="h-3 w-3 text-rose-500" /> Missing
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {job.missingSkills.slice(0, 4).map((skill) => (
                      <span key={skill} className="inline-flex items-center rounded-xl bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700">
                        {skill}
                      </span>
                    ))}
                    {job.missingSkills.length > 4 && (
                      <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500">
                        +{job.missingSkills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t-2 border-slate-100 pt-4 font-bold text-sky-500 transition-colors group-hover:text-sky-600">
              <span>View Details</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-500">No roles match your search.</p>
          <button onClick={() => { setSearch(""); setFilter("All"); }} className="mt-3 font-bold text-teal-600 hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
