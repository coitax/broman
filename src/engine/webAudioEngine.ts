import type { AudioEngine } from './audioEngine';

// Real, license-free web audio for the validation MVP: a soft synthesized ambient
// pad (detuned sine partials through a lowpass) plus gentle cue chimes, with true
// gain ducking. Real recorded voice/soundscapes replace these later by swapping
// asset keys at the data layer — this engine stays the web fallback.
const AMBIENT_LEVEL = 0.12;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export class WebAudioEngine implements AudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private currentTrack: string | null = null;
  private unlocked = false;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.installUnlock();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.publishDebug();
    return this.ctx;
  }

  // Browser autoplay policy: a context created off the main gesture may start
  // suspended. Resume it on the next user interaction anywhere in the app.
  private installUnlock() {
    if (this.unlocked || typeof document === 'undefined') return;
    const resume = () => {
      void this.ctx?.resume().then(() => this.publishDebug());
    };
    const events = ['pointerdown', 'keydown', 'touchstart', 'click'] as const;
    const handler = () => {
      resume();
      events.forEach((e) => document.removeEventListener(e, handler));
      this.unlocked = true;
    };
    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
  }

  private publishDebug() {
    (globalThis as unknown as { __MORNING_AUDIO__?: unknown }).__MORNING_AUDIO__ = {
      contextState: this.ctx?.state ?? 'none',
      ambientPlaying: this.oscillators.length > 0,
      currentTrack: this.currentTrack,
    };
  }

  async playAmbient(track: string): Promise<void> {
    const ctx = this.ensureCtx();
    if (this.currentTrack === track && this.oscillators.length > 0) return;
    this.stopOscillators();
    this.currentTrack = track;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(AMBIENT_LEVEL, ctx.currentTime + 2.5);
    gain.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.connect(gain);

    const base = 98 + (hash(track) % 6) * 12; // subtle per-track variation
    for (const mult of [1, 1.5, 2.005]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * mult;
      osc.connect(filter);
      osc.start();
      this.oscillators.push(osc);
    }
    this.ambientGain = gain;
    this.publishDebug();
  }

  async stopAmbient(): Promise<void> {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
    }
    this.stopOscillators();
    this.currentTrack = null;
    this.publishDebug();
  }

  async duckAmbient(level: number): Promise<void> {
    if (!this.ambientGain || !this.ctx) return;
    const target = Math.max(0.0001, AMBIENT_LEVEL * Math.min(1, Math.max(0, level)));
    this.ambientGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.4);
  }

  async playVoice(_track: string): Promise<void> {
    // No recorded voice assets yet; ensure the context is live so real narration
    // drops in here later. Ducking is driven separately by the player.
    this.ensureCtx();
  }

  async playCue(_cue: string): Promise<void> {
    const ctx = this.ensureCtx();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 528;
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 1.3);
  }

  async unloadAll(): Promise<void> {
    this.stopOscillators();
    this.currentTrack = null;
    this.ambientGain = null;
    if (this.ctx && this.ctx.state !== 'closed') {
      await this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.publishDebug();
  }

  private stopOscillators() {
    for (const osc of this.oscillators) {
      try {
        osc.stop();
      } catch {
        // already stopped
      }
    }
    this.oscillators = [];
  }
}
