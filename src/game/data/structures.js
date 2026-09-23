/**
 * Buildable structures (carpenter board). Footprint is w×h tiles anchored at
 * the top-left tile; `floor` structures are walkable, `onSoil` may sit on
 * tilled ground.
 */

export const STRUCTURES = {
  fence: { name: "Fence", w: 1, h: 1, cost: { wood: 1 }, desc: "Keeps the farm tidy." },
  path: { name: "Stone Path", w: 1, h: 1, cost: { stone: 1 }, floor: true, desc: "A cosy stepping-stone path." },
  scarecrow: { name: "Scarecrow", w: 1, h: 1, cost: { wood: 5, gold: 30 }, desc: "A friendly guardian." },
  sprinkler: { name: "Sprinkler", w: 1, h: 1, cost: { stone: 4, gold: 80 }, onSoil: true, desc: "Waters the 4 tiles around it each morning." },
  coop: { name: "Chicken Coop", w: 4, h: 3, cost: { wood: 40, stone: 20, gold: 400 }, desc: "Home for two chickens." },
  well: { name: "Well", w: 2, h: 2, cost: { stone: 20, gold: 150 }, water: true, desc: "Refill your watering can." },
};

export const BUILD_ORDER = ["fence", "path", "scarecrow", "sprinkler", "coop", "well"];
