import type { AudioEngine } from './audioEngine';
import { WebAudioEngine } from './webAudioEngine';

export function createAudioEngine(): AudioEngine {
  return new WebAudioEngine();
}
