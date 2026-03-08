# Video Script

## Why I Built This

I chose this scenario because I've lived it. As a student you apply to jobs and hear nothing back. You don't know if it's your skills, the way you wrote your bullets, or if you're applying to the wrong roles entirely. There's no feedback loop. SkillBridge is the tool I wished I had. Paste your resume, see exactly what's strong and what's not, get matched to roles based on what you actually know, and get a concrete plan to close the gaps.

## The Feel

Job searching is draining. Most career tools feel like tax software. I took a lot of inspiration from Duolingo. They figured out how to make something most people quit feel like you're making progress every time you open it. That's what I wanted here. When you see the score and the breakdown shows which categories are dragging it down, you don't feel defeated. You see exactly where you're losing points. The roadmap gives you a path. Complete one skill, the next one unlocks. Check off resume tweaks as you go. It should feel like you're getting somewhere, not just staring at a rejection.

## How It's Built

Next.js, TypeScript strict mode, TailwindCSS, Claude Haiku for the AI side. No database, no state library. Everything lives in one page with useState.

The lib folder has the core logic. types.ts is the single source of truth for every interface in the app. scoring.ts has all the scoring as pure functions, runs client-side, totally deterministic. fallback.ts is the rule-based engine that handles everything when AI isn't available.

Six API routes. Analyze, tweaks, roadmap, interview questions, answer evaluation, and file parsing. Every one has a try-catch around the AI call. If Claude fails for any reason it catches, runs the fallback, returns the same types. The user sees a toast, not an error page.

Static JSON for data. 18 jobs, 90+ skills with aliases, learning resources. I also built five sample resume templates at different quality levels so you can see how the scoring heuristics differentiate between a strong resume, a weak one, one with good keywords but no metrics, a DevOps specialist, and a career changer.

## Live Demo

The score breaks into five categories, each weighted differently. Impact and Keywords carry the most weight since those are what get past ATS filters. The resume sits on this paper-textured view. Green lines have quantified metrics. Amber means you used a good verb but didn't back it up with a number. Click any line and it tells you specifically what to improve.

18 jobs ranked by match percentage. The matching uses alias resolution so variations like "py" map to Python and "ES6" maps to JavaScript. On each job card you can see which skills matched in green and which are missing in red. Search and filter are instant since it's all client-side.

When you click into a job there are three tabs. The roadmap is sequential. You mark a skill as done and the next one unlocks. That's the Duolingo piece. With a database this would persist between sessions but the interaction pattern is already there. Tweaks are a checklist of specific resume improvements you can check off as you go. Mock interview gives role-specific questions with hints. Type an answer and get back a score with strengths, weaknesses, and a suggestion.

## Fallback + Responsible AI

Now switching to rule-based mode. It asks to confirm since we already have results. Same UI, same types, same scoring functions. Pull the API key out and the whole app still works.

Input gets sanitized against prompt injection patterns before it touches Claude. Resume text capped at 5000 characters. File uploads validated for type and size. API errors never expose internals. All data is synthetic, nothing gets stored beyond the session.

## Tests

14 tests across two files. Scoring and fallback logic. All pure functions, no API key needed. Edge cases covered including empty input, garbage text, and valid resume extraction. These test the deterministic logic that produces every number the user sees.

## Why the Scores Matter

I built five sample templates to show how the scoring actually differentiates. The weak resume scores low because there's not a single metric in any bullet, no skills section, no advanced tools. Then there's one with the same tech stack as the strong resume, good structure, good formatting, but every bullet just says "Developed X" with no outcomes. The impact score drops while keywords stay high. You have the skills, you're just not proving it. That's the difference between a number and a diagnosis.

## What's Next

Under the time constraint I focused on the full loop working in both modes, honest scoring, and interactive features that feel real even without persistence.

Next step would be PostgreSQL with Prisma. The data is relational. Users, analyses, skills, jobs. JSONB for the flexible parts like skill categories. That makes roadmap progress persist, tweak state save, interview scores track over time. The components already support all of it, they just need a persistence layer.

After that, real job APIs to replace the static data, and ATS simulation that scores keyword density against a specific job description instead of just the general taxonomy. With a database users could re-analyze after improving their resume and see their score trend over time. That's the feedback loop that makes it sticky.

Biggest takeaway: designing the fallback system first made everything resilient by default. When AI and fallback return the same types, error handling isn't something you add later. It's the architecture.
