import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { createSave, migrateChain } from "../../src/engine/save.js";
import { newState, migrateSave, SAVE_VERSION } from "../../src/game/state.js";
import { newCoop } from "../../src/game/rules/animals.js";
import { FARM_WELL } from "../../src/game/world/map.js";
import { MAP_W } from "../../src/game/config.js";

const V1 = JSON.parse(readFileSync(new URL("../fixtures/save-v1.json", import.meta.url), "utf8"));

/** Keys of newState() that every migrated save must carry. */
const shapeOf = (o) => Object.keys(o).sort();

describe("migrateChain", () => {
  const steps = { 1: (d) => ({ ...d, a: 1 }), 2: (d) => ({ ...d, b: d.a + 1 }) };

  it("runs every step from the save's version to the target", () => {
    expect(migrateChain(3, steps)({ v: 1 })).toEqual({ v: 3, a: 1, b: 2 });
    expect(migrateChain(3, steps)({ v: 2, a: 5 })).toEqual({ v: 3, a: 5, b: 6 });
  });

  it("treats a missing version as v1", () => {
    expect(migrateChain(2, steps)({})).toEqual({ v: 2, a: 1 });
  });

  it("rejects a save with no upgrade path", () => {
    expect(migrateChain(4, steps)({ v: 1 })).toBeNull();
  });
});

describe("createSave", () => {
  let store;
  beforeEach(() => {
    store = {};
    globalThis.localStorage = {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => (store[k] = v),
      removeItem: (k) => delete store[k],
    };
  });

  it("migrates old saves and refuses newer ones", () => {
    const slot = createSave("k", 2, migrateChain(2, { 1: (d) => ({ ...d, up: true }) }));
    store.k = JSON.stringify({ v: 1, x: 1 });
    expect(slot.load()).toEqual({ v: 2, x: 1, up: true });
    store.k = JSON.stringify({ v: 3 });
    expect(slot.load()).toBeNull();
    store.k = "{not json";
    expect(slot.load()).toBeNull();
  });
});

describe("game save", () => {
  it("loads the frozen v1 fixture at the current version with the current shape", () => {
    const s = migrateSave(structuredClone(V1));
    expect(s.v).toBe(SAVE_VERSION);
    expect(shapeOf(s)).toEqual(shapeOf({ ...newState(), v: SAVE_VERSION }));
    expect(s.soil["2325"].crop).toMatchObject({ id: "turnip", days: 1 });
    expect(s.gold).toBe(500);
  });

  it("v1 coops gain feed, a nest and named hens", () => {
    const v1 = { ...structuredClone(V1), structures: [{ uid: 4, type: "coop", tx: 10, ty: 10 }, { uid: 5, type: "fence", tx: 1, ty: 1 }] };
    const s = migrateSave(v1);
    expect(s.structures[0]).toEqual({ uid: 4, type: "coop", tx: 10, ty: 10, ...newCoop(4) });
    expect(s.structures[1]).toEqual({ uid: 5, type: "fence", tx: 1, ty: 1 });
    expect(s.fishLog).toEqual({});
  });

  it("v3 saves gain skills, skip the intro and tutorial, and clear the farm well's tiles", () => {
    const soilKey = (x, y) => y * MAP_W + x;
    const v3 = {
      ...structuredClone(V1),
      v: 3,
      fishLog: {},
      gold: 100,
      structures: [
        { uid: 1, type: "fence", tx: FARM_WELL.tx, ty: FARM_WELL.ty },
        { uid: 2, type: "fence", tx: 20, ty: 40 },
      ],
      soil: { [soilKey(FARM_WELL.tx + 1, FARM_WELL.ty)]: { watered: false, crop: null }, 2325: { watered: false, crop: null } },
    };
    const s = migrateSave(v3);
    expect(s.skills).toEqual({ farming: 0, foraging: 0, fishing: 0, ranching: 0 });
    expect(s.tutorial.done).toBe(true);
    expect(s.flags.intro).toBe(true);
    expect(s.structures.map((st) => st.uid)).toEqual([2]);
    expect(Object.keys(s.soil)).toEqual(["2325"]);
    expect(s.inv.find((x) => x?.id === "wood")).toEqual({ id: "wood", n: 1 });
  });

  it("v2 coops keep their eggs as normal quality", () => {
    const v2 = { ...structuredClone(V1), v: 2, structures: [{ uid: 4, type: "coop", tx: 10, ty: 10, hay: 7, eggs: 3 }] };
    expect(migrateSave(v2).structures[0]).toMatchObject({ hay: 7, eggs: [3, 0, 0], hens: newCoop(4).hens });
  });
});
