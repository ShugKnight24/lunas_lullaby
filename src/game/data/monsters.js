/**
 * Wildwood creatures. `ai` picks the behaviour in world/enemies.js; stats are
 * in world units (speed in tiles per second, reach and sight in tiles).
 * `drops` rolls each entry independently: [item, chance, min, max].
 */

export const MONSTERS = {
  slime: {
    name: "Bramble Slime",
    ai: "hop",
    hp: 14,
    dmg: 6,
    speed: 3.2,
    sight: 5,
    xp: 6,
    gold: [2, 6],
    color: "#7cc86a",
    drops: [["slime_gel", 0.7, 1, 2]],
  },
  slime_violet: {
    name: "Dusk Slime",
    ai: "hop",
    hp: 26,
    dmg: 9,
    speed: 3.8,
    sight: 6,
    xp: 11,
    gold: [4, 10],
    color: "#b08ad8",
    drops: [["slime_gel", 0.8, 1, 3], ["amber", 0.12, 1, 1]],
  },
  boar: {
    name: "Thornback",
    ai: "charge",
    hp: 34,
    dmg: 12,
    speed: 1.6,
    sight: 6,
    xp: 16,
    gold: [6, 14],
    drops: [["boar_tusk", 0.6, 1, 1], ["trail_jerky", 0.15, 1, 1], ["sturdy_boots", 0.03, 1, 1]],
  },
  shroom: {
    name: "Shroomling",
    ai: "spore",
    hp: 20,
    dmg: 7,
    speed: 1.8,
    sight: 5,
    xp: 9,
    gold: [3, 8],
    drops: [["spore_cap", 0.65, 1, 2], ["mushroom", 0.2, 1, 1]],
  },
  wisp: {
    name: "Gloom Wisp",
    ai: "shoot",
    hp: 22,
    dmg: 10,
    speed: 2.4,
    sight: 7,
    xp: 14,
    gold: [5, 12],
    drops: [["wisp_essence", 0.6, 1, 1], ["moonstone", 0.08, 1, 1], ["wisp_lantern", 0.02, 1, 1]],
  },
  gloomroot: {
    name: "The Gloomroot",
    ai: "boss",
    boss: true,
    hp: 420,
    dmg: 16,
    speed: 0.6,
    sight: 11,
    xp: 300,
    gold: [400, 400],
    drops: [["gloom_heart", 1, 1, 1], ["moonstone", 1, 2, 3]],
  },
};

/** Which monsters a Wildwood zone spawns by day and at night (weights). */
export const ZONE_SPAWNS = {
  edge: { day: [["slime", 5], ["shroom", 1]], night: [["slime", 3], ["slime_violet", 2], ["wisp", 1]], n: 6 },
  thicket: { day: [["boar", 3], ["shroom", 3], ["slime", 2]], night: [["boar", 3], ["slime_violet", 2], ["wisp", 2]], n: 8 },
  hollow: { day: [["shroom", 2], ["slime_violet", 2], ["wisp", 1]], night: [["wisp", 4], ["slime_violet", 2]], n: 6 },
};

/** After the Gloomroot falls the wood calms down: fewer creatures everywhere. */
export const CLEANSED_SPAWN_MULT = 0.5;
