/**
 * Item icons (32×32 units centred on the origin) for the hotbar, inventory,
 * ground drops and DOM menus.
 */

import { part, oval, circle, hi, fill, line, ellD, rrD, capD, polyD, outlined, sprite, toSvg, dark, lite, INK } from "./cozy-kit.js";
import { CROPS } from "../data/crops.js";
import { FISH } from "../data/fish.js";
import { ITEMS } from "../data/items.js";
import { leafD } from "./crops-art.js";

const BOX = [-17, -17, 34, 34];
const WOOD = "#b07a4a";
const leaf = (b, deg, len, w, c) => part(leafD(b, deg, len, w), c, { s: 1, w: 1.2 });
const handle = (a, b) => part(capD(a, b, 3.6, 3.2), WOOD, { s: 0.8, w: 1.3 });

const DRAW = {
  hoe: () => handle([-10, 11], [7, -8]) + part("M4 -12L12 -4L9 -1L2 -9Z", "#9fb4c4", { s: 1.2 }) + hi(6, -9, 1.2, 0.8),
  can: () =>
    part("M9 -3L15 -9L16 -7L11 -1Z", "#6aa8d8", { s: 0.8, w: 1.2 }) +
    part(rrD(-11, -6, 20, 16, 4), "#7cbfe8", { s: 2 }) +
    part("M-6 -6C-6 -14 4 -14 4 -6", "none", { flat: true, w: 2.6 }) + hi(-6, -2, 2.5, 1.6) + fill(rrD(-11, 4, 20, 3, 1.5), dark("#7cbfe8", 0.2)),
  axe: () => handle([-9, 12], [5, -9]) + part("M1 -14C9 -16 14 -10 12 -4L3 -6Z", "#aebfcc", { s: 1.2 }) + hi(6, -11, 2, 0.9),
  scythe: () => handle([-8, 12], [2, -10]) + part("M1 -11C8 -15 15 -10 16 -2C12 -8 7 -9 2 -7Z", "#c4d0da", { s: 1 }),
  rod: () => line("M-11 12L10 -12", 4.2, INK) + line("M-11 12L10 -12", 2.4, "#c98a4a") + line("M10 -12Q14 -2 11 6", 0.9, "#f4f4f4") + circle(11, 7, 2, "#e8566a", { s: 0.4, w: 1 }) + circle(-7, 7, 2.6, "#8a8a9a", { s: 0.6, w: 1.1 }),

  egg: () => part("M0 -11C7 -11 10 0 10 4C10 10 5 12 0 12C-5 12 -10 10 -10 4C-10 0 -7 -11 0 -11Z", "#f6ead8", { s: 1.6 }) + hi(-4, -4, 2.2, 3, 0.8),
  fertilizer: () => sack("#c8a878", "#a078c8"),
  deluxe_fertilizer: () => sack("#e8d8a8", "#f6c63c"),
  bicycle: () => circle(-7, 4, 5.4, "#3a3a44", { s: 0.4 }) + circle(-7, 4, 3, "#c8ccd4", { s: 0, w: 0 }) + circle(7, 4, 5.4, "#3a3a44", { s: 0.4 }) + circle(7, 4, 3, "#c8ccd4", { s: 0, w: 0 }) + line("M-7 4L-2 -4L6 -5L7 4M-2 -4L0 4L-7 4M6 -5L6 -8", 2, "#e8566a") + line("M4 -8H9", 1.8, "#3a3a44") + part(ellD(-2.5, -5, 2.6, 1.1), "#6a4a3a", { s: 0.3, w: 0.9 }),
  mayonnaise: () => jar("#fff4d0", "#f6e6a8"),
  preserves_jar: () => part(rrD(-9, -9, 18, 20, 5), "#d4ecf4", { s: 1.6 }) + hi(-5, -4, 1.4, 3.4, 0.6) + part(rrD(-10, -13, 20, 5, 2), WOOD, { s: 0.8 }),
  mayo_machine: () => part(rrD(-11, -8, 22, 20, 4), "#efe2c6", { s: 1.6 }) + part(rrD(-5, -3, 10, 7, 2), "#f6d86a", { s: 0.6, w: 1.1 }) + part("M-7 -13L7 -13L4 -8H-4Z", "#c8b8a0", { s: 0.6, w: 1.1 }) + line("M11 0H14V-6", 2, INK),
  egg_sandwich: () => part("M-12 2L0 -10L12 2Z", "#f0c890", { s: 1.4 }) + part("M-11 3H11L9 7H-9Z", "#fff4d0", { s: 0.6, w: 1.1 }) + circle(0, 4, 3, "#f6c63c", { s: 0.6, w: 1 }) + part("M-12 7H12L10 12H-10Z", "#f0c890", { s: 1.2 }),
  forager_stew: () => part("M-12 -2H12C12 8 6 12 0 12C-6 12 -12 8 -12 -2Z", "#b07a5a", { s: 1.6 }) + fill(ellD(0, -2, 11, 3.4), "#c8744a") + circle(-4, -3, 2.2, "#f4ead8", { s: 0.4, w: 1 }) + leaf([3, -3], 200, 7, 2.4, "#7cc06a") + line("M-4 -8Q-2 -12 -4 -15M3 -8Q5 -12 3 -15", 1.1, "#fff", 0.7),
  lucky_lure: () => line("M0 -14V-8", 1.2, "#c8c0b0") + part(ellD(0, 1, 6, 9), "#f6c63c", { s: 1.4 }) + fill(ellD(0, -3, 3, 3), "#e8566a") + line("M-3 10Q0 15 4 11", 1.6, "#9fb4c4") + hi(-2, -4, 1.2, 1.2, 0.8),
  ...Object.fromEntries(Object.keys(ITEMS).filter((id) => ITEMS[id].src).map((id) => [id, () => jar(lite(CROPS[ITEMS[id].src].color, 0.1), CROPS[ITEMS[id].src].color)])),
  bait: () => part("M-9 -2C-9 -9 9 -9 9 -2C9 6 -9 6 -9 -2Z", "#b07a5a", { s: 1.6 }) + fill(ellD(-3, -4, 2, 1.2), "#e8b890", 0.8) + line("M-5 0Q0 3 5 0M-4 3Q0 5 4 3", 1, dark("#b07a5a", 0.35)) + circle(0, -10, 2.4, "#e8566a", { s: 0.6 }),
  hay: () => part(rrD(-11, -6, 22, 14, 4), "#e8c86a", { s: 1.8 }) + line("M-8 -3H8M-8 1H8M-8 5H8", 0.9, dark("#e8c86a", 0.3)) + fill(rrD(-2, -7, 4, 16, 1.2), "#b0603a") + hi(-6, -4, 3, 1, 0.6),
  wood: () => part(capD([-10, 5], [9, -3], 9, 9), WOOD, { s: 1.4 }) + oval(10, -3.5, 3.6, 4.3, "#e8c08a", { s: 0.6 }) + line("M9.5 -5.5Q12 -3.5 9.5 -1.5", 0.8, dark(WOOD, 0.2)) + part(capD([-9, 11], [7, 7], 7, 7), dark(WOOD, 0.08), { s: 1.2 }),
  stone: () => part("M-11 7C-12 0 -6 -6 0 -6C7 -7 12 -1 11 6C9 10 -9 11 -11 7Z", "#a9a1ab", { s: 2 }) + hi(-4, -2, 3, 1.4, 0.6) + line("M2 -2L4 3", 1, dark("#a9a1ab", 0.4)),
  fiber: () => leaf([0, 10], 160, 20, 4, "#8cc06a") + leaf([0, 10], 190, 18, 4, "#7ab05a") + leaf([0, 10], 215, 16, 4, "#9cd07a") + fill(rrD(-4, 4, 8, 3.4, 1.6), "#d8b06a"),

  turnip: () => cropIcon("turnip"),
  strawberry: () => cropIcon("strawberry"),
  tomato: () => cropIcon("tomato"),
  sunflower: () => cropIcon("sunflower"),
  pumpkin: () => cropIcon("pumpkin"),
  cranberry: () => cropIcon("cranberry"),
  moonbloom: () => cropIcon("moonbloom"),

  spring_onion: () => leaf([0, 2], 170, 18, 2.6, "#7ec06a") + leaf([0, 2], 195, 16, 2.6, "#6ab05a") + part("M-4 2C-5 8 5 8 4 2C3 0 -3 0 -4 2Z", "#f6f0f4", { s: 1 }) + line("M-1 8V11M1 8V11.5", 0.8, "#c8b8a8"),
  leek: () => leaf([0, 0], 165, 16, 3.4, "#5aa05a") + leaf([0, 0], 200, 15, 3.4, "#7cc06a") + part(rrD(-3, -1, 6, 13, 3), "#f4f6e8", { s: 1 }),
  salmonberry: () => berries("#f08a5a"),
  blackberry: () => berries("#4a2a5a"),
  mushroom: () => part(rrD(-3, -1, 6, 11, 2.5), "#f4ead8", { s: 1 }) + part("M-11 1C-11 -10 11 -10 11 1Z", "#c86a4a", { s: 1.6 }) + circle(-4, -4, 1.6, "#fff4e8", { s: 0, w: 0 }) + circle(4, -5, 1.3, "#fff4e8", { s: 0, w: 0 }),
  chanterelle: () => part("M-2 10L-3 -1L3 -1L2 10Z", "#f2b84a", { s: 1 }) + part("M-11 -2C-9 -9 9 -9 11 -2C6 -1 -6 -1 -11 -2Z", "#f6c85a", { s: 1.4 }) + hi(-3, -5, 2.5, 1, 0.6),
  holly: () => leaf([0, 2], 130, 13, 5, "#3f8a4a") + leaf([0, 2], 230, 13, 5, "#4a9a5a") + circle(-2, 2, 2.6, "#e03a4a", { s: 0.6 }) + circle(2.5, 3.5, 2.6, "#e03a4a", { s: 0.6 }) + circle(0, -1, 2.6, "#e8485a", { s: 0.6 }),
  snow_yam: () => part("M-11 4C-12 -4 -2 -9 6 -6C12 -4 12 4 7 7C1 10 -9 10 -11 4Z", "#c8a8d8", { s: 1.8 }) + fill(ellD(-3, -4, 4, 1.8), "#fff", 0.8) + hi(-6, 1, 1.5, 1, 0.5),
  star_shard: () => part(polyD([[0, -13], [3.5, -4], [13, -3], [5.5, 3], [8, 12], [0, 7], [-8, 12], [-5.5, 3], [-13, -3], [-3.5, -4]]), "#bfe0ff", { s: 1.8 }) + hi(-2, -3, 2.5, 1.5, 0.9),

  ...Object.fromEntries(Object.entries(FISH).map(([id, f]) => [id, () => fish(f.color, f.fin)])),

  bread: () => part("M-12 6C-13 -4 -6 -9 0 -9C6 -9 13 -4 12 6Z", "#e0a060", { s: 2 }) + line("M-6 -5L-3 -1M0 -7L3 -2M5 -5L8 -1", 1.2, dark("#e0a060", 0.35)) + hi(-5, -4, 2.5, 1.2, 0.55),
  lullaby_loaf: () => part("M-12 6C-13 -4 -6 -9 0 -9C6 -9 13 -4 12 6Z", "#c8a0d8", { s: 2 }) + part(polyD([[0, -6], [1.6, -2], [5.5, -1.6], [2.6, 1], [3.4, 5], [0, 3], [-3.4, 5], [-2.6, 1], [-5.5, -1.6], [-1.6, -2]]), "#fff2a8", { s: 0.6, w: 1 }),
};

function berries(c) {
  let m = leaf([0, 4], 150, 12, 4.6, "#6aa25a") + leaf([0, 4], 215, 12, 4.6, "#5a924a");
  for (const [x, y] of [[-4, 2], [4, 3], [0, -2], [0, 6]]) m += circle(x, y, 3.6, c, { s: 1, w: 1.2 }) + fill(ellD(x - 1, y - 1.2, 0.9, 0.9), "#fff", 0.7);
  return m;
}

/** Tied sack with a coloured band (fertilizers). */
function sack(c, band) {
  return part("M-10 12C-13 4 -11 -4 -6 -7L6 -7C11 -4 13 4 10 12Z", c, { s: 1.8 }) + fill(rrD(-10, 0, 20, 5, 1), band) + part("M-6 -7L-8 -12H8L6 -7Z", c, { s: 0.6, w: 1.2 }) + line("M-6 -8H6", 1.6, dark(c, 0.4)) + hi(-5, -3, 1.4, 2.4, 0.5);
}

/** Small preserves jar with a cloth lid. */
function jar(fill1, cloth) {
  return part(rrD(-9, -7, 18, 19, 5), fill1, { s: 1.6 }) + hi(-5, -2, 1.4, 3, 0.6) + part("M-11 -8C-6 -13 6 -13 11 -8L8 -5H-8Z", cloth, { s: 0.6, w: 1.2 }) + line("M-8 -6H8", 1.2, dark(cloth, 0.35));
}

function fish(c, fin) {
  return (
    part("M-13 -5L-8 0L-13 5Z", fin, { s: 0.6, w: 1.2 }) +
    part("M-9 0C-6 -8 7 -9 12 -1C8 6 -5 8 -9 0Z", c, { s: 1.8 }) +
    part("M-1 -6L3 -10L5 -5Z", fin, { s: 0.4, w: 1 }) + fill(ellD(7, -2.2, 1.3, 1.3), INK) + hi(-2, -3, 3, 1.2, 0.5)
  );
}

function cropIcon(id) {
  const d = CROPS[id];
  const c = d.color;
  const g = d.accent;
  if (id === "turnip") return leaf([0, -4], 160, 12, 4, g) + leaf([0, -4], 200, 12, 4, g) + part("M-9 1C-9 -7 9 -7 9 1C9 6 3 10 0 12C-3 10 -9 6 -9 1Z", c, { s: 1.6 }) + fill("M-8.6 -2C-7 -6.5 7 -6.5 8.6 -2C4 -3.5 -4 -3.5 -8.6 -2Z", "#b06ac0") + hi(-4, 2, 1.6, 2.2, 0.7);
  if (id === "strawberry") return part("M-10 -3C-10 -10 10 -10 10 -3C10 4 3 11 0 12C-3 11 -10 4 -10 -3Z", c, { s: 1.8 }) + fill(polyD([[-6, -8], [0, -12], [6, -8], [0, -6]]), g) + fill(ellD(-4, -1, 0.8, 0.8), "#ffe8a0") + fill(ellD(3, 2, 0.8, 0.8), "#ffe8a0") + fill(ellD(0, 6, 0.8, 0.8), "#ffe8a0") + hi(-5, -3, 1.4, 2, 0.6);
  if (id === "tomato") return circle(0, 1, 10, c, { s: 2 }) + fill(polyD([[-5, -8], [0, -11], [5, -8], [2, -7], [0, -9], [-2, -7]]), g) + hi(-4, -3, 2.6, 1.8, 0.7);
  if (id === "sunflower") {
    let p = "";
    for (let i = 0; i < 10; i++) p += part(leafD([0, 0], i * 36, 12, 4), c, { s: 0.6, w: 1.1 });
    return p + circle(0, 0, 6, "#7a4a2a", { s: 1 }) + fill(ellD(-2, -2, 1.8, 1.4), "#a86a3a");
  }
  if (id === "moonbloom") {
    let p = "";
    for (let i = 0; i < 5; i++) p += part(leafD([0, 0], i * 72, 12, 6), c, { s: 1, w: 1.2 });
    return p + circle(0, 0, 4, "#f6d86a", { s: 0.8 }) + hi(-4, -5, 2, 1.2, 0.8);
  }
  if (id === "pumpkin") return part(ellD(0, 2, 13, 10), c, { s: 2 }) + line("M-5 -7Q-8 2 -5 11M5 -7Q8 2 5 11M0 -8V12", 1.1, dark(c, 0.35)) + line("M0 -8Q1 -12 4 -13", 3.4, INK) + line("M0 -8Q1 -12 4 -13", 2, "#6a8a3a") + hi(-7, -2, 2, 2.8, 0.55);
  let m = "";
  for (const [x, y] of [[-5, 2], [4, 4], [0, -3], [-1, 7], [6, -3], [-6, -5]]) m += circle(x, y, 3.8, c, { s: 1, w: 1.2 }) + fill(ellD(x - 1, y - 1.2, 1, 1), "#fff", 0.7);
  return m;
}

/** Seed packet: paper sleeve with a band in the crop's leaf colour and its fruit. */
function packet(cropId) {
  const d = CROPS[cropId];
  return (
    part(rrD(-10, -13, 20, 26, 3), "#f6ead2", { s: 1.6 }) +
    part(rrD(-10, -5, 20, 12, 0), d.accent, { s: 0, w: 0 }) +
    circle(0, 1, 5, d.color, { s: 1, w: 1.2 }) + fill(ellD(-1.6, -0.6, 1.4, 1.2), "#fff", 0.7) +
    line("M-10 -9H10", 1.2, INK) + line("M-5 10H5", 1.2, dark("#f6ead2", 0.4))
  );
}

export function iconSprite(id) {
  let m;
  if (id.endsWith("_seed")) m = packet(id.slice(0, -5));
  else m = (DRAW[id] ?? DRAW.stone)();
  return sprite(BOX, [outlined(m)]);
}

export const iconSvg = (id, cls = "icon") => toSvg(iconSprite(id), cls);
