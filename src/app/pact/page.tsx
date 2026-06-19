"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Copy, Check, Calendar, Hand } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { XPBadge } from "@/components/XPBadge";
import { StreakBadge } from "@/components/StreakBadge";
import { ReceiptCard } from "@/components/ReceiptCard";
import { TeamEnergyCard } from "@/components/TeamEnergyCard";
import { BadgeShelf } from "@/components/BadgeShelf";
import { EmptyState } from "@/components/EmptyState";
import { earnedBadges } from "@/lib/badges";
import {
  useDB,
  currentUser,
  friendProfile,
  currentPact,
  goalsForUser,
  checkInsForUser,
} from "@/lib/store";
import { totalXp } from "@/lib/xp";
import { currentStreak } from "@/lib/streaks";
import { receiptsThisWeek } from "@/lib/progress";
import { determineFriendStatus } from "@/lib/friend-status";
import type { Profile } from "@/lib/types";
import { CATEGORY_EMOJI } from "@/lib/constants";

export default function PactPage() {
  return (
    <AppShell>
      <PactInner />
    </AppShell>
  );
}

function PactInner() {
  const db = useDB();
  const me = currentUser(db);
  const friend = friendProfile(db);
  const pact = currentPact(db);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!pact) return;
    try {
      await navigator.clipboard.writeText(pact.invite_code);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      <PageHeader
        emoji="🤝"
        title={pact?.name ?? "Your Pact"}
        subtitle={
          pact
            ? `${format(parseISO(pact.start_date), "MMM d")} → ${format(
                parseISO(pact.end_date),
                "MMM d, yyyy"
              )}`
            : undefined
        }
        action={
          pact && (
            <Button variant={copied ? "lagoon" : "secondary"} onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : `Invite code: ${pact.invite_code}`}
            </Button>
          )
        }
      />

      {/* Co-op header: the two of you vs. the week, never each other. */}
      <TeamEnergyCard
        className="mb-4"
        me={{
          profile: me,
          checkIns: checkInsForUser(db, me.id),
          goals: goalsForUser(db, me.id),
        }}
        friend={
          friend
            ? {
                profile: friend,
                checkIns: checkInsForUser(db, friend.id),
                goals: goalsForUser(db, friend.id),
              }
            : null
        }
      />

      {friend && (
        <div className="mb-6 rounded-2xl bg-sand-100/70 px-4 py-3 text-center text-sm text-ink/60">
          🌻 This isn’t a leaderboard. It’s two people keeping each other company
          all summer. Cheer more than you compare.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <MemberColumn db={db} member={me} isMe />
        {friend ? (
          <MemberColumn db={db} member={friend} />
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                emoji="🪑"
                title="One empty seat"
                description="Share your invite code and your friend slots right in. Pacts are better with two."
                actionLabel={pact ? `Copy ${pact.invite_code}` : undefined}
                onAction={pact ? copyCode : undefined}
              />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function MemberColumn({
  db,
  member,
  isMe = false,
}: {
  db: ReturnType<typeof useDB>;
  member: Profile;
  isMe?: boolean;
}) {
  const allGoals = goalsForUser(db, member.id);
  const goals = allGoals.filter((g) => g.is_active);
  const checkIns = checkInsForUser(db, member.id);
  const status = determineFriendStatus(checkIns);
  const badges = earnedBadges(checkIns, allGoals);

  return (
    <Card className={isMe ? "ring-2 ring-sunset-200" : ""}>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold text-white ${
                isMe ? "bg-sunset-500" : "bg-berry-500"
              }`}
            >
              {member.display_name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold">
                {member.display_name}
                {isMe && (
                  <span className="chip bg-sunset-100 text-sunset-700">you</span>
                )}
              </div>
              <span className="text-xs text-ink/50">
                {status.emoji} {status.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="XP" value={totalXp(checkIns).toLocaleString()} />
          <Stat label="Streak" value={`${currentStreak(checkIns)}d`} />
          <Stat label="This week" value={`${receiptsThisWeek(checkIns).length}`} />
        </div>

        <div className="flex flex-wrap gap-2">
          <XPBadge xp={totalXp(checkIns)} size="sm" />
          <StreakBadge streak={currentStreak(checkIns)} />
        </div>

        {badges.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink/50">
              Badges {isMe ? "you’ve" : `${member.display_name} has`} earned
            </h4>
            <BadgeShelf badges={badges} showLocked={false} />
          </div>
        )}

        <div>
          <h4 className="mb-2 text-sm font-semibold text-ink/50">Active goals</h4>
          {goals.length === 0 ? (
            <p className="text-sm text-ink/40">No active goals yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {goals.map((g) => (
                <span key={g.id} className="chip bg-sand-100 text-ink/70">
                  {CATEGORY_EMOJI[g.category]} {g.title}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink/50">
            <Calendar className="h-4 w-4" /> Recent receipts
          </h4>
          {checkIns.length === 0 ? (
            <p className="text-sm text-ink/40">
              {isMe ? "No receipts yet — go log one!" : "Nothing yet. A nudge might help."}
            </p>
          ) : (
            <div className="space-y-3">
              {checkIns.slice(0, 3).map((ci) => (
                <ReceiptCard
                  key={ci.id}
                  checkIn={ci}
                  goal={goalsForUser(db, member.id).find((g) => g.id === ci.goal_id)}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {!isMe && (
          <Link
            href="/nudges"
            className="flex items-center justify-center gap-2 rounded-2xl bg-lagoon-500/10 py-2.5 text-sm font-semibold text-lagoon-600 transition hover:bg-lagoon-500/20"
          >
            <Hand className="h-4 w-4" /> Cheer {member.display_name} on
          </Link>
        )}
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand-50 py-3">
      <div className="text-xl font-extrabold text-ink">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">
        {label}
      </div>
    </div>
  );
}
