// ──────────────────────────────────────────────────────────────────────────
// AI integration layer.
//
// For the MVP, every function here uses deterministic templates so the app
// works with zero API keys. Each function is shaped so you can later swap the
// body for a real Claude / OpenAI call WITHOUT touching the UI.
//
// Recommended upgrade path:
//   1. Move these to server actions / route handlers (keep keys server-side).
//   2. Replace the `// === LLM SWAP POINT ===` block with a fetch to your model.
//   3. Keep the same return shape so components don't change.
//
// Example (Claude):
//   const res = await fetch("https://api.anthropic.com/v1/messages", {
//     method: "POST",
//     headers: {
//       "x-api-key": process.env.ANTHROPIC_API_KEY!,
//       "anthropic-version": "2023-06-01",
//       "content-type": "application/json",
//     },
//     body: JSON.stringify({
//       model: "claude-opus-4-8",
//       max_tokens: 400,
//       messages: [{ role: "user", content: prompt }],
//     }),
//   });
// ──────────────────────────────────────────────────────────────────────────

import type { CheckIn, Goal } from "./types";
import { buildWeeklyReview, type WeeklyReviewData } from "./weekly-review";
import { generateBossFightFor, type BossFight } from "./boss-fights";
import { generateNudge, generateNudgeOptions } from "./nudges";
import { seededPick } from "./utils";

export interface SaveMeTask {
  fiveMinVersion: string;
  whyItMatters: string;
  messageToFriend: string;
  suggestedSprintMinutes: number;
}

/** Weekly review — currently deterministic from check-in data. */
export async function generateWeeklyReview(
  checkIns: CheckIn[],
  goals: Goal[],
  weekStart?: Date
): Promise<WeeklyReviewData> {
  // === LLM SWAP POINT ===
  // Pass the same `checkIns`/`goals` summary to your model and ask for a
  // kind-but-honest paragraph + structured stats. Return WeeklyReviewData.
  return buildWeeklyReview(checkIns, goals, weekStart);
}

/** Boss fight challenge for the upcoming week. */
export async function generateBossFight(
  lastWeekCheckIns: CheckIn[],
  goals: Goal[],
  weekSeed: string
): Promise<BossFight> {
  // === LLM SWAP POINT ===
  return generateBossFightFor(lastWeekCheckIns, goals, weekSeed);
}

const FIVE_MIN_TEMPLATES = [
  "Open the file and write one sentence (or one line of code). That's it.",
  "Set a 5-minute timer and do the smallest visible piece. Don't finish — just start.",
  "Do the warm-up version: read the last thing you wrote and fix one tiny thing.",
  "Lay out your stuff and do the first physical step. Momentum does the rest.",
];

const SPRINT_MINUTES = [5, 7, 10];

/** "Save me from myself" — shrink a goal into a 5-minute on-ramp. */
export async function generateSaveMeTask(
  goal: Goal,
  friendName?: string
): Promise<SaveMeTask> {
  // === LLM SWAP POINT ===
  // Prompt idea: "The user is stuck on goal X (why: ...). Give them a 5-minute
  // on-ramp, a one-line reminder of why it matters, and a text to send a friend."
  const seed = `${goal.id}-${new Date().toDateString()}`;
  const fiveMinVersion = seededPick(FIVE_MIN_TEMPLATES, seed);
  const suggestedSprintMinutes = seededPick(SPRINT_MINUTES, seed);
  const why =
    goal.why_it_matters?.trim() ||
    "Because the version of you that started this pact wanted it. That still counts.";

  return {
    fiveMinVersion: `You do not need to finish "${goal.title}". ${fiveMinVersion} Then send one screenshot — that's a full receipt.`,
    whyItMatters: why,
    messageToFriend: `Brain's being dramatic about "${goal.title}". Doing a ${suggestedSprintMinutes}-min sprint right now — proof incoming. Hold me to it. 🫡`,
    suggestedSprintMinutes,
  };
}

/** A supportive nudge message for a friend who's gone quiet. */
export async function generateNudgeMessage(
  toName: string,
  staleGoalTitle?: string
): Promise<string> {
  // === LLM SWAP POINT ===
  return generateNudge(toName, staleGoalTitle).message;
}

/** Several nudge options to choose from. */
export async function generateNudgeMessageOptions(
  toName: string,
  staleGoalTitle?: string,
  count = 3
): Promise<string[]> {
  return generateNudgeOptions(toName, staleGoalTitle, count).map((n) => n.message);
}
