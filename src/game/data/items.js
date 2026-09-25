/**
 * Item table. `kind` drives what using/placing/gifting an item does;
 * `sell` is the shipping-bin price, `price` the shop price. Fish come from
 * data/fish.js; every crop also has a preserves-jar product (`<crop>_jam`).
 */

import { FISH } from "./fish.js";
import { CROPS } from "./crops.js";

/** Preserves names per crop; the rest are "<Crop> Preserves". */
const JAM_NAMES = { strawberry: "Strawberry Jam", cranberry: "Cranberry Jam", tomato: "Tomato Relish", turnip: "Pickled Turnip", pumpkin: "Pumpkin Butter", sunflower: "Sunflower Honey", moonbloom: "Moonbloom Syrup" };

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
  bait: { name: "Bait", kind: "tackle", price: 10, sell: 1, tip: "Fish bite sooner · used up one per cast from your bag" },
  hay: { name: "Hay", kind: "feed", price: 20, tip: "Chicken feed · stock it at the coop" },

  mayonnaise: { name: "Mayonnaise", kind: "artisan", sell: 150 },
  ...Object.fromEntries(Object.values(CROPS).map((c) => [`${c.produce}_jam`, { name: JAM_NAMES[c.produce] ?? `${c.name} Preserves`, kind: "artisan", sell: 0, src: c.produce }])),

  bicycle: { name: "Bicycle", kind: "vehicle", tip: "Press B (or use it) to ride · outdoors only" },
  preserves_jar: { name: "Preserves Jar", kind: "machine", tip: "Place on the farm · turns a crop into jam" },
  mayo_machine: { name: "Mayo Machine", kind: "machine", tip: "Place on the farm · turns an egg into mayonnaise" },
  lucky_lure: { name: "Lucky Lure", kind: "tackle", sell: 50, tip: "Keep it in your bag · wider silver and gold bands when reeling" },

  wood: { name: "Wood", kind: "resource", sell: 2 },
  stone: { name: "Stone", kind: "resource", sell: 2 },
  fiber: { name: "Fiber", kind: "resource", sell: 1 },

  bread: { name: "Honey Loaf", kind: "food", price: 60, sell: 25, energy: 60, hp: 10 },
  lullaby_loaf: { name: "Lullaby Loaf", kind: "food", sell: 200, energy: 150, hp: 30 },
  egg_sandwich: { name: "Egg Sandwich", kind: "food", sell: 90, energy: 110, hp: 20 },
  forager_stew: { name: "Forager's Stew", kind: "food", sell: 110, energy: 130, hp: 25 },
  // Hearth cooking (data/cooking.js): food with a buff for the rest of the day.
  farm_breakfast: { name: "Farmhand's Breakfast", kind: "food", sell: 160, energy: 160, hp: 20, buff: "farmhand" },
  spicy_stirfry: { name: "Spicy Stir-fry", kind: "food", sell: 180, energy: 100, hp: 25, buff: "fiery" },
  fisher_chowder: { name: "Fisher's Chowder", kind: "food", sell: 200, energy: 120, hp: 25, buff: "lucky" },
  honey_apple: { name: "Honey-glazed Apple", kind: "food", sell: 220, energy: 80, hp: 15, buff: "swift" },
  stuffed_pumpkin: { name: "Stuffed Pumpkin", kind: "food", sell: 480, energy: 180, hp: 40, buff: "sturdy" },
  moonbloom_tea: { name: "Moonbloom Tea", kind: "food", sell: 380, energy: 60, hp: 10, buff: "calm" },
  strawberry_cake: { name: "Strawberry Shortcake", kind: "food", sell: 450, energy: 140, hp: 20, buff: "cheer" },
  squeaky_ball: { name: "Squeaky Ball", kind: "toy", price: 50, tip: "Hold it and press Space to throw it for your companion" },
  healing_salve: { name: "Healing Salve", kind: "food", price: 90, sell: 30, energy: 10, hp: 40, petHeal: 30, tip: "Heals 40 health · use it on your companion to heal them" },
  trail_jerky: { name: "Trail Jerky", kind: "food", price: 45, sell: 20, energy: 40, hp: 15, petHeal: 20, petFull: 35 },
  pet_treat: { name: "Companion Treat", kind: "treat", price: 60, sell: 15, petHeal: 999, petFull: 60, tip: "Hold it and press E by your companion · heals and fills them up" },
  apple: { name: "Apple", kind: "food", price: 40, sell: 30, energy: 25, hp: 5 },
  honey: { name: "Wildflower Honey", kind: "artisan", price: 150, sell: 100 },
  milk: { name: "Milk", kind: "animal", price: 180, sell: 125 },
  cheese: { name: "Cheese", kind: "artisan", price: 320, sell: 230 },
  wool: { name: "Wool", kind: "animal", price: 420, sell: 340 },

  // Wildwood: weapons, creature loot and rare materials.
  // Gear: `slot` is where it's worn, `lvl` the Combat level needed to equip it.
  // Stats: dmg (weapons), def, hp, atk, spd (move speed, 0.1 = +10%), crit (chance).
  rusty_sword: { name: "Rusty Sword", kind: "weapon", slot: "weapon", dmg: 6, reach: 38, price: 150, tip: "An old blade that still bites" },
  bronze_sword: { name: "Bronze Sword", kind: "weapon", slot: "weapon", dmg: 8, reach: 40, lvl: 1, tip: "Balanced and dependable" },
  steel_sword: { name: "Steel Sword", kind: "weapon", slot: "weapon", dmg: 11, reach: 42, price: 1500, lvl: 3, tip: "Forged from the old lantern frames" },
  ironwood_blade: { name: "Ironwood Blade", kind: "weapon", slot: "weapon", dmg: 14, reach: 46, crit: 0.05, lvl: 5, tip: "Dark wood, harder than iron" },
  moon_blade: { name: "Moon Blade", kind: "weapon", slot: "weapon", dmg: 18, reach: 48, crit: 0.05, lvl: 6, tip: "The shrine's own blade" },

  leather_cap: { name: "Leather Cap", kind: "armor", slot: "head", def: 1, price: 250, tip: "Better than nothing" },
  iron_helm: { name: "Iron Helm", kind: "armor", slot: "head", def: 3, lvl: 3, tip: "Heavy, but your ears will thank you" },
  warden_hood: { name: "Warden's Hood", kind: "armor", slot: "head", def: 2, hp: 10, lvl: 4, tip: "Hazel's own pattern" },
  padded_vest: { name: "Padded Vest", kind: "armor", slot: "body", def: 2, price: 400, tip: "Quilted and cosy" },
  thornback_armor: { name: "Thornback Armor", kind: "armor", slot: "body", def: 4, atk: 1, lvl: 2, tip: "Tusks and hide, stitched tight" },
  ironwood_mail: { name: "Ironwood Mail", kind: "armor", slot: "body", def: 6, spd: -0.05, lvl: 5, tip: "Tough as a tree, and about as nimble" },
  sturdy_boots: { name: "Sturdy Boots", kind: "armor", slot: "feet", def: 1, spd: 0.05, price: 300, tip: "Good for long walks" },
  swift_boots: { name: "Swift Boots", kind: "armor", slot: "feet", def: 1, spd: 0.12, lvl: 3, tip: "Wisp-light soles" },
  slime_charm: { name: "Slime Charm", kind: "armor", slot: "charm", hp: 10, tip: "Squishy, and oddly comforting" },
  tusk_pendant: { name: "Tusk Pendant", kind: "armor", slot: "charm", atk: 2, lvl: 2, tip: "A Thornback's pride" },
  wisp_lantern: { name: "Wisp Lantern", kind: "armor", slot: "charm", crit: 0.08, lvl: 3, tip: "A tame wisp's glow" },
  moon_amulet: { name: "Moon Amulet", kind: "armor", slot: "charm", def: 2, hp: 15, atk: 2, lvl: 6, tip: "The Gloomroot's heart, made gentle" },

  slime_gel: { name: "Slime Gel", kind: "loot", sell: 8 },
  boar_tusk: { name: "Thornback Tusk", kind: "loot", sell: 35 },
  spore_cap: { name: "Spore Cap", kind: "loot", sell: 20 },
  wisp_essence: { name: "Wisp Essence", kind: "loot", sell: 60 },
  gloom_heart: { name: "Gloom Heart", kind: "loot", sell: 1200, tip: "Still faintly warm" },
  amber: { name: "Amber", kind: "mineral", sell: 60 },
  moonstone: { name: "Moonstone", kind: "mineral", sell: 180 },
  iron_ore: { name: "Iron Ore", kind: "mineral", sell: 25 },
  silverleaf: { name: "Silverleaf", kind: "forage", sell: 45 },
  ironwood: { name: "Ironwood", kind: "resource", sell: 30 },
  farm_stand: { name: "Farm Stand", kind: "stand", price: 800, tip: "Place it on your farm · stock it with E and villagers buy overnight" },
};

// Jam sells for twice its crop plus 50 (filled in after the table exists).
for (const id in ITEMS) if (ITEMS[id].src) ITEMS[id].sell = ITEMS[ITEMS[id].src].sell * 2 + 50;

export const TOOL_IDS = ["hoe", "can", "axe", "scythe"];
export const isGiftable = (id) => {
  const k = ITEMS[id]?.kind;
  return k === "crop" || k === "forage" || k === "fish" || k === "food" || k === "animal" || k === "artisan" || k === "mineral";
};
