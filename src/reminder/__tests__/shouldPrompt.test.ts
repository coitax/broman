import { shouldShowMorningPrompt } from '@/reminder/shouldPrompt';
import type { ReminderState } from '@/reminder/types';

const enabled: ReminderState = { enabled: true, time: { hour: 7, minute: 0 } };

function at(h: number, m: number): Date {
  const d = new Date('2026-05-28T00:00:00');
  d.setHours(h, m, 0, 0);
  return d;
}

describe('shouldShowMorningPrompt', () => {
  it('does not prompt when disabled or no time set', () => {
    expect(shouldShowMorningPrompt({ enabled: false, time: { hour: 7, minute: 0 } }, at(8, 0), null)).toBe(false);
    expect(shouldShowMorningPrompt({ enabled: true, time: null }, at(8, 0), null)).toBe(false);
  });

  it('does not prompt before the reminder time', () => {
    expect(shouldShowMorningPrompt(enabled, at(6, 59), null)).toBe(false);
  });

  it('prompts at or after the reminder time when not shown today', () => {
    expect(shouldShowMorningPrompt(enabled, at(7, 0), null)).toBe(true);
    expect(shouldShowMorningPrompt(enabled, at(9, 30), null)).toBe(true);
  });

  it('does not prompt twice on the same day', () => {
    const now = at(9, 0);
    const shownEarlierToday = at(7, 5).toISOString();
    expect(shouldShowMorningPrompt(enabled, now, shownEarlierToday)).toBe(false);
  });

  it('prompts again on a new day', () => {
    const now = at(7, 30);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(shouldShowMorningPrompt(enabled, now, yesterday.toISOString())).toBe(true);
  });

  it('ignores a corrupt lastShown timestamp', () => {
    expect(shouldShowMorningPrompt(enabled, at(8, 0), 'not-a-date')).toBe(true);
  });
});
