"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";

type JournalEntry = {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  source?: "journal" | "chatbot";
  eventType?: AlignmentEventType;
};

type AlignmentEventType = "lock" | "slip" | "recovery";

type SnapshotState = {
  direction: "Stable" | "Wavering" | "Reversing";
  friction: "Low" | "Moderate" | "High";
  recovery: "Strong" | "Delayed";
  updatedAt: string;
};

const STORAGE_KEY = "gaci-journal-entries";
const EVENTS_STORAGE_KEY = "gaci-alignment-events";
const MAX_TAGS = 3;
const SNAPSHOT_STORAGE_KEY = "gaci-alignment-snapshot";
const tagOptions = ["Calm", "Anxious", "Grateful", "Focused", "Hopeful", "Overwhelmed"];

const defaultSnapshot: SnapshotState = {
  direction: "Wavering",
  friction: "Moderate",
  recovery: "Delayed",
  updatedAt: new Date().toISOString()
};

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function inferEventType(entry: JournalEntry): AlignmentEventType | undefined {
  if (entry.eventType) {
    return entry.eventType;
  }

  const text = `${entry.content} ${entry.tags.join(" ")}`.toLowerCase();

  if (["stuck", "overwhelmed", "anxious", "heavy", "blocked", "slip"].some((word) => text.includes(word))) {
    return "slip";
  }

  if (["recover", "reset", "again", "breathe", "pause", "repair"].some((word) => text.includes(word))) {
    return "recovery";
  }

  if (["focused", "steady", "aligned", "clear", "grounded", "lock"].some((word) => text.includes(word))) {
    return "lock";
  }

  return undefined;
}

export default function JournalPage() {
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [snapshot, setSnapshot] = useState<SnapshotState>(defaultSnapshot);
  const [toast, setToast] = useState("");
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as JournalEntry[];
        const safeEntries = parsed
          .filter((entry) => entry.id && entry.content && entry.createdAt)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEntries(safeEntries);
      } catch {
        setEntries([]);
      }
    }

    const rawSnapshot = window.localStorage.getItem(SNAPSHOT_STORAGE_KEY);

    if (rawSnapshot) {
      try {
        const parsedSnapshot = JSON.parse(rawSnapshot) as SnapshotState;
        if (parsedSnapshot.direction && parsedSnapshot.friction && parsedSnapshot.recovery) {
          setSnapshot(parsedSnapshot);
        }
      } catch {
        setSnapshot(defaultSnapshot);
      }
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

  const alignmentSnapshot = useMemo(
    () => [
      { label: "Direction", value: snapshot.direction, choices: ["Stable", "Wavering", "Reversing"] as const },
      { label: "Friction", value: snapshot.friction, choices: ["Low", "Moderate", "High"] as const },
      { label: "Recovery", value: snapshot.recovery, choices: ["Strong", "Delayed"] as const }
    ],
    [snapshot.direction, snapshot.friction, snapshot.recovery]
  );

  const updateSnapshot = (label: "Direction" | "Friction" | "Recovery", value: string) => {
    setSnapshot((current) => {
      const next = {
        ...current,
        updatedAt: new Date().toISOString(),
        ...(label === "Direction" ? { direction: value as SnapshotState["direction"] } : {}),
        ...(label === "Friction" ? { friction: value as SnapshotState["friction"] } : {}),
        ...(label === "Recovery" ? { recovery: value as SnapshotState["recovery"] } : {})
      };
      window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

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
      createdAt: new Date().toISOString(),
      source: "journal",
      eventType: inferEventType({ id: "", content: content.trim(), tags: selectedTags, createdAt: new Date().toISOString() })
    };

    const nextEntries = [entry, ...entries];
    setEntries(nextEntries);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));

    if (entry.eventType) {
      const rawEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY);
      let parsedEvents: Array<{ id: string; eventType: AlignmentEventType; createdAt: string; entryId: string }> = [];

      if (rawEvents) {
        try {
          parsedEvents = JSON.parse(rawEvents) as Array<{
            id: string;
            eventType: AlignmentEventType;
            createdAt: string;
            entryId: string;
          }>;
        } catch {
          parsedEvents = [];
        }
      }

      const nextEvents = [
        {
          id: crypto.randomUUID(),
          eventType: entry.eventType,
          createdAt: entry.createdAt,
          entryId: entry.id
        },
        ...parsedEvents
      ].slice(0, 100);
      window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(nextEvents));
    }

    setContent("");
    setSelectedTags([]);
    setToast("Saved to journal.");
  };

  return (
    <MobileShell>
      <section className="space-y-5 pb-5">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-semibold text-[#003D7C]">Journal</h1>
          <p className="text-sm text-[#8A704C]">Private check-ins for Emotion Capture and Meaning Convergence.</p>
        </header>

        <section className="rounded-2xl border border-[#003D7C]/15 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8A704C]">Alignment snapshot</h2>
            <span className="text-xs text-slate-500">Update weekly or when your trajectory shifts</span>
          </div>
          <ul className="grid grid-cols-1 gap-2">
            {alignmentSnapshot.map((item) => (
              <li key={item.label} className="rounded-xl border border-[#8A704C]/25 bg-[#F7F7F2] px-3 py-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8A704C]">{item.label}</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-[#003D7C]/20 bg-white px-2 text-sm text-[#003D7C]"
                  onChange={(event) => updateSnapshot(item.label as "Direction" | "Friction" | "Recovery", event.target.value)}
                  value={item.value}
                >
                  {item.choices.map((choice) => (
                    <option key={`${item.label}-${choice}`} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">Last updated {formatDate(snapshot.updatedAt)}</p>
        </section>

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

        <section className="space-y-2.5" data-testid="journal-list">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8A704C]">Recent entries</h2>

          {entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#8A704C]/40 bg-white p-4 text-sm text-slate-500">
              No entries yet. Your first check-in will appear here.
            </p>
          ) : (
            <ul className="space-y-2.5">
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
                      <span className="rounded-full bg-slate-100 px-2 py-1 uppercase tracking-wide text-[10px] text-slate-600">
                        {entry.source ?? "journal"}
                      </span>
                      {entry.eventType ? (
                        <span className="rounded-full bg-[#003D7C]/10 px-2 py-1 uppercase tracking-wide text-[10px] text-[#003D7C]">
                          {entry.eventType}
                        </span>
                      ) : null}
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
