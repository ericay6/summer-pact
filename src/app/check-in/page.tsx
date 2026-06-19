"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Upload,
  ImageIcon,
  X,
  ArrowRight,
  Sparkles,
  Flame,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/EmptyState";
import { Confetti } from "@/components/Confetti";
import { CountUp } from "@/components/CountUp";
import { BadgeShelf } from "@/components/BadgeShelf";
import { StreakBadge } from "@/components/StreakBadge";
import {
  MOODS,
  EFFORT_LABELS,
  CATEGORY_EMOJI,
  XP_BONUS_PROOF,
  XP_BONUS_NEXT_STEP,
} from "@/lib/constants";
import { calculateXp } from "@/lib/xp";
import { currentStreak } from "@/lib/streaks";
import { computeBadges } from "@/lib/badges";
import { completionCopy } from "@/lib/encouragement";
import {
  useDB,
  currentUser,
  goalsForUser,
  addCheckIn,
  uploadProof,
} from "@/lib/store";
import type { Mood } from "@/lib/types";

export default function CheckInPage() {
  return (
    <AppShell>
      <CheckInInner />
    </AppShell>
  );
}

interface Submitted {
  xp: number;
  effort: number;
  goalId: string;
  firstOfDay: boolean;
  beforeEarnedIds: string[];
}

function CheckInInner() {
  const db = useDB();
  const me = currentUser(db);
  const allMyGoals = goalsForUser(db, me.id);
  const goals = allMyGoals.filter((g) => g.is_active);

  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reflection, setReflection] = useState("");
  const [effort, setEffort] = useState(3);
  const [mood, setMood] = useState<Mood>("😊");
  const [blocker, setBlocker] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [proof, setProof] = useState<{ name: string; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const xp = useMemo(
    () =>
      calculateXp({
        effortLevel: effort,
        hasProof: Boolean(proof),
        hasNextStep: Boolean(tomorrow.trim()),
      }),
    [effort, proof, tomorrow]
  );

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadProof(file);
    setUploading(false);
    if (url) setProof({ name: file.name, url });
  }

  function submit() {
    if (!goalId || !reflection.trim()) return;
    const beforeCheckIns = db.checkIns.filter((c) => c.user_id === me.id);
    const beforeEarnedIds = computeBadges(beforeCheckIns, allMyGoals)
      .filter((b) => b.earned)
      .map((b) => b.id);
    const firstOfDay = !beforeCheckIns.some((c) => c.check_in_date === date);

    const ci = addCheckIn({
      goal_id: goalId,
      check_in_date: date,
      reflection: reflection.trim(),
      proof_url: proof?.url ?? null,
      effort_level: effort,
      mood,
      blocker: blocker.trim() || null,
      tomorrow_step: tomorrow.trim() || null,
    });
    if (ci)
      setSubmitted({
        xp: ci.xp_awarded,
        effort,
        goalId,
        firstOfDay,
        beforeEarnedIds,
      });
  }

  if (goals.length === 0) {
    return (
      <div>
        <PageHeader emoji="🧾" title="Submit a receipt" />
        <EmptyState
          emoji="🎯"
          title="Add a goal first"
          description="Receipts are proof against a goal. Create one and you’re ready to log."
          actionLabel="Create a goal"
          actionHref="/goals"
          tip="Even “read 5 pages” is a totally legit goal."
        />
      </div>
    );
  }

  if (submitted) {
    return (
      <SuccessScreen
        submitted={submitted}
        onReset={() => {
          setSubmitted(null);
          setReflection("");
          setBlocker("");
          setTomorrow("");
          setProof(null);
          setEffort(3);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        emoji="🧾"
        title="Today’s receipt"
        subtitle="Tiny proof counts. No zero days, but also no shame."
      />

      <Card>
        <CardBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Goal worked on</Label>
              <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {CATEGORY_EMOJI[g.category]} {g.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>What did you do today?</Label>
            <Textarea
              autoFocus
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Even one sentence. Drafted a paragraph, did a 10-min walk, fixed one bug…"
            />
          </div>

          {/* Effort */}
          <div>
            <Label>Effort level — be honest, all of it counts</Label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setEffort(n)}
                  className={`rounded-2xl border p-2 text-center transition ${
                    effort === n
                      ? "border-sunset-400 bg-sunset-50"
                      : "border-sand-200 hover:bg-sand-50"
                  }`}
                >
                  <div className="text-lg font-extrabold">{n}</div>
                  <div className="text-[10px] leading-tight text-ink/50">
                    {EFFORT_LABELS[n]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <Label>Mood check</Label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm transition ${
                    mood === m.value
                      ? "border-sunset-400 bg-sunset-50 font-semibold"
                      : "border-sand-200 hover:bg-sand-50"
                  }`}
                >
                  <span className="text-lg">{m.value}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Proof */}
          <div>
            <Label>Proof (optional) · +{XP_BONUS_PROOF} XP</Label>
            {proof ? (
              <div className="flex items-center justify-between rounded-2xl border border-lagoon-500/30 bg-lagoon-500/10 p-3">
                <span className="flex items-center gap-2 text-sm text-lagoon-600">
                  <ImageIcon className="h-4 w-4" /> {proof.name}
                </span>
                <button
                  onClick={() => setProof(null)}
                  className="rounded-xl p-1 text-ink/40 hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                className={`${buttonVariants({
                  variant: "secondary",
                })} w-full cursor-pointer ${uploading ? "pointer-events-none opacity-60" : ""}`}
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload a screenshot or photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFile}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Blocker (optional)</Label>
              <Input
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                placeholder="What got in the way?"
              />
            </div>
            <div>
              <Label>Tomorrow’s tiny step · +{XP_BONUS_NEXT_STEP} XP</Label>
              <Input
                value={tomorrow}
                onChange={(e) => setTomorrow(e.target.value)}
                placeholder="The smallest next move"
              />
            </div>
          </div>

          {/* XP preview + submit */}
          <div className="flex flex-col gap-3 rounded-2xl bg-sand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-ink/60">
              <div className="flex items-center gap-1.5 font-semibold text-ink">
                <Sparkles className="h-4 w-4 text-sunset-500" /> You’ll earn{" "}
                {xp.total} XP
              </div>
              <div className="mt-0.5 text-xs">
                {xp.base} base
                {xp.proofBonus ? ` · +${xp.proofBonus} proof` : ""}
                {xp.nextStepBonus ? ` · +${xp.nextStepBonus} next step` : ""}
              </div>
            </div>
            <Button size="lg" onClick={submit} disabled={!reflection.trim()}>
              Submit receipt 🧾
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function SuccessScreen({
  submitted,
  onReset,
}: {
  submitted: Submitted;
  onReset: () => void;
}) {
  const db = useDB();
  const me = currentUser(db);
  const goals = goalsForUser(db, me.id);
  const myCheckIns = db.checkIns.filter((c) => c.user_id === me.id);

  const goal = goals.find((g) => g.id === submitted.goalId);
  const streak = currentStreak(myCheckIns);
  const copy = completionCopy({
    effort: submitted.effort,
    streak,
    goalTitle: goal?.title,
    firstOfDay: submitted.firstOfDay,
  });

  const badgesNow = computeBadges(myCheckIns, goals);
  const newBadges = badgesNow.filter(
    (b) => b.earned && !submitted.beforeEarnedIds.includes(b.id)
  );

  return (
    <div className="mx-auto max-w-lg text-center">
      <Confetti />
      <div className="card card-pad animate-pop-in">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-sunset-100 to-berry-500/20 text-5xl animate-float">
          {copy.emoji}
        </div>
        <h1 className="text-2xl font-extrabold">{copy.title}</h1>
        <p className="mt-1 text-ink/60">{copy.body}</p>

        {/* XP reveal */}
        <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-2 rounded-3xl bg-sunset-50 py-5">
          <Sparkles className="h-6 w-6 text-sunset-500" />
          <CountUp
            value={submitted.xp}
            className="text-4xl font-extrabold text-sunset-600"
            suffix=" XP"
          />
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <StreakBadge streak={streak} />
          {streak >= 3 && (
            <span className="chip bg-sunset-100 text-sunset-700">
              <Flame className="h-3.5 w-3.5" /> Keep it going!
            </span>
          )}
        </div>

        {/* Newly earned badges */}
        {newBadges.length > 0 && (
          <div className="mt-6 rounded-3xl border border-sunset-200 bg-sunset-50/60 p-4">
            <div className="text-sm font-bold text-sunset-700">
              🎖️ New badge{newBadges.length > 1 ? "s" : ""} unlocked!
            </div>
            <BadgeShelf
              badges={newBadges}
              highlightIds={newBadges.map((b) => b.id)}
              className="mt-3 justify-center"
            />
          </div>
        )}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard" className={buttonVariants()}>
            Back to dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Button variant="secondary" onClick={onReset}>
            Log another
          </Button>
        </div>
        <p className="mt-4 text-xs text-ink/40">
          Receipts, not vibes. One down — your friend can see it now. 👀
        </p>
      </div>
    </div>
  );
}
