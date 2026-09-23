/**
 * Web Audio engine: one AudioContext (created on the first user gesture, as
 * browsers require), music / sfx / ambience buses into a master, a shared
 * room reverb, ducking, and per-browser volume settings. Everything is
 * synthesized — `tone` and `noise` are the two primitives.
 */

const SETTINGS_KEY = "luna_audio";
const DEFAULTS = { master: 0.8, music: 0.6, sfx: 0.8, ambience: 0.6, muted: false };

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

export function createAudio() {
  const a = {
    ctx: null,
    settings: loadSettings(),
    bus: {},
    noiseBuf: null,
    duckLevel: 1,
  };

  /** Create (or resume) the context; call from a user gesture. Returns false if audio is unavailable. */
  a.unlock = () => {
    if (!a.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return false;
      a.ctx = new AC();
      build();
    }
    if (a.ctx.state === "suspended") a.ctx.resume();
    return true;
  };

  function build() {
    const c = a.ctx;
    const master = c.createGain();
    master.connect(c.destination);
    const reverb = c.createConvolver();
    reverb.buffer = impulse(c, 2.6, 2.4);
    const wet = c.createGain();
    wet.gain.value = 0.32;
    reverb.connect(wet).connect(master);
    const mk = (name, toReverb) => {
      const g = c.createGain();
      g.connect(master);
      if (toReverb) g.connect(reverb);
      a.bus[name] = g;
    };
    mk("music", true);
    mk("sfx", true);
    mk("ambience", false);
    // A low-pass on music so indoors can sound muffled.
    const tone = c.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 12000;
    tone.connect(a.bus.music);
    a.bus.musicIn = tone;
    a.bus.master = master;
    const len = c.sampleRate * 2;
    a.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = a.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    apply();
  }

  /** Stereo decaying-noise impulse for a soft room. */
  function impulse(c, seconds, decay) {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
    }
    return buf;
  }

  function apply() {
    if (!a.ctx) return;
    const s = a.settings;
    const t = a.ctx.currentTime;
    a.bus.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.05);
    a.bus.music.gain.setTargetAtTime(s.music * a.duckLevel, t, 0.25);
    a.bus.sfx.gain.setTargetAtTime(s.sfx, t, 0.05);
    a.bus.ambience.gain.setTargetAtTime(s.ambience, t, 0.3);
  }

  a.set = (key, value) => {
    a.settings = { ...a.settings, [key]: value };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(a.settings));
    } catch {}
    apply();
  };

  /** Lower the music under dialogue (level 0..1, 1 = normal). */
  a.duck = (level) => {
    if (a.duckLevel === level) return;
    a.duckLevel = level;
    apply();
  };

  /** Muffle the music (indoors) or open it up. */
  a.muffle = (on) => a.ctx && a.bus.musicIn.frequency.setTargetAtTime(on ? 1400 : 12000, a.ctx.currentTime, 0.4);

  a.now = () => (a.ctx ? a.ctx.currentTime : 0);
  a.ready = () => !!a.ctx && a.ctx.state === "running";

  /**
   * One oscillator note with an attack/release envelope.
   * `{ freq, to?, type, t?, dur, gain, attack?, release?, bus?, detune?, lp? }` —
   * `to` glides the pitch; `lp` adds a low-pass at that cutoff.
   */
  a.tone = (o) => {
    if (!a.ready()) return;
    const c = a.ctx;
    const t = o.t ?? c.currentTime;
    const osc = c.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    if (o.detune) osc.detune.value = o.detune;
    const env = c.createGain();
    const atk = o.attack ?? 0.005;
    const rel = o.release ?? o.dur * 0.8;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(o.gain, t + atk);
    env.gain.setTargetAtTime(0, t + Math.max(atk, o.dur - rel), rel / 4);
    let node = osc;
    if (o.lp) {
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = o.lp;
      node.connect(f);
      node = f;
    }
    node.connect(env).connect(o.bus === "music" ? a.bus.musicIn : a.bus[o.bus ?? "sfx"]);
    osc.start(t);
    osc.stop(t + o.dur + rel + 0.1);
  };

  /** A burst of filtered noise: `{ t?, dur, gain, type?, freq, to?, q?, bus?, attack? }`. */
  a.noise = (o) => {
    if (!a.ready()) return;
    const c = a.ctx;
    const t = o.t ?? c.currentTime;
    const src = c.createBufferSource();
    src.buffer = a.noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter();
    f.type = o.type ?? "bandpass";
    f.frequency.setValueAtTime(o.freq, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    f.Q.value = o.q ?? 1;
    const env = c.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(o.gain, t + (o.attack ?? 0.004));
    env.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f).connect(env).connect(a.bus[o.bus ?? "sfx"]);
    src.start(t, Math.random() * 1.5);
    src.stop(t + o.dur + 0.05);
  };

  /** A looping noise bed (rain); returns `{ level(v) }` to fade it. */
  a.loop = (freq, q, type = "lowpass") => {
    if (!a.ctx) return null;
    const c = a.ctx;
    const src = c.createBufferSource();
    src.buffer = a.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.value = 0;
    src.connect(f).connect(g).connect(a.bus.ambience);
    src.start();
    return { level: (v) => g.gain.setTargetAtTime(v, c.currentTime, 0.8) };
  };

  // Browsers stop rAF in hidden tabs; stop the sound with it.
  if (typeof document !== "undefined")
    document.addEventListener("visibilitychange", () => {
      if (!a.ctx) return;
      if (document.hidden) a.ctx.suspend();
      else a.ctx.resume();
    });

  return a;
}
