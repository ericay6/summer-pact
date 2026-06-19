"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { Trophy, Flame, Ghost, AlertTriangle, Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { BossFightCard } from "@/components/BossFightCard";
import {
  useDB,
  currentUser,
  goalsForUser,
  checkInsForUser,
  saveWeeklyReview,
} from "@/lib/store";
import { generateWeeklyReview, generateBossFight } from "@/lib/ai";
import type { WeeklyReviewData } from "@/lib/weekly-review";
import { checkInsForWeek } from "@/lib/weekly-review";
import type { BossFight } from "@/lib/boss-fights";
import { subWeeks } from "date-fns";

export default function WeeklyReviewPage() {
  return (
    <AppShell>
      <WeeklyReviewInner />
    </AppShell>
  );
}

function WeeklyReviewInner() {
  const db = useDB();
  const me = currentUser(db);
  const goals = goalsForUser(db, me.id);
  const checkIns = checkInsForUser(db, me.id);

  const [review, setReview] = useState<WeeklyReviewData | null>(null);
  const [boss, setBoss] = useState<BossFight | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const r = await generateWeeklyReview(checkIns, goals);
      const lastWeek = checkInsForWeek(checkIns, subWeeks(new Date(), 1));
      const b = await generateBossFight(lastWeek, goals, r.weekStart);
      if (active) {
        setReview(r);
        setBoss(b);
        saveWeeklyReview(r.reflection, b.title, r.weekStart);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const chartData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    return days.map((d) => {
      const iso = format(d, "yyyy-MM-dd");
      const xp = checkIns
        .filter((c) => c.check_in_date === iso)
        .reduce((s, c) => s + c.xp_awarded, 0);
      return { day: format(d, "EEE"), xp, isToday: iso === format(new Date(), "yyyy-MM-dd") };
    });
  }, [checkIns]);

  if (!review || !boss) {
    return (
      <div>
        <PageHeader emoji="📊" title="Weekly review" />
        <Card>
          <CardBody>Crunching your week…</CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        emoji="📊"
        title="Weekly review"
        subtitle={review.weekLabel}
      />

      {/* Headline stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                Receipts this week
              </div>
              <div className="mt-1 text-3xl font-extrabold">
                {review.receiptCount}
              </div>
            </div>
            <Flame className="h-9 w-9 text-sunset-400" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                XP earned
              </div>
              <div className="mt-1 text-3xl font-extrabold">
                {review.xpEarned}
              </div>
            </div>
            <Trophy className="h-9 w-9 text-sunset-400" />
          </CardBody>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardBody>
          <h3 className="mb-3 text-sm font-semibold text-ink/50">XP by day</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#b9a489"
                />
                <Tooltip
                  cursor={{ fill: "rgba(247,122,62,0.08)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #f6e1c5",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="xp" radius={[8, 8, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.isToday ? "#e34110" : "#fba572"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* Highlights */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Highlight
          icon={<Trophy className="h-5 w-5 text-lagoon-600" />}
          label="Strongest goal"
          value={
            review.strongestGoal
              ? `${review.strongestGoal.title} (${review.strongestGoal.xp} XP)`
              : "—"
          }
        />
        <Highlight
          icon={<Ghost className="h-5 w-5 text-berry-500" />}
          label="Most avoided"
          value={review.mostAvoidedGoal?.title ?? "Nothing — balanced week!"}
        />
        <Highlight
          icon={<AlertTriangle className="h-5 w-5 text-sunset-500" />}
          label="Common blocker"
          value={review.commonBlocker ?? "No recurring blockers 🎉"}
        />
        <Highlight
          icon={<Sparkles className="h-5 w-5 text-sunset-500" />}
          label="Best day"
          value={
            review.bestDay
              ? `${review.bestDay.label} (${review.bestDay.xp} XP)`
              : "—"
          }
        />
      </div>

      {/* Reflection */}
      <Card>
        <CardBody>
          <h3 className="mb-2 flex items-center gap-2 font-bold">
            🪞 A kind but honest reflection
          </h3>
          <p className="leading-relaxed text-ink/80">{review.reflection}</p>
        </CardBody>
      </Card>

      {/* Boss fight */}
      <BossFightCard bossFight={boss} />
    </div>
  );
}

function Highlight({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardBody className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sand-100">
          {icon}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            {label}
          </div>
          <div className="mt-0.5 font-semibold text-ink">{value}</div>
        </div>
      </CardBody>
    </Card>
  );
}
