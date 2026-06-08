import type { JourneyTemplate } from '@/content/types';

// Sample authored journey used by the Phase 0 skeleton. In Phase 1 these move to
// Supabase and are fetched at runtime. Asset keys (voice/ambient/video) are
// placeholders the no-op audio engine just logs — real media slots in later
// without touching the engine or screens.
//
// Segment order encodes the "three stages into movement" arc:
//   settle (breath -> meditation -> affirmation) -> light movement -> heavier movement.
export const sunriseFlow: JourneyTemplate = {
  id: 'sunrise-flow',
  title: 'Sunrise Flow',
  description: 'Wake gently, settle the mind, then ease the body into the day.',
  movementStyle: 'yoga',
  defaultAmbient: 'ambient/morning-light',
  segments: [
    {
      id: 'arrive',
      type: 'breath',
      title: 'Arrive & breathe',
      weight: 2,
      minSec: 45,
      voiceTrack: 'voice/arrive',
      ambientTrack: 'ambient/morning-light',
    },
    {
      id: 'settle',
      type: 'meditation',
      title: 'Settle the mind',
      weight: 3,
      minSec: 60,
      voiceTrack: 'voice/body-scan',
    },
    {
      id: 'acknowledge',
      type: 'affirmation',
      title: 'Acknowledge & encourage',
      weight: 2,
      minSec: 45,
      voiceTrack: 'voice/affirmations-morning',
    },
    {
      id: 'light-movement',
      type: 'movement',
      title: 'Light movement',
      weight: 3,
      minSec: 60,
      voiceTrack: 'voice/cue-light',
      video: 'movement/yoga-gentle',
    },
    {
      id: 'flow',
      type: 'movement',
      title: 'Find your flow',
      weight: 4,
      minSec: 60,
      voiceTrack: 'voice/cue-flow',
      video: 'movement/yoga-flow',
    },
    {
      id: 'close',
      type: 'transition',
      title: 'Carry it with you',
      weight: 1,
      minSec: 20,
      voiceTrack: 'voice/close',
    },
  ],
};

export const sampleJourneys: JourneyTemplate[] = [sunriseFlow];
