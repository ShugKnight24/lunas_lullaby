/**
 * The music as data (pure, testable in Node). Each day gets its own tune:
 * a seeded, four-phrase A A' B A melody over a gentle chord loop, in a scale
 * and tempo that suit the season; at night it slows into a music box. The
 * lullaby theme is written out by hand and plays on the title, in dreams and
 * as you fall asleep.
 *
 * Notes are MIDI numbers; a bar is 8 steps (eighth notes).
 */

export const STEPS_PER_BAR = 8;

export const midiToFreq = (m) => 440 * 2 ** ((m - 69) / 12);

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11];
const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];

/**
 * Season sound: tonic (MIDI), the 7-note `mode` chords are built from, the
 * melody `scale` (a subset of the mode), chord loop (mode degrees), tempo and voice.
 */
export const SEASON_MUSIC = [
  { name: "spring", root: 60, mode: MAJOR, scale: [0, 2, 4, 7, 9], chords: [0, 5, 3, 4], bpm: 76, lead: "box" },
  { name: "summer", root: 65, mode: LYDIAN, scale: [0, 2, 4, 6, 7, 9, 11], chords: [0, 4, 5, 1], bpm: 80, lead: "flute" },
  { name: "fall", root: 57, mode: AEOLIAN, scale: [0, 3, 5, 7, 10], chords: [0, 5, 2, 6], bpm: 70, lead: "flute" },
  { name: "winter", root: 62, mode: DORIAN, scale: [0, 2, 3, 5, 7, 9, 10], chords: [0, 3, 6, 4], bpm: 64, lead: "bell" },
];

/** Triad on a degree of a 7-note mode, as semitones above the tonic. */
export const triad = (degree, mode = MAJOR) => [0, 2, 4].map((k) => {
  const d = degree + k;
  return mode[d % 7] + 12 * Math.floor(d / 7);
});

/** Small deterministic RNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One 2-bar phrase: a random walk on scale degrees with rests and held notes. */
function phrase(r, len, restChance) {
  const out = [];
  let deg = 2 + Math.floor(r() * 3);
  for (let s = 0; s < len; ) {
    if (s > 0 && r() < restChance) {
      s += 1 + Math.floor(r() * 2);
      continue;
    }
    const step = r() < 0.5 ? 1 : r() < 0.7 ? -1 : r() < 0.5 ? 2 : -2;
    deg = Math.max(0, Math.min(9, deg + step));
    const dur = r() < 0.35 ? 2 : r() < 0.15 ? 3 : 1;
    out.push({ step: s, deg, len: Math.min(dur, len - s) });
    s += dur;
  }
  // Phrases settle home at the end.
  if (out.length) out[out.length - 1] = { ...out[out.length - 1], deg: out.length % 2 ? 0 : 2, len: Math.max(2, out[out.length - 1].len) };
  return out;
}

/**
 * The day's tune: `{ bpm, lead, bars: [{ chord: [midi], bass: midi, notes: [{ step, midi, len }] }] }`.
 * Night halves the density and slows it; indoors only changes the mix, not the notes.
 */
export function composeDay(seed, season, night = false) {
  const m = SEASON_MUSIC[season];
  const r = rng(seed * 7919 + season * 104729 + (night ? 1 : 0));
  const rest = night ? 0.45 : 0.25;
  const A = phrase(r, 16, rest);
  const A2 = A.map((n, i) => (i === A.length - 2 ? { ...n, deg: Math.min(9, n.deg + 1) } : n));
  const B = phrase(r, 16, rest + 0.1).map((n) => ({ ...n, deg: Math.min(9, n.deg + 2) }));
  const toMidi = (deg) => m.root + 12 + m.scale[deg % m.scale.length] + 12 * Math.floor(deg / m.scale.length);
  const bars = [];
  for (const ph of [A, A2, B, A]) {
    for (let half = 0; half < 2; half++) {
      const ci = bars.length % m.chords.length;
      const chord = triad(m.chords[ci], m.mode).map((iv) => m.root + iv);
      const notes = ph.filter((n) => Math.floor(n.step / STEPS_PER_BAR) === half).map((n) => ({ step: n.step % STEPS_PER_BAR, midi: toMidi(n.deg), len: n.len }));
      bars.push({ chord, bass: m.root - 12 + triad(m.chords[ci], m.mode)[0], notes });
    }
  }
  return { bpm: night ? Math.round(m.bpm * 0.8) : m.bpm, lead: night ? "box" : m.lead, bars };
}

/**
 * Luna's Lullaby — the theme. Hand-written, in C: a rocking 6/8-ish figure
 * that climbs, sighs, and comes home. Same shape as composeDay's output.
 */
export const LULLABY = (() => {
  const C = 72;
  // [step, semitone above C5, length] per bar.
  const tune = [
    [[0, 4, 2], [2, 7, 1], [3, 9, 1], [4, 7, 3]],
    [[0, 4, 2], [2, 2, 2], [4, 0, 4]],
    [[0, 2, 2], [2, 4, 1], [3, 7, 1], [4, 4, 3]],
    [[0, 2, 6]],
    [[0, 4, 2], [2, 7, 1], [3, 9, 1], [4, 12, 3]],
    [[0, 11, 2], [2, 9, 2], [4, 7, 4]],
    [[0, 9, 2], [2, 7, 1], [3, 4, 1], [4, 2, 3]],
    [[0, 0, 8]],
  ];
  const chords = [0, 5, 3, 4, 0, 2, 3, 0];
  return {
    bpm: 66,
    lead: "box",
    bars: tune.map((b, i) => ({
      chord: triad(chords[i]).map((iv) => 60 + iv),
      bass: 48 + triad(chords[i])[0],
      notes: b.map(([step, st, len]) => ({ step, midi: C + st, len })),
    })),
  };
})();
