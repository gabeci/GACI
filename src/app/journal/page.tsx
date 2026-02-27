"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";

type JournalEntry = {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
};

const STORAGE_KEY = "gaci-journal-entries";
const MAX_TAGS = 3;
const tagOptions = ["Calm", "Anxious", "Grateful", "Focused", "Hopeful", "Overwhelmed"];

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default function JournalPage() {
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [toast, setToast] = useState("");
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as JournalEntry[];
      const safeEntries = parsed
        .filter((entry) => entry.id && entry.content && entry.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEntries(safeEntries);
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(""), 1800);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const hasReachedTagLimit = selectedTags.length >= MAX_TAGS;
  const canSave = content.trim().length > 0;

  const wordCount = useMemo(() => {
    const trimmed = content.trim();

    if (!trimmed) {
      return 0;
    }

    return trimmed.split(/\s+/).length;
  }, [content]);

  const onToggleTag = (tag: string) => {
    setSelectedTags((current) => {
      if (current.includes(tag)) {
        return current.filter((item) => item !== tag);
      }

      if (current.length >= MAX_TAGS) {
        setToast("Pick up to 3 tags.");
        return current;
      }

      return [...current, tag];
    });
  };

  const onSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSave) {
      setToast("Write a few words before saving.");
      return;
    }

    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      content: content.trim(),
      tags: selectedTags,
      createdAt: new Date().toISOString()
    };

    const nextEntries = [entry, ...entries];
    setEntries(nextEntries);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));

    setContent("");
    setSelectedTags([]);
    setToast("Saved to journal.");
  };

  return (
    <MobileShell>
      <section className="space-y-4 pb-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#003D7C]">Journal</h1>
          <p className="text-sm text-[#8A704C]">Private check-ins for Emotion Capture and Meaning Convergence.</p>
        </header>

        <form className="space-y-3 rounded-2xl border border-[#8A704C]/30 bg-[#F7F7F2] p-4" onSubmit={onSave}>
          <label className="block text-sm font-medium text-[#003D7C]" htmlFor="journal-content">
            What are you feeling right now?
          </label>
          <textarea
            className="min-h-[132px] w-full rounded-xl border border-[#003D7C]/20 bg-white px-3 py-3 text-base text-slate-800 outline-none ring-[#003D7C] focus:ring-2"
            id="journal-content"
            maxLength={1200}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your check-in..."
            value={content}
          />

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#8A704C]">Mood / values (optional, up to 3)</p>
            <ul className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => {
                const selected = selectedTags.includes(tag);
                const disabled = !selected && hasReachedTagLimit;

                return (
                  <li key={tag}>
                    <button
                      className={`min-h-11 rounded-full border px-4 text-sm font-medium transition ${
                        selected
                          ? "border-[#003D7C] bg-[#003D7C] text-white"
                          : "border-[#8A704C]/40 bg-white text-[#003D7C]"
                      } ${disabled ? "opacity-50" : ""}`}
                      disabled={disabled}
                      onClick={() => onToggleTag(tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{wordCount} words</span>
            <button
              className="min-h-11 rounded-xl bg-[#003D7C] px-4 text-sm font-semibold text-white disabled:bg-slate-300"
              disabled={!canSave}
              type="submit"
            >
              Save entry
            </button>
          </div>
        </form>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8A704C]">Recent entries</h2>

          {entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#8A704C]/40 bg-white p-4 text-sm text-slate-500">
              No entries yet. Your first check-in will appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm"
                    onClick={() => setActiveEntry(entry)}
                    type="button"
                  >
                    <p className="line-clamp-2 text-sm text-slate-700">{entry.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{formatDate(entry.createdAt)}</span>
                      {entry.tags.map((tag) => (
                        <span className="rounded-full bg-[#F7F7F2] px-2 py-1 text-[#8A704C]" key={`${entry.id}-${tag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 mx-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-center text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      {activeEntry ? (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-900/45 p-3" role="dialog">
          <div className="w-full rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#003D7C]">Entry detail</p>
                <p className="text-xs text-slate-500">{formatDate(activeEntry.createdAt)}</p>
              </div>
              <button
                className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"
                onClick={() => setActiveEntry(null)}
                type="button"
              >
                Close
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{activeEntry.content}</p>
            {activeEntry.tags.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {activeEntry.tags.map((tag) => (
                  <li className="rounded-full bg-[#F7F7F2] px-3 py-1 text-xs text-[#8A704C]" key={`${activeEntry.id}-modal-${tag}`}>
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </MobileShell>
  );
}
