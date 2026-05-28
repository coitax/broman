import { storage } from '@/data/storage';
import type { ReminderScheduler, ReminderState } from './types';

const KEY = 'morning.reminder';

// Web has no reliable background alarm, so we just persist the preference and let
// the in-app morning prompt (shouldShowMorningPrompt) surface it. We still ask for
// Notification permission opportunistically for foreground reminders.
export const scheduler: ReminderScheduler = {
  async init() {},

  async requestPermission() {
    try {
      if (typeof Notification === 'undefined') return false;
      if (Notification.permission === 'granted') return true;
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  },

  async get() {
    const raw = await storage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReminderState) : { enabled: false, time: null };
  },

  async set(state) {
    await storage.setItem(KEY, JSON.stringify(state));
  },
};
