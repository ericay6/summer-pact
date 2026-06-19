import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakBadge({
  streak,
  className,
}: {
  streak: number;
  className?: string;
}) {
  const hot = streak >= 3;
  return (
    <span
      className={cn(
        "chip",
        hot ? "bg-sunset-500 text-white" : "bg-sand-100 text-ink/70",
        className
      )}
      title={`${streak}-day streak`}
    >
      <Flame className={cn("h-3.5 w-3.5", hot && "fill-white")} />
      {streak} day{streak === 1 ? "" : "s"}
    </span>
  );
}
