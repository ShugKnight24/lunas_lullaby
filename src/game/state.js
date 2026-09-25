/**
 * Save state: plain JSON data only (the runtime rebuilds levels, actors and
 * sprites from it). `createSave("luna_save", SAVE_VERSION)` stores it; bump
 * SAVE_VERSION and add a step to MIGRATIONS whenever the shape changes.
 */

import { createSave, migrateChain } from "../engine/save.js";
import { newCoop } from "./rules/animals.js";
import { newSkills } from "./rules/skills.js";
import { maxHp, newPetStats } from "./rules/combat.js";
import { newQuests } from "./rules/quests.js";
import { newEquip, newAttrs } from "./rules/equipment.js";
import { ITEMS } from "./data/items.js";
import { footprint } from "./rules/structures.js";
import { STRUCTURES } from "./data/structures.js";
import { INV_SIZE, MAX_ENERGY, CAN_CAPACITY, START_GOLD, TILE, MAP_W } from "./config.js";
import { newClock, dayIndex } from "./rules/clock.js";
import { newRel } from "./rules/relationships.js";
import { addItem } from "./rules/inventory.js";
import { VILLAGER_IDS } from "./data/villagers.js";
import { PLAYER_START, HORSE_START, FARM_WELL } from "./world/map.js";

export const SAVE_VERSION = 12;

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
  // v6: professions chosen at skill level 5.
  5: (d) => ({ ...d, professions: {} }),
  // v7: your companion's wishes, and harvest counts they're measured by.
  6: (d) => ({ ...d, dreams: {}, stats: { harvested: {}, ...d.stats }, flags: { finale: false, ...d.flags } }),
  // v8: the chainsaw companion is Sawyer now (an original name).
  7: (d) => {
    const pet = d.profile.pet;
    if (pet.kind !== "pochita") return d;
    return { ...d, profile: { ...d.profile, pet: { ...pet, kind: "sawpup", name: pet.name === "Pochita" ? "Sawyer" : pet.name } } };
  },
  // v9: the Building skill.
  8: (d) => ({ ...d, skills: { ...newSkills(), ...d.skills } }),
  // v10: the Wildwood: health, the Combat skill, a companion who levels up,
  // quests, the adventurers' guild, new neighbours and per-level object state.
  9: (d) => ({
    ...d,
    hp: maxHp(0),
    skills: { ...newSkills(), ...d.skills },
    pet: { ...newPetStats(), ...d.pet },
    quests: newQuests(),
    guild: 0,
    lvobjs: {},
    stats: { standSales: 0, kills: {}, ...d.stats },
    rel: { ...Object.fromEntries(VILLAGER_IDS.map((id) => [id, { ...newRel(), met: false }])), ...d.rel },
  }),
  // v11: equipment slots and stat points; the best sword in the bag is put on.
  10: (d) => {
    const inv = d.inv.map((x) => x && { ...x });
    const equip = newEquip();
    let best = -1;
    inv.forEach((x, i) => x && ITEMS[x.id]?.kind === "weapon" && (best < 0 || ITEMS[x.id].dmg > ITEMS[inv[best].id].dmg) && (best = i));
    if (best >= 0) {
      equip.weapon = inv[best].id;
      inv[best] = null;
    }
    return { ...d, inv, equip, attrs: newAttrs() };
  },
  // v12: the adventure diary starts on the day you open it.
  11: (d) => ({ ...d, log: [{ d: dayIndex(d.clock), t: `Started keeping a journal of life on ${d.profile.farm}.`, k: "event" }] }),
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
  name: "Sol",
  farm: "Moonpetal Farm",
  look: { skin: 1, hair: "ponytail", hairColor: "#b0603a", eyes: "#3f6fb0", top: "#f4a6b8", bottom: "#5a6e9a", hat: "straw" },
  pet: { kind: "anatolian", coat: "#c8965a", name: "Luna" },
};

export function newState(profile = DEFAULT_PROFILE, seed = 7) {
  const inv = new Array(INV_SIZE).fill(null);
  for (const id of ["hoe", "can", "axe", "scythe", "rod"]) addItem(inv, id, 1);
  addItem(inv, "turnip_seed", 15);
  addItem(inv, "strawberry_seed", 3);
  addItem(inv, "squeaky_ball", 1);
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
    pet: { happy: 40, petted: -1, ...newPetStats() },
    hp: maxHp(0),
    quests: newQuests(),
    guild: 0,
    lvobjs: {},
    equip: newEquip(),
    attrs: newAttrs(),
    log: [{ d: 0, t: `Arrived at ${profile.farm} with ${profile.pet.name}. Everything smells like rain and new beginnings.`, k: "event" }],
    bin: [],
    flags: { found: {}, intro: false, finale: false },
    dreams: {},
    skills: newSkills(),
    professions: {},
    tutorial: { step: 0, done: false },
    stats: { earned: 0, shippedDays: 0, harvested: {}, standSales: 0, kills: {} },
    fishLog: {},
    uid: 1,
  };
}
