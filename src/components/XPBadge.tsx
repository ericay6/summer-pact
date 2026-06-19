import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function XPBadge({
  xp,
  className,
  size = "md",
}: {
  xp: number;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "chip bg-sunset-100 text-sunset-700",
        size === "sm" ? "text-xs" : "text-sm px-3.5 py-1.5",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {xp.toLocaleString()} XP
    </span>
  );
}
