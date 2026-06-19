import {
  XP_BONUS_NEXT_STEP,
  XP_BONUS_PROOF,
  XP_BY_EFFORT,
} from "./constants";
import type { CheckIn } from "./types";

export interface XpInput {
  effortLevel: number;
  hasProof: boolean;
  hasNextStep: boolean;
}

export interface XpBreakdown {
  base: number;
  proofBonus: number;
  nextStepBonus: number;
  total: number;
}

/**
 * Calculate XP for a single receipt.
 *  - Effort 1..5 -> 5/10/20/35/50
 *  - +10 if proof uploaded
 *  - +15 if tomorrow's next step included
 */
export function calculateXp({
  effortLevel,
  hasProof,
  hasNextStep,
}: XpInput): XpBreakdown {
  const base = XP_BY_EFFORT[effortLevel] ?? 0;
  const proofBonus = hasProof ? XP_BONUS_PROOF : 0;
  const nextStepBonus = hasNextStep ? XP_BONUS_NEXT_STEP : 0;
  return {
    base,
    proofBonus,
    nextStepBonus,
    total: base + proofBonus + nextStepBonus,
  };
}

export function totalXp(checkIns: CheckIn[]): number {
  return checkIns.reduce((sum, c) => sum + (c.xp_awarded ?? 0), 0);
}

// Light "level" system for a touch of game feel.
export function levelForXp(xp: number): { level: number; into: number; need: number } {
  // Each level needs a bit more than the last.
  let level = 1;
  let need = 100;
  let remaining = xp;
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = Math.round(need * 1.25);
  }
  return { level, into: remaining, need };
}
