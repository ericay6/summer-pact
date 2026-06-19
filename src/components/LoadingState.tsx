export function LoadingState({ label = "Warming up the summer…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full bg-sunset-400 animate-bounce"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-ink/50">{label}</p>
    </div>
  );
}

/** A skeleton card used while the local store hydrates. */
export function SkeletonCard() {
  return (
    <div className="card card-pad animate-pulse">
      <div className="h-4 w-1/3 rounded bg-sand-200" />
      <div className="mt-3 h-3 w-2/3 rounded bg-sand-100" />
      <div className="mt-2 h-3 w-1/2 rounded bg-sand-100" />
    </div>
  );
}
