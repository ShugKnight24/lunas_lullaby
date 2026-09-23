import { describe, it, expect } from "vitest";
import { CROPS } from "../../src/game/data/crops.js";
import { ITEMS } from "../../src/game/data/items.js";
import { emptySoil, plant, water, grow, harvest, fertilize, totalDays } from "../../src/game/rules/crops.js";
import { rollQuality, cropOdds, sellPrice, qualityName } from "../../src/game/rules/quality.js";
import { addItem, countItem } from "../../src/game/rules/inventory.js";
import { shipItem, settle } from "../../src/game/rules/shipping.js";
import { gift, newRel, GIFT_PTS } from "../../src/game/rules/relationships.js";
import { VILLAGERS } from "../../src/game/data/villagers.js";

const T = CROPS.turnip;

/** Grow a turnip to ripe; `dryDay` skips watering on that day. */
function ripe(tile, dryDay = -1) {
  let t = plant(tile, T, "turnip", 0).tile;
  for (let d = 0, n = 0; n < totalDays(T); d++) {
    t = grow(d === dryDay ? t : water(t), T);
    t = { ...t, watered: false };
    if (d !== dryDay) n++;
  }
  return t;
}

describe("quality rolls", () => {
  it("maps a roll onto normal / silver / gold", () => {
    expect(rollQuality([0.3, 0.1], 0.05)).toBe(2);
    expect(rollQuality([0.3, 0.1], 0.2)).toBe(1);
    expect(rollQuality([0.3, 0.1], 0.5)).toBe(0);
  });

  it("fertilizer and steady watering raise the odds", () => {
    const [s0, g0] = cropOdds(0, false);
    const [s2, g2] = cropOdds(2, true);
    expect(s2).toBeGreaterThan(s0);
    expect(g2).toBeGreaterThan(g0);
    expect(cropOdds(0, true)[1]).toBeGreaterThan(g0);
  });

  it("prices and names by quality", () => {
    expect(sellPrice(40, 0)).toBe(40);
    expect(sellPrice(40, 1)).toBe(50);
    expect(sellPrice(40, 2)).toBe(60);
    expect(qualityName("Turnip", 2)).toBe("Gold Turnip");
    expect(qualityName("Turnip")).toBe("Turnip");
  });
});

describe("fertilizer and harvest quality", () => {
  it("goes into tilled soil before the seeds sprout", () => {
    expect(fertilize(null, 1).error).toBeTruthy();
    expect(fertilize(emptySoil(), 1).tile.fert).toBe(1);
    expect(fertilize({ ...emptySoil(), fert: 1 }, 1).error).toMatch(/already/);
    expect(fertilize({ ...emptySoil(), fert: 1 }, 2).tile.fert).toBe(2);
    const sprouted = { ...plant(emptySoil(), T, "turnip", 0).tile };
    sprouted.crop = { ...sprouted.crop, days: 1 };
    expect(fertilize(sprouted, 1).error).toMatch(/sprout/);
  });

  it("dry days are remembered and cost the tended bonus", () => {
    const tended = ripe(emptySoil());
    const dry = ripe(emptySoil(), 1);
    expect(tended.crop.missed ?? 0).toBe(0);
    expect(dry.crop.missed).toBe(1);
    // A roll just under the tended gold odds: gold only for the tended crop.
    const r = cropOdds(0, true)[1] - 0.01;
    expect(harvest(tended, T, r).q).toBe(2);
    expect(harvest(dry, T, r).q).not.toBe(2);
  });

  it("fertilized soil keeps its fertilizer after harvest", () => {
    const h = harvest(ripe({ ...emptySoil(), fert: 2 }), T, 0.99);
    expect(h.tile.fert).toBe(2);
    expect(h.q).toBe(0);
  });

  it("fertilizers are sold in the shop", () => {
    expect(ITEMS.fertilizer).toMatchObject({ kind: "fertilizer", tier: 1 });
    expect(ITEMS.deluxe_fertilizer).toMatchObject({ kind: "fertilizer", tier: 2 });
  });
});

describe("quality stacks", () => {
  it("only merge within a quality, and normal stacks stay q-less", () => {
    const inv = new Array(4).fill(null);
    addItem(inv, "turnip", 2);
    addItem(inv, "turnip", 1, 2);
    addItem(inv, "turnip", 3);
    expect(inv.slice(0, 2)).toEqual([{ id: "turnip", n: 5 }, { id: "turnip", n: 1, q: 2 }]);
    expect(countItem(inv, "turnip")).toBe(6);
  });

  it("ship and sell at the quality price", () => {
    let bin = shipItem([], "turnip", 2);
    bin = shipItem(bin, "turnip", 1, 2);
    bin = shipItem(bin, "turnip", 1, 2);
    expect(bin).toEqual([{ id: "turnip", n: 2 }, { id: "turnip", n: 2, q: 2 }]);
    expect(settle(bin, ITEMS).total).toBe(2 * 40 + 2 * 60);
  });

  it("better gifts earn more friendship", () => {
    const plain = gift(newRel(), "strawberry", VILLAGERS.mira, 0);
    const gold = gift(newRel(), "strawberry", VILLAGERS.mira, 0, 2);
    expect(plain.delta).toBe(GIFT_PTS.love);
    expect(gold.delta).toBeGreaterThan(plain.delta);
    expect(gift(newRel(), "stone", VILLAGERS.mira, 0, 2).delta).toBe(GIFT_PTS.dislike);
  });
});
