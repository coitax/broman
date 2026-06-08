import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazily created so the app runs in Phase 0 with no backend configured. Once
// EXPO_PUBLIC_SUPABASE_* env vars are set, this returns a real client used for
// auth, preferences, journey content, and mood check-ins.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) client = createClient(url, anonKey);
  return client;
}

export const isBackendConfigured = Boolean(url && anonKey);
