import { cn } from "@/lib/utils";

/** Simple SVG progress ring. */
export function ProgressRing({
  value,
  size = 84,
  stroke = 9,
  className,
  label,
  sublabel,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  className?: string;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-sand-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-sunset-500 transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold leading-none">{label ?? `${pct}%`}</span>
        {sublabel && (
          <span className="mt-0.5 text-[10px] font-medium text-ink/50">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

/** Inline horizontal progress bar alternative. */
export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2.5 w-full rounded-full bg-sand-200", className)}>
      <div
        className="h-full rounded-full bg-sunset-500 transition-[width] duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
