/**
 * Save state: plain JSON data only (the runtime rebuilds levels, actors and
 * sprites from it). `createSave("luna_save", 1)` stores it.
 */

import { createSave } from "../engine/save.js";
import { INV_SIZE, MAX_ENERGY, CAN_CAPACITY, START_GOLD, TILE } from "./config.js";
import { newClock } from "./rules/clock.js";
import { newRel } from "./rules/relationships.js";
import { addItem } from "./rules/inventory.js";
import { VILLAGER_IDS } from "./data/villagers.js";
import { PLAYER_START, HORSE_START } from "./world/map.js";

export const save = createSave("luna_save", 1);

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
    flags: { found: {} },
    stats: { earned: 0, shippedDays: 0 },
    uid: 1,
  };
}
