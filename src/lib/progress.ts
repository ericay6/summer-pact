import { isWithinInterval, parseISO, startOfWeek } from "date-fns";
import type { CheckIn, Goal } from "./types";

/** Receipts submitted this calendar week (week starts Monday). */
export function receiptsThisWeek(
  checkIns: CheckIn[],
  today = new Date()
): CheckIn[] {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  return checkIns.filter((c) => {
    const d = parseISO(c.check_in_date);
    return isWithinInterval(d, { start: weekStart, end: today });
  });
}

export interface WeeklyProgress {
  done: number;
  target: number;
  pct: number; // 0..100
}

/**
 * Weekly progress as receipts-this-week vs. summed weekly targets of active goals.
 * Falls back to a sensible target of 5 if no goals have targets.
 */
export function weeklyProgress(
  checkIns: CheckIn[],
  goals: Goal[],
  today = new Date()
): WeeklyProgress {
  const done = receiptsThisWeek(checkIns, today).length;
  const activeGoals = goals.filter((g) => g.is_active);
  const target =
    activeGoals.reduce((sum, g) => sum + (g.weekly_target || 0), 0) || 5;
  const pct = Math.min(100, Math.round((done / target) * 100));
  return { done, target, pct };
}

/** XP progress toward a goal's xp_target. */
export function goalXpProgress(goal: Goal, checkIns: CheckIn[]): WeeklyProgress {
  const done = checkIns
    .filter((c) => c.goal_id === goal.id)
    .reduce((sum, c) => sum + c.xp_awarded, 0);
  const target = goal.xp_target || 200;
  const pct = Math.min(100, Math.round((done / target) * 100));
  return { done, target, pct };
}
