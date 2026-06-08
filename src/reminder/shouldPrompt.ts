import type { ReminderState } from './types';

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Web fallback for the wake-up reminder: show an in-app "good morning" prompt when
// the app is opened at or after the reminder time and we haven't already prompted
// today. Pure so it's easy to test across edge cases.
export function shouldShowMorningPrompt(
  state: ReminderState,
  now: Date,
  lastShownISO: string | null,
): boolean {
  if (!state.enabled || !state.time) return false;

  const target = new Date(now);
  target.setHours(state.time.hour, state.time.minute, 0, 0);
  if (now < target) return false;

  if (lastShownISO) {
    const last = new Date(lastShownISO);
    if (!Number.isNaN(last.getTime()) && sameDay(last, now)) return false;
  }
  return true;
}
