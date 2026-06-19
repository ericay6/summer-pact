import type { Goal, Profile } from "./types";
import { seededPick, uid } from "./utils";

// Supportive, never shaming. Playful first, guilt never.
const NUDGE_TEMPLATES: ((name: string, goal?: string) => string)[] = [
  (n) => `No judgment, but your side quest is getting dusty. 25-minute sprint today, ${n}?`,
  (n) => `Your summer arc is not cancelled, ${n}. Tiny task tonight?`,
  () => `Receipts, not vibes. Send one tiny proof before midnight? 🧾`,
  (n, g) =>
    g
      ? `Hey ${n} — "${g}" misses you. Open it for 7 minutes, that's a full receipt.`
      : `Hey ${n} — one small thing counts as a full receipt. Go grab it.`,
  (n) => `${n}, comebacks are kind of your thing. Make today an easy one. 📈`,
  () => `Lowest-effort win available: open the file, do one line, screenshot it. Done.`,
  (n) => `Not a lecture, just a wave 👋 — a 2-minute check-in keeps the streak dream alive, ${n}.`,
];

export interface GeneratedNudge {
  message: string;
}

export function generateNudge(
  toName: string,
  staleGoalTitle?: string
): GeneratedNudge {
  const seed = `${toName}-${staleGoalTitle ?? ""}-${new Date().toDateString()}`;
  const template = seededPick(NUDGE_TEMPLATES, seed);
  return { message: template(toName, staleGoalTitle) };
}

/** A few options at once so the user can pick a vibe. */
export function generateNudgeOptions(
  toName: string,
  staleGoalTitle?: string,
  count = 3
): GeneratedNudge[] {
  const shuffled = [...NUDGE_TEMPLATES]
    .map((t) => ({ t, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .slice(0, count)
    .map(({ t }) => ({ message: t(toName, staleGoalTitle) }));
  return shuffled;
}

export function buildNudgeRecord(params: {
  fromUserId: string;
  toUser: Profile;
  pactId: string;
  message: string;
}) {
  return {
    id: uid("nudge"),
    from_user_id: params.fromUserId,
    to_user_id: params.toUser.id,
    pact_id: params.pactId,
    message: params.message,
    copied: false,
    created_at: new Date().toISOString(),
  };
}

/** Suggest the goal most worth nudging about (oldest active, simple heuristic). */
export function staleGoalFor(goals: Goal[]): Goal | undefined {
  return goals.filter((g) => g.is_active)[0];
}
