/**
 * Sound effects, all synthesized: `play(audio, name)` fires a preset. Each
 * varies a little in pitch and level so repeats don't sound mechanical.
 * Levels sit around 0.1–0.3 on the sfx bus: present, never piercing.
 */

import { midiToFreq } from "./score.js";

const vary = (x, k = 0.06) => x * (1 + (Math.random() * 2 - 1) * k);

/** Rising notes, one after another (chimes, fanfares). */
function notes(a, midis, gap, o = {}) {
  const t0 = a.now();
  midis.forEach((m, i) => a.tone({ freq: midiToFreq(m), type: o.type ?? "sine", t: t0 + i * gap, dur: o.dur ?? 0.35, gain: o.gain ?? 0.14, release: o.release ?? 0.3 }));
}

export const SFX = {
  // Tools
  hoe: (a) => {
    a.noise({ dur: 0.16, gain: 0.3, type: "lowpass", freq: vary(900), to: 200 });
    a.tone({ freq: vary(95), to: 55, dur: 0.14, gain: 0.25, type: "sine" });
  },
  water: (a) => {
    a.noise({ dur: 0.45, gain: 0.12, type: "bandpass", freq: vary(2400), to: 1200, q: 0.8, attack: 0.05 });
    for (let i = 0; i < 3; i++) a.tone({ freq: vary(900 + i * 220, 0.15), to: 1500, t: a.now() + 0.08 + i * 0.07, dur: 0.06, gain: 0.05 });
  },
  chop: (a) => {
    a.tone({ freq: vary(320), to: 140, dur: 0.12, gain: 0.22, type: "triangle" });
    a.noise({ dur: 0.1, gain: 0.2, freq: vary(1400), q: 2 });
  },
  rock: (a) => {
    a.noise({ dur: 0.12, gain: 0.28, freq: vary(2600), q: 3 });
    a.tone({ freq: vary(700), to: 450, dur: 0.08, gain: 0.08, type: "square", lp: 1800 });
  },
  scythe: (a) => a.noise({ dur: 0.18, gain: 0.14, type: "highpass", freq: vary(2500), to: 5000, attack: 0.02 }),
  refill: (a) => {
    a.noise({ dur: 0.6, gain: 0.14, type: "lowpass", freq: 900, to: 2200, attack: 0.08 });
    notes(a, [67, 72], 0.12, { gain: 0.07 });
  },
  plant: (a) => a.noise({ dur: 0.1, gain: 0.22, type: "lowpass", freq: vary(700), to: 300 }),
  // Getting things
  pickup: (a) => notes(a, [vary(79, 0.01), vary(84, 0.01)], 0.07, { gain: 0.12, dur: 0.22 }),
  harvest: (a) => {
    a.tone({ freq: vary(260), to: 520, dur: 0.1, gain: 0.18, type: "triangle" });
    notes(a, [76, 81, 88], 0.06, { gain: 0.1, dur: 0.25 });
  },
  quality: (a) => notes(a, [84, 88, 91, 96], 0.05, { gain: 0.08, dur: 0.3 }),
  ship: (a) => notes(a, [83, 88], 0.08, { type: "square", gain: 0.08, dur: 0.18 }),
  eat: (a) => {
    for (let i = 0; i < 3; i++) a.noise({ t: a.now() + i * 0.11, dur: 0.07, gain: 0.26, freq: vary(1500), q: 1.5 });
  },
  craft: (a) => {
    a.tone({ freq: vary(1200), to: 900, dur: 0.1, gain: 0.08, type: "triangle" });
    notes(a, [72, 79, 84], 0.07, { gain: 0.09 });
  },
  build: (a) => {
    a.tone({ freq: vary(120), to: 70, dur: 0.18, gain: 0.26, type: "sine" });
    a.noise({ dur: 0.2, gain: 0.18, type: "lowpass", freq: 800, to: 200 });
  },
  // Fishing
  cast: (a) => a.noise({ dur: 0.35, gain: 0.17, type: "bandpass", freq: 1200, to: 3200, q: 2, attack: 0.1 }),
  splash: (a) => a.noise({ dur: 0.3, gain: 0.27, type: "lowpass", freq: 2500, to: 400 }),
  bite: (a) => notes(a, [88, 88], 0.09, { type: "triangle", gain: 0.13, dur: 0.08, release: 0.06 }),
  catch: (a) => notes(a, [72, 76, 79, 84], 0.07, { gain: 0.12 }),
  miss: (a) => notes(a, [67, 62], 0.12, { type: "triangle", gain: 0.1, dur: 0.25 }),
  // Friends and animals
  pet: (a) => notes(a, [81, 86], 0.1, { gain: 0.12, dur: 0.4, release: 0.35 }),
  woof: (a) => {
    a.tone({ freq: vary(240), to: 160, dur: 0.12, gain: 0.2, type: "sawtooth", lp: 900 });
    a.noise({ dur: 0.08, gain: 0.06, freq: 600, q: 1 });
  },
  cluck: (a) => {
    for (let i = 0; i < 2; i++) a.tone({ freq: vary(700), to: 500, t: a.now() + i * 0.09, dur: 0.05, gain: 0.08, type: "square", lp: 1600 });
  },
  talk: (a) => {
    for (let i = 0; i < 3; i++) a.tone({ freq: vary(520, 0.2), t: a.now() + i * 0.06, dur: 0.05, gain: 0.09, type: "triangle" });
  },
  heart: (a) => notes(a, [79, 83, 86, 91], 0.09, { gain: 0.09, dur: 0.5 }),
  // Moments
  levelUp: (a) => notes(a, [72, 76, 79, 84, 88], 0.08, { gain: 0.12, dur: 0.45 }),
  task: (a) => notes(a, [79, 84], 0.1, { gain: 0.1, dur: 0.35 }),
  wish: (a) => notes(a, [76, 79, 84, 88, 91], 0.14, { gain: 0.09, dur: 0.8, release: 0.7 }),
  door: (a) => {
    a.tone({ freq: vary(180), to: 120, dur: 0.12, gain: 0.12, type: "triangle" });
    a.noise({ dur: 0.08, gain: 0.08, freq: 500, q: 1 });
  },
  bell: (a) => notes(a, [93, 93], 0.12, { gain: 0.08, dur: 0.3 }),
  ui: (a) => a.tone({ freq: vary(900), dur: 0.04, gain: 0.05, type: "triangle", release: 0.03 }),
  error: (a) => a.tone({ freq: 220, to: 180, dur: 0.14, gain: 0.08, type: "triangle" }),
  step: (a) => a.noise({ dur: 0.05, gain: 0.035, type: "lowpass", freq: vary(700, 0.2), to: 250 }),
};

export function play(a, name) {
  const f = SFX[name];
  if (f && a?.ready()) f(a);
}

/** Play a preset through the game's audio engine. */
export const sfx = (g, name) => play(g.audio, name);
