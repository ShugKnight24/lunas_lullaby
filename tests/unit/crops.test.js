import { describe, it, expect } from "vitest";
import { CROPS } from "../../src/game/data/crops.js";
import { emptySoil, plant, water, grow, morning, cropStage, visualStage, isRipe, harvest, seasonChange, totalDays } from "../../src/game/rules/crops.js";

const T = CROPS.turnip;
const planted = () => plant(emptySoil(), T, "turnip", 0).tile;

describe("crops", () => {
  it("plants only in tilled, empty soil and in season", () => {
    expect(plant(null, T, "turnip", 0).error).toBeTruthy();
    expect(plant(emptySoil(), T, "turnip", 1).error).toMatch(/season/);
    const t = planted();
    expect(t.crop).toEqual({ id: "turnip", days: 0, dead: false });
    expect(plant(t, T, "turnip", 0).error).toBeTruthy();
  });

  it("grows only on watered days", () => {
    let t = planted();
    t = grow(t, T);
    expect(t.crop.days).toBe(0);
    t = grow(water(t), T);
    expect(t.crop.days).toBe(1);
    t = morning(t, false);
    expect(t.watered).toBe(false);
  });

  it("walks through stages to ripe and harvests", () => {
    let t = planted();
    for (let d = 0; d < totalDays(T); d++) {
      expect(isRipe(t.crop, T)).toBe(false);
      t = morning(grow(water(t), T), false);
    }
    expect(cropStage(t.crop, T)).toBe(T.stages.length);
    expect(visualStage(t.crop, T)).toBe(4);
    const h = harvest(t, T);
    expect(h).toMatchObject({ item: "turnip", qty: 1 });
    expect(h.tile.crop).toBeNull();
    expect(harvest(planted(), T)).toBeNull();
  });

  it("regrowing crops go back a few days after harvest", () => {
    const S = CROPS.strawberry;
    const t = { watered: false, crop: { id: "strawberry", days: totalDays(S), dead: false } };
    const h = harvest(t, S);
    expect(h.tile.crop.days).toBe(totalDays(S) - S.regrow);
  });

  it("withers out-of-season crops at season change, keeps multi-season ones", () => {
    const t = planted();
    expect(seasonChange(t, T, 1).crop.dead).toBe(true);
    expect(grow(water(seasonChange(t, T, 1)), T).crop.days).toBe(0);
    const sun = { watered: false, crop: { id: "sunflower", days: 2, dead: false } };
    expect(seasonChange(sun, CROPS.sunflower, 2).crop.dead).toBe(false);
  });

  it("does not mutate its input", () => {
    const t = planted();
    water(t);
    grow(t, T);
    expect(t).toEqual({ watered: false, crop: { id: "turnip", days: 0, dead: false } });
  });
});

describe("winter", () => {
  it("every season stocks seeds, and Moonbloom only grows in winter", async () => {
    const { SHOP_SEEDS } = await import("../../src/game/data/crops.js");
    for (const list of SHOP_SEEDS) expect(list.length).toBeGreaterThan(0);
    const M = CROPS.moonbloom;
    expect(plant(emptySoil(), M, "moonbloom", 3).tile.crop.id).toBe("moonbloom");
    expect(plant(emptySoil(), M, "moonbloom", 0).error).toMatch(/season/);
  });
});
