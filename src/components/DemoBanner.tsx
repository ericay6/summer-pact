"use client";

import { useState } from "react";
import { Info, RotateCcw, X } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resetDemo } from "@/lib/store";

export function DemoBanner() {
  const [hidden, setHidden] = useState(false);
  if (isSupabaseConfigured() || hidden) return null;

  return (
    <div className="border-b border-sunset-200 bg-sunset-50">
      <div className="container flex items-center justify-between gap-3 py-2 text-xs text-sunset-700">
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            <strong>Demo mode.</strong> Data is saved locally in your browser.
            Add Supabase keys to go live for two real people.
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => {
              if (confirm("Reset demo data to the seeded pact?")) resetDemo();
            }}
            className="flex items-center gap-1 rounded-full px-2 py-1 font-semibold hover:bg-sunset-100"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            onClick={() => setHidden(true)}
            className="rounded-full p-1 hover:bg-sunset-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
