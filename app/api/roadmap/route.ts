import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisMode } from "@/lib/types";
import learningResources from "@/data/learning-resources.json";

const ROADMAP_PROMPT = `You are a career development advisor for software engineers. Given the candidate's current skills and the skills they're missing for a target role, create a personalized learning roadmap.

For each missing skill, suggest the BEST specific free or affordable learning resource. Prioritize:
1. Official documentation and tutorials (e.g. kubernetes.io, docs.docker.com)
2. High-quality free courses (freeCodeCamp, MIT OCW, Coursera audit mode, Google/AWS free training)
3. Interactive platforms (Katacoda, LeetCode, HackerRank for specific skills)
4. Well-known YouTube channels/playlists (Fireship, TechWorld with Nana, freeCodeCamp channel)

Use REAL URLs that actually exist. If unsure of the exact URL, use the main documentation site for that technology.

Return ONLY valid JSON:
{
  "roadmap": [
    {
      "skill": "Kubernetes",
      "priority": "high",
      "reason": "Required by most cloud engineering roles. Essential for container orchestration.",
      "resource": "Kubernetes Official Tutorial - Learn Kubernetes Basics",
      "resourceType": "docs",
      "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
      "estimatedHours": 20,
      "prerequisite": "Docker basics",
      "projectIdea": "Deploy a multi-container app to a local Minikube cluster with auto-scaling"
    }
  ],
  "totalWeeks": 8,
  "summary": "1-2 sentence overall learning plan summary"
}

Be specific with real, well-known resources. Limit to 6-8 skills max. Do not include any text outside the JSON.`;

const resourceLookup = learningResources as Record<string, { resource: string; type: string; estimatedHours: number; url: string }>;

const SKILL_PROJECTS: Record<string, string> = {
  Kubernetes: "Deploy a multi-container app to a local Minikube cluster with auto-scaling",
  Terraform: "Provision an AWS VPC with EC2 instances and an RDS database using Terraform modules",
  Docker: "Containerize a full-stack app with multi-stage builds and Docker Compose",
  AWS: "Build a serverless API with Lambda, API Gateway, and DynamoDB",
  GCP: "Deploy a containerized app to Google Cloud Run with Cloud Build CI/CD",
  Python: "Build a CLI tool that processes CSV data and generates summary reports",
  "CI/CD": "Set up a GitHub Actions pipeline with linting, testing, and auto-deploy to staging",
  Prometheus: "Set up Prometheus + Grafana monitoring for a containerized Node.js app",
  Grafana: "Create a dashboard visualizing application metrics and alerting on error rates",
  Go: "Build a concurrent HTTP API server with goroutines and channels",
  Kafka: "Build a producer-consumer pipeline for real-time event processing",
  PostgreSQL: "Design a normalized schema with indexes and write optimized queries for a social media app",
};

function getFallbackRoadmap(missingSkills: string[]): { roadmap: Array<Record<string, unknown>>; totalWeeks: number; summary: string } {
  let totalHours = 0;
  const roadmap = missingSkills.slice(0, 6).map((skill, i) => {
    const known = resourceLookup[skill];
    const hours = known?.estimatedHours || 15;
    totalHours += hours;
    return {
      skill,
      priority: i < 2 ? "high" : i < 4 ? "medium" : "low",
      reason: `Required or preferred by target roles.`,
      resource: known?.resource || `Official ${skill} documentation and tutorials`,
      resourceType: known?.type || "docs",
      url: known?.url || `https://www.google.com/search?q=${encodeURIComponent(skill + " tutorial")}`,
      estimatedHours: hours,
      prerequisite: "None",
      projectIdea: SKILL_PROJECTS[skill] || `Build a small project using ${skill} to demonstrate hands-on experience`,
    };
  });

  return {
    roadmap,
    totalWeeks: Math.ceil(totalHours / 10),
    summary: `Focus on ${missingSkills.slice(0, 3).join(", ")} first as they appear most frequently in your target roles.`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentSkills: string[] = body.current_skills || [];
    const missingSkills: string[] = body.missing_skills || [];
    const jobTitle: string = body.job_title || "";
    const mode: AnalysisMode = body.mode || "fallback";

    if (mode === "fallback" || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(getFallbackRoadmap(missingSkills));
    }

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const context = `Target Role: ${jobTitle}
Current Skills: ${currentSkills.join(", ")}
Missing Skills to Learn: ${missingSkills.join(", ")}`;

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: `${ROADMAP_PROMPT}\n\n${context}` }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const data = JSON.parse(cleaned);
      return NextResponse.json(data);
    } catch (aiError) {
      console.error("AI roadmap failed:", aiError);
      return NextResponse.json(getFallbackRoadmap(missingSkills));
    }
  } catch (error) {
    console.error("Roadmap route error:", error);
    return NextResponse.json({ error: "Failed to generate roadmap." }, { status: 500 });
  }
}
