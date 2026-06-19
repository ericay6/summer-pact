"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { GoalCard } from "@/components/GoalCard";
import { EmptyState } from "@/components/EmptyState";
import { GOAL_CATEGORIES, CATEGORY_EMOJI } from "@/lib/constants";
import {
  useDB,
  currentUser,
  goalsForUser,
  checkInsForUser,
  addGoal,
  updateGoal,
  archiveGoal,
  reactivateGoal,
} from "@/lib/store";
import { goalXpProgress, receiptsThisWeek } from "@/lib/progress";
import type { Goal, GoalCategory } from "@/lib/types";

export default function GoalsPage() {
  return (
    <AppShell>
      <GoalsInner />
    </AppShell>
  );
}

const EMPTY = {
  title: "",
  category: "Research" as GoalCategory,
  why_it_matters: "",
  minimum_success: "",
  dream_success: "",
  weekly_target: 4,
  xp_target: 320,
};

function GoalsInner() {
  const db = useDB();
  const me = currentUser(db);
  const goals = goalsForUser(db, me.id);
  const myCheckIns = checkInsForUser(db, me.id);

  const active = goals.filter((g) => g.is_active);
  const archived = goals.filter((g) => !g.is_active);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState(EMPTY);

  const activeCount = active.length;

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setForm({
      title: goal.title,
      category: goal.category,
      why_it_matters: goal.why_it_matters,
      minimum_success: goal.minimum_success,
      dream_success: goal.dream_success,
      weekly_target: goal.weekly_target,
      xp_target: goal.xp_target,
    });
    setShowForm(true);
  }

  function save() {
    if (!form.title.trim()) return;
    if (editing) {
      updateGoal(editing.id, form);
    } else {
      addGoal(form);
    }
    setShowForm(false);
    setForm(EMPTY);
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        emoji="🎯"
        title="Goals"
        subtitle={`${activeCount} active · the sweet spot is 2–4`}
        action={
          <Button onClick={openCreate} disabled={activeCount >= 4 && !showForm}>
            <Plus className="h-4 w-4" /> New goal
          </Button>
        }
      />

      {activeCount >= 4 && (
        <div className="mb-4 rounded-2xl bg-sunset-50 p-3 text-sm text-sunset-700">
          You’ve got 4 active goals — that’s the cap. Focus beats clutter. Archive
          one to add another.
        </div>
      )}

      {showForm && (
        <Card className="mb-6 animate-pop-in">
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editing ? "Edit goal" : "New goal"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl p-1.5 text-ink/40 hover:bg-sand-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Finish my research paper"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as GoalCategory })
                    }
                  >
                    {GOAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_EMOJI[c]} {c}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Weekly target</Label>
                  <Select
                    value={form.weekly_target}
                    onChange={(e) =>
                      setForm({ ...form, weekly_target: Number(e.target.value) })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>
                        {n}x / week
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Why this matters</Label>
                <Textarea
                  value={form.why_it_matters}
                  onChange={(e) =>
                    setForm({ ...form, why_it_matters: e.target.value })
                  }
                  placeholder="The reason future-you will thank present-you…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Minimum version of success</Label>
                  <Input
                    value={form.minimum_success}
                    onChange={(e) =>
                      setForm({ ...form, minimum_success: e.target.value })
                    }
                    placeholder="15 minutes counts"
                  />
                </div>
                <div>
                  <Label>Dream version of success</Label>
                  <Input
                    value={form.dream_success}
                    onChange={(e) =>
                      setForm({ ...form, dream_success: e.target.value })
                    }
                    placeholder="Submit the final draft"
                  />
                </div>
              </div>
              <div>
                <Label>XP target (whole summer)</Label>
                <Input
                  type="number"
                  min={50}
                  step={10}
                  value={form.xp_target}
                  onChange={(e) =>
                    setForm({ ...form, xp_target: Number(e.target.value) })
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={save} disabled={!form.title.trim()}>
                  {editing ? "Save changes" : "Add goal"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {active.length === 0 && !showForm ? (
        <EmptyState
          emoji="🌱"
          title="No goals yet — plant a few"
          description="Pick 2–4 things you actually want this summer. They can be ambitious or adorably small."
          actionLabel="Add your first goal"
          onAction={openCreate}
          tip="Define a “minimum win” you could do on your worst day. That’s the secret."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              xpDone={goalXpProgress(g, myCheckIns).done}
              receiptsThisWeek={
                receiptsThisWeek(myCheckIns).filter((c) => c.goal_id === g.id).length
              }
              onArchive={archiveGoal}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink/60">Archived</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                xpDone={goalXpProgress(g, myCheckIns).done}
                onReactivate={reactivateGoal}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
