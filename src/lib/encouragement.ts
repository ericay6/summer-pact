// Context-aware, warm microcopy. Keeps the whole app speaking in one
// playful-but-kind voice instead of generic strings scattered around.

import { seededPick } from "./utils";

const TODAY_OPEN = [
  "No receipt yet today — your side quest is alive. Tiny proof counts.",
  "Fresh day, blank receipt. One small thing and you’re on the board.",
  "The summer arc waits for no one. Drop one tiny proof today.",
  "Today’s receipt is unwritten. Make it small, make it real.",
];

const TODAY_DONE = [
  "Today’s receipt is in. Certified locked in. 🔒",
  "Proof beats vibes — and you brought receipts today. 🧾",
  "Logged and legit. Future-you says thanks. 💛",
  "That’s a wrap on today. The streak lives on. 🔥",
];

const STREAK_FLAIR: Record<string, string> = {
  cold: "Every streak starts at day one. Today’s a great day one.",
  warm: "Three days deep — momentum is officially on your side.",
  hot: "You’re on a roll. This is what the arc looks like. 🔥",
  blazing: "A full week+. Certified summer legend behavior. 🌋",
};

const NUDGE_FOOTER = [
  "Receipts, not vibes.",
  "No zero days, but also no shame.",
  "Make the comeback easy.",
  "Tiny proof counts.",
  "Two friends, one good summer.",
];

export function todaysOpenLine(seed: string) {
  return seededPick(TODAY_OPEN, seed);
}

export function todaysDoneLine(seed: string) {
  return seededPick(TODAY_DONE, seed);
}

export function streakFlair(streak: number): string {
  if (streak >= 7) return STREAK_FLAIR.blazing;
  if (streak >= 3) return STREAK_FLAIR.hot;
  if (streak >= 1) return STREAK_FLAIR.warm;
  return STREAK_FLAIR.cold;
}

export function footerLine(seed: string) {
  return seededPick(NUDGE_FOOTER, seed);
}

export interface CompletionCopy {
  emoji: string;
  title: string;
  body: string;
}

/**
 * The celebration line after a receipt — tuned to effort + streak so it never
 * feels canned. Big effort gets a big reaction; tiny effort gets warm respect.
 */
export function completionCopy(opts: {
  effort: number;
  streak: number;
  goalTitle?: string;
  firstOfDay: boolean;
}): CompletionCopy {
  const { effort, streak, goalTitle, firstOfDay } = opts;
  const g = goalTitle ? `“${goalTitle}”` : "your goal";

  if (effort >= 5) {
    return {
      emoji: "🚀",
      title: "All-in. Absolutely massive.",
      body: `${g} just got the full-send treatment. That’s a receipt to brag about.`,
    };
  }
  if (effort === 1) {
    return {
      emoji: "🌱",
      title: "Showed up. That counts — fully.",
      body: `Tiny proof beats a zero day every single time. ${g} stays alive.`,
    };
  }
  if (streak >= 7) {
    return {
      emoji: "🌋",
      title: `${streak}-day streak. You’re unreal.`,
      body: `${g} is officially a habit now, not a hope.`,
    };
  }
  if (streak >= 3) {
    return {
      emoji: "🔥",
      title: `Streak alive: ${streak} days!`,
      body: `Momentum looks good on you. ${g} is moving.`,
    };
  }
  if (firstOfDay) {
    return {
      emoji: "🎉",
      title: "Receipt logged!",
      body: `Proof beats vibes. ${g} just got real today.`,
    };
  }
  return {
    emoji: "✨",
    title: "Another one in the books.",
    body: `Stacking receipts on ${g}. This is how summers get won.`,
  };
}
