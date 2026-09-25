import { describe, it, expect } from "vitest";
import { careerSheet, rankOf, CAREERS, standSales, STAND_CAP, careerMult } from "../../src/game/rules/careers.js";
import { newState } from "../../src/game/state.js";

describe("careers", () => {
  it("rank up by their measure", () => {
    const farmer = CAREERS.find((c) => c.id === "farmer");
    expect(rankOf(farmer, 0)).toBe(0);
    expect(rankOf(farmer, 2000)).toBe(1);
    expect(rankOf(farmer, 999999)).toBe(4);
  });

  it("read a fresh save as all first ranks", () => {
    const sheet = careerSheet(newState());
    expect(sheet.map((c) => c.rank)).toEqual([0, 0, 0, 0, 0]);
    expect(sheet.every((c) => c.next > c.from)).toBe(true);
  });

  it("pay a little more for crops as a farmer", () => {
    const s = { ...newState(), stats: { ...newState().stats, earned: 10000 } };
    expect(careerMult(s, "turnip", { kind: "crop" })).toBeCloseTo(1.04);
    expect(careerMult(s, "wood", { kind: "resource" })).toBe(1);
  });
});

describe("farm stand", () => {
  const price = () => 100;
  it("sells up to the night's cap at a markup", () => {
    const r = standSales([{ id: "turnip", n: 10, q: 0 }, null], 0, price, () => 0);
    expect(r.sold).toEqual([{ id: "turnip", q: 0, n: STAND_CAP[0], each: 115 }]);
    expect(r.total).toBe(STAND_CAP[0] * 115);
    expect(r.stock[0].n).toBe(10 - STAND_CAP[0]);
  });

  it("empties slots it sells out of, and sells less in the rain", () => {
    const r = standSales([{ id: "egg", n: 1, q: 1 }], 4, price, () => 0.5, true);
    expect(r.stock).toEqual([null]);
    expect(r.sold[0].n).toBe(1);
    expect(standSales([{ id: "egg", n: 99 }], 0, price, () => 0, true).sold[0].n).toBe(Math.ceil(STAND_CAP[0] * 0.6));
  });
});
