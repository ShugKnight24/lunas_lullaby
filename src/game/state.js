/**
 * Save state: plain JSON data only (the runtime rebuilds levels, actors and
 * sprites from it). `createSave("luna_save", SAVE_VERSION)` stores it; bump
 * SAVE_VERSION and add a step to MIGRATIONS whenever the shape changes.
 */

import { createSave, migrateChain } from "../engine/save.js";
import { newCoop } from "./rules/animals.js";
import { newSkills } from "./rules/skills.js";
import { footprint } from "./rules/structures.js";
import { STRUCTURES } from "./data/structures.js";
import { INV_SIZE, MAX_ENERGY, CAN_CAPACITY, START_GOLD, TILE, MAP_W } from "./config.js";
import { newClock } from "./rules/clock.js";
import { newRel } from "./rules/relationships.js";
import { addItem } from "./rules/inventory.js";
import { VILLAGER_IDS } from "./data/villagers.js";
import { PLAYER_START, HORSE_START, FARM_WELL } from "./world/map.js";

export const SAVE_VERSION = 5;

/** `MIGRATIONS[n]` upgrades a v(n) save to v(n+1). */
export const MIGRATIONS = {
  // v2: coops keep feed and uncollected eggs.
  1: (d) => ({ ...d, structures: d.structures.map((st) => (st.type === "coop" ? { hay: 0, eggs: 0, ...st } : st)) }),
  // v3: fishing log; coops count eggs by quality and keep named hens.
  2: (d) => ({
    ...d,
    fishLog: {},
    structures: d.structures.map((st) => (st.type === "coop" ? { ...newCoop(st.uid), ...st, eggs: [st.eggs, 0, 0] } : st)),
  }),
  // v4: skills, the tutorial (already-played saves skip it and the intro), and
  // the new farm well's paving cleared of anything built or tilled there.
  3: (d) => clearFarmWell({ ...d, skills: newSkills(), tutorial: { step: 0, done: true }, flags: { ...d.flags, intro: true } }),
  // v5: villagers added since (Bram) get a fresh relationship.
  4: (d) => ({ ...d, rel: { ...Object.fromEntries(VILLAGER_IDS.map((id) => [id, { ...newRel(), met: false }])), ...d.rel } }),
};

/** Remove structures and soil on the farm well's paving, refunding what was built. */
function clearFarmWell(d) {
  const { tx, ty } = FARM_WELL;
  const onPave = ([x, y]) => x >= tx - 1 && x <= tx + 2 && y >= ty - 1 && y <= ty + 2;
  const inv = d.inv.map((s) => s && { ...s });
  let gold = d.gold;
  const structures = d.structures.filter((st) => {
    const def = STRUCTURES[st.type];
    if (!footprint(def, st.tx, st.ty).some(onPave)) return true;
    gold += def.cost.gold ?? 0;
    for (const k of ["wood", "stone"]) if (def.cost[k]) addItem(inv, k, def.cost[k]);
    if (st.eggs) st.eggs.forEach((n, q) => n && addItem(inv, "egg", n, q));
    return false;
  });
  const soil = {};
  for (const k in d.soil) if (!onPave([k % MAP_W, Math.floor(k / MAP_W)])) soil[k] = d.soil[k];
  return { ...d, gold, inv, structures, soil };
}

export const migrateSave = migrateChain(SAVE_VERSION, MIGRATIONS);
export const save = createSave("luna_save", SAVE_VERSION, migrateSave);

export const DEFAULT_PROFILE = {
  name: "Luna",
  farm: "Moonpetal Farm",
  look: { skin: 1, hair: "ponytail", hairColor: "#b0603a", eyes: "#3f6fb0", top: "#f4a6b8", bottom: "#5a6e9a", hat: "straw" },
  pet: { kind: "dog", coat: "#d9a066", name: "Biscuit" },
};

export function newState(profile = DEFAULT_PROFILE, seed = 7) {
  const inv = new Array(INV_SIZE).fill(null);
  for (const id of ["hoe", "can", "axe", "scythe", "rod"]) addItem(inv, id, 1);
  addItem(inv, "turnip_seed", 15);
  addItem(inv, "strawberry_seed", 3);
  const rel = {};
  for (const id of VILLAGER_IDS) rel[id] = { ...newRel(), met: false };
  return {
    seed,
    profile: structuredClone(profile),
    player: { level: "world", x: (PLAYER_START.tx + 0.5) * TILE, y: (PLAYER_START.ty + 0.6) * TILE, dir: "down" },
    horse: { name: "", level: "world", x: (HORSE_START.tx + 0.5) * TILE, y: (HORSE_START.ty + 0.6) * TILE, dir: "right", mounted: false },
    gold: START_GOLD,
    energy: MAX_ENERGY,
    water: CAN_CAPACITY,
    inv,
    sel: 0,
    clock: newClock(),
    weather: "sun",
    soil: {},
    structures: [],
    objs: {},
    forage: {},
    rel,
    pet: { happy: 40, petted: -1 },
    bin: [],
    flags: { found: {}, intro: false },
    skills: newSkills(),
    tutorial: { step: 0, done: false },
    stats: { earned: 0, shippedDays: 0 },
    fishLog: {},
    uid: 1,
  };
}
