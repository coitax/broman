import { useCallback, useEffect, useState } from 'react';
import { track } from '@/analytics';
import { reminderScheduler } from './index';
import type { ReminderState } from './types';

export function useReminder() {
  const [state, setState] = useState<ReminderState>({ enabled: false, time: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      await reminderScheduler.init();
      const s = await reminderScheduler.get();
      if (active) {
        setState(s);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (next: ReminderState) => {
    if (next.enabled) await reminderScheduler.requestPermission();
    await reminderScheduler.set(next);
    setState(next);
    if (next.time) {
      track({ name: 'reminder_set', hour: next.time.hour, minute: next.time.minute, enabled: next.enabled });
    }
  }, []);

  return { state, loading, save };
}
