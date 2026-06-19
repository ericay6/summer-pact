import type { Badge } from "@/lib/badges";
import { cn } from "@/lib/utils";

export function BadgeShelf({
  badges,
  highlightIds = [],
  showLocked = true,
  className,
}: {
  badges: Badge[];
  highlightIds?: string[];
  showLocked?: boolean;
  className?: string;
}) {
  const visible = showLocked ? badges : badges.filter((b) => b.earned);
  if (visible.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {visible.map((b) => {
        const isNew = highlightIds.includes(b.id);
        return (
          <div
            key={b.id}
            title={`${b.title} — ${b.description}`}
            className={cn(
              "group relative flex items-center gap-1.5 rounded-2xl border px-2.5 py-1.5 text-xs font-semibold transition",
              b.earned
                ? "border-sunset-200 bg-sunset-50 text-sunset-700"
                : "border-sand-200 bg-sand-50 text-ink/35",
              isNew && "animate-pop-in ring-2 ring-sunset-300"
            )}
          >
            <span className={cn("text-base", !b.earned && "grayscale opacity-50")}>
              {b.emoji}
            </span>
            <span className="hidden sm:inline">{b.title}</span>
            {isNew && (
              <span className="chip absolute -right-2 -top-2 bg-berry-500 px-1.5 py-0.5 text-[9px] text-white">
                NEW
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
