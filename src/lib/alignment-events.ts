export type AlignmentSignal = "Lock" | "Slip" | "Recovery";

export type AlignmentEvent = {
  id: string;
  createdAt: string;
  meaning: string;
  microAdjustment: string;
  alignmentSignal: AlignmentSignal;
  source: "chat" | "journal";
  sparkId?: string;
  promotedToStar: boolean;
};

export const ALIGNMENT_EVENTS_STORAGE_KEY = "gaci-alignment-events";
export const JOURNAL_STORAGE_KEY = "gaci-journal-entries";
export const STARS_STORAGE_KEY = "gaci-constellation-stars";

export function readAlignmentEvents(): AlignmentEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(ALIGNMENT_EVENTS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AlignmentEvent[];
    return parsed
      .filter(
        (event) =>
          event.id &&
          event.createdAt &&
          event.meaning &&
          event.microAdjustment &&
          ["Lock", "Slip", "Recovery"].includes(event.alignmentSignal)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function writeAlignmentEvents(events: AlignmentEvent[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ALIGNMENT_EVENTS_STORAGE_KEY, JSON.stringify(events));
}
