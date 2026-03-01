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

function mockReply(userText: string) {
  const text = userText.toLowerCase();
  const emotion = text.includes("overwhelmed") || text.includes("anxious") ? "overloaded and tense" : "emotionally activated";
  const action = text.includes("sleep") ? "Set a 10-minute wind-down timer and put your phone outside reach." : "Take one 5-minute reset: one glass of water, one deep breath cycle, then write one next step.";

  return `Meaning: You're feeling ${emotion}, and your system is asking for a small return to steadiness.\nAlignment Action: ${action}\nWhy: One grounded action lowers friction now and helps your next choice come from intention, not spiral.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = body.messages ?? [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }

    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: mockReply(latestUserMessage), mode: "mock" });
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

    return NextResponse.json({ reply, mode: "openai" });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
