import { describe, it, expect } from "vitest";
import { coopMorning, stockHay, petHen, newCoop, eggCount, henHearts, COOP_HAY_CAP, COOP_EGG_CAP, HEN_LOVE, HEN_LOVE_MAX } from "../../src/game/rules/animals.js";
import { endDay } from "../../src/game/rules/day.js";
import { newClock, dayIndex } from "../../src/game/rules/clock.js";
import { ITEMS } from "../../src/game/data/items.js";
import { CROPS } from "../../src/game/data/crops.js";
import { FORAGE, RARE_FORAGE } from "../../src/game/data/forage.js";

const coop = (hay, over = {}) => ({ uid: 1, type: "coop", tx: 0, ty: 0, ...newCoop(1), hay, ...over });
const DAY = 5;
const normal = () => 0.99;
const gold = () => 0;

describe("coop", () => {
  it("starts with two named hens", () => {
    const c = newCoop(1);
    expect(c.hens).toHaveLength(2);
    expect(c.hens[0].name).not.toBe(c.hens[1].name);
    expect(c).toMatchObject({ hay: 0, eggs: [0, 0, 0] });
  });

  it("each hen that finds hay eats one and lays an egg", () => {
    expect(coopMorning(coop(5), DAY, normal)).toMatchObject({ st: { hay: 3, eggs: [2, 0, 0] }, laid: 2 });
    expect(coopMorning(coop(1), DAY, normal)).toMatchObject({ st: { hay: 0, eggs: [1, 0, 0] }, laid: 1 });
    expect(coopMorning(coop(0), DAY, normal)).toMatchObject({ st: { hay: 0, eggs: [0, 0, 0] }, laid: 0 });
  });

  it("stops laying when the nest is full", () => {
    const r = coopMorning(coop(10, { eggs: [COOP_EGG_CAP - 1, 0, 0] }), DAY, normal);
    expect(eggCount(r.st)).toBe(COOP_EGG_CAP);
    expect(r.laid).toBe(1);
  });

  it("stocks feed up to the bin's capacity", () => {
    expect(stockHay(coop(0), 12)).toMatchObject({ st: { hay: 12 }, used: 12 });
    expect(stockHay(coop(COOP_HAY_CAP - 3), 10)).toMatchObject({ st: { hay: COOP_HAY_CAP }, used: 3 });
    expect(stockHay(coop(COOP_HAY_CAP), 5).used).toBe(0);
  });
});

describe("hen affection", () => {
  it("petting counts once a day", () => {
    const hen = newCoop(1).hens[0];
    const a = petHen(hen, DAY);
    expect(a.gained).toBe(HEN_LOVE.pet);
    expect(petHen(a.hen, DAY).gained).toBe(0);
    expect(petHen(a.hen, DAY + 1).gained).toBe(HEN_LOVE.pet);
  });

  it("feeding and petting build affection; neglect wears it down", () => {
    const st = coop(10, { hens: [{ name: "A", love: 500, petted: DAY }, { name: "B", love: 500, petted: -1 }] });
    const { st: fed } = coopMorning(st, DAY, normal);
    expect(fed.hens[0].love).toBe(500 + HEN_LOVE.fed);
    expect(fed.hens[1].love).toBe(500 + HEN_LOVE.fed + HEN_LOVE.unpetted);
    const { st: hungry } = coopMorning({ ...st, hay: 0 }, DAY, normal);
    expect(hungry.hens[0].love).toBe(500 + HEN_LOVE.hungry);
  });

  it("a loved hen can lay gold eggs; a new one can't", () => {
    const loved = coop(10, { hens: [{ name: "A", love: HEN_LOVE_MAX, petted: DAY }, { name: "B", love: 0, petted: DAY }] });
    expect(coopMorning(loved, DAY, gold).st.eggs).toEqual([1, 0, 1]);
    expect(henHearts(loved.hens[0])).toBe(5);
  });
});

describe("endDay with coops", () => {
  it("feeds every coop and reports the eggs laid", () => {
    const s = {
      seed: 7, gold: 0, clock: newClock(), weather: "sun", bin: [], soil: {}, forage: {}, energy: 0,
      structures: [coop(3), coop(0, { uid: 2 }), { uid: 3, type: "fence", tx: 5, ty: 5 }],
    };
    const { state, report } = endDay(s, { crops: CROPS, items: ITEMS, w: 10, spots: [], forage: FORAGE, rareForage: RARE_FORAGE });
    expect(state.structures[0].hay).toBe(1);
    expect(eggCount(state.structures[0])).toBe(2);
    expect(eggCount(state.structures[1])).toBe(0);
    expect(state.structures[2]).toEqual(s.structures[2]);
    expect(report.eggs).toBe(2);
    expect(dayIndex(s.clock)).toBe(0);
  });
});

describe("items", () => {
  it("eggs are sellable gifts and hay is sold in the shop", () => {
    expect(ITEMS.egg.sell).toBeGreaterThan(0);
    expect(ITEMS.hay.price).toBeGreaterThan(0);
  });
});
