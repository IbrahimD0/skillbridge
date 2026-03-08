import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    let text = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      // Dynamic import to avoid Turbopack bundling issues
      const pdf = (await import("pdf-parse-new")).default;
      const data = await pdf(buffer);
      text = data.text;
    } else if (
      file.type === "text/plain" ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md")
    ) {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF or TXT file." },
        { status: 400 }
      );
    }

    const trimmed = text.trim().slice(0, 5000);

    if (trimmed.length === 0) {
      return NextResponse.json({ error: "Could not extract text from file." }, { status: 400 });
    }

    return NextResponse.json({ text: trimmed });
  } catch (error) {
    console.error("Parse resume error:", error);
    return NextResponse.json({ error: "Failed to parse file. Please try pasting your resume text instead." }, { status: 500 });
  }
}
