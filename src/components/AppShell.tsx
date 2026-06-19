"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { DemoBanner } from "./DemoBanner";
import { LoadingState } from "./LoadingState";
import {
  useDB,
  currentPactId,
  ensureLiveInit,
  isLiveMode,
} from "@/lib/store";

/**
 * Wraps every authenticated page: nav, demo banner, layout, and the auth +
 * onboarding guard. In live mode it waits for Supabase to hydrate, sends
 * signed-out users to /login, and un-onboarded users to /onboarding.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const db = useDB();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void ensureLiveInit();
  }, []);

  const ready = mounted && (db.ready ?? !isLiveMode);

  useEffect(() => {
    if (!ready) return;
    if (isLiveMode && !db.authed) {
      router.replace("/login");
      return;
    }
    if (!db.onboarded || !currentPactId(db)) {
      router.replace("/onboarding");
    }
  }, [ready, db, router]);

  if (!ready) {
    return (
      <div className="container py-20">
        <LoadingState label="Loading your pact…" />
      </div>
    );
  }

  if (isLiveMode && !db.authed) {
    return (
      <div className="container py-20">
        <LoadingState label="Checking you in…" />
      </div>
    );
  }

  if (!db.onboarded || !currentPactId(db)) {
    return (
      <div className="container py-20">
        <LoadingState label="Setting up your pact…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <DemoBanner />
      <Navbar />
      <main className="container py-6 md:py-8">{children}</main>
    </div>
  );
}

/** Section header used across pages. */
export function PageHeader({
  title,
  subtitle,
  emoji,
  action,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink/55">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
