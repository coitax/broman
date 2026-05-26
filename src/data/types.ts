import type { Intensity, MovementStyle } from '@/content/types';

export interface Preferences {
  totalMinutes: number;
  intensity: Intensity;
  movementStyle: MovementStyle;
}

export interface Checkin {
  mood: string;
  phase: 'pre' | 'post';
  note?: string;
  journeyId?: string;
}

export interface Completion {
  journeyId: string;
  totalSec: number;
}

export interface Repository {
  /** Ensure a session/identity exists (anonymous auth on Supabase). */
  init(): Promise<void>;
  getPreferences(): Promise<Preferences | null>;
  savePreferences(prefs: Preferences): Promise<void>;
  saveCheckin(checkin: Checkin): Promise<void>;
  recordCompletion(completion: Completion): Promise<void>;
}
