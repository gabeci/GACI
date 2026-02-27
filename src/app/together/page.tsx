"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";

type TogetherCard = {
  id: string;
  title: string;
  prompt: string;
  vibe: string;
  members: string;
};

const JOINED_STORAGE_KEY = "gaci-together-joined";

const featuredCard: TogetherCard = {
  id: "featured-deep-breath-reset",
  title: "Tonight's Reset Room",
  prompt: "Two-minute pause. Name one emotion and one value you want to protect tonight.",
  vibe: "Gentle accountability",
  members: "213 now"
};

const feedCards: TogetherCard[] = [
  {
    id: "focus-sprint-25",
    title: "25-min Focus Sprint",
    prompt: "Set one meaningful action for this hour and start together.",
    vibe: "Quiet momentum",
    members: "89 joining"
  },
  {
    id: "gratitude-thread",
    title: "Gratitude Thread",
    prompt: "Drop one specific person, place, or moment you're grateful for.",
    vibe: "Warm and reflective",
    members: "147 sharing"
  },
  {
    id: "anxiety-landing-zone",
    title: "Anxiety Landing Zone",
    prompt: "Name the feeling. Name what's in your control. Keep it short.",
    vibe: "Steady + private",
    members: "56 grounding"
  },
  {
    id: "hopeful-plans",
    title: "Hopeful Plans",
    prompt: "One small action that keeps your future self in view.",
    vibe: "Forward-looking",
    members: "122 planning"
  },
  {
    id: "evening-reflection",
    title: "Evening Reflection",
    prompt: "What meaning did today reveal? Keep it to a sentence.",
    vibe: "Soft close",
    members: "64 reflecting"
  }
];

function loadJoinedState() {
  if (typeof window === "undefined") {
    return {} as Record<string, boolean>;
  }

  const raw = window.localStorage.getItem(JOINED_STORAGE_KEY);

  if (!raw) {
    return {} as Record<string, boolean>;
  }

  try {
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {} as Record<string, boolean>;
  }
}

export default function TogetherPage() {
  const [joinedById, setJoinedById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setJoinedById(loadJoinedState());
  }, []);

  const joinedCount = useMemo(
    () => Object.values(joinedById).filter(Boolean).length,
    [joinedById]
  );

  const onToggleJoin = (cardId: string) => {
    setJoinedById((current) => {
      const next = { ...current, [cardId]: !current[cardId] };
      window.localStorage.setItem(JOINED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const renderCard = (card: TogetherCard, highlighted = false) => {
    const joined = Boolean(joinedById[card.id]);

    return (
      <article
        className={`rounded-3xl border p-4 shadow-sm ${
          highlighted
            ? "border-[#003D7C]/20 bg-gradient-to-br from-[#003D7C] to-[#285A95] text-white"
            : "border-[#8A704C]/20 bg-white"
        }`}
        key={card.id}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className={`text-xs uppercase tracking-wide ${highlighted ? "text-white/80" : "text-[#8A704C]"}`}>
              {card.vibe}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{card.title}</h2>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              highlighted ? "bg-white/20 text-white" : "bg-[#F7F7F2] text-[#8A704C]"
            }`}
          >
            {card.members}
          </span>
        </div>

        <p className={`text-sm leading-6 ${highlighted ? "text-white/90" : "text-slate-600"}`}>{card.prompt}</p>

        <button
          className={`mt-4 min-h-11 w-full rounded-2xl px-4 text-sm font-semibold transition ${
            joined
              ? highlighted
                ? "bg-white text-[#003D7C]"
                : "bg-[#003D7C] text-white"
              : highlighted
                ? "border border-white/70 bg-transparent text-white"
                : "border border-[#003D7C]/30 bg-white text-[#003D7C]"
          }`}
          onClick={() => onToggleJoin(card.id)}
          type="button"
        >
          {joined ? "Joined" : "Join"}
        </button>
      </article>
    );
  };

  return (
    <MobileShell>
      <section className="space-y-4 pb-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#003D7C]">Together</h1>
          <p className="text-sm text-[#8A704C]">Drop in when you want shared momentum. No gates, no pressure.</p>
        </header>

        <div className="rounded-2xl bg-[#F7F7F2] px-4 py-3 text-sm text-[#003D7C]">
          You joined <span className="font-semibold">{joinedCount}</span> room{joinedCount === 1 ? "" : "s"}.
        </div>

        {renderCard(featuredCard, true)}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8A704C]">Live rooms</h2>
          {feedCards.map((card) => renderCard(card))}
        </section>
      </section>
    </MobileShell>
  );
}
