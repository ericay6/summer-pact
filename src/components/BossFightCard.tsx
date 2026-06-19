import { Swords } from "lucide-react";
import type { BossFight } from "@/lib/boss-fights";

export function BossFightCard({ bossFight }: { bossFight: BossFight }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-berry-500/20 bg-gradient-to-br from-berry-500 to-sunset-500 p-6 text-white shadow-cozy">
      <div className="absolute -right-6 -top-6 text-8xl opacity-15">⚔️</div>
      <div className="relative">
        <div className="chip mb-2 bg-white/20 text-white">
          <Swords className="h-3.5 w-3.5" /> This week’s boss fight
        </div>
        <h3 className="text-xl font-extrabold leading-snug">{bossFight.title}</h3>
        <p className="mt-2 text-sm text-white/85">{bossFight.reward}</p>
      </div>
    </div>
  );
}
