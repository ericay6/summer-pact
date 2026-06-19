"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Hand } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NudgeCard } from "@/components/NudgeCard";
import { EmptyState } from "@/components/EmptyState";
import {
  useDB,
  friendProfile,
  goalsForUser,
  checkInsForUser,
  addNudge,
  markNudgeCopied,
} from "@/lib/store";
import { daysSinceLastCheckIn } from "@/lib/streaks";
import { determineFriendStatus } from "@/lib/friend-status";
import { staleGoalFor } from "@/lib/nudges";
import { generateNudgeMessageOptions } from "@/lib/ai";

export default function NudgesPage() {
  return (
    <AppShell>
      <NudgesInner />
    </AppShell>
  );
}

function NudgesInner() {
  const db = useDB();
  const friend = friendProfile(db);
  const friendCheckIns = friend ? checkInsForUser(db, friend.id) : [];
  const friendGoals = friend ? goalsForUser(db, friend.id) : [];
  const sinceLast = daysSinceLastCheckIn(friendCheckIns);
  const status = friend ? determineFriendStatus(friendCheckIns) : null;
  const needsNudge = sinceLast !== null && sinceLast >= 2;

  const [messages, setMessages] = useState<string[]>([]);

  async function regenerate() {
    if (!friend) return;
    const stale = staleGoalFor(friendGoals);
    const opts = await generateNudgeMessageOptions(
      friend.display_name,
      stale?.title,
      3
    );
    setMessages(opts);
  }

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friend?.id]);

  if (!friend) {
    return (
      <div>
        <PageHeader emoji="👋" title="Nudges" />
        <EmptyState
          emoji="🤝"
          title="No pact partner yet"
          description="Once your friend joins, you can send supportive nudges when they go quiet."
          actionLabel="Invite a friend"
          actionHref="/pact"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        emoji="👋"
        title="Send a nudge"
        subtitle="Supportive, never shamey. The goal is momentum, not guilt."
      />

      <Card className="mb-6">
        <CardBody className="flex items-center justify-between gap-3">
          <div>
            <div className="font-bold">
              {friend.display_name} · {status?.emoji} {status?.status}
            </div>
            <p className="mt-1 text-sm text-ink/55">
              {sinceLast === null
                ? "No receipts logged yet."
                : sinceLast === 0
                ? "Checked in today — all good!"
                : `Last receipt was ${sinceLast} day${sinceLast === 1 ? "" : "s"} ago.`}
            </p>
          </div>
          <span className="text-3xl">{status?.emoji}</span>
        </CardBody>
      </Card>

      {!needsNudge ? (
        <Card>
          <CardBody>
            <EmptyState
              emoji="🌞"
              title={`${friend.display_name} is doing fine`}
              description="No nudge needed right now — they’ve checked in recently. Want to send some love anyway? Generate a message below."
            />
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={regenerate}>
                <Hand className="h-4 w-4" /> Send encouragement anyway
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="rounded-2xl bg-berry-500/10 p-4 text-sm text-berry-500">
          {friend.display_name}’s side quest has been quiet for a couple days.
          Pick a vibe below and drop a friendly poke 👇
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink/50">
              Pick a message to copy
            </h3>
            <Button size="sm" variant="ghost" onClick={regenerate}>
              <RefreshCw className="h-4 w-4" /> Shuffle
            </Button>
          </div>
          {messages.map((m, i) => (
            <NudgeCard
              key={i}
              message={m}
              onCopied={() => {
                const n = addNudge(m);
                if (n) markNudgeCopied(n.id);
              }}
            />
          ))}
        </div>
      )}

      {db.nudges.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-sm font-semibold text-ink/50">
            Nudges you’ve sent
          </h3>
          <div className="space-y-2">
            {db.nudges
              .slice()
              .reverse()
              .map((n) => (
                <div
                  key={n.id}
                  className="rounded-2xl border border-sand-200 bg-white/70 p-3 text-sm text-ink/70"
                >
                  {n.message}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
