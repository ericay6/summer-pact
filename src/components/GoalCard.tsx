import { Archive, RotateCcw, Target, Pencil } from "lucide-react";
import { CATEGORY_EMOJI } from "@/lib/constants";
import type { Goal } from "@/lib/types";
import { ProgressBar } from "./ProgressRing";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

export function GoalCard({
  goal,
  xpDone,
  receiptsThisWeek,
  onArchive,
  onReactivate,
  onEdit,
}: {
  goal: Goal;
  xpDone?: number;
  receiptsThisWeek?: number;
  onArchive?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onEdit?: (goal: Goal) => void;
}) {
  const xpPct = goal.xp_target
    ? Math.min(100, Math.round(((xpDone ?? 0) / goal.xp_target) * 100))
    : 0;

  return (
    <div
      className={cn(
        "card card-pad flex flex-col gap-3",
        !goal.is_active && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sand-100 text-xl">
            {CATEGORY_EMOJI[goal.category]}
          </div>
          <div>
            <h3 className="font-bold leading-tight text-ink">{goal.title}</h3>
            <span className="chip mt-1 bg-sand-100 text-ink/60">
              {goal.category}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {onEdit && goal.is_active && (
            <button
              onClick={() => onEdit(goal)}
              className="rounded-xl p-2 text-ink/40 hover:bg-sand-100 hover:text-ink"
              aria-label="Edit goal"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onArchive && goal.is_active && (
            <button
              onClick={() => onArchive(goal.id)}
              className="rounded-xl p-2 text-ink/40 hover:bg-sand-100 hover:text-ink"
              aria-label="Archive goal"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
          {onReactivate && !goal.is_active && (
            <Button size="sm" variant="secondary" onClick={() => onReactivate(goal.id)}>
              <RotateCcw className="h-4 w-4" /> Reactivate
            </Button>
          )}
        </div>
      </div>

      {goal.why_it_matters && (
        <p className="text-sm italic text-ink/60">“{goal.why_it_matters}”</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl bg-sand-50 px-3 py-2">
          <div className="font-semibold text-ink/40">Minimum win</div>
          <div className="text-ink/80">{goal.minimum_success || "—"}</div>
        </div>
        <div className="rounded-2xl bg-sand-50 px-3 py-2">
          <div className="font-semibold text-ink/40">Dream win</div>
          <div className="text-ink/80">{goal.dream_success || "—"}</div>
        </div>
      </div>

      {goal.is_active && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-ink/50">
            <span className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" /> {xpDone ?? 0}/{goal.xp_target} XP
            </span>
            <span>
              {receiptsThisWeek ?? 0}/{goal.weekly_target} this week
            </span>
          </div>
          <ProgressBar value={xpPct} />
        </div>
      )}
    </div>
  );
}
