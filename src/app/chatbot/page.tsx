"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const quickPrompts = [
  "I'm overwhelmed and need one grounded next step.",
  "Help me name what I feel and what matters right now.",
  "Give me one alignment action I can do in 10 minutes."
];

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
  const listRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => draft.trim().length > 0 && !isLoading, [draft, isLoading]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
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

      const data = (await response.json()) as { reply?: string; error?: string };
      const reply = data.reply?.trim();

      if (!reply) {
        throw new Error(data.error ?? "No assistant response returned.");
      }

      setMessages((current) => [...current, { role: "assistant", content: reply }]);
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
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
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
