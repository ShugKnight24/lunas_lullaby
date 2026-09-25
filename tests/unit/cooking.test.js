import { describe, it, expect } from "vitest";
import { cook, shortOf, activeBuff } from "../../src/game/rules/cooking.js";
import { COOKING, BUFFS } from "../../src/game/data/cooking.js";
import { ITEMS } from "../../src/game/data/items.js";

const recipe = (out) => COOKING.find((r) => r.out === out);
const bag = (...slots) => [...slots, ...new Array(10 - slots.length).fill(null)];

describe("cooking", () => {
  it("every dish is food with a real buff, from real ingredients", () => {
    for (const r of COOKING) {
      expect(ITEMS[r.out].kind, r.out).toBe("food");
      expect(BUFFS[ITEMS[r.out].buff], r.out).toBeTruthy();
      for (const k of Object.keys(r.in)) if (!k.startsWith("kind:")) expect(ITEMS[k], k).toBeTruthy();
    }
  });

  it("takes any fish for 'kind:fish', cheapest first", () => {
    const inv = bag({ id: "trout", n: 1 }, { id: "carp", n: 1 }, { id: "milk", n: 1 });
    expect(cook(recipe("fisher_chowder"), inv, ITEMS).ok).toBe(true);
    expect(inv.filter(Boolean).map((s) => s.id).sort()).toEqual(["fisher_chowder", "trout"]);
  });

  it("reports what's missing and changes nothing", () => {
    const inv = bag({ id: "egg", n: 1 });
    expect(shortOf(recipe("farm_breakfast"), inv, ITEMS)).toEqual([{ key: "egg", have: 1, need: 2 }, { key: "milk", have: 0, need: 1 }]);
    expect(cook(recipe("farm_breakfast"), inv, ITEMS).error).toBeTruthy();
    expect(inv[0]).toEqual({ id: "egg", n: 1 });
  });

  it("a buff lasts only the day it was eaten", () => {
    const s = { buff: { id: "swift", day: 4 } };
    expect(activeBuff(s, 4, BUFFS)).toBe(BUFFS.swift);
    expect(activeBuff(s, 5, BUFFS)).toBeNull();
  });
});
