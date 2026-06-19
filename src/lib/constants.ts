import type { GoalCategory, Mood } from "./types";

export const APP_NAME = "Summer Pact";
export const APP_SLOGAN = "Receipts, not vibes.";
export const APP_TAGLINE =
  "A private summer accountability game for two friends.";

export const GOAL_CATEGORIES: GoalCategory[] = [
  "Fitness",
  "Research",
  "Coding",
  "Career",
  "School",
  "Creative",
  "Reading",
  "Health",
  "Social",
  "Other",
];

// A little flavor per category for cards / empty states.
export const CATEGORY_EMOJI: Record<GoalCategory, string> = {
  Fitness: "💪",
  Research: "🔬",
  Coding: "💻",
  Career: "🚀",
  School: "📚",
  Creative: "🎨",
  Reading: "📖",
  Health: "🌱",
  Social: "🫶",
  Other: "✨",
};

export const MOODS: { value: Mood; label: string }[] = [
  { value: "🔥", label: "Locked in" },
  { value: "😊", label: "Good" },
  { value: "😐", label: "Meh" },
  { value: "😮‍💨", label: "Drained" },
  { value: "😴", label: "Running on fumes" },
];

export const EFFORT_LABELS: Record<number, string> = {
  1: "Showed up",
  2: "A little something",
  3: "Solid session",
  4: "Really pushed",
  5: "Went all in",
};

// XP earned per effort level.
export const XP_BY_EFFORT: Record<number, number> = {
  1: 5,
  2: 10,
  3: 20,
  4: 35,
  5: 50,
};

export const XP_BONUS_PROOF = 10;
export const XP_BONUS_NEXT_STEP = 15;

// Default summer window (used when creating a pact).
export const DEFAULT_SUMMER_END = "2026-09-01";

// Playful copy reused around the app.
export const PLAYFUL_LINES = [
  "Your side quest is alive.",
  "Tiny proof counts.",
  "No zero days, but also no shame.",
  "Make the comeback easy.",
  "Receipts, not vibes.",
];
