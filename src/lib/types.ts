// Shared domain types for Summer Pact.
// These mirror the Supabase schema in supabase/schema.sql so the demo store
// and a future Supabase data layer stay interchangeable.

export type GoalCategory =
  | "Fitness"
  | "Research"
  | "Coding"
  | "Career"
  | "School"
  | "Creative"
  | "Reading"
  | "Health"
  | "Social"
  | "Other";

export type Mood = "🔥" | "😊" | "😐" | "😮‍💨" | "😴";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Pact {
  id: string;
  name: string;
  invite_code: string;
  start_date: string; // ISO date (yyyy-MM-dd)
  end_date: string; // ISO date
  created_by: string;
  created_at: string;
}

export interface PactMember {
  id: string;
  pact_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  pact_id: string;
  title: string;
  category: GoalCategory;
  why_it_matters: string;
  minimum_success: string;
  dream_success: string;
  weekly_target: number;
  xp_target: number;
  is_active: boolean;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  pact_id: string;
  goal_id: string;
  check_in_date: string; // ISO date
  reflection: string;
  proof_url: string | null;
  effort_level: number; // 1..5
  mood: Mood;
  blocker: string | null;
  tomorrow_step: string | null;
  xp_awarded: number;
  created_at: string;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  pact_id: string;
  week_start: string; // ISO date
  summary: string;
  boss_fight: string;
  created_at: string;
}

export interface Nudge {
  id: string;
  from_user_id: string;
  to_user_id: string;
  pact_id: string;
  message: string;
  copied: boolean;
  created_at: string;
}

// Convenience view models used across the UI.
export interface MemberSnapshot {
  profile: Profile;
  totalXp: number;
  streak: number;
  receiptsThisWeek: number;
  goals: Goal[];
  recentCheckIns: CheckIn[];
  status: FriendStatus;
  checkedInToday: boolean;
}

export type FriendStatus =
  | "On fire"
  | "Making a comeback"
  | "Needs a nudge"
  | "Quiet but not out";
