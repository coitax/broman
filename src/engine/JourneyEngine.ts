import type {
  Intensity,
  JourneyTemplate,
  PlannedJourney,
  PlannedSegment,
  SegmentTemplate,
} from '@/content/types';

export interface BuildOptions {
  totalMinutes: number;
  intensity: Intensity;
}

// Intensity nudges where time goes. "gentle" leans into settling segments
// (breath/meditation/affirmation); "energizing" leans into movement.
const INTENSITY_BIAS: Record<Intensity, { settle: number; movement: number }> = {
  gentle: { settle: 1.35, movement: 0.75 },
  balanced: { settle: 1, movement: 1 },
  energizing: { settle: 0.7, movement: 1.4 },
};

function isMovement(type: SegmentTemplate['type']): boolean {
  return type === 'movement';
}

function biasFor(template: SegmentTemplate, intensity: Intensity): number {
  const bias = INTENSITY_BIAS[intensity];
  return template.weight * (isMovement(template.type) ? bias.movement : bias.settle);
}

/**
 * Allocate a fixed time budget across a template's segments, proportional to
 * intensity-weighted shares, while respecting per-segment minimums. Segment
 * order (the "three stages" arc) is always preserved.
 *
 * Guarantees: the returned segment durations sum to exactly totalMinutes * 60.
 */
export function buildJourney(
  template: JourneyTemplate,
  options: BuildOptions,
): PlannedJourney {
  const totalSec = Math.max(0, Math.round(options.totalMinutes * 60));
  const segments = template.segments;

  if (segments.length === 0) {
    return { id: template.id, title: template.title, totalSec: 0, segments: [] };
  }

  const minTotal = segments.reduce((sum, s) => sum + (s.minSec ?? 0), 0);

  // If the budget can't even cover the minimums, distribute proportionally to
  // the minimums so we still sum to totalSec and never exceed it.
  if (totalSec <= minTotal) {
    return finalize(template, allocateProportional(segments, segments.map((s) => s.minSec ?? 1), totalSec));
  }

  // Distribute the floors first, then share the remainder by weighted bias.
  const remainder = totalSec - minTotal;
  const weights = segments.map((s) => biasFor(s, options.intensity));
  const extra = allocateProportional(segments, weights, remainder);
  const durations = segments.map((s, i) => (s.minSec ?? 0) + extra[i]);

  return finalize(template, durations);
}

/**
 * Split `amount` across slots proportional to `weights`, using largest-remainder
 * rounding so the parts sum exactly to `amount` (no drift from Math.round).
 */
function allocateProportional(
  slots: readonly unknown[],
  weights: readonly number[],
  amount: number,
): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / weightSum) * amount);
  const floors = raw.map((x) => Math.floor(x));
  let used = floors.reduce((a, b) => a + b, 0);

  // Hand out the leftover units to the largest fractional remainders.
  const order = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);

  let k = 0;
  while (used < amount && k < order.length) {
    floors[order[k].i] += 1;
    used += 1;
    k += 1;
  }
  return floors;
}

function finalize(template: JourneyTemplate, durations: number[]): PlannedJourney {
  const planned: PlannedSegment[] = template.segments.map((s, i) => ({
    ...s,
    durationSec: durations[i],
    ambientTrack: s.ambientTrack ?? template.defaultAmbient,
  }));
  return {
    id: template.id,
    title: template.title,
    totalSec: planned.reduce((sum, s) => sum + s.durationSec, 0),
    segments: planned,
  };
}
