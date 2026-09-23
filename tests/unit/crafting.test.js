import { describe, it, expect } from "vitest";
import { RECIPES } from "../../src/game/data/recipes.js";
import { MACHINES } from "../../src/game/data/machines.js";
import { ITEMS } from "../../src/game/data/items.js";
import { CROPS } from "../../src/game/data/crops.js";
import { STRUCTURES } from "../../src/game/data/structures.js";
import { craft, missing, unlocked } from "../../src/game/rules/crafting.js";
import { loadMachine, machineMorning, collectMachine, emptyMachine } from "../../src/game/rules/machines.js";
import { addItem, countItem } from "../../src/game/rules/inventory.js";
import { PROFESSIONS, pendingProfessions, sellMult, newSkills, LEVEL_XP, SKILLS } from "../../src/game/rules/skills.js";
import { settle } from "../../src/game/rules/shipping.js";
import { catchQuality } from "../../src/game/rules/fishing.js";
import { endDay } from "../../src/game/rules/day.js";
import { newClock } from "../../src/game/rules/clock.js";
import { FORAGE, RARE_FORAGE } from "../../src/game/data/forage.js";

const bag = (...pairs) => {
  const inv = new Array(6).fill(null);
  for (const [id, n, q] of pairs) addItem(inv, id, n, q);
  return inv;
};
const zero = Object.fromEntries(SKILLS.map((id) => [id, 0]));
const recipe = (out) => RECIPES.find((r) => r.out[0] === out);

describe("crafting", () => {
  it("every recipe uses and makes real items", () => {
    for (const r of RECIPES) {
      expect(ITEMS[r.out[0]], r.out[0]).toBeTruthy();
      for (const id in r.in) expect(ITEMS[id], id).toBeTruthy();
    }
  });

  it("locks recipes behind skill levels", () => {
    expect(unlocked(recipe("fertilizer"), zero)).toBe(true);
    expect(unlocked(recipe("preserves_jar"), zero)).toBe(false);
    expect(unlocked(recipe("preserves_jar"), { ...zero, farming: 3 })).toBe(true);
  });

  it("takes ingredients and gives the product", () => {
    const inv = bag(["fiber", 5], ["stone", 2]);
    expect(craft(recipe("fertilizer"), inv, zero)).toEqual({ ok: true });
    expect([countItem(inv, "fiber"), countItem(inv, "stone"), countItem(inv, "fertilizer")]).toEqual([2, 1, 2]);
  });

  it("changes nothing when short or when the bag is full", () => {
    const short = bag(["fiber", 2], ["stone", 1]);
    expect(missing(recipe("fertilizer"), short)).toEqual([{ id: "fiber", have: 2, need: 3 }]);
    expect(craft(recipe("fertilizer"), short, zero).error).toMatch(/missing/);
    expect(countItem(short, "fiber")).toBe(2);

    const full = bag(["fiber", 4], ["stone", 2], ["wood", 1], ["hay", 1], ["egg", 1], ["bread", 1]); // no stack empties
    const before = JSON.stringify(full);
    expect(craft(recipe("fertilizer"), full, zero).error).toMatch(/full/);
    expect(JSON.stringify(full)).toBe(before);
  });
});

describe("machines", () => {
  const jar = MACHINES.preserves_jar;

  it("every machine item places as a structure", () => {
    for (const id in MACHINES) expect(STRUCTURES[id].item).toBe(id);
  });

  it("jars take crops, keep quality, and take their days", () => {
    expect(loadMachine(emptyMachine(), jar, "egg", ITEMS.egg).error).toBeTruthy();
    let st = loadMachine(emptyMachine(), jar, "strawberry", ITEMS.strawberry, 2).st;
    expect(loadMachine(st, jar, "tomato", ITEMS.tomato).error).toMatch(/working/);
    st = machineMorning(st, jar);
    st = machineMorning(st, jar);
    expect(collectMachine(st)).toBeNull();
    st = machineMorning(st, jar);
    expect(collectMachine(st)).toMatchObject({ item: "strawberry_jam", q: 2 });
    expect(collectMachine(collectMachine(st).st)).toBeNull();
  });

  it("every crop has a jam worth more than the crop", () => {
    for (const c of Object.values(CROPS)) expect(ITEMS[`${c.produce}_jam`].sell).toBe(ITEMS[c.produce].sell * 2 + 50);
  });

  it("run overnight in endDay", () => {
    const s = {
      seed: 7, gold: 0, clock: newClock(), weather: "sun", bin: [], soil: {}, forage: {}, energy: 0,
      structures: [{ uid: 1, type: "mayo_machine", tx: 0, ty: 0, ...emptyMachine(), input: "egg", left: 1, q: 1 }],
    };
    const { state } = endDay(s, { crops: CROPS, items: ITEMS, w: 10, spots: [], forage: FORAGE, rareForage: RARE_FORAGE });
    expect(state.structures[0]).toMatchObject({ input: null, out: "mayonnaise", q: 1 });
  });
});

describe("professions", () => {
  it("each skill offers two", () => {
    for (const id of SKILLS) expect(PROFESSIONS[id]).toHaveLength(2);
  });

  it("are offered once a skill reaches level 5 without one", () => {
    const skills = { ...newSkills(), fishing: LEVEL_XP[4] };
    expect(pendingProfessions(skills, {})).toEqual(["fishing"]);
    expect(pendingProfessions(skills, { fishing: "angler" })).toEqual([]);
  });

  it("raise sell prices for their goods", () => {
    const prof = { fishing: "angler", farming: "artisan" };
    expect(sellMult(prof, "carp", ITEMS.carp)).toBe(1.25);
    expect(sellMult(prof, "strawberry_jam", ITEMS.strawberry_jam)).toBe(1.25);
    expect(sellMult(prof, "turnip", ITEMS.turnip)).toBe(1);
    const bin = [{ id: "carp", n: 2 }];
    expect(settle(bin, ITEMS, (id) => sellMult(prof, id, ITEMS[id])).total).toBe(Math.round(ITEMS.carp.sell * 1.25) * 2);
  });

  it("a Lucky Lure widens the gold band", () => {
    // zone 0.4..0.6: 0.47 is 30% off-centre — silver normally, gold with the lure.
    expect(catchQuality(0.47, 0.4, 0.2)).toBe(1);
    expect(catchQuality(0.47, 0.4, 0.2, true)).toBe(2);
  });
});
