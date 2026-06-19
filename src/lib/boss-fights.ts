import type { CheckIn, Goal } from "./types";
import { seededPick } from "./utils";

const BOSS_FIGHTS = [
  "Complete 3 deep work sessions before Friday.",
  "Submit 4 receipts with proof this week.",
  "Do your hardest goal first thing, 3 days in a row.",
  "Make a comeback: 2 small check-ins in the next 2 days.",
  "No-zero week: at least one tiny receipt every day.",
  "Beat last week's XP by 25%.",
  "Stack a 3-day streak before the weekend.",
  "Clear the goal you've been avoiding with one honest session.",
];

export interface BossFight {
  title: string;
  reward: string;
}

/**
 * Choose a boss fight tuned to last week's behavior.
 * Deterministic for the MVP; swap for an LLM via lib/ai.ts later.
 */
export function generateBossFightFor(
  lastWeekCheckIns: CheckIn[],
  goals: Goal[],
  weekSeed: string
): BossFight {
  const count = lastWeekCheckIns.length;
  const withProof = lastWeekCheckIns.filter((c) => c.proof_url).length;

  let title: string;
  if (count === 0) {
    title = "Make a comeback: 2 small check-ins in the next 2 days.";
  } else if (withProof === 0) {
    title = "Submit 4 receipts with proof this week.";
  } else if (count < 3) {
    title = "No-zero week: at least one tiny receipt every day.";
  } else {
    title = seededPick(BOSS_FIGHTS, weekSeed);
  }

  return {
    title,
    reward: "Bragging rights + a +50 XP victory bonus when you log the win.",
  };
}
