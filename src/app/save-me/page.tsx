"use client";

import { useEffect, useRef, useState } from "react";
import { LifeBuoy, Play, Pause, RotateCcw, Heart, Send } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { NudgeCard } from "@/components/NudgeCard";
import { EmptyState } from "@/components/EmptyState";
import { CATEGORY_EMOJI } from "@/lib/constants";
import {
  useDB,
  currentUser,
  goalsForUser,
} from "@/lib/store";
import { generateSaveMeTask, type SaveMeTask } from "@/lib/ai";

export default function SaveMePage() {
  return (
    <AppShell>
      <SaveMeInner />
    </AppShell>
  );
}

function SaveMeInner() {
  const db = useDB();
  const me = currentUser(db);
  const goals = goalsForUser(db, me.id).filter((g) => g.is_active);

  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");
  const [task, setTask] = useState<SaveMeTask | null>(null);
  const [loading, setLoading] = useState(false);

  async function rescue() {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    setLoading(true);
    const t = await generateSaveMeTask(goal);
    setTask(t);
    setLoading(false);
  }

  if (goals.length === 0) {
    return (
      <div>
        <PageHeader emoji="🛟" title="Save me from myself" />
        <EmptyState
          emoji="🎯"
          title="Add a goal first"
          description="This button shrinks a scary goal into a 5-minute on-ramp. Add a goal and come back when you’re stuck."
          actionLabel="Create a goal"
          actionHref="/goals"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        emoji="🛟"
        title="Save me from myself"
        subtitle="Feeling unmotivated? Don’t finish the whole thing. Just start."
      />

      <Card className="mb-6">
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="label">Which goal is freaking you out?</label>
              <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {CATEGORY_EMOJI[g.category]} {g.title}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="berry" size="lg" onClick={rescue} disabled={loading}>
              <LifeBuoy className="h-5 w-5" />
              {loading ? "Rescuing…" : "Rescue me"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {task && (
        <div className="space-y-4 animate-pop-in">
          <Card className="bg-gradient-to-br from-berry-500 to-sunset-500 text-white">
            <CardBody>
              <div className="chip mb-2 bg-white/20 text-white">
                🪄 Your 5-minute version
              </div>
              <p className="text-lg font-bold leading-snug">{task.fiveMinVersion}</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-2 font-semibold text-ink/60">
                <Heart className="h-4 w-4 text-berry-500" /> Why this still matters
              </div>
              <p className="mt-1 text-ink/80">{task.whyItMatters}</p>
            </CardBody>
          </Card>

          <SprintTimer minutes={task.suggestedSprintMinutes} />

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink/50">
              <Send className="h-4 w-4" /> Tell your friend (accountability hack)
            </div>
            <NudgeCard message={task.messageToFriend} />
          </div>
        </div>
      )}
    </div>
  );
}

function SprintTimer({ minutes }: { minutes: number }) {
  const total = minutes * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(minutes * 60);
    setRunning(false);
  }, [minutes]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            setRunning(false);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = ((total - remaining) / total) * 100;
  const done = remaining === 0;

  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <div className="text-sm font-semibold text-ink/50">
            {done ? "Time’s up — you did the thing 🎉" : `${minutes}-minute sprint`}
          </div>
          <div className="font-mono text-4xl font-extrabold tabular-nums">
            {mm}:{ss}
          </div>
          <div className="mt-2 h-2 w-44 rounded-full bg-sand-200">
            <div
              className="h-full rounded-full bg-sunset-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {!done && (
            <Button onClick={() => setRunning((r) => !r)}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pause" : remaining === total ? "Start sprint" : "Resume"}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              setRunning(false);
              setRemaining(total);
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
