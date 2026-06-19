"use client";

// ──────────────────────────────────────────────────────────────────────────
// Data layer for Summer Pact.
//
// Two modes, ONE interface:
//   • DEMO MODE (no Supabase env)  → localStorage, single browser, seeded pact.
//   • LIVE MODE  (Supabase env set) → real shared database for two people.
//
// Both keep an in-memory cache shaped like DemoDB and expose the same
// synchronous `useDB()` + selectors, so the UI never changes. In live mode
// mutations update the cache optimistically and write to Supabase in the
// background; a realtime subscription re-syncs so each friend sees the other's
// XP, receipts, nudges, and boss fights.
// ──────────────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from "react";
import { buildDemoDB, DEMO_IDS, type DemoDB } from "./demo-data";
import { calculateXp } from "./xp";
import { generateInviteCode, normalizeInviteCode } from "./invite";
import { DEFAULT_SUMMER_END } from "./constants";
import { uid } from "./utils";
import { createClient } from "./supabase/client";
import { isSupabaseConfigured, PROOF_BUCKET } from "./supabase/config";
import type {
  CheckIn,
  Goal,
  GoalCategory,
  Nudge,
  Pact,
  Profile,
  WeeklyReview,
} from "./types";

const STORAGE_KEY = "summer-pact:v1";
const LIVE = isSupabaseConfigured();

let cache: DemoDB | null = null;
const listeners = new Set<() => void>();

function emptyDB(): DemoDB {
  return {
    profiles: [],
    pacts: [],
    members: [],
    goals: [],
    checkIns: [],
    reviews: [],
    nudges: [],
    session: { userId: null },
    onboarded: false,
    ready: false,
    authed: false,
  };
}

function load(): DemoDB {
  if (cache) return cache;
  if (LIVE) {
    // Live mode hydrates asynchronously via ensureLiveInit().
    cache = emptyDB();
    return cache;
  }
  // Demo mode: localStorage-backed, always "ready" and "authed".
  if (typeof window === "undefined") {
    cache = { ...buildDemoDB(), ready: true, authed: true };
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw
      ? { ...(JSON.parse(raw) as DemoDB), ready: true, authed: true }
      : { ...buildDemoDB(), ready: true, authed: true };
    if (!raw) persist();
  } catch {
    cache = { ...buildDemoDB(), ready: true, authed: true };
  }
  return cache!;
}

function persist() {
  if (LIVE || typeof window === "undefined" || !cache) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function mutate(fn: (db: DemoDB) => void) {
  const db = load();
  fn(db);
  emit();
}

// ── React binding ─────────────────────────────────────────────────────────
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useDB(): DemoDB {
  return useSyncExternalStore(subscribe, load, load);
}

export const isLiveMode = LIVE;

// ── Selectors (pure, take a db) ─────────────────────────────────────────────
export function currentUserId(db: DemoDB) {
  return db.session.userId ?? (LIVE ? "" : DEMO_IDS.ME);
}

export function currentUser(db: DemoDB) {
  const id = currentUserId(db);
  return db.profiles.find((p) => p.id === id) ?? db.profiles[0];
}

export function currentPactId(db: DemoDB): string | null {
  const id = currentUserId(db);
  const m = db.members.find((m) => m.user_id === id);
  return m?.pact_id ?? null;
}

export function currentPact(db: DemoDB): Pact | null {
  const pid = currentPactId(db);
  return db.pacts.find((p) => p.id === pid) ?? null;
}

export function pactMembers(db: DemoDB) {
  const pid = currentPactId(db);
  return db.members
    .filter((m) => m.pact_id === pid)
    .map((m) => db.profiles.find((p) => p.id === m.user_id)!)
    .filter(Boolean);
}

export function friendProfile(db: DemoDB) {
  const me = currentUserId(db);
  return pactMembers(db).find((p) => p.id !== me) ?? null;
}

export function goalsForUser(db: DemoDB, userId: string) {
  return db.goals.filter((g) => g.user_id === userId);
}

export function checkInsForUser(db: DemoDB, userId: string) {
  return db.checkIns
    .filter((c) => c.user_id === userId)
    .sort((a, b) => (a.check_in_date < b.check_in_date ? 1 : -1));
}

// ── Supabase helpers (live mode) ────────────────────────────────────────────
function sb() {
  return createClient();
}

let initPromise: Promise<void> | null = null;
let realtimeBound = false;

/** Idempotent: load the signed-in user's pact + all related rows into cache. */
export function ensureLiveInit(): Promise<void> {
  if (!LIVE) return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = hydrate();
  return initPromise;
}

async function hydrate(): Promise<void> {
  const supabase = sb();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const db = load();

  if (!user) {
    db.authed = false;
    db.ready = true;
    db.session.userId = null;
    db.onboarded = false;
    emit();
    return;
  }

  db.authed = true;
  db.session.userId = user.id;

  // Ensure a profile row exists (trigger usually handles this).
  await supabase
    .from("profiles")
    .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });

  // Find my membership → pact.
  const { data: myMemberships } = await supabase
    .from("pact_members")
    .select("pact_id")
    .eq("user_id", user.id)
    .limit(1);

  const pactId = myMemberships?.[0]?.pact_id as string | undefined;

  if (!pactId) {
    // Authed but not in a pact yet → onboarding.
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    db.profiles = myProfile ? [myProfile as Profile] : [];
    db.onboarded = false;
    db.ready = true;
    emit();
    return;
  }

  await loadPactData(pactId, user.id);
  bindRealtime(pactId);
}

async function loadPactData(pactId: string, userId: string) {
  const supabase = sb();
  if (!supabase) return;
  const db = load();

  const [pacts, members, goals, checkIns, reviews, nudges] = await Promise.all([
    supabase.from("pacts").select("*").eq("id", pactId),
    supabase.from("pact_members").select("*").eq("pact_id", pactId),
    supabase.from("goals").select("*").eq("pact_id", pactId),
    supabase.from("check_ins").select("*").eq("pact_id", pactId),
    supabase.from("weekly_reviews").select("*").eq("pact_id", pactId),
    supabase.from("nudges").select("*").eq("pact_id", pactId),
  ]);

  // Profiles of everyone in the pact.
  const memberIds = (members.data ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", memberIds.length ? memberIds : [userId]);

  db.profiles = (profiles ?? []) as Profile[];
  db.pacts = (pacts.data ?? []) as Pact[];
  db.members = (members.data ?? []) as DemoDB["members"];
  db.goals = (goals.data ?? []) as Goal[];
  db.checkIns = (checkIns.data ?? []) as CheckIn[];
  db.reviews = (reviews.data ?? []) as WeeklyReview[];
  db.nudges = (nudges.data ?? []) as Nudge[];
  db.session.userId = userId;
  db.onboarded = true;
  db.ready = true;
  emit();
}

function bindRealtime(pactId: string) {
  const supabase = sb();
  if (!supabase || realtimeBound) return;
  realtimeBound = true;
  const userId = load().session.userId!;
  supabase
    .channel(`pact-${pactId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public" },
      () => {
        // Any change to pact data → re-sync the cache from the server.
        loadPactData(pactId, userId);
      }
    )
    .subscribe();
}

/** Re-pull everything from Supabase (used after joining/creating a pact). */
export async function refresh() {
  if (!LIVE) return;
  initPromise = null;
  realtimeBound = false;
  await ensureLiveInit();
}

export async function signOut() {
  const supabase = sb();
  if (supabase) await supabase.auth.signOut();
  cache = emptyDB();
  cache.ready = true;
  emit();
}

// ── Mutations (work in both modes) ──────────────────────────────────────────
export function resetDemo() {
  if (LIVE) return;
  cache = { ...buildDemoDB(), ready: true, authed: true };
  emit();
}

export function clearAll() {
  cache = { ...emptyDB(), ready: true, authed: !LIVE };
  emit();
}

export function setDisplayName(name: string) {
  const trimmed = name.trim();
  mutate((db) => {
    let me = db.profiles.find((p) => p.id === currentUserId(db));
    if (!me) {
      me = {
        id: LIVE ? currentUserId(db) || uid() : DEMO_IDS.ME,
        display_name: trimmed,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };
      db.profiles.push(me);
      if (!db.session.userId) db.session.userId = me.id;
    } else {
      me.display_name = trimmed;
    }
  });
  if (LIVE) {
    const supabase = sb();
    const id = currentUserId(load());
    if (supabase && id) {
      void supabase
        .from("profiles")
        .upsert({ id, display_name: trimmed }, { onConflict: "id" });
    }
  }
}

export function setOnboarded(value: boolean) {
  mutate((db) => {
    db.onboarded = value;
  });
}

export function createPact(name: string, endDate = DEFAULT_SUMMER_END): Pact {
  const db = load();
  const meId = currentUserId(db);
  const pact: Pact = {
    id: uid(),
    name: name.trim() || "Our Summer Pact",
    invite_code: generateInviteCode(),
    start_date: new Date().toISOString().slice(0, 10),
    end_date: endDate,
    created_by: meId,
    created_at: new Date().toISOString(),
  };
  const member = {
    id: uid(),
    pact_id: pact.id,
    user_id: meId,
    role: "owner" as const,
    joined_at: new Date().toISOString(),
  };
  mutate((d) => {
    d.pacts.push(pact);
    d.members.push(member);
    d.onboarded = true;
  });
  if (LIVE) {
    const supabase = sb();
    if (supabase) {
      void (async () => {
        const p = await supabase.from("pacts").insert({
          id: pact.id,
          name: pact.name,
          invite_code: pact.invite_code,
          start_date: pact.start_date,
          end_date: pact.end_date,
          created_by: pact.created_by,
        });
        if (p.error) console.error("[SummerPact] create pact failed:", p.error);
        const m = await supabase.from("pact_members").insert({
          pact_id: pact.id,
          user_id: meId,
          role: "owner",
        });
        if (m.error) console.error("[SummerPact] add owner member failed:", m.error);
        bindRealtime(pact.id);
      })();
    }
  }
  return pact;
}

export async function joinPactByCode(
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizeInviteCode(code);

  if (LIVE) {
    const supabase = sb();
    if (!supabase) return { ok: false, error: "Not connected." };
    const { data, error } = await supabase.rpc("join_pact", {
      p_code: normalized,
    });
    if (error) return { ok: false, error: error.message };
    if (data) {
      await refresh();
      return { ok: true };
    }
    return { ok: false, error: "Could not join that pact." };
  }

  // Demo mode (local).
  const db = load();
  const pact = db.pacts.find((p) => p.invite_code === normalized);
  if (!pact) return { ok: false, error: "No pact found with that code." };
  const existing = db.members.filter((m) => m.pact_id === pact.id);
  if (existing.length >= 2)
    return { ok: false, error: "This pact is full (2 members max)." };
  const meId = currentUserId(db);
  if (existing.some((m) => m.user_id === meId)) return { ok: true };
  mutate((d) => {
    d.members.push({
      id: uid(),
      pact_id: pact.id,
      user_id: meId,
      role: "member",
      joined_at: new Date().toISOString(),
    });
    d.onboarded = true;
  });
  return { ok: true };
}

export interface GoalInput {
  title: string;
  category: GoalCategory;
  why_it_matters: string;
  minimum_success: string;
  dream_success: string;
  weekly_target: number;
  xp_target: number;
}

export function addGoal(input: GoalInput): Goal | null {
  const db = load();
  const pactId = currentPactId(db);
  if (!pactId) return null;
  const goal: Goal = {
    id: uid(),
    user_id: currentUserId(db),
    pact_id: pactId,
    is_active: true,
    created_at: new Date().toISOString(),
    ...input,
  };
  mutate((d) => {
    d.goals.push(goal);
  });
  if (LIVE) {
    const supabase = sb();
    if (supabase) void supabase.from("goals").insert(goal);
  }
  return goal;
}

export function updateGoal(id: string, patch: Partial<Goal>) {
  mutate((db) => {
    const g = db.goals.find((g) => g.id === id);
    if (g) Object.assign(g, patch);
  });
  if (LIVE) {
    const supabase = sb();
    if (supabase) void supabase.from("goals").update(patch).eq("id", id);
  }
}

export function archiveGoal(id: string) {
  updateGoal(id, { is_active: false });
}

export function reactivateGoal(id: string) {
  updateGoal(id, { is_active: true });
}

export interface CheckInInput {
  goal_id: string;
  check_in_date: string;
  reflection: string;
  proof_url: string | null;
  effort_level: number;
  mood: CheckIn["mood"];
  blocker: string | null;
  tomorrow_step: string | null;
}

export function addCheckIn(input: CheckInInput): CheckIn | null {
  const db = load();
  const pactId = currentPactId(db);
  if (!pactId) return null;
  const xp = calculateXp({
    effortLevel: input.effort_level,
    hasProof: Boolean(input.proof_url),
    hasNextStep: Boolean(input.tomorrow_step && input.tomorrow_step.trim()),
  }).total;
  const checkIn: CheckIn = {
    id: uid(),
    user_id: currentUserId(db),
    pact_id: pactId,
    created_at: new Date().toISOString(),
    xp_awarded: xp,
    ...input,
  };
  mutate((d) => {
    d.checkIns.push(checkIn);
  });
  if (LIVE) {
    const supabase = sb();
    if (supabase) void supabase.from("check_ins").insert(checkIn);
  }
  return checkIn;
}

export function addNudge(message: string): Nudge | null {
  const db = load();
  const pactId = currentPactId(db);
  const friend = friendProfile(db);
  if (!pactId || !friend) return null;
  const nudge: Nudge = {
    id: uid(),
    from_user_id: currentUserId(db),
    to_user_id: friend.id,
    pact_id: pactId,
    message,
    copied: false,
    created_at: new Date().toISOString(),
  };
  mutate((d) => {
    d.nudges.push(nudge);
  });
  if (LIVE) {
    const supabase = sb();
    if (supabase) void supabase.from("nudges").insert(nudge);
  }
  return nudge;
}

export function markNudgeCopied(id: string) {
  mutate((db) => {
    const n = db.nudges.find((n) => n.id === id);
    if (n) n.copied = true;
  });
  if (LIVE) {
    const supabase = sb();
    if (supabase) void supabase.from("nudges").update({ copied: true }).eq("id", id);
  }
}

export function saveWeeklyReview(
  summary: string,
  bossFight: string,
  weekStart: string
) {
  const db = load();
  const pactId = currentPactId(db);
  if (!pactId) return;
  const meId = currentUserId(db);
  let record: WeeklyReview | null = null;
  mutate((d) => {
    const existing = d.reviews.find(
      (r) => r.user_id === meId && r.week_start === weekStart
    );
    if (existing) {
      existing.summary = summary;
      existing.boss_fight = bossFight;
      record = existing;
      return;
    }
    record = {
      id: uid(),
      user_id: meId,
      pact_id: pactId,
      week_start: weekStart,
      summary,
      boss_fight: bossFight,
      created_at: new Date().toISOString(),
    };
    d.reviews.push(record);
  });
  if (LIVE && record) {
    const supabase = sb();
    if (supabase)
      void supabase
        .from("weekly_reviews")
        .upsert(record, { onConflict: "user_id,week_start" });
  }
}

/** Upload a proof image; returns a URL to store on the check-in. */
export async function uploadProof(file: File): Promise<string | null> {
  if (LIVE) {
    const supabase = sb();
    if (!supabase) return null;
    const userId = currentUserId(load());
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(PROOF_BUCKET)
      .upload(path, file, { upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from(PROOF_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
  // Demo: inline data URL.
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// ── "Letter to future me" (kept local; personal note) ───────────────────────
const ARCHIVE_LETTER_KEY = "summer-pact:letter";

export function saveLetter(text: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ARCHIVE_LETTER_KEY, text);
  }
}

export function loadLetter(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ARCHIVE_LETTER_KEY) ?? "";
}
