/**
 * Item table. `kind` drives what using/placing/gifting an item does;
 * `sell` is the shipping-bin price, `price` the shop price.
 */

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
  cranberry_seed: { name: "Cranberry Seeds", kind: "seed", crop: "cranberry", price: 200 },

  turnip: { name: "Turnip", kind: "crop", sell: 40 },
  strawberry: { name: "Strawberry", kind: "crop", sell: 110 },
  tomato: { name: "Tomato", kind: "crop", sell: 60 },
  sunflower: { name: "Sunflower", kind: "crop", sell: 150 },
  pumpkin: { name: "Pumpkin", kind: "crop", sell: 320 },
  cranberry: { name: "Cranberries", kind: "crop", sell: 75 },

  spring_onion: { name: "Spring Onion", kind: "forage", sell: 12 },
  leek: { name: "Wild Leek", kind: "forage", sell: 60 },
  salmonberry: { name: "Salmonberry", kind: "forage", sell: 10 },
  blackberry: { name: "Blackberry", kind: "forage", sell: 25 },
  mushroom: { name: "Mushroom", kind: "forage", sell: 40 },
  chanterelle: { name: "Chanterelle", kind: "forage", sell: 160 },
  holly: { name: "Holly", kind: "forage", sell: 80 },
  snow_yam: { name: "Snow Yam", kind: "forage", sell: 100 },
  star_shard: { name: "Star Shard", kind: "forage", sell: 400 },

  sunfish: { name: "Sunfish", kind: "fish", sell: 30 },
  carp: { name: "Pond Carp", kind: "fish", sell: 45 },
  trout: { name: "Rainbow Trout", kind: "fish", sell: 90 },

  wood: { name: "Wood", kind: "resource", sell: 2 },
  stone: { name: "Stone", kind: "resource", sell: 2 },
  fiber: { name: "Fiber", kind: "resource", sell: 1 },

  bread: { name: "Honey Loaf", kind: "food", price: 60, sell: 25, energy: 60 },
  lullaby_loaf: { name: "Lullaby Loaf", kind: "food", sell: 200, energy: 150 },
};

export const TOOL_IDS = ["hoe", "can", "axe", "scythe"];
export const isGiftable = (id) => {
  const k = ITEMS[id]?.kind;
  return k === "crop" || k === "forage" || k === "fish" || k === "food";
};
