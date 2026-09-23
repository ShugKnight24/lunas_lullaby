/**
 * Item table. `kind` drives what using/placing/gifting an item does;
 * `sell` is the shipping-bin price, `price` the shop price. Fish come from
 * data/fish.js.
 */

import { FISH } from "./fish.js";

export const ITEMS = {
  hoe: { name: "Hoe", kind: "tool", energy: 2, tip: "Till soil" },
  can: { name: "Watering Can", kind: "tool", energy: 2, tip: "Water crops · refill at water" },
  axe: { name: "Axe", kind: "tool", energy: 3, tip: "Chop trees · break rocks" },
  scythe: { name: "Scythe", kind: "tool", energy: 1, tip: "Cut weeds · harvest" },
  rod: { name: "Fishing Rod", kind: "tool", energy: 4, tip: "Cast into water" },

  turnip_seed: { name: "Turnip Seeds", kind: "seed", crop: "turnip", price: 20 },
  strawberry_seed: { name: "Strawberry Seeds", kind: "seed", crop: "strawberry", price: 90 },
  tomato_seed: { name: "Tomato Seeds", kind: "seed", crop: "tomato", price: 50 },
  sunflower_seed: { name: "Sunflower Seeds", kind: "seed", crop: "sunflower", price: 110 },
  pumpkin_seed: { name: "Pumpkin Seeds", kind: "seed", crop: "pumpkin", price: 100 },
  moonbloom_seed: { name: "Moonbloom Seeds", kind: "seed", crop: "moonbloom", price: 120 },
  cranberry_seed: { name: "Cranberry Seeds", kind: "seed", crop: "cranberry", price: 200 },

  turnip: { name: "Turnip", kind: "crop", sell: 40 },
  strawberry: { name: "Strawberry", kind: "crop", sell: 110 },
  tomato: { name: "Tomato", kind: "crop", sell: 60 },
  sunflower: { name: "Sunflower", kind: "crop", sell: 150 },
  pumpkin: { name: "Pumpkin", kind: "crop", sell: 320 },
  cranberry: { name: "Cranberries", kind: "crop", sell: 75 },
  moonbloom: { name: "Moonbloom", kind: "crop", sell: 280 },

  spring_onion: { name: "Spring Onion", kind: "forage", sell: 12 },
  leek: { name: "Wild Leek", kind: "forage", sell: 60 },
  salmonberry: { name: "Salmonberry", kind: "forage", sell: 10 },
  blackberry: { name: "Blackberry", kind: "forage", sell: 25 },
  mushroom: { name: "Mushroom", kind: "forage", sell: 40 },
  chanterelle: { name: "Chanterelle", kind: "forage", sell: 160 },
  holly: { name: "Holly", kind: "forage", sell: 80 },
  snow_yam: { name: "Snow Yam", kind: "forage", sell: 100 },
  star_shard: { name: "Star Shard", kind: "forage", sell: 400 },

  ...Object.fromEntries(Object.entries(FISH).map(([id, f]) => [id, { name: f.name, kind: "fish", sell: f.sell }])),

  egg: { name: "Egg", kind: "animal", sell: 50 },
  fertilizer: { name: "Basic Fertilizer", kind: "fertilizer", tier: 1, price: 30, tip: "Better crop quality · use on tilled soil" },
  deluxe_fertilizer: { name: "Deluxe Fertilizer", kind: "fertilizer", tier: 2, price: 90, tip: "Much better crop quality · use on tilled soil" },
  bait: { name: "Bait", kind: "tackle", sell: 1, tip: "Fish bite sooner · used up one per cast from your bag" },
  hay: { name: "Hay", kind: "feed", price: 20, tip: "Chicken feed · stock it at the coop" },

  wood: { name: "Wood", kind: "resource", sell: 2 },
  stone: { name: "Stone", kind: "resource", sell: 2 },
  fiber: { name: "Fiber", kind: "resource", sell: 1 },

  bread: { name: "Honey Loaf", kind: "food", price: 60, sell: 25, energy: 60 },
  lullaby_loaf: { name: "Lullaby Loaf", kind: "food", sell: 200, energy: 150 },
};

export const TOOL_IDS = ["hoe", "can", "axe", "scythe"];
export const isGiftable = (id) => {
  const k = ITEMS[id]?.kind;
  return k === "crop" || k === "forage" || k === "fish" || k === "food" || k === "animal";
};
