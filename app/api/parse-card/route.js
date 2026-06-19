// app/api/parse-card/route.js
// Calls Gemini directly — identical pattern to the working Salesforce project.
// gemini-3-flash-preview: confirmed free tier, same key that works there.

export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/apiHelpers";
import { NextResponse }  from "next/server";

const GEMINI_MODEL   = "gemini-2.5-flash";   // ← same model as working project
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are a structured-data extractor for a study-card CMS.
The user will paste raw text describing a study card.
Read that text carefully and extract the content into the JSON structure below.

CRITICAL: Fill in ALL fields with real content from the text.
Return ONLY the JSON object — no explanation, no markdown, no backticks, nothing else.

Field rules:
- "title"    : The main heading. Write the full name without any prefix like "Q5 —" or "Project 30 —".
- "badge"    : ONLY the short prefix (e.g. "Q5", "Project 30", "P1"). Empty string if no prefix.
- "color"    : Always empty string.
- "sections" : One object per distinct named block. Extract ALL of them.

Each section must have:
  "label"   : the section heading (e.g. "Problem", "Algorithm", "Example", "Overview")
  "type"    : exactly one of "text", "list", or "code"
  "content" : the full text content of that section

Choosing type:
  "list" → content has bullet points or numbered items → one item per line, no bullet symbol
  "code" → content is inside backtick fences or is clearly source code → raw code, no fences
  "text" → everything else

If a block has no heading, label it "Overview".

Example output:
{
  "title": "Check if a Number is a Fibonacci Number",
  "badge": "Q5",
  "color": "",
  "sections": [
    { "label": "Problem",   "type": "text", "content": "Take a number. Print whether it belongs to the Fibonacci series." },
    { "label": "Algorithm", "type": "text", "content": "A number n is Fibonacci if (5n^2+4) or (5n^2-4) is a perfect square." },
    { "label": "Steps",     "type": "list", "content": "Check int(x**0.5)**2 == x\nApply to both expressions" },
    { "label": "Example",   "type": "code", "content": "Input  : 21\nOutput : 21 is a Fibonacci number" }
  ]
}

Now extract the following text:`;

export async function POST(request) {
  const authErr = await requireAuth(request);
  if (authErr) return authErr;

  let text, cardType;
  try {
    ({ text, cardType } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Add it to .env.local and Vercel environment variables." },
      { status: 500 }
    );
  }

  // Single contents block — exactly like the working Salesforce project.
  // System instructions are prepended into the text, not a separate field.
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${text.trim()}`;

  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
      }),
    });

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      console.error("Gemini API error:", errData);
      return NextResponse.json(
        { error: errData?.error?.message || `Gemini HTTP ${geminiRes.status}` },
        { status: geminiRes.status }
      );
    }

    const geminiData = await geminiRes.json();

    // Gemini response shape: candidates[0].content.parts[0].text
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!rawText) {
      return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 500 });
    }

    // Strip any markdown fences the model adds despite instructions
    const clean = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error("Gemini returned non-JSON:\n", rawText);
      return NextResponse.json(
        { error: "Gemini returned malformed JSON. Try pasting more structured text." },
        { status: 500 }
      );
    }

    if (!parsed.title && (!parsed.sections || parsed.sections.length === 0)) {
      return NextResponse.json(
        { error: "Gemini found no content to extract. Try pasting more structured text." },
        { status: 500 }
      );
    }

    // Return card fields DIRECTLY — no wrapper — so SmartPaste.onParsed(json)
    // hands exactly { title, badge, color, sections } to handleSmartParsed.
    return NextResponse.json({
      title:    typeof parsed.title    === "string" ? parsed.title    : "",
      badge:    typeof parsed.badge    === "string" ? parsed.badge    : "",
      color:    "",
      sections: Array.isArray(parsed.sections)      ? parsed.sections : [],
    });

  } catch (err) {
    console.error("parse-card unexpected error:", err);
    return NextResponse.json({ error: "Internal server error: " + err.message }, { status: 500 });
  }
}