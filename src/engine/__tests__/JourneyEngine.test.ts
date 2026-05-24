import { sunriseFlow } from '@/content/manifests/sunriseFlow';
import { buildJourney } from '@/engine/JourneyEngine';

describe('buildJourney', () => {
  it('allocates durations that sum exactly to the requested budget', () => {
    for (const minutes of [5, 10, 15, 20]) {
      const j = buildJourney(sunriseFlow, { totalMinutes: minutes, intensity: 'balanced' });
      expect(j.totalSec).toBe(minutes * 60);
      expect(j.segments.reduce((s, x) => s + x.durationSec, 0)).toBe(minutes * 60);
    }
  });

  it('preserves the authored segment order (the three-stage arc)', () => {
    const j = buildJourney(sunriseFlow, { totalMinutes: 10, intensity: 'balanced' });
    expect(j.segments.map((s) => s.id)).toEqual(sunriseFlow.segments.map((s) => s.id));
  });

  it('respects per-segment minimums', () => {
    const j = buildJourney(sunriseFlow, { totalMinutes: 10, intensity: 'balanced' });
    for (const seg of j.segments) {
      const tmpl = sunriseFlow.segments.find((s) => s.id === seg.id)!;
      expect(seg.durationSec).toBeGreaterThanOrEqual(tmpl.minSec ?? 0);
    }
  });

  it('gives movement more time when energizing than when gentle', () => {
    const energizing = buildJourney(sunriseFlow, { totalMinutes: 20, intensity: 'energizing' });
    const gentle = buildJourney(sunriseFlow, { totalMinutes: 20, intensity: 'gentle' });

    const movementSec = (j: ReturnType<typeof buildJourney>) =>
      j.segments.filter((s) => s.type === 'movement').reduce((sum, s) => sum + s.durationSec, 0);

    expect(movementSec(energizing)).toBeGreaterThan(movementSec(gentle));
  });

  it('falls back gracefully when the budget cannot cover the minimums', () => {
    const j = buildJourney(sunriseFlow, { totalMinutes: 1, intensity: 'balanced' });
    expect(j.totalSec).toBe(60);
    expect(j.segments.reduce((s, x) => s + x.durationSec, 0)).toBe(60);
  });

  it('inherits the default ambient track when a segment omits one', () => {
    const j = buildJourney(sunriseFlow, { totalMinutes: 10, intensity: 'balanced' });
    const settle = j.segments.find((s) => s.id === 'settle')!;
    expect(settle.ambientTrack).toBe(sunriseFlow.defaultAmbient);
  });
});
