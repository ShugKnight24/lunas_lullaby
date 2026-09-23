import { describe, it, expect } from "vitest";
import { buildCost } from "../../src/game/rules/structures.js";
import { STRUCTURES, BUILD_ORDER, PAINTS } from "../../src/game/data/structures.js";
import { ITEMS } from "../../src/game/data/items.js";
import { RECIPES } from "../../src/game/data/recipes.js";
import { fenceSprite } from "../../src/game/art/props.js";
import { moveMult } from "../../src/game/actors/actors.js";
import { loadMachine, emptyMachine } from "../../src/game/rules/machines.js";
import { MACHINES } from "../../src/game/data/machines.js";
import { SKILLS, PROFESSIONS, newSkills } from "../../src/game/rules/skills.js";
import { RIDE_MULT, BIKE_MULT, SPRINT_MULT } from "../../src/game/config.js";

describe("building skill", () => {
  it("is the fifth skill, with two professions", () => {
    expect(SKILLS).toContain("building");
    expect(newSkills().building).toBe(0);
    expect(PROFESSIONS.building.map((p) => p.id)).toEqual(["carpenter", "tinkerer"]);
  });

  it("trims materials per level, more for a Carpenter, and waives the gold fee from level 6", () => {
    const coop = STRUCTURES.coop.cost; // 40 wood, 20 stone, 400g
    expect(buildCost(coop, 0)).toEqual(coop);
    expect(buildCost(coop, 5)).toEqual({ wood: 34, stone: 17, gold: 400 });
    expect(buildCost(coop, 5, { carpenter: true })).toEqual({ wood: 26, stone: 13, gold: 400 });
    expect(buildCost(coop, 6)).toEqual({ wood: 33, stone: 17 });
    expect(buildCost({ wood: 1 }, 10, { carpenter: true })).toEqual({ wood: 1 });
  });

  it("every build-board entry is a structure you can pay for with things that exist", () => {
    for (const t of BUILD_ORDER) {
      expect(STRUCTURES[t], t).toBeTruthy();
      for (const k in STRUCTURES[t].cost) if (k !== "gold") expect(ITEMS[k], `${t}: ${k}`).toBeTruthy();
    }
  });

  it("every fence style draws for every mask, painted or not", () => {
    const styles = [...new Set(Object.values(STRUCTURES).map((d) => d.fence).filter(Boolean))];
    expect(styles.sort()).toEqual(["gate", "hedge", "picket", "rustic", "stone", "wood"]);
    for (const st of styles) for (let m = 0; m < 16; m++) for (const c of [null, PAINTS[2]]) expect(fenceSprite(m, 0, st, c).layers.length).toBe(1);
  });

  it("gates are walkable; the bicycle is craftable at Building 2", () => {
    expect(STRUCTURES.fence_gate.walk).toBe(true);
    expect(RECIPES.find((r) => r.out[0] === "bicycle").skill).toEqual(["building", 2]);
  });

  it("a Tinkerer's machines finish a night sooner (never under one)", () => {
    const jar = MACHINES.preserves_jar;
    expect(loadMachine(emptyMachine(), jar, "turnip", ITEMS.turnip, 0, true).st.left).toBe(jar.days - 1);
    expect(loadMachine(emptyMachine(), MACHINES.mayo_machine, "egg", ITEMS.egg, 0, true).st.left).toBe(1);
  });
});

describe("getting around", () => {
  it("sprinting < bike < horse", () => {
    expect(moveMult({}, false)).toBe(1);
    expect(moveMult({}, true)).toBe(SPRINT_MULT);
    expect(moveMult({ biking: true }, true)).toBe(BIKE_MULT);
    expect(moveMult({ mounted: true }, true)).toBe(RIDE_MULT);
    expect(SPRINT_MULT).toBeLessThan(BIKE_MULT);
    expect(BIKE_MULT).toBeLessThan(RIDE_MULT);
  });
});
