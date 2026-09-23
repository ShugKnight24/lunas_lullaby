import { describe, it, expect } from "vitest";
import { fishPool, pickFish, barParams, catchQuality, logCatch } from "../../src/game/rules/fishing.js";
import { FISH, FISH_IDS } from "../../src/game/data/fish.js";
import { ITEMS } from "../../src/game/data/items.js";
import { waterKind } from "../../src/game/world/map.js";

const ids = (ctx) => fishPool(FISH, ctx).map((f) => f.id).sort();
const SPRING = 0;
const WINTER = 3;

describe("fish pool", () => {
  it("filters by water, season, hour and weather", () => {
    expect(ids({ where: "river", season: SPRING, min: 600, weather: "sun" })).toEqual(["bass", "sunfish"]);
    expect(ids({ where: "river", season: SPRING, min: 600, weather: "rain" })).toEqual(["bass", "catfish"]);
    expect(ids({ where: "river", season: SPRING, min: 1200, weather: "rain" })).toEqual(["bass", "bream", "catfish", "eel"]);
    expect(ids({ where: "pond", season: WINTER, min: 1300, weather: "snow" })).toEqual(["carp", "lanternfish", "pike"]);
  });

  it("the Moonfish only rises in the hidden pool late at night", () => {
    expect(ids({ where: "pool", season: SPRING, min: 1300, weather: "sun" })).toContain("moonfish");
    expect(ids({ where: "pool", season: SPRING, min: 1200, weather: "sun" })).not.toContain("moonfish");
    expect(ids({ where: "river", season: SPRING, min: 1300, weather: "sun" })).not.toContain("moonfish");
  });

  it("every season has something to catch in daylight", () => {
    for (let season = 0; season < 4; season++) for (const weather of ["sun", season === 3 ? "snow" : "rain"])
      expect(fishPool(FISH, { where: "river", season, min: 600, weather }).length).toBeGreaterThan(0);
  });

  it("picks by weight", () => {
    const pool = [{ id: "a", weight: 3 }, { id: "b", weight: 1 }];
    expect(pickFish(pool, 0)).toBe("a");
    expect(pickFish(pool, 0.74)).toBe("a");
    expect(pickFish(pool, 0.76)).toBe("b");
    expect(pickFish([], 0.5)).toBeNull();
  });
});

describe("reel", () => {
  it("harder fish move faster, with a smaller zone and a shorter bite window", () => {
    const easy = barParams(0.1);
    const hard = barParams(0.85);
    expect(hard.vel).toBeGreaterThan(easy.vel);
    expect(hard.zoneW).toBeLessThan(easy.zoneW);
    expect(hard.bite).toBeLessThan(easy.bite);
    expect(hard.zoneW).toBeGreaterThan(0.1);
  });

  it("quality comes from how close to the middle the marker stopped", () => {
    // zone 0.4..0.6, middle 0.5
    expect(catchQuality(0.39, 0.4, 0.2)).toBeNull();
    expect(catchQuality(0.41, 0.4, 0.2)).toBe(0);
    expect(catchQuality(0.46, 0.4, 0.2)).toBe(1);
    expect(catchQuality(0.51, 0.4, 0.2)).toBe(2);
  });

  it("logs counts and the best quality", () => {
    let log = logCatch({}, "carp", 1);
    log = logCatch(log, "carp", 0);
    log = logCatch(log, "eel", 2);
    expect(log).toEqual({ carp: { n: 2, best: 1 }, eel: { n: 1, best: 2 } });
  });
});

describe("fish data", () => {
  it("every fish is a sellable item", () => {
    for (const id of FISH_IDS) expect(ITEMS[id]).toMatchObject({ kind: "fish", sell: FISH[id].sell });
  });

  it("classifies the map's waters", () => {
    expect(waterKind(8, 66)).toBe("pool");
    expect(waterKind(87, 48)).toBe("pond");
    expect(waterKind(77, 20)).toBe("river");
  });
});
