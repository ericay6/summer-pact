import type { CheckIn, FriendStatus } from "./types";
import { currentStreak, daysSinceLastCheckIn } from "./streaks";
import { receiptsThisWeek } from "./progress";

export interface FriendStatusResult {
  status: FriendStatus;
  emoji: string;
  blurb: string;
}

/**
 * Determine a playful, non-shaming status label from recent activity.
 *  - On fire: active streak >= 3 OR 4+ receipts this week
 *  - Making a comeback: checked in today/yesterday after a 2+ day gap before that
 *  - Needs a nudge: 2+ days since last receipt
 *  - Quiet but not out: everything else (low but present)
 */
export function determineFriendStatus(
  checkIns: CheckIn[],
  today = new Date()
): FriendStatusResult {
  const streak = currentStreak(checkIns, today);
  const sinceLast = daysSinceLastCheckIn(checkIns, today);
  const week = receiptsThisWeek(checkIns, today).length;

  if (sinceLast === null) {
    return {
      status: "Quiet but not out",
      emoji: "🌙",
      blurb: "Hasn't dropped a first receipt yet. The arc awaits.",
    };
  }

  if (streak >= 3 || week >= 4) {
    return {
      status: "On fire",
      emoji: "🔥",
      blurb: "Stacking receipts like it's nothing. Certified locked in.",
    };
  }

  if (sinceLast >= 2) {
    return {
      status: "Needs a nudge",
      emoji: "👀",
      blurb: "It's been a couple quiet days. A tiny proof would land well.",
    };
  }

  // Recently active after a gap = comeback.
  if (streak <= 2 && week >= 1 && sinceLast <= 1) {
    return {
      status: "Making a comeback",
      emoji: "📈",
      blurb: "Back on the board. Comebacks count double in spirit.",
    };
  }

  return {
    status: "Quiet but not out",
    emoji: "🌙",
    blurb: "Low-key but still in the pact. No zero days, no shame.",
  };
}
