/**
 * Music and ambience. A lookahead scheduler (checks every 50 ms, books notes
 * 0.25 s ahead on the audio clock) plays a tune from score.js: lead, a soft
 * pad, and a felt-more-than-heard bass. Two bars of rest follow each pass —
 * silence is part of a lullaby. `director` picks the tune (the lullaby theme
 * on the title and in dreams, the day's tune otherwise), muffles it indoors,
 * ducks it under dialogue, and runs rain, birdsong and crickets.
 */

import { STEPS_PER_BAR, midiToFreq, composeDay, LULLABY } from "./score.js";

const LOOKAHEAD = 0.25;
const REST_BARS = 2;

/** Lead voices. */
const VOICES = {
  box: (a, f, t, d, v) => {
    a.tone({ bus: "music", freq: f, t, dur: Math.min(d, 0.5), gain: 0.11 * v, attack: 0.004, release: 1.1 });
    a.tone({ bus: "music", freq: f * 2, t, dur: 0.2, gain: 0.025 * v, attack: 0.004, release: 0.5 });
  },
  flute: (a, f, t, d, v) => a.tone({ bus: "music", freq: f, t, dur: d, gain: 0.1 * v, type: "triangle", attack: 0.06, release: 0.35, lp: 2600 }),
  bell: (a, f, t, d, v) => {
    a.tone({ bus: "music", freq: f, t, dur: 0.3, gain: 0.09 * v, attack: 0.003, release: 1.6 });
    a.tone({ bus: "music", freq: f * 2.76, t, dur: 0.15, gain: 0.02 * v, attack: 0.003, release: 0.8 });
  },
};

export function createMusic(a) {
  const m = { tune: null, key: "", pending: null, step: 0, next: 0, timer: null };

  function schedule() {
    if (!a.ready() || !m.tune) return;
    const stepDur = 60 / m.tune.bpm / 2;
    const total = (m.tune.bars.length + REST_BARS) * STEPS_PER_BAR;
    if (m.next < a.now()) m.next = a.now() + 0.05;
    while (m.next < a.now() + LOOKAHEAD) {
      const bi = Math.floor(m.step / STEPS_PER_BAR);
      const si = m.step % STEPS_PER_BAR;
      // Swap tunes only at a bar line so changes never cut a phrase mid-note.
      if (si === 0 && m.pending) {
        m.tune = m.pending;
        m.pending = null;
        m.step = 0;
        continue;
      }
      const bar = m.tune.bars[bi];
      if (bar) {
        const voice = VOICES[m.tune.lead] ?? VOICES.box;
        for (const n of bar.notes) if (n.step === si) voice(a, midiToFreq(n.midi), m.next, n.len * stepDur, 1);
        if (si === 0) {
          for (const c of bar.chord) a.tone({ bus: "music", freq: midiToFreq(c), t: m.next, dur: STEPS_PER_BAR * stepDur, gain: 0.03, type: "triangle", attack: 1.2, release: 1.4, lp: 900 });
          a.tone({ bus: "music", freq: midiToFreq(bar.bass), t: m.next, dur: 3 * stepDur, gain: 0.1, attack: 0.02, release: 0.6 });
        }
        if (si === 4) a.tone({ bus: "music", freq: midiToFreq(bar.bass + 7), t: m.next, dur: 2 * stepDur, gain: 0.05, attack: 0.02, release: 0.4 });
      }
      m.next += stepDur;
      m.step = (m.step + 1) % total;
    }
  }

  /** Change to `tune` (identified by `key`) at the next bar line. */
  m.play = (key, tune) => {
    if (key === m.key) return;
    m.key = key;
    if (!m.tune) {
      m.tune = tune;
      m.step = 0;
    } else m.pending = tune;
    if (!m.timer) m.timer = setInterval(schedule, 50);
  };

  return m;
}

/** Ambience: rain bed, daytime birds, night crickets. */
function createAmbience(a) {
  const amb = { rain: null, birdT: 2, crickT: 1 };
  amb.update = (dt, { outdoor, rain, night, busy }) => {
    if (!a.ready()) return;
    amb.rain ??= a.loop(900, 0.4);
    amb.rain?.level(rain ? (outdoor ? 0.22 : 0.08) : 0);
    if (!outdoor || rain || busy) return;
    if (!night && (amb.birdT -= dt) <= 0) {
      amb.birdT = 3 + Math.random() * 7;
      const f = 2400 + Math.random() * 1600;
      for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) a.tone({ bus: "ambience", freq: f, to: f * (1.2 + Math.random() * 0.3), t: a.now() + i * 0.12, dur: 0.08, gain: 0.03 });
    }
    if (night && (amb.crickT -= dt) <= 0) {
      amb.crickT = 0.6 + Math.random() * 1.4;
      const f = 4200 + Math.random() * 600;
      for (let i = 0; i < 3; i++) a.tone({ bus: "ambience", freq: f, t: a.now() + i * 0.05, dur: 0.03, gain: 0.012 });
    }
  };
  return amb;
}

/**
 * Chooses what plays from the game state each frame. `scene` is "title",
 * "dream" or "play"; `day`, `season`, `min`, `weather`, `outdoor`, `talking`.
 */
export function createDirector(a) {
  const music = createMusic(a);
  const amb = createAmbience(a);
  return {
    music,
    update(dt, s) {
      if (!a.ready()) return;
      const night = s.min >= 20 * 60 || s.min < 6 * 60;
      if (s.scene !== "play") music.play("lullaby", LULLABY);
      else {
        const key = `${s.day}:${s.season}:${night ? "n" : "d"}`;
        if (key !== music.key) music.play(key, composeDay(s.day, s.season, night));
      }
      a.muffle(s.scene === "play" && !s.outdoor);
      a.duck(s.talking ? 0.55 : 1);
      amb.update(dt, { outdoor: s.outdoor && s.scene === "play", rain: s.weather === "rain", night, busy: s.talking });
    },
  };
}
