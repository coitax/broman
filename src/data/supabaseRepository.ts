import { getSupabase } from './supabase';
import type { Checkin, Completion, Preferences, Repository } from './types';

// Supabase-backed repository. Uses anonymous auth so users can start immediately
// with no signup; rows are scoped to the anonymous user_id via RLS. The schema
// lives in supabase/migrations/0001_init.sql.
export class SupabaseRepository implements Repository {
  private userId: string | null = null;

  async init(): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    if (data.session) {
      this.userId = data.session.user.id;
      return;
    }
    const { data: anon } = await sb.auth.signInAnonymously();
    this.userId = anon.user?.id ?? null;
  }

  async getPreferences(): Promise<Preferences | null> {
    const sb = getSupabase();
    if (!sb || !this.userId) return null;
    const { data } = await sb
      .from('preferences')
      .select('total_minutes, intensity, movement_style')
      .eq('user_id', this.userId)
      .maybeSingle();
    if (!data) return null;
    return {
      totalMinutes: data.total_minutes,
      intensity: data.intensity,
      movementStyle: data.movement_style,
    };
  }

  async savePreferences(prefs: Preferences): Promise<void> {
    const sb = getSupabase();
    if (!sb || !this.userId) return;
    await sb.from('preferences').upsert({
      user_id: this.userId,
      total_minutes: prefs.totalMinutes,
      intensity: prefs.intensity,
      movement_style: prefs.movementStyle,
      updated_at: new Date().toISOString(),
    });
  }

  async saveCheckin(checkin: Checkin): Promise<void> {
    const sb = getSupabase();
    if (!sb || !this.userId) return;
    await sb.from('mood_checkins').insert({
      user_id: this.userId,
      mood: checkin.mood,
      phase: checkin.phase,
      note: checkin.note ?? null,
      journey_id: checkin.journeyId ?? null,
    });
  }

  async recordCompletion(completion: Completion): Promise<void> {
    const sb = getSupabase();
    if (!sb || !this.userId) return;
    await sb.from('journey_completions').insert({
      user_id: this.userId,
      journey_id: completion.journeyId,
      total_sec: completion.totalSec,
    });
  }
}
