// Content model for the data-driven Journey Engine.
//
// A JourneyTemplate is authored content (eventually fetched from Supabase). The
// JourneyBuilder turns a template + the user's preferences into a PlannedJourney
// with concrete per-segment durations. Adding new custom audio/voice later means
// uploading media and adding a template row — no app release required.

export type SegmentType =
  | 'breath'
  | 'meditation'
  | 'affirmation'
  | 'movement'
  | 'transition';

/** How hard the user wants to work; shifts time allocation across segment types. */
export type Intensity = 'gentle' | 'balanced' | 'energizing';

/** Movement discipline the user prefers. */
export type MovementStyle = 'yoga' | 'taichi' | 'either';

export interface SegmentTemplate {
  id: string;
  type: SegmentType;
  title: string;
  /** Relative share of total time this segment gets, before intensity weighting. */
  weight: number;
  /** Never shrink a segment below this many seconds. */
  minSec?: number;
  /** Asset keys/URLs — resolved by the audio engine / media layer. */
  voiceTrack?: string;
  ambientTrack?: string;
  /** Movement demo video (Phase 1) — replaced/augmented by the 3D avatar later. */
  video?: string;
}

export interface JourneyTemplate {
  id: string;
  title: string;
  description: string;
  movementStyle: MovementStyle;
  /** Default ambient bed if a segment does not override it. */
  defaultAmbient: string;
  /**
   * Ordered segments encoding the "three stages into movement" arc:
   * settle (breath/meditation/affirmation) -> light movement -> heavier movement.
   * Order is preserved by the builder; only durations are computed.
   */
  segments: SegmentTemplate[];
}

export interface PlannedSegment extends SegmentTemplate {
  durationSec: number;
  ambientTrack: string;
}

export interface PlannedJourney {
  id: string;
  title: string;
  totalSec: number;
  segments: PlannedSegment[];
}
