"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";

type AlignmentEventType = "lock" | "slip" | "recovery";

type JournalEntry = {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  source?: "journal" | "chatbot";
  eventType?: AlignmentEventType;
};

type AlignmentEvent = {
  id: string;
  eventType: AlignmentEventType;
  createdAt: string;
  entryId?: string;
};

type PositionedEntry = JournalEntry & {
  x: number;
  y: number;
  ring: number;
};

const JOURNAL_STORAGE_KEY = "gaci-journal-entries";
const STARS_STORAGE_KEY = "gaci-constellation-stars";
const EVENTS_STORAGE_KEY = "gaci-alignment-events";
const CENTER = 150;

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function snippet(content: string) {
  return content.length > 120 ? `${content.slice(0, 120)}...` : content;
}

function getEntryTitle(content: string) {
  const normalized = content.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return "Untitled Spark";
  }

  const words = normalized.split(" ").slice(0, 5).join(" ");
  return words.length < normalized.length ? `${words}...` : words;
}

function positionFor(entry: JournalEntry, index: number, total: number): { x: number; y: number; ring: number } {
  const hash = Array.from(entry.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const tagWeight = Math.min(entry.tags.length, 3) * 6;
  const angle = ((Math.PI * 2) / Math.max(total, 1)) * index + (hash % 19) * 0.045;
  const ring = 64 + (hash % 36) - tagWeight;

  return {
    x: CENTER + Math.cos(angle) * ring,
    y: CENTER + Math.sin(angle) * ring,
    ring
  };
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

export default function ConstellationPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [starById, setStarById] = useState<Record<string, boolean>>({});
  const [activeTag, setActiveTag] = useState<string>("All");
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [selfEventState, setSelfEventState] = useState<AlignmentEventType | null>(null);

  useEffect(() => {
    const load = () => {
      const rawJournal = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
      const rawStars = window.localStorage.getItem(STARS_STORAGE_KEY);
      const rawEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY);

      if (rawStars) {
        try {
          setStarById(JSON.parse(rawStars) as Record<string, boolean>);
        } catch {
          setStarById({});
        }
      }

      if (rawJournal) {
        try {
          const parsed = JSON.parse(rawJournal) as JournalEntry[];
          const safe = parsed
            .filter((entry) => entry.id && entry.content && entry.createdAt)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 30);
          setEntries(safe);
        } catch {
          setEntries([]);
        }
      }

      const latestEntryEvent = rawJournal
        ? (() => {
            try {
              const parsed = JSON.parse(rawJournal) as JournalEntry[];
              return parsed
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((entry) => inferEventType(entry))
                .find(Boolean);
            } catch {
              return undefined;
            }
          })()
        : undefined;

      if (rawEvents) {
        try {
          const parsedEvents = JSON.parse(rawEvents) as AlignmentEvent[];
          const recentEvent = parsedEvents
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .find((event) => event.eventType);

          setSelfEventState((recentEvent?.eventType ?? latestEntryEvent ?? null) as AlignmentEventType | null);
          return;
        } catch {
          setSelfEventState((latestEntryEvent ?? null) as AlignmentEventType | null);
          return;
        }
      }

      setSelfEventState((latestEntryEvent ?? null) as AlignmentEventType | null);
    };

    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onStorage);
    };
  }, []);

  const tags = useMemo(() => {
    const uniqueTags = new Set<string>();
    entries.forEach((entry) => entry.tags.forEach((tag) => uniqueTags.add(tag)));
    return ["All", ...Array.from(uniqueTags)];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (activeTag === "All") {
      return entries;
    }

    return entries.filter((entry) => entry.tags.includes(activeTag));
  }, [activeTag, entries]);

  const positionedEntries = useMemo<PositionedEntry[]>(() => {
    return filteredEntries.map((entry, index) => ({
      ...entry,
      ...positionFor(entry, index, filteredEntries.length)
    }));
  }, [filteredEntries]);

  const toggleStar = (entryId: string) => {
    setStarById((current) => {
      const next = { ...current, [entryId]: !current[entryId] };
      window.localStorage.setItem(STARS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const selfClasses = `self-star-drift ${
    selfEventState === "lock"
      ? "self-star-lock"
      : selfEventState === "slip"
        ? "self-star-slip"
        : selfEventState === "recovery"
          ? "self-star-recovery"
          : ""
  }`;

  return (
    <MobileShell>
      <section className="space-y-5 pb-5">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-semibold text-[#003D7C]">Constellation</h1>
          <p className="text-sm text-[#8A704C]">Your life-trajectory map of sparks, stars, and your central self field.</p>
        </header>

        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = activeTag === tag;

            return (
              <li key={tag}>
                <button
                  className={`min-h-10 rounded-full border px-3 text-xs font-medium ${
                    active
                      ? "border-[#003D7C] bg-[#003D7C] text-white"
                      : "border-[#8A704C]/30 bg-white text-[#003D7C]"
                  }`}
                  onClick={() => setActiveTag(tag)}
                  type="button"
                >
                  {tag}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="rounded-3xl border border-[#003D7C]/20 bg-gradient-to-br from-[#002955] via-[#003D7C] to-[#285A95] p-4 text-white shadow-sm">
          {positionedEntries.length === 0 ? (
            <p className="rounded-2xl border border-white/30 bg-white/10 p-6 text-sm text-white/90">
              No Sparks yet for this filter. Add Journal entries to generate your map.
            </p>
          ) : (
            <svg aria-label="Constellation map" className="h-[320px] w-full" viewBox="0 0 300 300">
              <defs>
                <radialGradient id="selfGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8A704C" stopOpacity="0.95" />
                  <stop offset="55%" stopColor="#8A704C" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#8A704C" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="fieldGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F7F7F2" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F7F7F2" stopOpacity="0" />
                </radialGradient>
              </defs>

              {positionedEntries.map((entry) => (
                <circle
                  key={`${entry.id}-field`}
                  cx={entry.x}
                  cy={entry.y}
                  fill="url(#fieldGradient)"
                  r={entry.ring < 75 ? 24 : 18}
                />
              ))}

              <g className={selfClasses}>
                <circle className="self-star-pulse" cx={CENTER} cy={CENTER} fill="#8A704C" opacity="0.45" r="28" />
                <circle cx={CENTER} cy={CENTER} fill="url(#selfGlow)" r="22" />
                <circle cx={CENTER} cy={CENTER} fill="#8A704C" r="11" stroke="#F7F7F2" strokeWidth="2" />
              </g>

              {positionedEntries.map((entry) => {
                const isStar = Boolean(starById[entry.id]);

                return (
                  <g key={entry.id}>
                    <circle
                      cx={entry.x}
                      cy={entry.y}
                      fill={isStar ? "#8A704C" : "#003D7C"}
                      onClick={() => setActiveEntry(entry)}
                      r={isStar ? 7 : 4}
                      stroke={isStar ? "#F7F7F2" : "#ffffff"}
                      strokeWidth={isStar ? 2 : 1.2}
                      style={{ cursor: "pointer" }}
                    />
                    {isStar ? (
                      <circle
                        cx={entry.x}
                        cy={entry.y}
                        fill="none"
                        onClick={() => setActiveEntry(entry)}
                        r={10}
                        stroke="rgba(255,243,204,0.5)"
                        strokeWidth="1.2"
                        style={{ cursor: "pointer" }}
                      />
                    ) : null}
                  </g>
                );
              })}
            </svg>
          )}

          <div className="mt-3 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/90">
            <p>Self Star anchors the field. Sparks cluster by shared felt-state gravity. Promoted Stars hold brighter pull.</p>
            <p className="mt-1 text-white/80">Direction/Friction/Recovery reactions appear in your Self Star field.</p>
          </div>
        </div>
      </section>

      {activeEntry ? (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-900/45 p-3" role="dialog">
          <div className="w-full rounded-3xl bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#003D7C]">{getEntryTitle(activeEntry.content)}</p>
                <p className="text-xs text-slate-500">{formatDate(activeEntry.createdAt)}</p>
              </div>
              <button
                aria-label="Close detail"
                className="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-600"
                onClick={() => setActiveEntry(null)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {activeEntry.tags.length > 0 ? (
                activeEntry.tags.map((tag) => (
                  <span className="rounded-full bg-[#F7F7F2] px-2.5 py-1 text-xs font-medium text-[#8A704C]" key={`${activeEntry.id}-${tag}`}>
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No tags on this Spark.</span>
              )}
            </div>

            <p className="mb-4 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{snippet(activeEntry.content)}</p>

            <button
              className={`min-h-11 w-full rounded-xl px-4 text-sm font-semibold ${
                starById[activeEntry.id] ? "bg-[#003D7C] text-white" : "border border-[#003D7C]/30 bg-white text-[#003D7C]"
              }`}
              onClick={() => toggleStar(activeEntry.id)}
              type="button"
            >
              {starById[activeEntry.id] ? "Promoted to Star" : "Promote to Star"}
            </button>
          </div>
        </div>
      ) : null}
    </MobileShell>
  );
}
