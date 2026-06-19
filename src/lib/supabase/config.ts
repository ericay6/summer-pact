// Central place to read Supabase env + decide if we're configured.
// When NOT configured, the app falls back to DEMO MODE (local store).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const PROOF_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PROOF_BUCKET ?? "proofs";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
