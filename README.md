# SkillBridge Career Navigator

**Candidate Name:** Ibrahim Dobashi

**Scenario Chosen:** Skill-Bridge Career Navigator

**Estimated Time Spent:** ~5 hours

**Live Demo:** https://skillbridge-six-lilac.vercel.app/

**Video Walkthrough:** https://www.youtube.com/watch?v=moSTTW71xMo

## Why I Chose This Scenario

I'm a new grad. I've submitted resumes and heard nothing back without knowing why. The tools out there either reformat your resume or dump a list of jobs with no connection between the two. I wanted to build the thing I wished I had: paste your resume, see exactly what's weak, get matched to roles you're actually qualified for, and get a plan to close the gaps.

## Quick Start

**Prerequisites:** Node.js 18+, npm

**Run Commands:**
```bash
npm install
cp .env.example .env.local  # Add your Anthropic API key
npm run dev
```

**Test Commands:**
```bash
npm test
```

> Note: The app works fully without an API key using rule-based fallback mode. Toggle "AI Mode" off in the navbar, or the app will auto-fallback if no key is configured.

## What It Does

SkillBridge is a career navigation tool that analyzes your resume and matches it against job postings. The 4-step flow:

1. **Upload** - Paste your resume, upload a PDF/TXT file, or choose from 5 sample templates that demonstrate different scoring outcomes
2. **Review** - See an overall score, 5-category breakdown (Impact, Keywords, Relevance, Formatting, Depth), and an annotated resume with clickable feedback highlights
3. **Match** - Browse 18 job postings ranked by match %, with search and role-type filters
4. **Plan** - Three tabs:
   - **Learning Roadmap** - Sequential skill unlock system (complete one to unlock the next) with estimated hours and resources
   - **Resume Tweaks** - Interactive checklist of actionable improvements with completion tracking
   - **Mock Interview** - AI-generated questions with hints, answer submission, and AI-powered evaluation with scoring and feedback

## AI Mode vs Rule-Based Mode

A visible toggle in the navbar switches between:

- **AI Mode** - Uses Claude Haiku for skill extraction, resume annotation, roadmap generation, interview questions, and answer evaluation
- **Rule-Based Mode** - Uses regex/keyword matching, heuristic scoring, and template-based generation. Works completely offline with no API key.

Both modes return identical TypeScript types. The UI can't tell which mode produced the data. If any AI call fails, it auto-falls back to rule-based and shows a toast.

## Scoring System

All scoring is client-side, deterministic, and testable (pure functions in `scoring.ts`):

- **Impact (25%)** - Percentage of resume bullets containing quantified metrics (numbers, percentages, multipliers), with curve scaling and action verb bonus
- **Keywords (25%)** - Coverage of the top 20 most-demanded skills across all job postings, using alias resolution (e.g., "py" matches "Python")
- **Relevance (20%)** - Job title family matching + domain keyword coverage
- **Formatting (15%)** - Standard sections present, action verb usage, bullet consistency, line length
- **Depth (15%)** - Presence of advanced/specialized tools (Kubernetes, Terraform, Prometheus, etc.) in both extracted skills and raw resume text

Five sample resume templates demonstrate scoring differentiation:
- **Strong SWE (75)** - Metrics + keywords + structure = high across the board
- **Weak/Vague (22)** - No metrics, no skills section, vague descriptions = low everywhere
- **Good Keywords, No Impact (64)** - Right tech stack but no quantified outcomes, impact score visibly drags overall down
- **DevOps Specialist (78)** - Depth signals (K8s, Terraform, Prometheus) push depth to 100
- **Career Changer (43)** - Business metrics help impact but missing tech keywords and depth

## Design Approach

The UI is inspired by Duolingo's design language. Job searching is exhausting and most career tools feel clinical, like tax software. Duolingo solved a similar problem for language learning: they made something that feels tedious into something you want to come back to. Bouncy buttons, progress bars, sequential unlocks on the roadmap, checkable tweaks, a score ring that makes you want to push it higher. The goal is that when you see a 64 and the breakdown shows your impact score at 6, you don't feel defeated. You feel like you know exactly what to fix and you want to fix it.

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript strict mode)
- **UI:** React + TailwindCSS + lucide-react icons
- **AI:** Anthropic Claude API (claude-haiku-4-5-20251001)
- **Data:** Static JSON (18 synthetic job postings, 90+ skills taxonomy with aliases, learning resources)
- **Tests:** Vitest (14 tests across 2 test files)
- **File Parsing:** pdf-parse for PDF resume upload

## Responsible AI

- **Prompt injection defense.** Input sanitized against 6 patterns before sending to Claude.
- **Auto-fallback.** Every AI call wrapped in try/catch. On failure, rule-based runs automatically.
- **Input validation.** Max 5000 chars, empty input blocked, short resume warning under 30 words.
- **No PII stored.** All data is synthetic, session-only state, nothing persisted beyond the current session.
- **Transparent mode.** User can see and toggle between AI and rule-based at any time.
- **Disclaimer.** Footer states AI suggestions are informational and may contain inaccuracies.

## AI Disclosure

- **Did you use an AI assistant?** Yes, Claude Code for implementation. I wrote the architecture doc and spec first, Claude Code built against it.

- **How did you verify?** Read code before accepting and caught wrong assumptions (e.g. keyword matching was doing exact string comparison instead of alias resolution, scoring curves were inflating results). Used plan mode to think through architectural tradeoffs before writing code, like whether scoring should live server-side or client-side. Ran `npm test` after every change. Manually tested both modes end-to-end including edge cases (empty input, garbage text, missing API key, mode toggle mid-session).

- **Example of a suggestion I rejected:** Claude Code generated the annotated resume view with full-line block highlighting that made empty lines show up as green bars. I caught it visually, traced it to fuzzy string matching in `findAnnotation()` where empty strings matched everything, and added a minimum length guard. Separately, the initial scoring gave the strong sample resume 91/100 which was clearly wrong for a resume with vague intern bullets and no infrastructure depth. I reworked the curves and denominators until the scores were honest (75/22/64/78/43 across the five templates).

## Tradeoffs & Prioritization

**What I focused on:** Full end-to-end flow in both modes. Scoring that produces honest, differentiable results across resume quality levels. Interactive features (sequential roadmap, checkable tweaks, mock interview) that feel functional even without persistence.

**What I cut:**
- **Persistent storage.** Not needed to prove the concept. The UI already has the patterns (mark as done, check off tweaks) that would plug into a database.
- **Real job APIs.** Static JSON with 18 curated postings demos search, filter, and matching more reliably than a live API during a presentation.
- **Recruiter perspective.** Separate product surface. Kept focus on the candidate side.

**What I would build next:**
- **PostgreSQL with Prisma.** The data is naturally relational (users, analyses, skills, jobs). JSONB columns handle the flexible parts like skill categories. Would persist roadmap progress, tweak completion, interview history, and saved analyses for comparison. The UI components already support it, they just need a persistence layer.
- **Real job APIs.** Indeed or LinkedIn integration with a background sync that maps their fields to our taxonomy.
- **ATS simulation.** Keyword density scoring against a specific job description, not just the general taxonomy.
- **Progress over time.** Re-analyze after improving your resume and see your score trend. That's what makes it sticky.

**Known limitations:** Synthetic job data, scoring heuristics are rule-based not ML-trained, no persistence across sessions.

## Video

https://www.youtube.com/watch?v=moSTTW71xMo

## Project Structure

```
skillbridge/
├── app/
│   ├── layout.tsx              # Root layout, navbar with mode toggle
│   ├── page.tsx                # Main app (single page, step-based state)
│   ├── globals.css             # Tailwind + custom animations + paper texture
│   └── api/
│       ├── analyze/route.ts    # Skill extraction + resume annotation
│       ├── tweaks/route.ts     # Per-job resume suggestions
│       ├── roadmap/route.ts    # Learning plan generation
│       ├── interview/route.ts  # Mock interview question generation
│       ├── evaluate-answer/route.ts  # Interview answer evaluation
│       └── parse-resume/route.ts     # PDF/TXT file upload parsing
├── components/
│   ├── UploadStep.tsx          # Resume input, file upload, sample template picker
│   ├── ReviewStep.tsx          # Score ring, categories, annotated resume
│   ├── MatchStep.tsx           # Job cards, search, filter chips
│   ├── PlanStep.tsx            # Roadmap, tweaks, mock interview (3 tabs)
│   ├── AnnotatedResume.tsx     # Paper-textured resume with color-coded highlights
│   └── Toast.tsx               # Notification component
├── lib/
│   ├── types.ts                # All TypeScript interfaces (source of truth)
│   ├── ai.ts                   # Anthropic Claude API wrapper
│   ├── fallback.ts             # Rule-based fallback logic
│   └── scoring.ts              # Match %, category scores (pure functions)
├── data/
│   ├── jobs.json               # 18 synthetic job postings
│   ├── skills-taxonomy.json    # 90+ skills with aliases
│   ├── learning-resources.json # Skill -> resource mapping
│   └── sample-resume.ts       # 5 sample templates with expected scores
└── __tests__/
    ├── scoring.test.ts         # 6 tests: match %, category scores
    └── fallback.test.ts        # 8 tests: empty input, garbage, valid resume
```
