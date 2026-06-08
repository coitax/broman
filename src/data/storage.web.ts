import type { KeyValueStore } from './storage';

// Web key-value store backed by localStorage, guarded so SSR/export prerender
// (no window) degrades to a no-op rather than throwing.
export const storage: KeyValueStore = {
  async getItem(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // ignore (private mode / quota)
    }
  },
};
