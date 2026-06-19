import { format, parseISO } from "date-fns";
import { ArrowRight, ImageIcon, OctagonAlert } from "lucide-react";
import type { CheckIn, Goal } from "@/lib/types";
import { CATEGORY_EMOJI, EFFORT_LABELS } from "@/lib/constants";
import { XPBadge } from "./XPBadge";

export function ReceiptCard({
  checkIn,
  goal,
  compact = false,
}: {
  checkIn: CheckIn;
  goal?: Goal;
  compact?: boolean;
}) {
  return (
    <div className="card card-pad flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{goal ? CATEGORY_EMOJI[goal.category] : "🧾"}</span>
          <div>
            <div className="text-sm font-bold leading-tight text-ink">
              {goal?.title ?? "Receipt"}
            </div>
            <div className="text-xs text-ink/40">
              {format(parseISO(checkIn.check_in_date), "EEE, MMM d")} ·{" "}
              {EFFORT_LABELS[checkIn.effort_level]} {checkIn.mood}
            </div>
          </div>
        </div>
        <XPBadge xp={checkIn.xp_awarded} size="sm" />
      </div>

      {checkIn.reflection && (
        <p className="text-sm text-ink/80">{checkIn.reflection}</p>
      )}

      {!compact && (
        <div className="flex flex-wrap gap-2 text-xs">
          {checkIn.proof_url && (
            <span className="chip bg-lagoon-500/10 text-lagoon-600">
              <ImageIcon className="h-3.5 w-3.5" /> Proof attached
            </span>
          )}
          {checkIn.blocker && (
            <span className="chip bg-berry-500/10 text-berry-500">
              <OctagonAlert className="h-3.5 w-3.5" /> {checkIn.blocker}
            </span>
          )}
          {checkIn.tomorrow_step && (
            <span className="chip bg-sand-100 text-ink/60">
              <ArrowRight className="h-3.5 w-3.5" /> {checkIn.tomorrow_step}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
