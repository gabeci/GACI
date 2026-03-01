import { NextRequest, NextResponse } from "next/server";
import { AlignmentSignal } from "@/lib/alignment-events";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type MockChatReply = {
  meaning: string;
  alignmentSignal: AlignmentSignal;
  microAdjustment: string;
};

const KEYWORD_BANK: Array<{
  signal: AlignmentSignal;
  keywords: string[];
  meaning: string;
  microAdjustment: string;
}> = [
  {
    signal: "Slip",
    keywords: ["overwhelmed", "stuck", "anxious", "panic", "avoid", "spiral", "late"],
    meaning: "You're carrying too many open loops, so your energy is scattering instead of landing.",
    microAdjustment: "Take one task and reduce it to a two-minute first move before touching anything else."
  },
  {
    signal: "Recovery",
    keywords: ["reset", "recover", "again", "restart", "repair", "bounce", "return"],
    meaning: "You're rebuilding traction after a wobble, and that reset instinct is a strength.",
    microAdjustment: "Do one small repair action right now, then pause and acknowledge that you restarted."
  },
  {
    signal: "Lock",
    keywords: ["clear", "focused", "ready", "aligned", "calm", "steady", "grateful"],
    meaning: "Your priorities are coherent right now, and your attention is available for meaningful action.",
    microAdjustment: "Protect this state by committing to one focused block before any new inputs."
  }
];

function buildDeterministicReply(messages: ChatMessage[]): MockChatReply {
  const latestUser = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase().trim() ?? "";

  const selected =
    KEYWORD_BANK.find((candidate) => candidate.keywords.some((keyword) => latestUser.includes(keyword))) ?? KEYWORD_BANK[0];

  return {
    meaning: selected.meaning,
    alignmentSignal: selected.signal,
    microAdjustment: selected.microAdjustment
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = body.messages ?? [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }

    const reply = buildDeterministicReply(messages);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
