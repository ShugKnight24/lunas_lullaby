/**
 * Hearth cooking: dishes made at the farmhouse fireplace. Each restores
 * energy and health like any food and gives a buff for the rest of the day
 * (one at a time; a new dish replaces it). An ingredient key "kind:fish"
 * takes any item of that kind, cheapest first.
 */

export const BUFFS = {
  farmhand: { name: "Farmhand", desc: "Tools use half the energy", energy: 0.5 },
  fiery: { name: "Fiery", desc: "+3 attack", atk: 3 },
  lucky: { name: "Lucky Line", desc: "A wider green zone when reeling", fish: 0.035 },
  swift: { name: "Swift", desc: "+15% speed", spd: 0.15 },
  sturdy: { name: "Sturdy", desc: "+3 defence and +20 health", def: 3, hp: 20 },
  calm: { name: "Moonlit Calm", desc: "Energy trickles back as the day goes on", regen: 2 },
  cheer: { name: "Cheerful", desc: "Chats and gifts build friendship faster", friend: 1.5 },
};

export const COOKING = [
  { out: "farm_breakfast", in: { egg: 2, milk: 1 } },
  { out: "spicy_stirfry", in: { tomato: 2, mushroom: 1 } },
  { out: "fisher_chowder", in: { "kind:fish": 1, milk: 1 } },
  { out: "honey_apple", in: { apple: 2, honey: 1 } },
  { out: "stuffed_pumpkin", in: { pumpkin: 1, mushroom: 2 } },
  { out: "moonbloom_tea", in: { moonbloom: 1, silverleaf: 1 } },
  { out: "strawberry_cake", in: { strawberry: 3, egg: 1, milk: 1 } },
];
