import posthog from 'posthog-js';
import type { AnalyticsSink } from './sink';

// Web analytics sink. Initializes PostHog only when a key is configured; otherwise
// it stays a no-op so the app runs locally without analytics. In dev it also
// mirrors events to a global buffer so the flow can be verified without a key.
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let ready = false;

type EventBuffer = { event: string; props?: Record<string, unknown> }[];

function buffer(): EventBuffer {
  const g = globalThis as typeof globalThis & { __MORNING_EVENTS__?: EventBuffer };
  if (!g.__MORNING_EVENTS__) g.__MORNING_EVENTS__ = [];
  return g.__MORNING_EVENTS__;
}

function record(event: string, props?: Record<string, unknown>) {
  if (__DEV__) {
    buffer().push({ event, props });
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props ?? {});
  }
}

export const sink: AnalyticsSink = {
  init() {
    if (KEY && typeof window !== 'undefined' && !ready) {
      posthog.init(KEY, {
        api_host: HOST,
        capture_pageview: false,
        persistence: 'localStorage',
      });
      ready = true;
    }
  },
  capture(event, props) {
    record(event, props);
    if (ready) posthog.capture(event, props);
  },
  identify(id) {
    if (ready) posthog.identify(id);
  },
};
