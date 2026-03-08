# Design Documentation

## Overview

SkillBridge Career Navigator is a resume analysis and career planning tool. Users paste or upload a resume, receive a scored breakdown, get matched to relevant jobs, and follow a structured plan to close skill gaps. It runs in two modes: AI-powered (Claude Haiku) and rule-based fallback.

## Technical Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | Server-side API routes + React UI in one project. App Router for file-based routing and server components. |
| Language | TypeScript (strict mode) | Catch type mismatches between AI responses and UI expectations at compile time. |
| Styling | TailwindCSS v4 | Utility-first, no CSS modules or build config needed. Supports the animated, interactive UI without custom CSS tooling. |
| AI | Anthropic Claude API (claude-haiku-4-5-20251001) | Fast, cost-effective for structured extraction tasks. Haiku handles skill extraction, annotations, roadmaps, and interview evaluation well within latency targets. |
| Icons | lucide-react | Lightweight, tree-shakeable icon set. |
| Testing | Vitest | Fast, native ESM support, works with TypeScript out of the box. |
| File Parsing | pdf-parse | Extracts text from PDF resume uploads server-side. |
| Data | Static JSON | 18 synthetic job postings, 90+ skills with aliases, learning resources. No database needed for the prototype. |

## Architecture Decisions

### Single-Page Step Flow

The app is a single page (`page.tsx`) with step-based state managed through `useState`. Steps: Upload, Review, Match, Plan. This avoids routing complexity and keeps all state in one place. Each step is a standalone component that receives props and callbacks.

Why not a multi-page app: the data flows linearly (resume -> analysis -> matches -> plan). Splitting across routes would require either a global store or URL-based state passing, both adding complexity without benefit for a prototype.

### Client-Side Scoring

All scoring logic lives in `scoring.ts` as pure functions. Scores are computed in the browser, not on the server. This means:

- Scoring works identically in AI and rule-based modes
- No API call needed to compute scores
- Every number the user sees is deterministic and testable
- The server only handles skill extraction and content generation

Five scoring categories, each a pure function:

- **Impact (25%)** - Counts bullets with quantified metrics. Uses a curved formula (`metricRatio * 160`, capped at 100) plus an action verb bonus (max +10). The curve rewards having some metrics without requiring every bullet to have one.
- **Keywords (25%)** - Checks coverage of top 20 demanded skills across all job postings. Uses alias resolution through a taxonomy (e.g., "py" -> "Python", "ES6" -> "JavaScript") so skill naming variations don't penalize the user.
- **Relevance (20%)** - Matches job title families and domain keywords against resume text.
- **Formatting (15%)** - Checks for standard sections (experience, education, skills), action verb usage, bullet consistency, reasonable line lengths.
- **Depth (15%)** - Detects advanced/specialized tools (Kubernetes, Terraform, Prometheus, etc.) in both extracted skills and raw resume text. Denominator of 6 means showing expertise in a few advanced tools scores well.

### AI Mode vs Rule-Based Fallback

Both modes return identical TypeScript types defined in `lib/types.ts`. The UI components don't know which mode produced the data. This is enforced at the type level: `AnalysisResult`, `RoadmapItem`, `InterviewQuestion`, etc. are shared interfaces.

Every API route follows the same pattern:
1. Receive request
2. Try AI call (Claude Haiku)
3. On failure, catch and run fallback function
4. Return same response shape either way
5. If fallback was used, include a flag so the UI shows a toast

The user can also manually toggle modes via a navbar switch. Switching to rule-based mid-session prompts confirmation if AI results already exist.

### Dual-Mode Design Rationale

Building the fallback first had an architectural benefit: it forced every feature to work without AI before AI was added. This means the entire app is functional with no API key. The AI layer adds quality (better skill extraction, more specific annotations, tailored roadmaps) but never adds capability that doesn't exist in fallback.

### Sequential Roadmap Unlocks

The learning roadmap uses a sequential unlock pattern inspired by Duolingo. Each skill card starts locked. Completing one (clicking "Mark as Done") unlocks the next. This creates a sense of progression rather than dumping all skills at once.

State is managed locally (`completedRoadmapItems` set in `PlanStep.tsx`). With a database, this state would persist across sessions. The UI interaction pattern is already built for it.

### Scoring Differentiation

Five sample resume templates are included to demonstrate that the scoring heuristics produce meaningfully different results:

| Template | Score | Why |
|----------|-------|-----|
| Strong SWE | 75 | Metrics in bullets, right keywords, good structure |
| Weak/Vague | 22 | No metrics, no skills section, vague descriptions |
| No Impact | 64 | Same tech stack as strong, but no quantified outcomes |
| DevOps Specialist | 78 | Depth signals (K8s, Terraform) push depth to 100 |
| Career Changer | 43 | Business metrics help impact, but missing tech keywords |

The "No Impact" template is the most instructive: it has the same skills as the strong resume but scores 11 points lower because every bullet says "Developed X" without outcomes. Impact drops while keywords stay high. That gap is the diagnosis.

## Responsible AI

- **Prompt injection defense.** Six regex patterns sanitize input before it reaches Claude. Patterns cover common injection attempts (ignore instructions, system prompt extraction, role reassignment).
- **Auto-fallback.** Every AI call is wrapped in try/catch. Failures trigger rule-based fallback automatically. The user sees a toast notification, never an error page.
- **Input validation.** Resume text capped at 5000 characters. Empty input blocked at the UI level. Short resumes (under 30 words) show a warning.
- **No PII storage.** All job data is synthetic. Resume text exists only in session state. Nothing is persisted to disk or database.
- **Transparent mode switching.** The AI/rule-based toggle is always visible. Users know which mode is active.
- **Disclaimer.** Footer states AI suggestions are informational and may contain inaccuracies.

## Data Model

No database in the current prototype. All state lives in React `useState`. The data model is designed to be directly mappable to a relational schema:

```
Users (future)
  ├── Analyses (resume text, extracted skills, scores, annotations)
  │     └── CategoryScores (impact, keywords, relevance, formatting, depth)
  ├── SavedJobs (job_id, match_percentage, matched_skills, missing_skills)
  └── Progress
        ├── RoadmapCompletion (skill_id, completed_at)
        ├── TweakCompletion (tweak_id, checked)
        └── InterviewHistory (question, answer, score, feedback)
```

PostgreSQL with Prisma would be the next step. JSONB columns handle flexible fields like skill categories and annotation arrays. The UI components already accept the state they need through props, so adding persistence means wiring up API calls without changing component logic.

## Testing Strategy

14 tests across 2 files, all testing pure functions:

- **Scoring tests (6):** Match percentage computation, category score ranges, edge cases (empty skills, no overlap, perfect overlap).
- **Fallback tests (8):** Empty input handling, garbage text, valid resume extraction, response shape validation, skill detection accuracy.

No API key required to run tests. The tests cover the deterministic logic that produces every number the user sees. AI-generated content (annotations, roadmaps) is tested indirectly through the fallback functions which return the same types.

## UI/UX Design

The interface draws from Duolingo's design language. Career tools tend to feel clinical, which adds to the exhaustion of job searching. Duolingo solved a similar engagement problem for language learning: they made repetitive practice feel like progression.

Design elements borrowed from that approach:
- **Score ring** on the review page creates a target to improve
- **Progress bar** across the top shows how far through the flow you are
- **Sequential unlocks** on the roadmap create a sense of forward movement
- **Checkable tweaks** give small wins as you work through improvements
- **Bouncy button animations** make interactions feel responsive
- **Color-coded highlights** on the annotated resume make feedback scannable (green = strong, amber = needs work)

The goal: when you see your score and the breakdown shows which category is dragging it down, you know exactly what to fix and you want to fix it.

## Known Limitations

- Scoring is heuristic-based, not ML-trained. It works well for the patterns it checks but can't evaluate resume quality holistically.
- Job data is synthetic (18 postings). A production version would integrate with job APIs.
- No persistence across sessions. Closing the tab loses all progress.
- PDF parsing depends on text-based PDFs. Scanned image PDFs won't extract properly.
- Interview answer evaluation quality depends on AI mode. Rule-based evaluation uses keyword matching which is less nuanced.
