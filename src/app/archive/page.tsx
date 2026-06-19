"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Save, Trophy, Flame, Receipt, Sparkles, CheckCircle2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { ReceiptCard } from "@/components/ReceiptCard";
import {
  useDB,
  currentPact,
  pactMembers,
  checkInsForUser,
  goalsForUser,
  saveLetter,
  loadLetter,
} from "@/lib/store";
import { totalXp } from "@/lib/xp";
import { longestStreak } from "@/lib/streaks";
import type { CheckIn } from "@/lib/types";

export default function ArchivePage() {
  return (
    <AppShell>
      <ArchiveInner />
    </AppShell>
  );
}

function biggestComeback(checkIns: CheckIn[]): number {
  const dates = Array.from(new Set(checkIns.map((c) => c.check_in_date)))
    .map((d) => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime());
  let maxGap = 0;
  for (let i = 1; i < dates.length; i++) {
    const gap = differenceInCalendarDays(dates[i], dates[i - 1]);
    if (gap > maxGap) maxGap = gap;
  }
  return maxGap; // days survived between a lapse and a return
}

function ArchiveInner() {
  const db = useDB();
  const pact = currentPact(db);
  const members = pactMembers(db);

  const allCheckIns = members.flatMap((m) => checkInsForUser(db, m.id));
  const allGoals = members.flatMap((m) => goalsForUser(db, m.id));

  const totalReceipts = allCheckIns.length;
  const xp = totalXp(allCheckIns);
  const longest = Math.max(0, ...members.map((m) => longestStreak(checkInsForUser(db, m.id))));
  const comeback = biggestComeback(allCheckIns);

  const memorable = [...allCheckIns].sort((a, b) => b.xp_awarded - a.xp_awarded)[0];
  const memorableGoal = memorable
    ? allGoals.find((g) => g.id === memorable.goal_id)
    : undefined;

  const completedGoals = allGoals.filter((g) => !g.is_active);

  const [letter, setLetter] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLetter(loadLetter());
  }, []);

  function persist() {
    saveLetter(letter);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        emoji="📦"
        title="Summer archive"
        subtitle={
          pact
            ? `${pact.name} · the whole arc, receipts and all`
            : "The whole arc"
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBig icon={<Receipt className="h-6 w-6" />} value={totalReceipts} label="Total receipts" />
        <StatBig icon={<Trophy className="h-6 w-6" />} value={xp.toLocaleString()} label="Total XP" />
        <StatBig icon={<Flame className="h-6 w-6" />} value={`${longest}d`} label="Longest streak" />
        <StatBig icon={<Sparkles className="h-6 w-6" />} value={`${comeback}d`} label="Biggest comeback gap" />
      </div>

      {/* Memorable receipt */}
      {memorable && (
        <div>
          <h2 className="mb-2 text-lg font-bold">🏅 Most memorable receipt</h2>
          <ReceiptCard checkIn={memorable} goal={memorableGoal} />
        </div>
      )}

      {/* Goals completed */}
      <Card>
        <CardBody>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <CheckCircle2 className="h-5 w-5 text-lagoon-600" /> Goals completed
            (archived)
          </h2>
          {completedGoals.length === 0 ? (
            <p className="text-sm text-ink/50">
              None archived yet — the summer’s still going. Finish strong.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {completedGoals.map((g) => (
                <span key={g.id} className="chip bg-lagoon-500/10 text-lagoon-600">
                  ✅ {g.title}
                </span>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Letter to future me */}
      <Card className="bg-gradient-to-br from-sand-100 to-sunset-50">
        <CardBody>
          <h2 className="mb-1 text-lg font-bold">💌 Letter to future me</h2>
          <p className="mb-3 text-sm text-ink/55">
            Write something to the version of you reading this in September.
          </p>
          <Textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            placeholder="Dear future me, by the end of this summer I hope…"
            className="min-h-[140px] bg-white"
          />
          <div className="mt-3 flex justify-end">
            <Button variant={saved ? "lagoon" : "primary"} onClick={persist}>
              <Save className="h-4 w-4" /> {saved ? "Saved" : "Save letter"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <p className="pb-4 text-center text-sm text-ink/40">
        Receipts, not vibes. — {members.map((m) => m.display_name).join(" & ")}
      </p>
    </div>
  );
}

function StatBig({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <Card>
      <CardBody className="text-center">
        <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-sunset-100 text-sunset-600">
          {icon}
        </div>
        <div className="text-2xl font-extrabold">{value}</div>
        <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">
          {label}
        </div>
      </CardBody>
    </Card>
  );
}
