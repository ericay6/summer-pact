"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, ArrowRight } from "lucide-react";
import { APP_NAME, APP_SLOGAN } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useDB, ensureLiveInit, isLiveMode, currentPactId } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const db = useDB();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  // Live mode: if already signed in, skip the login screen.
  useEffect(() => {
    void ensureLiveInit();
  }, []);
  useEffect(() => {
    if (!isLiveMode || !db.ready || !db.authed) return;
    router.replace(currentPactId(db) ? "/dashboard" : "/onboarding");
  }, [db, router]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;
    setStatus("sending");
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
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
            <h1 className="text-xl font-extrabold">Welcome back</h1>
            <p className="mt-1 text-sm text-ink/55">{APP_SLOGAN}</p>

            {configured ? (
              status === "sent" ? (
                <div className="mt-6 rounded-2xl bg-lagoon-500/10 p-4 text-sm text-lagoon-600">
                  📬 Check your inbox — we sent a magic link to{" "}
                  <strong>{email}</strong>.
                </div>
              ) : (
                <form onSubmit={sendMagicLink} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {status === "error" && (
                    <p className="text-sm text-berry-500">{errorMsg}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={status === "sending"}
                  >
                    <Mail className="h-4 w-4" />
                    {status === "sending" ? "Sending…" : "Send magic link"}
                  </Button>
                </form>
              )
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

            <div className="mt-6 text-center text-sm text-ink/50">
              New here?{" "}
              <Link href="/onboarding" className="font-semibold text-sunset-600">
                Create your pact
              </Link>
            </div>
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
