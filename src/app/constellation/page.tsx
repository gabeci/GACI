"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";

type JournalEntry = {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
};

type PositionedEntry = JournalEntry & {
  x: number;
  y: number;
};

const JOURNAL_STORAGE_KEY = "gaci-journal-entries";
const STARS_STORAGE_KEY = "gaci-constellation-stars";

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

function positionFor(entry: JournalEntry, index: number, total: number): { x: number; y: number } {
  const hash = Array.from(entry.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angle = ((Math.PI * 2) / Math.max(total, 1)) * index + (hash % 13) * 0.05;
  const ring = 55 + (hash % 35);
  const cx = 150;
  const cy = 150;

  return {
    x: cx + Math.cos(angle) * ring,
    y: cy + Math.sin(angle) * ring
  };
}

export default function ConstellationPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [starById, setStarById] = useState<Record<string, boolean>>({});
  const [activeTag, setActiveTag] = useState<string>("All");
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const rawJournal = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
    const rawStars = window.localStorage.getItem(STARS_STORAGE_KEY);

    if (rawStars) {
      try {
        setStarById(JSON.parse(rawStars) as Record<string, boolean>);
      } catch {
        setStarById({});
      }
    }

    if (!rawJournal) {
      return;
    }

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

  return (
    <MobileShell>
      <section className="space-y-4 pb-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#003D7C]">Constellation</h1>
          <p className="text-sm text-[#8A704C]">Your life-trajectory map of sparks and promoted stars.</p>
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
              {positionedEntries.map((entry, index) => {
                const nextEntry = positionedEntries[index + 1];
                if (!nextEntry) {
                  return null;
                }

                return (
                  <line
                    key={`${entry.id}-line`}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="1"
                    x1={entry.x}
                    x2={nextEntry.x}
                    y1={entry.y}
                    y2={nextEntry.y}
                  />
                );
              })}

              {positionedEntries.map((entry) => {
                const isStar = Boolean(starById[entry.id]);

                return (
                  <g key={entry.id}>
                    <circle
                      cx={entry.x}
                      cy={entry.y}
                      fill={isStar ? "#FFD166" : "#D7E6FF"}
                      onClick={() => setActiveEntry(entry)}
                      r={isStar ? 6.5 : 4.5}
                      stroke={isStar ? "#FFF3CC" : "#ffffff"}
                      strokeWidth="1.5"
                      style={{ cursor: "pointer" }}
                    />
                  </g>
                );
              })}
            </svg>
          )}
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
                starById[activeEntry.id]
                  ? "bg-[#003D7C] text-white"
                  : "border border-[#003D7C]/30 bg-white text-[#003D7C]"
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
