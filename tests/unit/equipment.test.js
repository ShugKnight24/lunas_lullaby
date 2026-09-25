import { describe, it, expect } from "vitest";
import { statsFor, equip, unequip, spendPoint, pointsFree, reduce, compare, newEquip, newAttrs, SLOTS } from "../../src/game/rules/equipment.js";
import { ITEMS } from "../../src/game/data/items.js";
import { RECIPES } from "../../src/game/data/recipes.js";
import { newState, migrateSave } from "../../src/game/state.js";
import { LEVEL_XP } from "../../src/game/rules/skills.js";

const fresh = (xp = 0) => {
  const s = newState();
  s.skills.combat = xp;
  return s;
};

describe("stats", () => {
  it("start at 30 health and grow with level, points and gear", () => {
    const s = fresh(LEVEL_XP[1]); // combat 2
    expect(statsFor(s, ITEMS).maxHp).toBe(40);
    s.attrs = { ...newAttrs(), vig: 1, mig: 2 };
    s.equip = { ...newEquip(), body: "padded_vest", charm: "slime_charm" };
    expect(statsFor(s, ITEMS)).toMatchObject({ maxHp: 58, atk: 5, def: 2 });
  });

  it("defence shaves damage but never below 1", () => {
    expect(reduce(10, 0)).toBe(10);
    expect(reduce(10, 5)).toBe(6);
    expect(reduce(1, 20)).toBe(1);
  });

  it("gives two points per combat level", () => {
    const s = fresh(LEVEL_XP[2]); // combat 3
    expect(pointsFree(s)).toBe(6);
    const r = spendPoint(s, "grd");
    expect(r.attrs.grd).toBe(1);
    expect(spendPoint({ ...s, attrs: { vig: 6, mig: 0, grd: 0, agi: 0 } }, "mig").error).toBeTruthy();
  });
});

describe("equipping", () => {
  it("moves gear out of the bag and swaps the old piece back into that slot", () => {
    const s = fresh(LEVEL_XP[4]);
    s.inv[10] = { id: "leather_cap", n: 1 };
    const a = equip(s, s.inv, 10, ITEMS);
    expect(a.equip.head).toBe("leather_cap");
    expect(s.inv[10]).toBeNull();
    s.equip = a.equip;
    s.inv[11] = { id: "iron_helm", n: 1 };
    const b = equip(s, s.inv, 11, ITEMS);
    expect(b.equip.head).toBe("iron_helm");
    expect(s.inv[11]).toEqual({ id: "leather_cap", n: 1 });
  });

  it("refuses gear above your level, and things you can't wear", () => {
    const s = fresh();
    s.inv[10] = { id: "moon_blade", n: 1 };
    expect(equip(s, s.inv, 10, ITEMS).error).toMatch(/level 6/);
    s.inv[11] = { id: "turnip", n: 3 };
    expect(equip(s, s.inv, 11, ITEMS).error).toBeTruthy();
  });

  it("takes gear off into the bag", () => {
    const s = fresh();
    s.equip = { ...newEquip(), feet: "sturdy_boots" };
    const r = unequip(s, s.inv, "feet");
    expect(r.equip.feet).toBeNull();
    expect(s.inv.some((x) => x?.id === "sturdy_boots")).toBe(true);
  });

  it("compares a piece against what's worn", () => {
    const s = fresh(LEVEL_XP[4]);
    s.equip = { ...newEquip(), weapon: "rusty_sword" };
    expect(compare(s, ITEMS, "steel_sword")).toMatchObject({ dmg: 5, def: 0 });
    expect(compare(s, ITEMS, "swift_boots")).toMatchObject({ def: 1, spd: 12 });
  });
});

describe("gear data", () => {
  it("every piece has a real slot, and every gear recipe makes gear", () => {
    for (const it of Object.values(ITEMS)) if (it.slot) expect(SLOTS).toContain(it.slot);
    for (const r of RECIPES) for (const id of [r.out[0], ...Object.keys(r.in)]) expect(ITEMS[id], id).toBeTruthy();
  });

  it("older saves put on their best sword", () => {
    const s = newState();
    delete s.equip;
    delete s.attrs;
    s.inv[12] = { id: "rusty_sword", n: 1 };
    s.inv[13] = { id: "steel_sword", n: 1 };
    const m = migrateSave({ ...s, v: 10 });
    expect(m.equip.weapon).toBe("steel_sword");
    expect(m.inv[13]).toBeNull();
    expect(m.inv[12]).toEqual({ id: "rusty_sword", n: 1 });
  });
});
