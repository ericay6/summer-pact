import Link from "next/link";
import { Button, buttonVariants } from "./ui/Button";

export function EmptyState({
  emoji = "🌅",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  tip,
}: {
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  /** A small playful "psst" line under the action. */
  tip?: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-sand-300 bg-white/60 px-6 py-12 text-center">
      {/* soft summer glow */}
      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-sunset-200/40 blur-3xl" />
      <div className="relative">
        <div className="mb-3 inline-grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-sand-100 to-sunset-100 text-3xl animate-float">
          {emoji}
        </div>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink/60">{description}</p>
        {actionLabel && actionHref && (
          <Link href={actionHref} className={`${buttonVariants()} mt-5`}>
            {actionLabel}
          </Link>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button className="mt-5" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {tip && (
          <p className="mt-4 text-xs font-medium text-sunset-600/80">✨ {tip}</p>
        )}
      </div>
    </div>
  );
}
