// Native (default) analytics sink. Phase 2 swaps in posthog-react-native here.
// Until then it logs in dev so events are observable while building.
export interface AnalyticsSink {
  init(): void;
  capture(event: string, props?: Record<string, unknown>): void;
  identify(id: string): void;
}

export const sink: AnalyticsSink = {
  init() {},
  capture(event, props) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[analytics] ${event}`, props ?? {});
    }
  },
  identify() {},
};
