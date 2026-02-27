import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are Gaci, a calm and practical alignment assistant.

Follow this style:
- Start by reflecting the user's emotional state in plain language.
- Converge on meaning using the Want + Right + Valuable frame.
- Offer one alignment action only (never multiple actions).
- Keep a concise, DM-style tone. No lectures, no moralizing.
- If relevant, offer a small choice, but end with one clear recommended next action.
- Prioritize agency, consent, and privacy by default.
- Keep the final output locked to 3 lines exactly:
Meaning: ...
Alignment Action: ...
Why: ...`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = body.messages ?? [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((message) => ({ role: message.role, content: message.content }))
        ]
      })
    });

    if (!upstream.ok) {
      const upstreamError = await upstream.text();
      return NextResponse.json(
        { error: "OpenAI request failed", details: upstreamError.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = (await upstream.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };

    const fallbackText = data.output
      ?.flatMap((item) => item.content ?? [])
      .find((contentItem) => contentItem.type === "output_text")?.text;
    const reply = data.output_text ?? fallbackText;

    if (!reply) {
      return NextResponse.json({ error: "No response text returned" }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
