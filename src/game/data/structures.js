/**
 * Buildable structures (carpenter board). Footprint is w×h tiles anchored at
 * the top-left tile; `floor` structures are walkable, `walk` ones too (gates),
 * `onSoil` may sit on tilled ground. `fence` gives the fence style (all fence
 * styles join up), `paint` lets you pick its colour, `deco` reuses a town
 * prop's art, and `level` is the Building level that unlocks it.
 */

export const STRUCTURES = {
  fence: { name: "Fence", w: 1, h: 1, cost: { wood: 1 }, fence: "wood", paint: true, desc: "Keeps the farm tidy." },
  fence_gate: { name: "Gate", w: 1, h: 1, cost: { wood: 2 }, fence: "gate", paint: true, walk: true, level: 1, desc: "A fence you can walk through." },
  fence_rustic: { name: "Log Fence", w: 1, h: 1, cost: { wood: 2 }, fence: "rustic", level: 2, desc: "Chunky split-rail logs." },
  fence_white: { name: "Picket Fence", w: 1, h: 1, cost: { wood: 2 }, fence: "picket", paint: true, level: 3, desc: "Pointed pickets, ready to paint." },
  fence_stone: { name: "Stone Wall", w: 1, h: 1, cost: { stone: 3 }, fence: "stone", level: 4, desc: "A low dry-stone wall." },
  fence_hedge: { name: "Hedge", w: 1, h: 1, cost: { wood: 1, fiber: 4 }, fence: "hedge", level: 5, desc: "A clipped green hedge." },
  planter: { name: "Planter", w: 1, h: 1, cost: { wood: 4, stone: 2 }, deco: "planter", level: 1, desc: "Flowers for the porch." },
  lamp: { name: "Lamp Post", w: 1, h: 1, cost: { wood: 2, stone: 6, gold: 40 }, deco: "lamp", level: 2, desc: "Glows warm after dark." },
  bench: { name: "Bench", w: 1, h: 1, cost: { wood: 8 }, deco: "bench", level: 3, desc: "Somewhere to sit and watch things grow." },
  path: { name: "Stone Path", w: 1, h: 1, cost: { stone: 1 }, floor: true, desc: "A cosy stepping-stone path." },
  scarecrow: { name: "Scarecrow", w: 1, h: 1, cost: { wood: 5, gold: 30 }, desc: "A friendly guardian." },
  sprinkler: { name: "Sprinkler", w: 1, h: 1, cost: { stone: 4, gold: 80 }, onSoil: true, desc: "Waters the 4 tiles around it each morning." },
  coop: { name: "Chicken Coop", w: 4, h: 3, cost: { wood: 40, stone: 20, gold: 400 }, desc: "Home for two chickens." },
  well: { name: "Well", w: 2, h: 2, cost: { stone: 20, gold: 150 }, water: true, desc: "Refill your watering can." },
};

// Machines are crafted and placed from the bag (`item`), not bought in build mode.
STRUCTURES.preserves_jar = { name: "Preserves Jar", w: 1, h: 1, cost: {}, item: "preserves_jar", desc: "Turns a crop into jam." };
STRUCTURES.mayo_machine = { name: "Mayo Machine", w: 1, h: 1, cost: {}, item: "mayo_machine", desc: "Turns an egg into mayonnaise." };

export const BUILD_ORDER = ["fence", "fence_gate", "fence_rustic", "fence_white", "fence_stone", "fence_hedge", "path", "planter", "lamp", "bench", "scarecrow", "sprinkler", "coop", "well"];

/** Paint colours for fences that take paint (null = natural). */
export const PAINTS = [null, "#f4ece0", "#e88a9a", "#f6c86a", "#8ac0e0", "#9cc08a", "#b8a0d8", "#7a4a6a"];
