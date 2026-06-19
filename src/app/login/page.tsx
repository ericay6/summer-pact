"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Lock } from "lucide-react";
import { APP_NAME, APP_SLOGAN } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  useDB,
  ensureLiveInit,
  isLiveMode,
  currentPactId,
  refresh,
} from "@/lib/store";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const db = useDB();
  const configured = isSupabaseConfigured();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Live mode: if already signed in, skip the login screen.
  useEffect(() => {
    void ensureLiveInit();
  }, []);
  useEffect(() => {
    if (!isLiveMode || !db.ready || !db.authed) return;
    router.replace(currentPactId(db) ? "/dashboard" : "/onboarding");
  }, [db, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setErrorMsg("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMsg(error.message);
        setBusy(false);
        return;
      }
      if (!data.session) {
        // Email confirmation is still ON in Supabase.
        setErrorMsg(
          "Almost there — turn OFF “Confirm email” in Supabase (Authentication → Providers → Email), then sign up again. For a private 2-person app you don’t need email confirmation."
        );
        setBusy(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMsg(error.message);
        setBusy(false);
        return;
      }
    }

    await refresh();
    router.replace("/dashboard"); // guards send new users to onboarding
  }

  function enterDemo() {
    router.push(db.onboarded ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 font-extrabold"
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sunset-500 text-white shadow-cozy">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">{APP_NAME}</span>
        </Link>

        <Card className="animate-pop-in">
          <CardBody>
            <h1 className="text-xl font-extrabold">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-ink/55">{APP_SLOGAN}</p>

            {configured ? (
              <>
                {/* Sign in / Create account toggle */}
                <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-sand-100 p-1">
                  {(["signin", "signup"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setErrorMsg("");
                      }}
                      className={`rounded-xl py-2 text-sm font-semibold transition ${
                        mode === m
                          ? "bg-white text-ink shadow-card"
                          : "text-ink/50"
                      }`}
                    >
                      {m === "signin" ? "Sign in" : "Create account"}
                    </button>
                  ))}
                </div>

                <form onSubmit={submit} className="mt-5 space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {errorMsg && (
                    <p className="rounded-xl bg-berry-500/10 p-2.5 text-sm text-berry-500">
                      {errorMsg}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={busy}>
                    <Lock className="h-4 w-4" />
                    {busy
                      ? "One sec…"
                      : mode === "signup"
                      ? "Create account & start"
                      : "Sign in"}
                  </Button>
                </form>

                <p className="mt-4 text-center text-xs text-ink/45">
                  {mode === "signin"
                    ? "New here? Tap “Create account” above."
                    : "Already have an account? Tap “Sign in” above."}
                </p>
              </>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-sunset-50 p-4 text-sm text-sunset-700">
                  Supabase isn’t configured yet, so the app is running in{" "}
                  <strong>demo mode</strong>. Jump straight in — everything
                  saves locally in your browser.
                </div>
                <Button className="w-full" onClick={enterDemo}>
                  Enter the demo <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-ink/40">
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            ← Back home
          </Link>
        </p>
      </div>
    </div>
  );
}
