import { differenceInCalendarDays, parseISO } from "date-fns";
import type { CheckIn } from "./types";

/** Unique sorted (desc) list of ISO dates a user checked in. */
function uniqueCheckInDates(checkIns: CheckIn[]): string[] {
  const set = new Set(checkIns.map((c) => c.check_in_date));
  return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
}

/**
 * Current streak = consecutive days with at least one receipt, counting back
 * from today (or yesterday, so a streak doesn't "break" before today's check-in).
 */
export function currentStreak(checkIns: CheckIn[], today = new Date()): number {
  const dates = uniqueCheckInDates(checkIns);
  if (dates.length === 0) return 0;

  let streak = 0;
  let cursor = today;

  // Allow the streak to be anchored to today OR yesterday.
  const mostRecent = parseISO(dates[0]);
  const gapToToday = differenceInCalendarDays(today, mostRecent);
  if (gapToToday > 1) return 0;
  if (gapToToday === 1) cursor = mostRecent; // last receipt was yesterday

  for (const iso of dates) {
    const date = parseISO(iso);
    const gap = differenceInCalendarDays(cursor, date);
    if (gap === 0) {
      streak += 1;
      cursor = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    } else if (gap === 1) {
      streak += 1;
      cursor = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }
  return streak;
}

/** Longest streak ever recorded. */
export function longestStreak(checkIns: CheckIn[]): number {
  const dates = uniqueCheckInDates(checkIns)
    .map((d) => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const gap = differenceInCalendarDays(dates[i], dates[i - 1]);
    if (gap === 1) {
      run += 1;
      best = Math.max(best, run);
    } else if (gap === 0) {
      // same day, ignore
    } else {
      run = 1;
    }
  }
  return best;
}

/** How many days since the last receipt (0 = today). null if never. */
export function daysSinceLastCheckIn(
  checkIns: CheckIn[],
  today = new Date()
): number | null {
  const dates = uniqueCheckInDates(checkIns);
  if (dates.length === 0) return null;
  return differenceInCalendarDays(today, parseISO(dates[0]));
}
