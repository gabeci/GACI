"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import {
  AlignmentEvent,
  AlignmentSignal,
  JOURNAL_STORAGE_KEY,
  STARS_STORAGE_KEY,
  readAlignmentEvents,
  writeAlignmentEvents
} from "@/lib/alignment-events";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  structured?: {
    meaning: string;
    alignmentSignal: AlignmentSignal;
    microAdjustment: string;
  };
};

type JournalEntry = {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
};

const quickPrompts = [
  "I'm overwhelmed and need one grounded next step.",
  "Help me name what I feel and what matters right now.",
  "Give me one alignment action I can do in 10 minutes."
];

function readJournalEntries(): JournalEntry[] {
  const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as JournalEntry[];
  } catch {
    return [];
  }
}

function formatStructuredReply(structured: ChatMessage["structured"]) {
  if (!structured) {
    return "";
  }

  return [
    `Meaning: ${structured.meaning}`,
    `Alignment Signal: ${structured.alignmentSignal}`,
    `Micro Adjustment: ${structured.microAdjustment}`
  ].join("\n");
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm Gaci. Tell me how you're feeling, and we'll find one right next action together."
    }
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSignal, setSaveSignal] = useState<AlignmentSignal>("Lock");
  const [toast, setToast] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => draft.trim().length > 0 && !isLoading, [draft, isLoading]);

  const latestStructuredReply = useMemo(
    () => [...messages].reverse().find((message) => message.structured)?.structured,
    [messages]
  );

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  const saveAlignment = (promotedToStar: boolean) => {
    if (!latestStructuredReply) {
      return;
    }

    const sparkId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const entry: JournalEntry = {
      id: sparkId,
      content: `${latestStructuredReply.meaning}\n\nMicro adjustment: ${latestStructuredReply.microAdjustment}`,
      tags: [saveSignal],
      createdAt
    };

    const journalEntries = [entry, ...readJournalEntries()];
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journalEntries));

    if (promotedToStar) {
      const rawStars = window.localStorage.getItem(STARS_STORAGE_KEY);
      const starById = rawStars ? (JSON.parse(rawStars) as Record<string, boolean>) : {};
      const nextStarById = { ...starById, [sparkId]: true };
      window.localStorage.setItem(STARS_STORAGE_KEY, JSON.stringify(nextStarById));
    }

    const event: AlignmentEvent = {
      id: crypto.randomUUID(),
      createdAt,
      source: "chat",
      sparkId,
      meaning: latestStructuredReply.meaning,
      microAdjustment: latestStructuredReply.microAdjustment,
      alignmentSignal: saveSignal,
      promotedToStar
    };

    writeAlignmentEvents([event, ...readAlignmentEvents()]);
    setToast(promotedToStar ? "Saved and promoted to Star." : "Saved as Spark.");
    window.setTimeout(() => setToast(""), 1800);
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setIsLoading(true);
    scrollToBottom();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });

      if (!response.ok) {
        throw new Error("Could not get a response. Please try again.");
      }

      const data = (await response.json()) as {
        reply?: { meaning: string; alignmentSignal: AlignmentSignal; microAdjustment: string };
        error?: string;
      };

      if (!data.reply) {
        throw new Error(data.error ?? "No assistant response returned.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", structured: data.reply, content: formatStructuredReply(data.reply) }
      ]);
      setSaveSignal(data.reply.alignmentSignal);
      scrollToBottom();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unexpected error while sending message.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendMessage(draft);
  };

  return (
    <MobileShell>
      <section className="flex h-full min-h-[72vh] flex-col gap-4 text-[#003D7C]">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold">Chatbot</h1>
          <p className="text-sm text-[#8A704C]">Emotion Capture → Meaning Convergence → Alignment Action</p>
        </header>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto rounded-2xl bg-[#F7F7F2] p-4">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isUser ? "rounded-br-md bg-[#003D7C] text-[#F7F7F2]" : "rounded-bl-md bg-white text-[#003D7C]"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            );
          })}
          {isLoading ? (
            <div className="flex justify-start">
              <p className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-[#8A704C] shadow-sm">Thinking…</p>
            </div>
          ) : null}
        </div>

        {latestStructuredReply ? (
          <section className="space-y-3 rounded-2xl border border-[#8A704C]/30 bg-white p-4">
            <h2 className="text-sm font-semibold text-[#003D7C]">Save alignment event</h2>
            <label className="block text-xs font-medium uppercase tracking-wide text-[#8A704C]" htmlFor="event-type">
              Select event type confirmation
            </label>
            <select
              className="w-full rounded-xl border border-[#003D7C]/20 bg-[#F7F7F2] px-3 py-2 text-sm text-[#003D7C]"
              id="event-type"
              onChange={(event) => setSaveSignal(event.target.value as AlignmentSignal)}
              value={saveSignal}
            >
              <option value="Lock">Lock</option>
              <option value="Slip">Slip</option>
              <option value="Recovery">Recovery</option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <button
                className="min-h-11 rounded-xl border border-[#003D7C]/30 bg-white px-3 text-sm font-semibold text-[#003D7C]"
                onClick={() => saveAlignment(false)}
                type="button"
              >
                Save as Spark
              </button>
              <button
                className="min-h-11 rounded-xl bg-[#003D7C] px-3 text-sm font-semibold text-white"
                onClick={() => saveAlignment(true)}
                type="button"
              >
                Promote to Star
              </button>
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="rounded-full border border-[#8A704C]/30 bg-white px-3 py-1.5 text-xs text-[#8A704C] transition hover:border-[#8A704C]"
              onClick={() => void sendMessage(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>

        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

        {toast ? <p className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">{toast}</p> : null}

        <form onSubmit={handleSubmit} className="sticky bottom-0 rounded-2xl bg-white p-2 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2 rounded-full border border-[#003D7C]/20 bg-[#F7F7F2] px-3 py-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Share what you feel right now..."
              className="flex-1 border-none bg-transparent text-sm text-[#003D7C] outline-none placeholder:text-[#8A704C]/80"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="rounded-full bg-[#003D7C] px-4 py-2 text-sm font-medium text-[#F7F7F2] disabled:opacity-50"
              disabled={!canSend}
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </MobileShell>
  );
}
