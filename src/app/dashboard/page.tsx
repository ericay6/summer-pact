"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarCheck,
  LifeBuoy,
  Swords,
  PlusCircle,
  Trophy,
  Flame,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { StreakBadge } from "@/components/StreakBadge";
import { ProgressRing, ProgressBar } from "@/components/ProgressRing";
import { GoalCard } from "@/components/GoalCard";
import { FriendStatusCard } from "@/components/FriendStatusCard";
import { TeamEnergyCard } from "@/components/TeamEnergyCard";
import { BadgeShelf } from "@/components/BadgeShelf";
import { EmptyState } from "@/components/EmptyState";
import {
  useDB,
  currentUser,
  friendProfile,
  goalsForUser,
  checkInsForUser,
} from "@/lib/store";
import { totalXp, levelForXp } from "@/lib/xp";
import { currentStreak } from "@/lib/streaks";
import { weeklyProgress, receiptsThisWeek, goalXpProgress } from "@/lib/progress";
import { computeBadges, earnedBadges, nextBadge } from "@/lib/badges";
import { todaysDoneLine, todaysOpenLine, streakFlair } from "@/lib/encouragement";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardInner />
    </AppShell>
  );
}

function DashboardInner() {
  const db = useDB();
  const me = currentUser(db);
  const friend = friendProfile(db);
  const myGoals = goalsForUser(db, me.id);
  const myCheckIns = checkInsForUser(db, me.id);

  const xp = totalXp(myCheckIns);
  const { level, into, need } = levelForXp(xp);
  const streak = currentStreak(myCheckIns);
  const week = weeklyProgress(myCheckIns, myGoals);

  const todayIso = format(new Date(), "yyyy-MM-dd");
  const checkedInToday = myCheckIns.some((c) => c.check_in_date === todayIso);

  const friendCheckIns = friend ? checkInsForUser(db, friend.id) : [];
  const friendGoals = friend ? goalsForUser(db, friend.id) : [];
  const activeGoals = myGoals.filter((g) => g.is_active);

  const allBadges = computeBadges(myCheckIns, myGoals);
  const earned = earnedBadges(myCheckIns, myGoals);
  const upcoming = nextBadge(myCheckIns, myGoals);

  return (
    <div className="space-y-6">
      {/* ── HERO: today's command center ──────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sunset-500 via-peach-500 to-berry-500 p-6 text-white shadow-cozy sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 text-[10rem] opacity-15">
          ☀️
        </div>
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="chip mb-3 bg-white/20 text-white">
              {checkedInToday ? "🔒 Today is logged" : "🧾 Receipts, not vibes"}
            </div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {greeting()}, {me.display_name}
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/90 sm:text-base">
              {checkedInToday
                ? todaysDoneLine(todayIso + me.id)
                : todaysOpenLine(todayIso + me.id)}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/check-in"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-white text-sunset-600 hover:bg-white/90"
                )}
              >
                <CalendarCheck className="h-5 w-5" />
                {checkedInToday ? "Add another receipt" : "Submit today’s receipt"}
              </Link>
              <Link
                href="/save-me"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25"
              >
                <LifeBuoy className="h-4 w-4" /> Save me from myself
              </Link>
            </div>
          </div>

          {/* Today snapshot */}
          <div className="flex items-center gap-5 rounded-3xl bg-white/15 p-5 backdrop-blur">
            <ProgressRing
              value={week.pct}
              label={`${week.done}/${week.target}`}
              sublabel="this week"
              className="text-white"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Flame className="h-4 w-4" /> {streak}-day streak
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Trophy className="h-4 w-4" /> {xp.toLocaleString()} XP · Lvl {level}
              </div>
              <div className="text-xs text-white/80">{streakFlair(streak)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Supporting stats ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                Total XP
              </div>
              <Trophy className="h-5 w-5 text-sunset-400" />
            </div>
            <div className="mt-1 text-3xl font-extrabold text-ink">
              {xp.toLocaleString()}
            </div>
            <div className="mt-2">
              <ProgressBar value={Math.round((into / need) * 100)} />
              <div className="mt-1 text-xs text-ink/45">
                Level {level} · {into}/{need} to level {level + 1}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                Current streak
              </div>
              <Flame className="h-5 w-5 text-sunset-400" />
            </div>
            <div className="mt-1 text-3xl font-extrabold text-ink">
              {streak}
              <span className="text-base font-semibold text-ink/40"> days</span>
            </div>
            <div className="mt-2">
              <StreakBadge streak={streak} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                Badges earned
              </div>
              <Sparkles className="h-5 w-5 text-sunset-400" />
            </div>
            <div className="mt-1 text-3xl font-extrabold text-ink">
              {earned.length}
              <span className="text-base font-semibold text-ink/40">
                {" "}
                / {allBadges.length}
              </span>
            </div>
            {upcoming && (
              <div className="mt-2 text-xs text-ink/50">
                Next: {upcoming.emoji} {upcoming.title}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Co-op energy + badges ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <TeamEnergyCard
          me={{ profile: me, checkIns: myCheckIns, goals: myGoals }}
          friend={
            friend
              ? { profile: friend, checkIns: friendCheckIns, goals: friendGoals }
              : null
          }
        />
        <Card>
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Your badge shelf 🏅</h2>
              <span className="text-xs text-ink/40">
                {earned.length} unlocked
              </span>
            </div>
            <BadgeShelf badges={allBadges} />
            {upcoming && (
              <p className="mt-3 text-xs text-ink/50">
                Closest unlock: <strong>{upcoming.emoji} {upcoming.title}</strong>{" "}
                — {upcoming.description}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Goals + friend ────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Your active goals</h2>
            <Link
              href="/goals"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <PlusCircle className="h-4 w-4" /> Manage
            </Link>
          </div>
          {activeGoals.length === 0 ? (
            <EmptyState
              emoji="🎯"
              title="No active goals yet"
              description="Pick 2–4 things you want this summer. Big or tiny — both count."
              actionLabel="Add a goal"
              actionHref="/goals"
              tip="The best first goal is one you could do in 10 minutes today."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeGoals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  xpDone={goalXpProgress(g, myCheckIns).done}
                  receiptsThisWeek={
                    receiptsThisWeek(myCheckIns).filter((c) => c.goal_id === g.id)
                      .length
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Your pact partner</h2>
            <Link
              href="/pact"
              className="flex items-center text-xs font-semibold text-sunset-600"
            >
              Full pact <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {friend ? (
            <FriendStatusCard
              friend={friend}
              checkIns={friendCheckIns}
              goals={friendGoals}
            />
          ) : (
            <Card>
              <CardBody>
                <EmptyState
                  emoji="🤝"
                  title="One seat open"
                  description="Share your invite code so your friend can join. Pacts are way better with two."
                  actionLabel="Get invite code"
                  actionHref="/pact"
                  tip="Accountability hits different when someone’s watching the receipts."
                />
              </CardBody>
            </Card>
          )}
          <Link
            href="/nudges"
            className="block rounded-3xl bg-gradient-to-br from-lagoon-500 to-lagoon-600 p-5 text-white shadow-cozy transition hover:brightness-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">Send a little love 💌</div>
                <p className="mt-1 text-sm text-white/85">
                  A 10-second nudge keeps the whole summer arc alive.
                </p>
              </div>
              <ChevronRight className="h-5 w-5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
