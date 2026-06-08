import * as Notifications from 'expo-notifications';
import { storage } from '@/data/storage';
import type { ReminderScheduler, ReminderState } from './types';

const KEY = 'morning.reminder';

// Native scheduler: a repeating daily local notification — the gentle wake-up.
// Built and typechecked here; exercised on a device/EAS build (not in the web
// sandbox).
export const scheduler: ReminderScheduler = {
  async init() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  },

  async requestPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async get() {
    const raw = await storage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReminderState) : { enabled: false, time: null };
  },

  async set(state) {
    await storage.setItem(KEY, JSON.stringify(state));
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (state.enabled && state.time) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Good morning',
          body: 'Your morning ritual is ready when you are.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: state.time.hour,
          minute: state.time.minute,
        },
      });
    }
  },
};
