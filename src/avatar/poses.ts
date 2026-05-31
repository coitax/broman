import type { JointName, Keyframe, Pose, PoseSequence, Vec3 } from './types';

// --- Rig geometry -----------------------------------------------------------
// Local offset of each joint from its parent and the limb length drawn below it.
// Used by the renderer; kept here so web (three.js) and future native (expo-gl)
// share one source of truth.
export interface Bone {
  parent: JointName | null;
  /** Local position offset from the parent joint. */
  offset: Vec3;
  /** Length of the visual segment drawn from this joint toward its child. */
  length: number;
}

export const RIG: Record<JointName, Bone> = {
  hips: { parent: null, offset: [0, 0, 0], length: 0.25 },
  spine: { parent: 'hips', offset: [0, 0.25, 0], length: 0.3 },
  chest: { parent: 'spine', offset: [0, 0.3, 0], length: 0.3 },
  neck: { parent: 'chest', offset: [0, 0.32, 0], length: 0.22 },
  leftShoulder: { parent: 'chest', offset: [0.22, 0.28, 0], length: 0.32 },
  leftElbow: { parent: 'leftShoulder', offset: [0, -0.32, 0], length: 0.3 },
  rightShoulder: { parent: 'chest', offset: [-0.22, 0.28, 0], length: 0.32 },
  rightElbow: { parent: 'rightShoulder', offset: [0, -0.32, 0], length: 0.3 },
  leftHip: { parent: 'hips', offset: [0.12, -0.05, 0], length: 0.42 },
  leftKnee: { parent: 'leftHip', offset: [0, -0.42, 0], length: 0.4 },
  rightHip: { parent: 'hips', offset: [-0.12, -0.05, 0], length: 0.42 },
  rightKnee: { parent: 'rightHip', offset: [0, -0.42, 0], length: 0.4 },
};

export const JOINT_NAMES = Object.keys(RIG) as JointName[];

// --- Pure interpolation math ------------------------------------------------

export function lerp(a: number, b: number, alpha: number): number {
  return a + (b - a) * alpha;
}

const ZERO: Vec3 = [0, 0, 0];

export function lerpVec3(a: Vec3 = ZERO, b: Vec3 = ZERO, alpha: number): Vec3 {
  return [lerp(a[0], b[0], alpha), lerp(a[1], b[1], alpha), lerp(a[2], b[2], alpha)];
}

/** Interpolate every joint present in either pose; missing joints default to 0. */
export function lerpPose(a: Pose, b: Pose, alpha: number): Pose {
  const joints = new Set<JointName>([
    ...(Object.keys(a) as JointName[]),
    ...(Object.keys(b) as JointName[]),
  ]);
  const out: Pose = {};
  for (const j of joints) out[j] = lerpVec3(a[j], b[j], alpha);
  return out;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * Sample a sequence at normalized time `q` (clamped to [0,1]). Finds the
 * bracketing keyframes and lerps between them. Assumes keyframes are sorted by t.
 */
export function interpolateSequence(seq: PoseSequence, q: number): Pose {
  const frames = seq.keyframes;
  if (frames.length === 0) return {};
  const time = clamp01(q);

  if (time <= frames[0].t) return { ...frames[0].pose };
  const last = frames[frames.length - 1];
  if (time >= last.t) return { ...last.pose };

  let lo = frames[0];
  let hi = last;
  for (let i = 0; i < frames.length - 1; i += 1) {
    if (time >= frames[i].t && time <= frames[i + 1].t) {
      lo = frames[i];
      hi = frames[i + 1];
      break;
    }
  }
  const span = hi.t - lo.t;
  const alpha = span <= 0 ? 0 : (time - lo.t) / span;
  return lerpPose(lo.pose, hi.pose, alpha);
}

/**
 * Advance the playhead by `dtSec` real seconds at a `speed` multiplier over a
 * sequence of `durationSec`. Loops (wraps) or clamps at the end. Returns the new
 * normalized playhead in [0,1].
 */
export function advancePlayhead(
  q: number,
  dtSec: number,
  durationSec: number,
  speed: number,
  loop: boolean,
): number {
  if (durationSec <= 0) return loop ? 0 : 1;
  const next = q + (dtSec * speed) / durationSec;
  if (loop) {
    const wrapped = next % 1;
    return wrapped < 0 ? wrapped + 1 : wrapped;
  }
  return clamp01(next);
}

// --- Movement sequences -----------------------------------------------------
// Simplified, recognizable shapes built from joint rotations (radians). Real
// motion-captured glTF clips replace these later behind the same component API.

function kf(t: number, pose: Pose): Keyframe {
  return { t, pose };
}

export const yogaSunSalutation: PoseSequence = {
  id: 'yoga-sun',
  title: 'Sun Salutation',
  keyframes: [
    // Mountain
    kf(0, {}),
    // Arms reach overhead
    kf(0.25, { leftShoulder: [0, 0, -2.7], rightShoulder: [0, 0, 2.7] }),
    // Forward fold
    kf(0.5, {
      spine: [1.3, 0, 0],
      chest: [0.3, 0, 0],
      leftShoulder: [2.6, 0, -0.2],
      rightShoulder: [2.6, 0, 0.2],
    }),
    // Plank-ish reach
    kf(0.75, {
      spine: [0.4, 0, 0],
      leftShoulder: [1.6, 0, -0.3],
      rightShoulder: [1.6, 0, 0.3],
      leftHip: [0.2, 0, 0],
      rightHip: [0.2, 0, 0],
    }),
    // Back to mountain
    kf(1, {}),
  ],
};

export const taichiCloudHands: PoseSequence = {
  id: 'taichi-cloud',
  title: 'Cloud Hands',
  keyframes: [
    kf(0, { leftShoulder: [0, 0, -0.5], rightShoulder: [0, 0, 0.5], leftElbow: [1.1, 0, 0], rightElbow: [1.1, 0, 0] }),
    kf(0.33, {
      spine: [0, 0.4, 0],
      leftShoulder: [0, 0, -1.4],
      rightShoulder: [0, 0, 0.3],
      leftElbow: [0.8, 0, 0],
      rightElbow: [1.4, 0, 0],
    }),
    kf(0.66, {
      spine: [0, -0.4, 0],
      leftShoulder: [0, 0, -0.3],
      rightShoulder: [0, 0, 1.4],
      leftElbow: [1.4, 0, 0],
      rightElbow: [0.8, 0, 0],
    }),
    kf(1, { leftShoulder: [0, 0, -0.5], rightShoulder: [0, 0, 0.5], leftElbow: [1.1, 0, 0], rightElbow: [1.1, 0, 0] }),
  ],
};

export const sequences: PoseSequence[] = [yogaSunSalutation, taichiCloudHands];

export function findSequence(id: string): PoseSequence | undefined {
  return sequences.find((s) => s.id === id);
}
