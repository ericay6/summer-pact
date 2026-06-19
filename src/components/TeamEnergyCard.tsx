import { Users, Sparkles } from "lucide-react";
import type { CheckIn, Goal, Profile } from "@/lib/types";
import { totalXp } from "@/lib/xp";
import { receiptsThisWeek } from "@/lib/progress";
import { cn } from "@/lib/utils";

interface Side {
  profile: Profile;
  checkIns: CheckIn[];
  goals: Goal[];
}

/**
 * Co-op framing: the two of you vs. the week, never vs. each other.
 * Shows a single shared bar split by who contributed what, plus a combined
 * XP pool. The whole point is "we're in this together".
 */
export function TeamEnergyCard({
  me,
  friend,
  className,
}: {
  me: Side;
  friend: Side | null;
  className?: string;
}) {
  const myWeek = receiptsThisWeek(me.checkIns).length;
  const friendWeek = friend ? receiptsThisWeek(friend.checkIns).length : 0;
  const combined = myWeek + friendWeek;

  const myTarget = me.goals
    .filter((g) => g.is_active)
    .reduce((s, g) => s + (g.weekly_target || 0), 0);
  const friendTarget = friend
    ? friend.goals.filter((g) => g.is_active).reduce((s, g) => s + (g.weekly_target || 0), 0)
    : 0;
  const target = Math.max(1, myTarget + friendTarget || 8);

  const combinedXp = totalXp(me.checkIns) + (friend ? totalXp(friend.checkIns) : 0);
  const pct = Math.min(100, Math.round((combined / target) * 100));
  const myPct = Math.min(100, Math.round((myWeek / target) * 100));
  const friendPct = Math.min(100, Math.round((friendWeek / target) * 100));

  const message = !friend
    ? "Invite your friend and this bar fills twice as fast."
    : combined === 0
    ? "Fresh week. Whoever logs first sets the tone — no pressure, all vibes."
    : pct >= 100
    ? "Weekly team goal smashed. The pact is THRIVING. 🎉"
    : friendWeek === 0
    ? `You’ve carried the team so far. A nudge might bring ${friend.profile.display_name} along.`
    : myWeek === 0
    ? `${friend.profile.display_name} is holding it down. Your turn to add to the pile.`
    : "Both of you are showing up. This is exactly the energy. 🤝";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-lagoon-500 to-lagoon-600 p-5 text-white shadow-cozy sm:p-6",
        className
      )}
    >
      <div className="absolute -right-4 -top-6 text-7xl opacity-15">🤝</div>
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Users className="h-4 w-4" /> Team energy this week
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div className="text-3xl font-extrabold">
            {combined}
            <span className="text-base font-semibold text-white/70"> / {target} receipts</span>
          </div>
          <div className="chip bg-white/20 text-white">
            <Sparkles className="h-3.5 w-3.5" /> {combinedXp.toLocaleString()} XP combined
          </div>
        </div>

        {/* Shared, split bar */}
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full bg-white transition-all duration-700"
            style={{ width: `${myPct}%` }}
            title={`You: ${myWeek}`}
          />
          <div
            className="h-full bg-sunset-300 transition-all duration-700"
            style={{ width: `${friendPct}%` }}
            title={`${friend?.profile.display_name ?? "Friend"}: ${friendWeek}`}
          />
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-white/85">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white" /> You · {myWeek}
          </span>
          {friend && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sunset-300" />
              {friend.profile.display_name} · {friendWeek}
            </span>
          )}
        </div>

        <p className="mt-3 text-sm text-white/90">{message}</p>
      </div>
    </div>
  );
}
