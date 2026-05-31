import {
  advancePlayhead,
  interpolateSequence,
  lerpPose,
  yogaSunSalutation,
} from '@/avatar/poses';
import type { PoseSequence } from '@/avatar/types';

const seq: PoseSequence = {
  id: 'test',
  title: 'Test',
  keyframes: [
    { t: 0, pose: { leftShoulder: [0, 0, 0] } },
    { t: 0.5, pose: { leftShoulder: [0, 0, 2] } },
    { t: 1, pose: { leftShoulder: [0, 0, 0] } },
  ],
};

describe('lerpPose', () => {
  it('interpolates joints present in either pose, defaulting missing to zero', () => {
    const out = lerpPose({ leftShoulder: [0, 0, 0] }, { leftShoulder: [0, 0, 2], spine: [1, 0, 0] }, 0.5);
    expect(out.leftShoulder).toEqual([0, 0, 1]);
    expect(out.spine).toEqual([0.5, 0, 0]); // missing in `a` -> treated as [0,0,0]
  });
});

describe('interpolateSequence', () => {
  it('returns endpoint poses at and beyond the boundaries (clamped)', () => {
    expect(interpolateSequence(seq, 0).leftShoulder).toEqual([0, 0, 0]);
    expect(interpolateSequence(seq, -1).leftShoulder).toEqual([0, 0, 0]);
    expect(interpolateSequence(seq, 2).leftShoulder).toEqual([0, 0, 0]);
  });

  it('lerps within a segment', () => {
    // quarter of the way to the t=0.5 keyframe -> half of [0,0,2]
    expect(interpolateSequence(seq, 0.25).leftShoulder).toEqual([0, 0, 1]);
    // peak at t=0.5
    expect(interpolateSequence(seq, 0.5).leftShoulder).toEqual([0, 0, 2]);
    // halfway back down
    expect(interpolateSequence(seq, 0.75).leftShoulder).toEqual([0, 0, 1]);
  });

  it('handles an empty sequence', () => {
    expect(interpolateSequence({ id: 'x', title: 'x', keyframes: [] }, 0.5)).toEqual({});
  });

  it('samples the real sun-salutation sequence without throwing', () => {
    for (let q = 0; q <= 1.0001; q += 0.1) {
      expect(typeof interpolateSequence(yogaSunSalutation, q)).toBe('object');
    }
  });
});

describe('advancePlayhead', () => {
  it('advances proportional to dt, speed, and duration', () => {
    // 1s at speed 1 over a 10s sequence -> +0.1
    expect(advancePlayhead(0, 1, 10, 1, false)).toBeCloseTo(0.1);
    // slow-motion (0.5x) covers half as much
    expect(advancePlayhead(0, 1, 10, 0.5, false)).toBeCloseTo(0.05);
  });

  it('clamps at 1 when not looping', () => {
    expect(advancePlayhead(0.95, 1, 10, 1, false)).toBe(1);
  });

  it('wraps when looping', () => {
    expect(advancePlayhead(0.95, 1, 10, 1, true)).toBeCloseTo(0.05);
  });

  it('degrades safely on zero duration', () => {
    expect(advancePlayhead(0.3, 1, 0, 1, true)).toBe(0);
    expect(advancePlayhead(0.3, 1, 0, 1, false)).toBe(1);
  });
});
