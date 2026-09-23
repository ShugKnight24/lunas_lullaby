import { describe, it, expect } from "vitest";
import { coopMorning, stockHay, COOP_HAY_CAP, COOP_EGG_CAP } from "../../src/game/rules/animals.js";
import { endDay } from "../../src/game/rules/day.js";
import { newClock } from "../../src/game/rules/clock.js";
import { ITEMS } from "../../src/game/data/items.js";
import { CROPS } from "../../src/game/data/crops.js";
import { FORAGE, RARE_FORAGE } from "../../src/game/data/forage.js";

const coop = (hay, eggs = 0) => ({ uid: 1, type: "coop", tx: 0, ty: 0, hay, eggs });

describe("coop", () => {
  it("each hen that finds hay eats one and lays an egg", () => {
    expect(coopMorning(coop(5))).toEqual({ st: coop(3, 2), laid: 2 });
    expect(coopMorning(coop(1))).toEqual({ st: coop(0, 1), laid: 1 });
    expect(coopMorning(coop(0))).toEqual({ st: coop(0, 0), laid: 0 });
  });

  it("stops laying when the nest is full", () => {
    const r = coopMorning(coop(10, COOP_EGG_CAP - 1));
    expect(r.st.eggs).toBe(COOP_EGG_CAP);
    expect(r.laid).toBe(1);
  });

  it("stocks feed up to the bin's capacity", () => {
    expect(stockHay(coop(0), 12)).toEqual({ st: coop(12), used: 12 });
    expect(stockHay(coop(COOP_HAY_CAP - 3), 10)).toEqual({ st: coop(COOP_HAY_CAP), used: 3 });
    expect(stockHay(coop(COOP_HAY_CAP), 5).used).toBe(0);
  });

  it("eggs are sellable gifts and hay is sold in the shop", () => {
    expect(ITEMS.egg.sell).toBeGreaterThan(0);
    expect(ITEMS.hay.price).toBeGreaterThan(0);
  });
});

describe("endDay with coops", () => {
  it("feeds every coop and reports the eggs laid", () => {
    const s = {
      seed: 7, gold: 0, clock: newClock(), weather: "sun", bin: [], soil: {}, forage: {}, energy: 0,
      structures: [coop(3), { ...coop(0), uid: 2 }, { uid: 3, type: "fence", tx: 5, ty: 5 }],
    };
    const { state, report } = endDay(s, { crops: CROPS, items: ITEMS, w: 10, spots: [], forage: FORAGE, rareForage: RARE_FORAGE });
    expect(state.structures[0]).toMatchObject({ hay: 1, eggs: 2 });
    expect(state.structures[1]).toMatchObject({ hay: 0, eggs: 0 });
    expect(state.structures[2]).toEqual(s.structures[2]);
    expect(report.eggs).toBe(2);
  });
});
