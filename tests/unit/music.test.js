import { describe, it, expect } from "vitest";
import { composeDay, LULLABY, SEASON_MUSIC, STEPS_PER_BAR, triad, midiToFreq } from "../../src/game/audio/score.js";
import { SFX } from "../../src/game/audio/sfx.js";

const pc = (m) => ((m % 12) + 12) % 12;

describe("the day's tune", () => {
  it("is the same tune for the same day, and a different one on other days", () => {
    expect(composeDay(12, 0)).toEqual(composeDay(12, 0));
    expect(JSON.stringify(composeDay(12, 0))).not.toBe(JSON.stringify(composeDay(13, 0)));
  });

  it("keeps every melody note in the season's scale and every chord in its mode", () => {
    for (let season = 0; season < 4; season++) {
      const m = SEASON_MUSIC[season];
      const scale = new Set(m.scale.map((iv) => pc(m.root + iv)));
      const mode = new Set(m.mode.map((iv) => pc(m.root + iv)));
      for (let day = 0; day < 20; day++) {
        const tune = composeDay(day, season);
        expect(tune.bars).toHaveLength(8);
        for (const bar of tune.bars) {
          for (const n of bar.notes) {
            expect(scale.has(pc(n.midi)), `${m.name} note ${n.midi}`).toBe(true);
            expect(n.step + n.len).toBeLessThanOrEqual(STEPS_PER_BAR + 2);
          }
          for (const c of bar.chord) expect(mode.has(pc(c)), `${m.name} chord ${c}`).toBe(true);
        }
      }
    }
  });

  it("slows down and turns to the music box at night", () => {
    const day = composeDay(3, 1);
    const night = composeDay(3, 1, true);
    expect(night.bpm).toBeLessThan(day.bpm);
    expect(night.lead).toBe("box");
  });

  it("stays in a comfortable range", () => {
    for (let season = 0; season < 4; season++)
      for (const bar of composeDay(5, season).bars) for (const n of bar.notes) {
        expect(n.midi).toBeGreaterThanOrEqual(55);
        expect(n.midi).toBeLessThanOrEqual(96);
      }
  });
});

describe("Luna's Lullaby", () => {
  it("is eight bars in C that end home on C", () => {
    expect(LULLABY.bars).toHaveLength(8);
    const last = LULLABY.bars.at(-1);
    expect(pc(last.notes.at(-1).midi)).toBe(0);
    expect(last.chord.map(pc)).toEqual(triad(0).map((iv) => pc(60 + iv)));
    for (const bar of LULLABY.bars) for (const n of bar.notes) expect([0, 2, 4, 5, 7, 9, 11]).toContain(pc(n.midi));
  });

  it("A4 is 440", () => {
    expect(midiToFreq(69)).toBe(440);
  });
});

describe("sound effects", () => {
  it("every preset runs against a stub engine", () => {
    const calls = [];
    const a = { now: () => 0, tone: (o) => calls.push(o), noise: (o) => calls.push(o) };
    for (const name in SFX) {
      const before = calls.length;
      SFX[name](a);
      expect(calls.length, name).toBeGreaterThan(before);
    }
    for (const c of calls) {
      expect(c.gain).toBeGreaterThan(0);
      expect(c.gain).toBeLessThanOrEqual(0.3);
    }
  });
});
