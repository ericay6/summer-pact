import { format, subDays } from "date-fns";
import { calculateXp } from "./xp";
import type {
  CheckIn,
  Goal,
  Nudge,
  Pact,
  PactMember,
  Profile,
  WeeklyReview,
} from "./types";

export interface DemoDB {
  profiles: Profile[];
  pacts: Pact[];
  members: PactMember[];
  goals: Goal[];
  checkIns: CheckIn[];
  reviews: WeeklyReview[];
  nudges: Nudge[];
  session: { userId: string | null };
  onboarded: boolean;
  /** Live mode: data finished loading from Supabase. Always true in demo. */
  ready?: boolean;
  /** Live mode: a Supabase auth session exists. Always true in demo. */
  authed?: boolean;
}

const ME = "user_me";
const FRIEND = "user_riley";
const PACT = "pact_demo";

function iso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function mkCheckIn(
  partial: Omit<CheckIn, "id" | "created_at" | "xp_awarded"> & {
    xp_awarded?: number;
  }
): CheckIn {
  // Treat 0/undefined as "auto-compute" so seed rows always get real XP.
  const xp =
    partial.xp_awarded ||
    calculateXp({
      effortLevel: partial.effort_level,
      hasProof: Boolean(partial.proof_url),
      hasNextStep: Boolean(partial.tomorrow_step),
    }).total;
  return {
    id: `ci_${partial.user_id}_${partial.check_in_date}_${partial.goal_id}`,
    created_at: new Date(partial.check_in_date + "T18:00:00").toISOString(),
    ...partial,
    xp_awarded: xp,
  };
}

/**
 * Builds a believable demo pact seeded relative to `today` so streaks,
 * "this week", and friend-status all look alive on first load.
 */
export function buildDemoDB(today = new Date()): DemoDB {
  const profiles: Profile[] = [
    {
      id: ME,
      display_name: "You",
      avatar_url: null,
      created_at: subDays(today, 16).toISOString(),
    },
    {
      id: FRIEND,
      display_name: "Riley",
      avatar_url: null,
      created_at: subDays(today, 16).toISOString(),
    },
  ];

  const pacts: Pact[] = [
    {
      id: PACT,
      name: "The Summer Arc",
      invite_code: "SUN24Z",
      start_date: iso(subDays(today, 16)),
      end_date: "2026-09-01",
      created_by: ME,
      created_at: subDays(today, 16).toISOString(),
    },
  ];

  const members: PactMember[] = [
    {
      id: "m_me",
      pact_id: PACT,
      user_id: ME,
      role: "owner",
      joined_at: subDays(today, 16).toISOString(),
    },
    {
      id: "m_riley",
      pact_id: PACT,
      user_id: FRIEND,
      role: "member",
      joined_at: subDays(today, 15).toISOString(),
    },
  ];

  const goals: Goal[] = [
    {
      id: "g_research",
      user_id: ME,
      pact_id: PACT,
      title: "Finish PACT research paper",
      category: "Research",
      why_it_matters:
        "It's my first first-author paper and future-me really wants this on the CV.",
      minimum_success: "Touch the doc for 15 minutes.",
      dream_success: "Submit a full draft to my advisor by August.",
      weekly_target: 4,
      xp_target: 400,
      is_active: true,
      created_at: subDays(today, 16).toISOString(),
    },
    {
      id: "g_fitness",
      user_id: ME,
      pact_id: PACT,
      title: "Move my body 4x/week",
      category: "Fitness",
      why_it_matters: "I think clearer and sleep better when I actually move.",
      minimum_success: "A 10-minute walk counts.",
      dream_success: "Run a 5k without stopping by end of summer.",
      weekly_target: 4,
      xp_target: 300,
      is_active: true,
      created_at: subDays(today, 16).toISOString(),
    },
    {
      id: "g_reading",
      user_id: ME,
      pact_id: PACT,
      title: "Read 6 books this summer",
      category: "Reading",
      why_it_matters: "I miss reading for fun, not just for class.",
      minimum_success: "Read 5 pages.",
      dream_success: "Finish 6 books and write tiny reviews.",
      weekly_target: 3,
      xp_target: 200,
      is_active: true,
      created_at: subDays(today, 16).toISOString(),
    },
    {
      id: "g_riley_coding",
      user_id: FRIEND,
      pact_id: PACT,
      title: "Ship a portfolio project",
      category: "Coding",
      why_it_matters: "Recruiters keep asking for something I built end to end.",
      minimum_success: "Commit one small change.",
      dream_success: "Deploy it and post about it.",
      weekly_target: 4,
      xp_target: 400,
      is_active: true,
      created_at: subDays(today, 15).toISOString(),
    },
    {
      id: "g_riley_health",
      user_id: FRIEND,
      pact_id: PACT,
      title: "Cook at home 5x/week",
      category: "Health",
      why_it_matters: "Saving money and actually eating vegetables.",
      minimum_success: "Make literally anything that isn't takeout.",
      dream_success: "A repertoire of 10 go-to meals.",
      weekly_target: 5,
      xp_target: 250,
      is_active: true,
      created_at: subDays(today, 15).toISOString(),
    },
  ];

  const checkIns: CheckIn[] = [];

  // --- My check-ins: a strong recent run (streak), proof + next steps. ---
  const myPlan: Array<[number, string, number, string, string | null, string | null]> = [
    // [daysAgo, goalId, effort, reflection, proof, tomorrowStep]
    [0, "g_research", 3, "Outlined the results section. Brain was foggy but I showed up.", null, "Write the first paragraph of results."],
    [1, "g_fitness", 4, "30-min run by the water. Felt unstoppable for exactly 12 minutes.", "demo://run.jpg", "Stretch + a short walk."],
    [1, "g_research", 2, "Reread my notes, fixed two citations.", null, null],
    [2, "g_reading", 3, "Read 20 pages of the novel before bed.", "demo://book.jpg", "Read one chapter."],
    [3, "g_research", 5, "Huge session — drafted the entire methods section!", "demo://methods.png", "Send methods to advisor."],
    [4, "g_fitness", 2, "Short walk, low energy day, but not a zero day.", null, "Try a real workout."],
    [6, "g_reading", 2, "A few pages, fell asleep. Counts.", null, null],
    [7, "g_research", 4, "Cleaned up figures and re-ran the analysis.", "demo://fig.png", "Polish figure captions."],
  ];
  for (const [daysAgo, goalId, effort, reflection, proof, step] of myPlan) {
    checkIns.push(
      mkCheckIn({
        user_id: ME,
        pact_id: PACT,
        goal_id: goalId,
        check_in_date: iso(subDays(today, daysAgo)),
        reflection,
        proof_url: proof,
        effort_level: effort,
        mood: effort >= 4 ? "🔥" : effort === 1 ? "😴" : "😊",
        blocker: daysAgo === 0 ? "Tired / low focus" : daysAgo === 4 ? "Low energy" : null,
        tomorrow_step: step,
        xp_awarded: 0,
      })
    );
  }

  // --- Riley's check-ins: went quiet 3 days ago -> "Needs a nudge". ---
  const rileyPlan: Array<[number, string, number, string, string | null]> = [
    [3, "g_riley_coding", 3, "Set up the repo and CI. Tedious but done.", "demo://repo.png"],
    [4, "g_riley_health", 2, "Made pasta. Veggies were technically present.", null],
    [5, "g_riley_coding", 4, "Built the auth flow, super proud of this one.", "demo://auth.png"],
    [6, "g_riley_health", 3, "Meal prepped for two days.", "demo://mealprep.jpg"],
    [8, "g_riley_coding", 2, "Small bug fix, low energy.", null],
  ];
  for (const [daysAgo, goalId, effort, reflection, proof] of rileyPlan) {
    checkIns.push(
      mkCheckIn({
        user_id: FRIEND,
        pact_id: PACT,
        goal_id: goalId,
        check_in_date: iso(subDays(today, daysAgo)),
        reflection,
        proof_url: proof,
        effort_level: effort,
        mood: effort >= 4 ? "🔥" : "😊",
        blocker: null,
        tomorrow_step: daysAgo === 5 ? "Wire up the database." : null,
        xp_awarded: 0,
      })
    );
  }

  const nudges: Nudge[] = [];
  const reviews: WeeklyReview[] = [];

  return {
    profiles,
    pacts,
    members,
    goals,
    checkIns,
    reviews,
    nudges,
    session: { userId: ME },
    onboarded: true,
    // ^ demo starts already onboarded so you land on a lively dashboard.
  };
}

export const DEMO_IDS = { ME, FRIEND, PACT };
