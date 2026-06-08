// 3D avatar pose model. Poses are joint euler rotations (radians); the rig
// hierarchy and bone geometry live in poses.ts. Keeping pose data + interpolation
// as plain values (no three.js types) means the math is pure and unit-testable,
// and the same poses drive web (three.js) now and native (expo-gl) later.

export type Vec3 = [number, number, number];

export type JointName =
  | 'hips'
  | 'spine'
  | 'chest'
  | 'neck'
  | 'leftShoulder'
  | 'leftElbow'
  | 'rightShoulder'
  | 'rightElbow'
  | 'leftHip'
  | 'leftKnee'
  | 'rightHip'
  | 'rightKnee';

/** A pose is a (possibly partial) map of joint -> euler rotation. */
export type Pose = Partial<Record<JointName, Vec3>>;

export interface Keyframe {
  /** Normalized time in [0, 1]. */
  t: number;
  pose: Pose;
}

export interface PoseSequence {
  id: string;
  title: string;
  /** Sorted keyframes; the first should be at t=0 and the last at t=1. */
  keyframes: Keyframe[];
}
