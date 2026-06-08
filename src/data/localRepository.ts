import type { KeyValueStore } from './storage';
import type { Checkin, Completion, Preferences, Repository } from './types';

const KEYS = {
  prefs: 'morning.preferences',
  checkins: 'morning.checkins',
  completions: 'morning.completions',
} as const;

// Local-only repository used when no backend is configured. Keeps the app fully
// functional for the validation MVP; the Supabase impl mirrors the same shape.
export class LocalRepository implements Repository {
  constructor(private readonly store: KeyValueStore) {}

  async init(): Promise<void> {}

  async getPreferences(): Promise<Preferences | null> {
    const raw = await this.store.getItem(KEYS.prefs);
    return raw ? (JSON.parse(raw) as Preferences) : null;
  }

  async savePreferences(prefs: Preferences): Promise<void> {
    await this.store.setItem(KEYS.prefs, JSON.stringify(prefs));
  }

  async saveCheckin(checkin: Checkin): Promise<void> {
    const list = await this.readList(KEYS.checkins);
    list.push({ ...checkin, at: new Date().toISOString() });
    await this.store.setItem(KEYS.checkins, JSON.stringify(list));
  }

  async recordCompletion(completion: Completion): Promise<void> {
    const list = await this.readList(KEYS.completions);
    list.push({ ...completion, at: new Date().toISOString() });
    await this.store.setItem(KEYS.completions, JSON.stringify(list));
  }

  private async readList(key: string): Promise<Record<string, unknown>[]> {
    const raw = await this.store.getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
