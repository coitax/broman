// Cross-platform audio abstraction.
//
// The Journey Player talks only to this interface. For Phase 0 we ship a console
// no-op implementation so the app runs end-to-end without bundled media. Phase 1
// swaps in real engines behind the SAME interface:
//   - native: react-native-track-player (background + lock-screen audio)
//   - web:    Howler.js / Web Audio API
// expo-av is the simplest single-API fallback if we want one engine first.

export interface AudioEngine {
  /** Start (or crossfade to) the looping ambient bed. */
  playAmbient(track: string): Promise<void>;
  stopAmbient(): Promise<void>;
  /** Play a one-shot guided-voice narration over the bed. */
  playVoice(track: string): Promise<void>;
  /** Duck the ambient bed to `level` (0..1) so voice/cues sit on top. */
  duckAmbient(level: number): Promise<void>;
  /** Short transition chime between segments. */
  playCue(cue: string): Promise<void>;
  unloadAll(): Promise<void>;
}

class NoopAudioEngine implements AudioEngine {
  private log(action: string, detail?: string) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[audio:noop] ${action}${detail ? ` -> ${detail}` : ''}`);
    }
  }
  async playAmbient(track: string) { this.log('playAmbient', track); }
  async stopAmbient() { this.log('stopAmbient'); }
  async playVoice(track: string) { this.log('playVoice', track); }
  async duckAmbient(level: number) { this.log('duckAmbient', String(level)); }
  async playCue(cue: string) { this.log('playCue', cue); }
  async unloadAll() { this.log('unloadAll'); }
}

let engine: AudioEngine | null = null;

/** Singleton accessor — swap the constructed engine here in Phase 1. */
export function getAudioEngine(): AudioEngine {
  if (!engine) engine = new NoopAudioEngine();
  return engine;
}
