import type { PlannedJourney } from '@/content/types';
import {
  initialPlayerState,
  journeyProgress,
  playerReducer,
  type PlayerState,
} from '@/engine/player';

const journey: PlannedJourney = {
  id: 'test',
  title: 'Test',
  totalSec: 30,
  segments: [
    { id: 'a', type: 'breath', title: 'A', weight: 1, durationSec: 10, ambientTrack: 'amb' },
    { id: 'b', type: 'movement', title: 'B', weight: 1, durationSec: 20, ambientTrack: 'amb' },
  ],
};

function run(state: PlayerState, ...events: Parameters<typeof playerReducer>[2][]): PlayerState {
  return events.reduce((s, e) => playerReducer(journey, s, e), state);
}

describe('playerReducer', () => {
  it('starts at the first segment', () => {
    const s = playerReducer(journey, initialPlayerState(), { type: 'START' });
    expect(s).toEqual({ status: 'playing', index: 0, elapsedInSegmentSec: 0 });
  });

  it('advances to the next segment when a segment elapses', () => {
    let s = playerReducer(journey, initialPlayerState(), { type: 'START' });
    s = run(s, { type: 'TICK', deltaSec: 10 });
    expect(s.index).toBe(1);
    expect(s.elapsedInSegmentSec).toBe(0);
    expect(s.status).toBe('playing');
  });

  it('completes after the final segment', () => {
    let s = playerReducer(journey, initialPlayerState(), { type: 'START' });
    s = run(s, { type: 'TICK', deltaSec: 30 });
    expect(s.status).toBe('completed');
    expect(journeyProgress(journey, s)).toBe(1);
  });

  it('rolls a single large tick across multiple segments', () => {
    let s = playerReducer(journey, initialPlayerState(), { type: 'START' });
    s = run(s, { type: 'TICK', deltaSec: 25 });
    expect(s.index).toBe(1);
    expect(s.elapsedInSegmentSec).toBe(15);
  });

  it('ignores ticks while paused and resumes cleanly', () => {
    let s = playerReducer(journey, initialPlayerState(), { type: 'START' });
    s = run(s, { type: 'TICK', deltaSec: 5 }, { type: 'PAUSE' }, { type: 'TICK', deltaSec: 100 });
    expect(s.status).toBe('paused');
    expect(s.index).toBe(0);
    expect(s.elapsedInSegmentSec).toBe(5);
    s = run(s, { type: 'RESUME' });
    expect(s.status).toBe('playing');
  });

  it('NEXT skips to the following segment', () => {
    let s = playerReducer(journey, initialPlayerState(), { type: 'START' });
    s = run(s, { type: 'NEXT' });
    expect(s.index).toBe(1);
    expect(s.elapsedInSegmentSec).toBe(0);
  });
});
