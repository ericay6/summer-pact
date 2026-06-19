"use client";

import { useMemo } from "react";

const PIECES = ["🎉", "🧾", "⭐️", "🔥", "💛", "✨", "🌟", "🥳"];
const COLORS = ["#f25a1b", "#2dd4bf", "#e84d92", "#fba572", "#fbbf24"];

/**
 * Lightweight, dependency-free confetti burst. Renders ~28 emoji/dots that
 * fall once via a CSS keyframe (see globals.css `confetti-fall`).
 */
export function Confetti({ count = 28 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const useEmoji = i % 2 === 0;
        return {
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 1.8 + Math.random() * 1.4,
          drift: (Math.random() - 0.5) * 120,
          rotate: Math.random() * 360,
          emoji: useEmoji ? PIECES[i % PIECES.length] : null,
          color: COLORS[i % COLORS.length],
          size: 10 + Math.random() * 12,
        };
      }),
    [count]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute top-[-10%] animate-[confetti-fall_var(--d)_ease-in_forwards]"
          style={
            {
              left: `${b.left}%`,
              fontSize: b.emoji ? `${b.size + 6}px` : undefined,
              width: b.emoji ? undefined : b.size,
              height: b.emoji ? undefined : b.size,
              background: b.emoji ? undefined : b.color,
              borderRadius: b.emoji ? undefined : 2,
              ["--d" as string]: `${b.duration}s`,
              ["--drift" as string]: `${b.drift}px`,
              ["--rot" as string]: `${b.rotate}deg`,
              animationDelay: `${b.delay}s`,
            } as React.CSSProperties
          }
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );
}
