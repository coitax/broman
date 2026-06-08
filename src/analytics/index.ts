import { sink } from './sink';

// Typed analytics events. Keeping the event vocabulary in one union means every
// call site is checked and the validation funnel is easy to reason about.
export type AnalyticsEvent =
  | { name: 'app_opened' }
  | { name: 'onboarding_completed'; minutes: number; intensity: string; style: string }
  | { name: 'journey_started'; journeyId: string; minutes: number; intensity: string }
  | { name: 'journey_completed'; journeyId: string; totalSec: number }
  | { name: 'checkin_saved'; mood: string; phase: 'pre' | 'post' }
  | { name: 'library_opened' }
  | { name: 'paywall_viewed'; source: string }
  | { name: 'premium_unlocked' }
  | { name: 'reminder_set'; hour: number; minute: number; enabled: boolean }
  | { name: 'pose_studio_opened'; sequenceId: string };

let started = false;

export function initAnalytics(): void {
  if (started) return;
  started = true;
  sink.init();
}

export function track(event: AnalyticsEvent): void {
  const { name, ...props } = event;
  sink.capture(name, props as Record<string, unknown>);
}

export function identifyUser(id: string): void {
  sink.identify(id);
}
