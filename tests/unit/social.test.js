import { describe, it, expect } from "vitest";
import { VILLAGERS } from "../../src/game/data/villagers.js";
import { LINES, HEART_EVENTS } from "../../src/game/data/dialogue.js";
import { newRel, talk, gift, hearts, giftTaste, eventReady, MAX_PTS, TALK_PTS, GIFT_PTS } from "../../src/game/rules/relationships.js";
import { pickLine, fillLine } from "../../src/game/rules/dialogue.js";

const mira = VILLAGERS.mira;

describe("relationships", () => {
  it("talking counts once per day", () => {
    let r = talk(newRel(), 0);
    expect(r.gained).toBe(TALK_PTS);
    r = talk(r.rel, 0);
    expect(r.gained).toBe(0);
    expect(talk(r.rel, 1).rel.pts).toBe(TALK_PTS * 2);
  });

  it("gift tastes and daily limit", () => {
    expect(giftTaste("strawberry", mira)).toBe("love");
    expect(giftTaste("turnip", mira)).toBe("like");
    expect(giftTaste("stone", mira)).toBe("dislike");
    expect(giftTaste("tomato", mira)).toBe("neutral");
    const g = gift(newRel(), "strawberry", mira, 3);
    expect(g.delta).toBe(GIFT_PTS.love);
    expect(gift(g.rel, "turnip", mira, 3).refused).toBe(true);
    expect(gift(newRel(), "stone", mira, 3).rel.pts).toBe(0);
  });

  it("hearts are clamped to 0..10", () => {
    let rel = { ...newRel(), pts: MAX_PTS - 5 };
    rel = gift(rel, "strawberry", mira, 1).rel;
    expect(rel.pts).toBe(MAX_PTS);
    expect(hearts(rel)).toBe(10);
  });

  it("heart event becomes ready at two hearts, once", () => {
    const ev = HEART_EVENTS.mira;
    expect(eventReady({ ...newRel(), pts: 199 }, ev)).toBe(false);
    expect(eventReady({ ...newRel(), pts: 200 }, ev)).toBe(true);
    expect(eventReady({ ...newRel(), pts: 250, events: { 2: true } }, ev)).toBe(false);
  });
});

describe("dialogue", () => {
  it("introduces first, then varies by season, weather and hearts", () => {
    const ctx = { season: 0, weather: "sun", hearts: 0, day: 0, met: false };
    expect(pickLine(LINES.mira, ctx)).toMatch(/Welcome/);
    const lines = new Set();
    for (let d = 0; d < 8; d++) lines.add(pickLine(LINES.mira, { ...ctx, met: true, day: d }));
    expect(lines.size).toBeGreaterThan(1);
    for (const l of lines) expect(l).not.toMatch(/Pumpkin|Snow|hot to bake/);
    const rain = pickLine(LINES.mira, { ...ctx, met: true, weather: "rain", season: 3, day: 2 });
    expect(rain).toMatch(/Rain|Snow/);
    expect(fillLine("Hi {name} of {farm}", { name: "Luna", farm: "Moon" })).toBe("Hi Luna of Moon");
  });
});
