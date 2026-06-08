import { type AudioEngine, NoopAudioEngine } from './audioEngine';

// Native default. Phase 2 returns a react-native-track-player engine here.
export function createAudioEngine(): AudioEngine {
  return new NoopAudioEngine();
}
