import { format, parseISO } from "date-fns";
import type { CheckIn, Goal, Profile } from "@/lib/types";
import { determineFriendStatus } from "@/lib/friend-status";
import { currentStreak } from "@/lib/streaks";
import { totalXp } from "@/lib/xp";
import { receiptsThisWeek } from "@/lib/progress";
import { XPBadge } from "./XPBadge";
import { StreakBadge } from "./StreakBadge";

const STATUS_STYLES: Record<string, string> = {
  "On fire": "bg-sunset-500 text-white",
  "Making a comeback": "bg-lagoon-500 text-white",
  "Needs a nudge": "bg-berry-500 text-white",
  "Quiet but not out": "bg-sand-200 text-ink/70",
};

export function FriendStatusCard({
  friend,
  checkIns,
  goals,
}: {
  friend: Profile;
  checkIns: CheckIn[];
  goals: Goal[];
}) {
  const status = determineFriendStatus(checkIns);
  const latest = checkIns[0];
  const latestGoal = latest
    ? goals.find((g) => g.id === latest.goal_id)
    : undefined;

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-berry-500/15 text-lg font-bold text-berry-500">
            {friend.display_name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-ink">{friend.display_name}</div>
            <span
              className={`chip mt-0.5 ${STATUS_STYLES[status.status]}`}
            >
              {status.emoji} {status.status}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <XPBadge xp={totalXp(checkIns)} size="sm" />
          <StreakBadge streak={currentStreak(checkIns)} />
        </div>
      </div>

      <p className="mt-3 text-sm text-ink/60">{status.blurb}</p>

      <div className="mt-3 rounded-2xl bg-sand-50 p-3">
        <div className="mb-1 text-xs font-semibold text-ink/40">
          Latest receipt
        </div>
        {latest ? (
          <div>
            <div className="text-sm font-medium text-ink/80">
              {latestGoal?.title ?? "A goal"} ·{" "}
              {format(parseISO(latest.check_in_date), "MMM d")}
            </div>
            <p className="text-sm text-ink/60">{latest.reflection}</p>
          </div>
        ) : (
          <p className="text-sm text-ink/50">
            No receipts yet — be the friend who sends the first nudge.
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink/50">
        <span>{receiptsThisWeek(checkIns).length} receipts this week</span>
        <span>{goals.filter((g) => g.is_active).length} active goals</span>
      </div>
    </div>
  );
}
