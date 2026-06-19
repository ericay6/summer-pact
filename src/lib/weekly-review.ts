import {
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from "date-fns";
import type { CheckIn, Goal } from "./types";

export interface WeeklyReviewData {
  weekLabel: string;
  weekStart: string;
  receiptCount: number;
  xpEarned: number;
  strongestGoal: { title: string; xp: number } | null;
  mostAvoidedGoal: { title: string } | null;
  commonBlocker: string | null;
  bestDay: { date: string; label: string; xp: number } | null;
  reflection: string;
}

const DAY_LABEL = "EEEE"; // e.g. "Tuesday"

export function checkInsForWeek(
  checkIns: CheckIn[],
  weekStart: Date
): CheckIn[] {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const end = endOfWeek(weekStart, { weekStartsOn: 1 });
  return checkIns.filter((c) =>
    isWithinInterval(parseISO(c.check_in_date), { start, end })
  );
}

/**
 * Deterministic weekly recap. The kind-but-honest reflection is templated
 * here; lib/ai.ts shows where to swap in an LLM for richer prose.
 */
export function buildWeeklyReview(
  allCheckIns: CheckIn[],
  goals: Goal[],
  weekStartInput = new Date()
): WeeklyReviewData {
  const start = startOfWeek(weekStartInput, { weekStartsOn: 1 });
  const week = checkInsForWeek(allCheckIns, start);

  const xpEarned = week.reduce((s, c) => s + c.xp_awarded, 0);

  // XP per goal -> strongest.
  const xpByGoal = new Map<string, number>();
  for (const c of week) {
    xpByGoal.set(c.goal_id, (xpByGoal.get(c.goal_id) ?? 0) + c.xp_awarded);
  }
  let strongestGoal: WeeklyReviewData["strongestGoal"] = null;
  for (const [goalId, xp] of Array.from(xpByGoal.entries())) {
    const g = goals.find((x) => x.id === goalId);
    if (g && (!strongestGoal || xp > strongestGoal.xp)) {
      strongestGoal = { title: g.title, xp };
    }
  }

  // Most avoided: active goal with the fewest receipts this week.
  const activeGoals = goals.filter((g) => g.is_active);
  let mostAvoidedGoal: WeeklyReviewData["mostAvoidedGoal"] = null;
  if (activeGoals.length > 0) {
    const sorted = [...activeGoals].sort((a, b) => {
      const ca = week.filter((c) => c.goal_id === a.id).length;
      const cb = week.filter((c) => c.goal_id === b.id).length;
      return ca - cb;
    });
    const least = sorted[0];
    const leastCount = week.filter((c) => c.goal_id === least.id).length;
    const topCount = Math.max(
      0,
      ...activeGoals.map((g) => week.filter((c) => c.goal_id === g.id).length)
    );
    if (leastCount < topCount) mostAvoidedGoal = { title: least.title };
  }

  // Common blocker.
  const blockerCounts = new Map<string, number>();
  for (const c of week) {
    if (c.blocker && c.blocker.trim()) {
      const key = c.blocker.trim().toLowerCase();
      blockerCounts.set(key, (blockerCounts.get(key) ?? 0) + 1);
    }
  }
  let commonBlocker: string | null = null;
  let blockerMax = 0;
  for (const [b, n] of Array.from(blockerCounts.entries())) {
    if (n > blockerMax) {
      blockerMax = n;
      commonBlocker = b;
    }
  }

  // Best day by XP.
  const xpByDay = new Map<string, number>();
  for (const c of week) {
    xpByDay.set(c.check_in_date, (xpByDay.get(c.check_in_date) ?? 0) + c.xp_awarded);
  }
  let bestDay: WeeklyReviewData["bestDay"] = null;
  for (const [date, xp] of Array.from(xpByDay.entries())) {
    if (!bestDay || xp > bestDay.xp) {
      bestDay = { date, label: format(parseISO(date), DAY_LABEL), xp };
    }
  }

  const reflection = buildReflection({
    receiptCount: week.length,
    xpEarned,
    strongestGoal,
    mostAvoidedGoal,
    commonBlocker,
    bestDay,
  });

  return {
    weekLabel: `Week of ${format(start, "MMM d")}`,
    weekStart: format(start, "yyyy-MM-dd"),
    receiptCount: week.length,
    xpEarned,
    strongestGoal,
    mostAvoidedGoal,
    commonBlocker,
    bestDay,
    reflection,
  };
}

function buildReflection(d: {
  receiptCount: number;
  xpEarned: number;
  strongestGoal: WeeklyReviewData["strongestGoal"];
  mostAvoidedGoal: WeeklyReviewData["mostAvoidedGoal"];
  commonBlocker: string | null;
  bestDay: WeeklyReviewData["bestDay"];
}): string {
  if (d.receiptCount === 0) {
    return "Quiet week — and that's allowed. The pact isn't about perfect, it's about not disappearing. One tiny receipt resets everything. Make the comeback easy.";
  }

  const parts: string[] = [];
  parts.push(
    `You logged ${d.receiptCount} receipt${d.receiptCount === 1 ? "" : "s"} for ${d.xpEarned} XP — that's real, that happened.`
  );
  if (d.strongestGoal) {
    parts.push(`"${d.strongestGoal.title}" carried the week. Clearly something's clicking there.`);
  }
  if (d.mostAvoidedGoal) {
    parts.push(
      `Honest note: "${d.mostAvoidedGoal.title}" got the cold shoulder. No shame — just give it one small opening next week.`
    );
  }
  if (d.commonBlocker) {
    parts.push(`Your recurring snag was "${d.commonBlocker}". Worth naming it out loud and planning around it.`);
  }
  if (d.bestDay) {
    parts.push(`${d.bestDay.label} was your peak. Whatever you did that day, do that again.`);
  }
  return parts.join(" ");
}
