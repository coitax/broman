import type { JourneyTemplate } from '@/content/types';
import { sunriseFlow } from './sunriseFlow';

// Two premium journeys to exercise the freemium gate. Content is just segment
// data; real audio/video assets attach to the segment keys later.
export const taichiUnwind: JourneyTemplate = {
  id: 'taichi-unwind',
  title: 'Tai Chi Unwind',
  description: 'Slow, flowing movement to loosen the body and steady the breath.',
  premium: true,
  movementStyle: 'taichi',
  defaultAmbient: 'ambient/still-water',
  segments: [
    { id: 'arrive', type: 'breath', title: 'Soften', weight: 2, minSec: 45, voiceTrack: 'voice/soften', ambientTrack: 'ambient/still-water' },
    { id: 'center', type: 'meditation', title: 'Find center', weight: 3, minSec: 60, voiceTrack: 'voice/center' },
    { id: 'affirm', type: 'affirmation', title: 'Steady & kind', weight: 2, minSec: 45, voiceTrack: 'voice/affirmations-steady' },
    { id: 'flow-1', type: 'movement', title: 'Cloud hands', weight: 4, minSec: 60, voiceTrack: 'voice/cue-cloud', video: 'movement/taichi-cloud' },
    { id: 'flow-2', type: 'movement', title: 'Wave hands', weight: 4, minSec: 60, voiceTrack: 'voice/cue-wave', video: 'movement/taichi-wave' },
    { id: 'close', type: 'transition', title: 'Return', weight: 1, minSec: 20, voiceTrack: 'voice/close' },
  ],
};

export const powerSunrise: JourneyTemplate = {
  id: 'power-sunrise',
  title: 'Power Sunrise',
  description: 'A brisker wake-up that builds heat and leaves you energized.',
  premium: true,
  movementStyle: 'yoga',
  defaultAmbient: 'ambient/first-light',
  segments: [
    { id: 'wake', type: 'breath', title: 'Wake the breath', weight: 2, minSec: 40, voiceTrack: 'voice/wake', ambientTrack: 'ambient/first-light' },
    { id: 'set', type: 'affirmation', title: 'Set your intention', weight: 2, minSec: 40, voiceTrack: 'voice/intention' },
    { id: 'warm', type: 'movement', title: 'Warm up', weight: 3, minSec: 60, voiceTrack: 'voice/cue-warm', video: 'movement/yoga-warm' },
    { id: 'flow', type: 'movement', title: 'Sun salutations', weight: 5, minSec: 90, voiceTrack: 'voice/cue-sun', video: 'movement/yoga-sun' },
    { id: 'close', type: 'transition', title: 'Carry the energy', weight: 1, minSec: 20, voiceTrack: 'voice/close' },
  ],
};

export const catalog: JourneyTemplate[] = [sunriseFlow, taichiUnwind, powerSunrise];

export function findJourney(id: string): JourneyTemplate | undefined {
  return catalog.find((j) => j.id === id);
}
