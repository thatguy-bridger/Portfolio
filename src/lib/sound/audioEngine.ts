// Native Web Audio API sound engine — no npm dependency. Two layers, both
// gated behind one masterGain node so a single mute toggle silences both:
//
//  - an ambient pad: three detuned oscillators through a slow-modulated
//    lowpass filter, very quiet, always running once started — the
//    "subtle background layer" the owner asked for.
//  - short synthesized SFX (field-enter / lock-on / click), each a
//    fresh oscillator + gain-envelope created on demand and torn down
//    after it finishes — no audio asset files needed.
//
// Autoplay-policy handling: `ensureContext()` is only ever called from
// inside a real user-gesture event handler (MotionLayer's first-interaction
// listener, or the mute toggle's own click) — never from a mount effect or
// module init — so the browser never has grounds to log "AudioContext was
// not allowed to start" and never needs an explicit unlock gesture beyond
// the one the visitor already made. Before that first gesture, `ctx` stays
// null and every play* function below is a silent no-op by construction.
const STORAGE_KEY = 'portfolio:sound-muted';
const TARGET_VOLUME = 0.55;
const AMBIENT_GAIN = 0.05;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = readStoredMuted();
let ambientStarted = false;
const listeners = new Set<() => void>();

function readStoredMuted(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false; // storage unavailable — default to "sound wants to be on", per the owner's stated intent
  }
}

function writeStoredMuted(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // best-effort only
  }
}

function notify() {
  for (const l of listeners) l();
}

export function subscribeSoundState(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isMuted(): boolean {
  return muted;
}

export function isAudioReady(): boolean {
  return ctx !== null;
}

function rampGain(node: GainNode, to: number, seconds: number) {
  if (!ctx) return;
  const now = ctx.currentTime;
  node.gain.cancelScheduledValues(now);
  node.gain.setValueAtTime(node.gain.value, now);
  node.gain.linearRampToValueAtTime(to, now + seconds);
}

function buildAmbientPad(context: AudioContext, destination: AudioNode) {
  const ambientGain = context.createGain();
  ambientGain.gain.value = AMBIENT_GAIN;
  ambientGain.connect(destination);

  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.7;
  filter.connect(ambientGain);

  // A slow LFO breathing the filter cutoff so the drone isn't perfectly static.
  const lfo = context.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.07;
  const lfoGain = context.createGain();
  lfoGain.gain.value = 260;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const root = context.createOscillator();
  root.type = 'sine';
  root.frequency.value = 55; // A1 — low, felt more than heard

  const fifth = context.createOscillator();
  fifth.type = 'sine';
  fifth.frequency.value = 55 * 1.5;
  fifth.detune.value = 4;
  const fifthGain = context.createGain();
  fifthGain.gain.value = 0.6;
  fifth.connect(fifthGain);
  fifthGain.connect(filter);

  const octave = context.createOscillator();
  octave.type = 'triangle';
  octave.frequency.value = 55 * 2;
  const octaveGain = context.createGain();
  octaveGain.gain.value = 0.35;
  octave.connect(octaveGain);
  octaveGain.connect(filter);

  root.connect(filter);

  for (const osc of [lfo, root, fifth, octave]) osc.start();
  ambientStarted = true;
}

/** Creates the AudioContext + full graph. Only safe to call from inside a user-gesture handler — see the file header. Idempotent. */
export function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined' || (!window.AudioContext && !(window as any).webkitAudioContext)) return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  const context: AudioContext = new Ctor();
  const gain = context.createGain();
  gain.gain.value = 0; // start silent regardless of stored preference — see fadeInIfPermitted
  gain.connect(context.destination);
  ctx = context;
  masterGain = gain;
  buildAmbientPad(context, gain);
  return context;
}

/** Called by MotionLayer's first-interaction listener. If the visitor hasn't explicitly muted before, fades the master gain in — this is the "on by default, but only after a gesture" behavior the autoplay policy forces. A no-op if already faded in or explicitly muted. */
export function fadeInIfPermitted() {
  const context = ensureContext();
  if (!context || !masterGain) return;
  void context.resume().catch(() => {});
  if (!muted) rampGain(masterGain, TARGET_VOLUME, 1.4);
}

export function toggleMute(): boolean {
  const context = ensureContext();
  muted = !muted;
  writeStoredMuted(muted);
  if (context && masterGain) {
    void context.resume().catch(() => {});
    rampGain(masterGain, muted ? 0 : TARGET_VOLUME, muted ? 0.25 : 0.4);
  }
  notify();
  return muted;
}

function playEnvelopedTone(spec: { type: OscillatorType; freqFrom: number; freqTo?: number; duration: number; peak: number; filterHz?: number }) {
  if (!ctx || !masterGain || muted) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.freqFrom, now);
  if (spec.freqTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(spec.freqTo, 1), now + spec.duration);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(spec.peak, now + Math.min(0.012, spec.duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.duration);

  let last: AudioNode = osc;
  if (spec.filterHz) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = spec.filterHz;
    osc.connect(filter);
    last = filter;
  }
  last.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + spec.duration + 0.02);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

// Trigger counters, incremented regardless of mute/context state — QA-only
// (see getAudioDebugSnapshot), so a Playwright check can confirm "hovering
// a CTA fires the field-enter trigger" without needing to actually hear it.
const toneCounts = { fieldEnter: 0, lockOn: 0, click: 0 };

/** Soft field-enter blip — a small synth "ping" for when the cursor crosses into an element's influence radius. `kind: 'cta'` is a touch brighter/louder than `'soft'`, matching that element's stronger polarity. */
export function playFieldEnterTone(kind: 'soft' | 'cta') {
  toneCounts.fieldEnter++;
  playEnvelopedTone(
    kind === 'cta'
      ? { type: 'sine', freqFrom: 880, duration: 0.07, peak: 0.06 }
      : { type: 'sine', freqFrom: 660, duration: 0.06, peak: 0.04 },
  );
}

/** The "locked on" tone — a quick synthy downward zap, distinct in timbre from the field-enter blip, for the moment a strong-polarity element (a CTA) reaches full pull. */
export function playLockOnTone() {
  toneCounts.lockOn++;
  playEnvelopedTone({ type: 'sawtooth', freqFrom: 1400, freqTo: 700, duration: 0.13, peak: 0.09, filterHz: 2600 });
}

/** A crisp confirm click, synthesized rather than sampled — plays on pointerdown for sfx-enabled elements (currently: buttons). */
export function playClickTone() {
  toneCounts.click++;
  playEnvelopedTone({ type: 'square', freqFrom: 320, freqTo: 200, duration: 0.06, peak: 0.08, filterHz: 3200 });
}

/** Debug/QA snapshot only — harmless to expose (no PII), used by Playwright checks and left off the window object entirely in SSR. */
export function getAudioDebugSnapshot() {
  return {
    hasContext: ctx !== null,
    contextState: ctx?.state ?? 'none',
    muted,
    ambientStarted,
    toneCounts: { ...toneCounts },
  };
}

if (typeof window !== 'undefined') {
  (window as any).__motionAudioDebug = { getAudioDebugSnapshot };
}
