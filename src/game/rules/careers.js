/**
 * Careers: long paths you grow along by playing, each with five ranks and a
 * small perk per rank. Rank comes from a measure of the save state, so
 * nothing extra is stored. The Farm Stand (your own shop) sells overnight.
 */

import { skillLevel } from "./skills.js";

export const CAREERS = [
  {
    id: "farmer",
    name: "Farmer",
    ranks: ["Hand", "Grower", "Farmer", "Master Grower", "Legend of the Hollow"],
    at: [0, 2000, 10000, 40000, 120000],
    measure: (s) => s.stats.earned,
    unit: "g shipped",
    perk: "Crops sell for 2% more per rank",
  },
  {
    id: "adventurer",
    name: "Adventurer",
    ranks: ["Wanderer", "Bronze Warden", "Silver Warden", "Gold Warden", "Wildwood Hero"],
    at: [0, 3, 8, 15, 25],
    measure: (s) => s.guild ?? 0,
    unit: "guild points",
    perk: "+5 max health per rank; Hazel stocks better gear",
  },
  {
    id: "merchant",
    name: "Merchant",
    ranks: ["Peddler", "Stallholder", "Shopkeeper", "Trader", "Merchant Prince"],
    at: [0, 500, 3000, 12000, 40000],
    measure: (s) => s.stats.standSales ?? 0,
    unit: "g sold at your stand",
    perk: "Your Farm Stand sells more each night, at a better markup",
  },
  {
    id: "angler",
    name: "Angler",
    ranks: ["Dabbler", "Line Caster", "Angler", "Pond Master", "Moonfish Whisperer"],
    at: [0, 10, 40, 100, 250],
    measure: (s) => Object.values(s.fishLog ?? {}).reduce((a, f) => a + f.n, 0),
    unit: "fish caught",
    perk: "Fish sell for 2% more per rank",
  },
  {
    id: "rancher",
    name: "Rancher",
    ranks: ["Hen Keeper", "Herder", "Rancher", "Master Rancher", "Heart of the Herd"],
    at: [0, 2, 4, 7, 10],
    measure: (s) => skillLevel(s.skills.ranching ?? 0),
    unit: "ranching level",
    perk: "Eggs, milk, wool and cheese sell for 2% more per rank",
  },
];

/** Rank index 0..4 for a measured value. */
export function rankOf(career, value) {
  let r = 0;
  while (r < career.at.length - 1 && value >= career.at[r + 1]) r++;
  return r;
}

/** Every career's `{ id, name, rank, title, value, next }` for the save. */
export function careerSheet(s) {
  return CAREERS.map((c) => {
    const value = c.measure(s);
    const rank = rankOf(c, value);
    return { id: c.id, name: c.name, rank, title: c.ranks[rank], value, from: c.at[rank], next: c.at[rank + 1] ?? null, unit: c.unit, perk: c.perk };
  });
}

export const careerRank = (s, id) => rankOf(CAREERS.find((c) => c.id === id), CAREERS.find((c) => c.id === id).measure(s));

const RANCH_GOODS = new Set(["egg", "mayonnaise", "milk", "wool", "cheese"]);

/** Sell multiplier from career ranks (stacks with professions). */
export function careerMult(s, id, item) {
  if (item.kind === "crop") return 1 + careerRank(s, "farmer") * 0.02;
  if (item.kind === "fish") return 1 + careerRank(s, "angler") * 0.02;
  if (RANCH_GOODS.has(id)) return 1 + careerRank(s, "rancher") * 0.02;
  return 1;
}

// ── Farm Stand ──────────────────────────────────────────────────────────────

/** How many items the stand sells a night, and the markup over shipping, by merchant rank. */
export const STAND_CAP = [4, 6, 9, 13, 18];
export const STAND_MARKUP = [1.15, 1.2, 1.28, 1.36, 1.45];
export const STAND_SLOTS = 6;

/**
 * Overnight stand sales. `stock` is `[{ id, n, q }]`; `price(id, q)` the
 * shipping price; `rand()` in [0, 1). Villagers buy up to the cap, choosing
 * among the stocked goods; rain keeps some away.
 * Returns `{ stock, sold: [{ id, q, n, each }], total }`.
 */
export function standSales(stock, rank, price, rand, rain = false) {
  const left = stock.map((x) => x && { ...x });
  let cap = STAND_CAP[rank];
  if (rain) cap = Math.ceil(cap * 0.6);
  const sold = new Map();
  let total = 0;
  for (let i = 0; i < cap; i++) {
    const open = left.map((x, j) => (x && x.n > 0 ? j : -1)).filter((j) => j >= 0);
    if (!open.length) break;
    const x = left[open[Math.floor(rand() * open.length)]];
    x.n--;
    const each = Math.round(price(x.id, x.q ?? 0) * STAND_MARKUP[rank]);
    total += each;
    const k = `${x.id}:${x.q ?? 0}`;
    const cur = sold.get(k) ?? { id: x.id, q: x.q ?? 0, n: 0, each };
    cur.n++;
    sold.set(k, cur);
  }
  return { stock: left.map((x) => (x && x.n > 0 ? x : null)), sold: [...sold.values()], total };
}
