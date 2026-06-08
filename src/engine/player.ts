import type { PlannedJourney, PlannedSegment } from '@/content/types';

// A pure, framework-agnostic state machine that walks a PlannedJourney one
// segment at a time. The UI drives it with TICK events from a timer; tests drive
// it directly. No timers, audio, or React here on purpose — keeps it testable.

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'completed';

export interface PlayerState {
  status: PlayerStatus;
  /** Index into journey.segments; equals length when completed. */
  index: number;
  elapsedInSegmentSec: number;
}

export type PlayerEvent =
  | { type: 'START' }
  | { type: 'TICK'; deltaSec: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'NEXT' }
  | { type: 'RESET' };

export function initialPlayerState(): PlayerState {
  return { status: 'idle', index: 0, elapsedInSegmentSec: 0 };
}

export function currentSegment(
  journey: PlannedJourney,
  state: PlayerState,
): PlannedSegment | null {
  return journey.segments[state.index] ?? null;
}

/** Overall progress across the whole journey, 0..1. */
export function journeyProgress(
  journey: PlannedJourney,
  state: PlayerState,
): number {
  if (journey.totalSec === 0) return 1;
  let elapsed = 0;
  for (let i = 0; i < state.index; i += 1) elapsed += journey.segments[i].durationSec;
  elapsed += state.elapsedInSegmentSec;
  return Math.min(1, elapsed / journey.totalSec);
}

export function playerReducer(
  journey: PlannedJourney,
  state: PlayerState,
  event: PlayerEvent,
): PlayerState {
  switch (event.type) {
    case 'START':
      if (journey.segments.length === 0) {
        return { status: 'completed', index: 0, elapsedInSegmentSec: 0 };
      }
      return { status: 'playing', index: 0, elapsedInSegmentSec: 0 };

    case 'PAUSE':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state;

    case 'RESUME':
      return state.status === 'paused' ? { ...state, status: 'playing' } : state;

    case 'NEXT':
      return advanceTo(journey, state.index + 1);

    case 'RESET':
      return initialPlayerState();

    case 'TICK': {
      if (state.status !== 'playing') return state;
      const seg = journey.segments[state.index];
      if (!seg) return { ...state, status: 'completed' };

      let index = state.index;
      let elapsed = state.elapsedInSegmentSec + Math.max(0, event.deltaSec);

      // A single tick may span more than one short segment, so roll forward.
      while (index < journey.segments.length && elapsed >= journey.segments[index].durationSec) {
        elapsed -= journey.segments[index].durationSec;
        index += 1;
      }

      if (index >= journey.segments.length) {
        return { status: 'completed', index: journey.segments.length, elapsedInSegmentSec: 0 };
      }
      return { status: 'playing', index, elapsedInSegmentSec: elapsed };
    }

    default:
      return state;
  }
}

function advanceTo(journey: PlannedJourney, nextIndex: number): PlayerState {
  if (nextIndex >= journey.segments.length) {
    return { status: 'completed', index: journey.segments.length, elapsedInSegmentSec: 0 };
  }
  return { status: 'playing', index: nextIndex, elapsedInSegmentSec: 0 };
}
