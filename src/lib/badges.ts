// Lightweight achievement system — pure functions over a user's check-ins and
// goals. Badges are a low-pressure way to celebrate effort and personality,
// not to rank people. Everyone can earn every badge.

import { differenceInCalendarDays, getHours, parseISO } from "date-fns";
import type { CheckIn, Goal } from "./types";
import { totalXp } from "./xp";
import { currentStreak, longestStreak } from "./streaks";

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
  /** 0..1 progress toward earning (for the "almost there" hint). */
  progress: number;
}

function maxReceiptsInAnyWeek(checkIns: CheckIn[]): number {
  const byWeek = new Map<string, Set<string>>();
  for (const c of checkIns) {
    const d = parseISO(c.check_in_date);
    // ISO-ish week key: year + week number via day math from epoch Monday.
    const key = String(Math.floor((d.getTime() / 86400000 + 3) / 7));
    if (!byWeek.has(key)) byWeek.set(key, new Set());
    byWeek.get(key)!.add(c.check_in_date);
  }
  let max = 0;
  byWeek.forEach((s) => (max = Math.max(max, s.size)));
  return max;
}

function hasComeback(checkIns: CheckIn[]): boolean {
  const dates = Array.from(new Set(checkIns.map((c) => c.check_in_date)))
    .map((d) => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime());
  for (let i = 1; i < dates.length; i++) {
    if (differenceInCalendarDays(dates[i], dates[i - 1]) >= 3) return true;
  }
  return false;
}

export function computeBadges(checkIns: CheckIn[], goals: Goal[]): Badge[] {
  const xp = totalXp(checkIns);
  const streak = currentStreak(checkIns);
  const longest = longestStreak(checkIns);
  const proofCount = checkIns.filter((c) => c.proof_url).length;
  const weekMax = maxReceiptsInAnyWeek(checkIns);
  const completedGoals = goals.filter((g) => !g.is_active).length;
  const hasEffort5 = checkIns.some((c) => c.effort_level === 5);
  const earlyBird = checkIns.some((c) => getHours(parseISO(c.created_at)) < 9);
  const nightOwl = checkIns.some((c) => getHours(parseISO(c.created_at)) >= 22);

  const def = (
    id: string,
    emoji: string,
    title: string,
    description: string,
    earned: boolean,
    progress: number
  ): Badge => ({ id, emoji, title, description, earned, progress: Math.min(1, progress) });

  return [
    def("first", "🧾", "First Receipt", "Logged your very first proof.", checkIns.length >= 1, checkIns.length / 1),
    def("streak3", "🔥", "Hot Streak", "Hit a 3-day streak.", longest >= 3, longest / 3),
    def("streak7", "🌋", "On Fire", "Hit a 7-day streak.", longest >= 7, longest / 7),
    def("proof5", "📸", "Proof Pro", "Attached proof to 5 receipts.", proofCount >= 5, proofCount / 5),
    def("xp100", "💯", "Century Club", "Earned 100 XP.", xp >= 100, xp / 100),
    def("xp500", "🚀", "High Roller", "Earned 500 XP.", xp >= 500, xp / 500),
    def("week", "🗓️", "Full Week", "5+ receipts in one week.", weekMax >= 5, weekMax / 5),
    def("effort5", "⚔️", "Full Send", "Logged a max-effort session.", hasEffort5, hasEffort5 ? 1 : 0),
    def("comeback", "📈", "Comeback Kid", "Returned after a few quiet days.", hasComeback(checkIns), hasComeback(checkIns) ? 1 : 0),
    def("finisher", "🏆", "Finisher", "Completed (archived) a goal.", completedGoals >= 1, completedGoals / 1),
    def("early", "🌅", "Early Bird", "Logged a receipt before 9am.", earlyBird, earlyBird ? 1 : 0),
    def("owl", "🦉", "Night Owl", "Logged a receipt after 10pm.", nightOwl, nightOwl ? 1 : 0),
  ];
}

export function earnedBadges(checkIns: CheckIn[], goals: Goal[]): Badge[] {
  return computeBadges(checkIns, goals).filter((b) => b.earned);
}

/** Returns the IDs newly present in `after` that weren't in `before`. */
export function newlyEarnedIds(before: Badge[], after: Badge[]): string[] {
  const had = new Set(before.filter((b) => b.earned).map((b) => b.id));
  return after.filter((b) => b.earned && !had.has(b.id)).map((b) => b.id);
}

/** The closest unearned badge, for a gentle "almost there" nudge. */
export function nextBadge(checkIns: CheckIn[], goals: Goal[]): Badge | null {
  const unearned = computeBadges(checkIns, goals)
    .filter((b) => !b.earned)
    .sort((a, b) => b.progress - a.progress);
  return unearned[0] ?? null;
}
