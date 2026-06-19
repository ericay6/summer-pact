"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ArrowLeft, Check, Copy } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { GOAL_CATEGORIES, CATEGORY_EMOJI, DEFAULT_SUMMER_END } from "@/lib/constants";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import {
  useDB,
  setDisplayName,
  createPact,
  joinPactByCode,
  addGoal,
  setOnboarded,
  currentPact,
  currentPactId,
  ensureLiveInit,
  isLiveMode,
} from "@/lib/store";
import type { GoalCategory } from "@/lib/types";

type Mode = "create" | "join";

export default function OnboardingPage() {
  const router = useRouter();
  const db = useDB();
  const [step, setStep] = useState(0);

  // step 1
  const [name, setName] = useState("");
  // step 2
  const [mode, setMode] = useState<Mode>("create");
  const [pactName, setPactName] = useState("");
  const [endDate, setEndDate] = useState(DEFAULT_SUMMER_END);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // step 3
  const [goalTitle, setGoalTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Research");
  const [why, setWhy] = useState("");
  const [minWin, setMinWin] = useState("");
  const [dreamWin, setDreamWin] = useState("");
  const [weeklyTarget, setWeeklyTarget] = useState(4);

  const existingPact = useMemo(() => currentPact(db), [db]);
  const [busy, setBusy] = useState(false);

  // Live mode: connect to Supabase so we know who's signed in.
  useEffect(() => {
    void ensureLiveInit();
  }, []);

  // Returning live user who already has a pact → straight to the dashboard.
  useEffect(() => {
    if (!isLiveMode) return;
    if (db.ready && step === 0 && db.onboarded && currentPactId(db)) {
      router.replace("/dashboard");
    }
  }, [db, step, router]);

  function next() {
    setStep((s) => Math.min(2, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function submitName() {
    if (!name.trim()) return;
    setDisplayName(name.trim());
    next();
  }

  async function submitPact() {
    setJoinError("");
    if (mode === "create") {
      const pact = createPact(pactName, endDate);
      setCreatedCode(pact.invite_code);
      next();
    } else {
      setBusy(true);
      const res = await joinPactByCode(joinCode);
      setBusy(false);
      if (!res.ok) {
        setJoinError(res.error ?? "Couldn't join that pact.");
        return;
      }
      next();
    }
  }

  function finish() {
    if (goalTitle.trim()) {
      addGoal({
        title: goalTitle.trim(),
        category,
        why_it_matters: why,
        minimum_success: minWin,
        dream_success: dreamWin,
        weekly_target: weeklyTarget,
        xp_target: weeklyTarget * 80,
      });
    }
    setOnboarded(true);
    router.push("/dashboard");
  }

  async function copyCode() {
    const code = createdCode ?? existingPact?.invite_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2 font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sunset-500 text-white shadow-cozy">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">{APP_NAME}</span>
        </div>

        {/* Progress dots */}
        <div className="mb-5 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-sunset-500" : "w-2 bg-sand-300"
              }`}
            />
          ))}
        </div>

        <Card className="animate-pop-in">
          <CardBody>
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-extrabold">What should we call you? 👋</h1>
                  <p className="mt-1 text-sm text-ink/55">
                    Your friend will see this name on the pact.
                  </p>
                </div>
                <div>
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    autoFocus
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitName()}
                  />
                </div>
                <Button className="w-full" onClick={submitName} disabled={!name.trim()}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-extrabold">Start or join a pact 🤝</h1>
                  <p className="mt-1 text-sm text-ink/55">
                    A pact is just the two of you, all summer.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode("create")}
                    className={`rounded-2xl border p-3 text-left text-sm font-semibold transition ${
                      mode === "create"
                        ? "border-sunset-400 bg-sunset-50 text-sunset-700"
                        : "border-sand-200 text-ink/60"
                    }`}
                  >
                    ✨ Create a new pact
                  </button>
                  <button
                    onClick={() => setMode("join")}
                    className={`rounded-2xl border p-3 text-left text-sm font-semibold transition ${
                      mode === "join"
                        ? "border-sunset-400 bg-sunset-50 text-sunset-700"
                        : "border-sand-200 text-ink/60"
                    }`}
                  >
                    🔑 Join with a code
                  </button>
                </div>

                {mode === "create" ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pactName">Pact name</Label>
                      <Input
                        id="pactName"
                        placeholder="The Summer Arc"
                        value={pactName}
                        onChange={(e) => setPactName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Ends on</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="code">Invite code</Label>
                    <Input
                      id="code"
                      placeholder="e.g. SUN24Z"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    />
                    {joinError && (
                      <p className="mt-2 text-sm text-berry-500">{joinError}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={back}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button className="flex-1" onClick={submitPact} disabled={busy}>
                    {busy ? "Joining…" : "Continue"}{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-extrabold">Add your first goal 🎯</h1>
                  <p className="mt-1 text-sm text-ink/55">
                    You can add more later (2–4 is the sweet spot).
                  </p>
                </div>

                {(createdCode ?? existingPact?.invite_code) && (
                  <div className="flex items-center justify-between rounded-2xl bg-lagoon-500/10 p-3 text-sm">
                    <div>
                      <div className="font-semibold text-lagoon-600">
                        Your invite code
                      </div>
                      <div className="font-mono text-lg tracking-widest text-ink">
                        {createdCode ?? existingPact?.invite_code}
                      </div>
                    </div>
                    <Button size="sm" variant={copied ? "lagoon" : "secondary"} onClick={copyCode}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Share"}
                    </Button>
                  </div>
                )}

                <div>
                  <Label htmlFor="goalTitle">Goal title</Label>
                  <Input
                    id="goalTitle"
                    placeholder="Finish my research paper"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cat">Category</Label>
                    <Select
                      id="cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as GoalCategory)}
                    >
                      {GOAL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_EMOJI[c]} {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="wt">Weekly target</Label>
                    <Select
                      id="wt"
                      value={weeklyTarget}
                      onChange={(e) => setWeeklyTarget(Number(e.target.value))}
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
                  <Label htmlFor="why">Why this matters</Label>
                  <Textarea
                    id="why"
                    placeholder="Future-me really wants this…"
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="min">Minimum win</Label>
                    <Input
                      id="min"
                      placeholder="15 min counts"
                      value={minWin}
                      onChange={(e) => setMinWin(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dream">Dream win</Label>
                    <Input
                      id="dream"
                      placeholder="Submit the draft"
                      value={dreamWin}
                      onChange={(e) => setDreamWin(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={back}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button className="flex-1" onClick={finish}>
                    {goalTitle.trim() ? "Start my summer" : "Skip for now"}{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-ink/40">
          Already set up?{" "}
          <Link href="/dashboard" className="font-semibold text-sunset-600">
            Go to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
