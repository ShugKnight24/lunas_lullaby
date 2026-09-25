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

  rusty_sword: () => part("M-4 4L8 -11L12 -12L11 -8L-4 4Z", "#b8aaa0", { s: 1, lo: dark("#b8aaa0", 0.25) }) + part(capD([-8, 1], [-1, 8], 3.4, 3.4), "#8a7a70", { s: 0.6, w: 1.2 }) + part(capD([-5, 5], [-10, 10], 3.2, 3.2), WOOD, { s: 0.6, w: 1.2 }) + circle(-11, 11, 2.2, "#8a7a70", { s: 0.4, w: 1.1 }) + fill(ellD(3, -3, 1.4, 1), "#b8683a", 0.9) + fill(ellD(7, -7.5, 1, 0.8), "#b8683a", 0.9) + fill(ellD(0.5, 0, 0.9, 0.7), "#c87a4a", 0.8),
  steel_sword: () => part("M-4 4L8 -11L12 -12L11 -8L-4 4Z", "#dfe8ef", { s: 1, lo: dark("#dfe8ef", 0.25) }) + part(capD([-8, 1], [-1, 8], 3.4, 3.4), "#9fb4c4", { s: 0.6, w: 1.2 }) + part(capD([-5, 5], [-10, 10], 3.2, 3.2), "#6a4a3a", { s: 0.6, w: 1.2 }) + circle(-11, 11, 2.2, "#9fb4c4", { s: 0.4, w: 1.1 }) + line("M-1 1L9 -9", 0.9, "#fff", 0.8),
  moon_blade: () => part("M-4 4L8 -11L12 -12L11 -8L-4 4Z", "#c8dcff", { s: 1, lo: dark("#c8dcff", 0.25) }) + part(capD([-8, 1], [-1, 8], 3.4, 3.4), "#f2c24a", { s: 0.6, w: 1.2 }) + part(capD([-5, 5], [-10, 10], 3.2, 3.2), "#4a3a6a", { s: 0.6, w: 1.2 }) + circle(-11, 11, 2.2, "#f2c24a", { s: 0.4, w: 1.1 }) + line("M-1 1L9 -9", 0.9, "#fff", 0.9) + part("M-11 0C-13 -4 -9 -9 -5 -8C-8 -6 -9 -3 -8 0Z", "#fff0a8", { s: 0.4, w: 1 }),
  slime_gel: () => part("M-10 8C-12 2 -8 -8 0 -9C8 -8 12 2 10 8C6 11 -6 11 -10 8Z", "#7cc86a", { s: 2, lo: dark("#7cc86a", 0.3) }) + fill(ellD(0, 5, 6, 2.4), lite("#7cc86a", 0.3), 0.8) + hi(-4, -3, 2.6, 1.6, 0.85) + hi(-1, -6, 0.9, 0.9, 0.85),
  boar_tusk: () => part("M-10 10C-8 0 0 -8 10 -12C6 -6 2 0 -4 12Z", "#f6ecd8", { s: 1.6 }) + line("M-7 6L-3 7M-4 1L0 3M0 -4L3 -2", 0.9, dark("#f6ecd8", 0.3), 0.8) + part(rrD(-12, 8, 9, 5, 2), "#8a5a4a", { s: 0.6, w: 1.1 }),
  spore_cap: () => part(rrD(-3, 0, 6, 10, 2.5), "#f4e6d0", { s: 1 }) + part("M-12 2C-12 -10 12 -10 12 2C6 4 -6 4 -12 2Z", "#c0583a", { s: 1.6 }) + fill(ellD(-5, -3, 2, 1.7), "#fff4e4") + fill(ellD(3, -5, 2.2, 1.8), "#fff4e4") + fill(ellD(7, -1, 1.3, 1.1), "#fff4e4") + circle(-10, -11, 1.8, "#d8e86a", { s: 0.4, w: 0.9 }) + circle(9, -12, 1.4, "#d8e86a", { s: 0.4, w: 0.9 }),
  wisp_essence: () => part(rrD(-7, -4, 14, 16, 5), "#e4ecf4", { s: 1.2 }) + part("M-5 9C-6 3 -3 0 0 -3C3 0 6 3 5 9Z", "#8a6ac8", { s: 1, w: 1 }) + fill(ellD(0, 6, 2, 2.4), "#f0e4ff") + part(rrD(-4, -9, 8, 6, 1.5), "#9a6a48", { s: 0.6, w: 1.1 }) + hi(-4, 1, 1, 3, 0.7),
  gloom_heart: () => part("M0 12C-6 7 -12 2 -12 -4C-12 -9 -8 -12 -4 -12C-2 -12 -1 -11 0 -9C1 -11 2 -12 4 -12C8 -12 12 -9 12 -4C12 2 6 7 0 12Z", "#6a44b0", { s: 2, lo: "#3e2670" }) + fill(polyD([[0, -6], [4, -1], [0, 6], [-4, -1]]), "#c8a0ff", 0.85) + fill(polyD([[0, -3], [1.6, -1], [0, 2], [-1.4, -1]]), "#f4e8ff") + hi(-6, -7, 2.4, 1.4, 0.6),
  amber: () => part(polyD([[-10, 2], [-6, -9], [4, -11], [11, -3], [8, 9], [-4, 11]]), "#f0a040", { s: 2 }) + fill(polyD([[-6, -9], [4, -11], [2, -3], [-4, -2]]), lite("#f0a040", 0.4), 0.85) + line("M-4 -2L2 -3L8 9M2 -3L11 -3M-4 -2L-10 2M-4 -2L-4 11", 0.9, dark("#f0a040", 0.3), 0.8) + hi(-2, -7, 1.6, 1, 0.8),
  moonstone: () => part("M-9 6C-11 -2 -6 -10 1 -10C8 -10 11 -2 9 6C6 11 -6 11 -9 6Z", "#c8e4ff", { s: 1.8 }) + fill(ellD(2, 1, 4, 5), "#eef8ff", 0.8) + fill(ellD(-2, -2, 2.4, 3), "#e0d0ff", 0.6) + hi(-4, -5, 2.2, 1.4, 0.9),
  iron_ore: () => part("M-11 7C-12 0 -6 -8 1 -8C8 -9 12 -2 11 6C8 10 -8 11 -11 7Z", "#8e8a94", { s: 2 }) + fill(ellD(-5, 1, 2, 1.5), "#b8683a") + fill(ellD(4, -3, 1.6, 1.2), "#b8683a") + fill(ellD(5, 4, 2.2, 1.4), "#b8683a") + fill(ellD(-1, -4, 2.6, 1), "#e8eef4", 0.8) + hi(-5, -3, 2, 1, 0.5),
  silverleaf: () => leaf([-8, 11], 150, 22, 6, "#c8dcd4") + line("M-8 11Q0 0 5 -8", 1, dark("#c8dcd4", 0.35), 0.8) + hi(-3, -1, 1.4, 3, 0.8) + fill(ellD(4, -6, 1, 1), "#fff"),
  ironwood: () => part(capD([-10, 5], [9, -3], 9, 9), "#6a5a58", { s: 1.4 }) + oval(10, -3.5, 3.6, 4.3, "#a89890", { s: 0.6 }) + line("M9.5 -5.5Q12 -3.5 9.5 -1.5", 0.8, "#4a3a3a") + part(capD([-9, 11], [7, 7], 7, 7), "#5a4a4a", { s: 1.2 }) + line("M-6 2L4 -2", 0.8, "#9a9aa8", 0.8),
  pet_treat: () => part("M-6 -3H6C6 -8 12 -9 12 -4C14 -3 14 3 12 4C12 9 6 8 6 3H-6C-6 8 -12 9 -12 4C-14 3 -14 -3 -12 -4C-12 -9 -6 -8 -6 -3Z", "#d8a060", { s: 1.6 }) + fill(ellD(-2, 0, 0.8, 0.8), dark("#d8a060", 0.35)) + fill(ellD(2, -1, 0.8, 0.8), dark("#d8a060", 0.35)) + hi(-8, -4, 1.6, 1, 0.5),
  trail_jerky: () => part("M-12 6C-8 2 -9 -4 -4 -6C0 -8 2 -10 6 -11C10 -11 12 -8 10 -5C6 -3 6 2 1 4C-2 6 -5 11 -10 10Z", "#a8483a", { s: 1.6 }) + line("M-8 5Q-4 0 0 -2M-2 3Q2 -2 6 -6", 0.9, lite("#a8483a", 0.35), 0.8),
  milk: () => part("M-6 -6C-6 -9 -4 -10 -4 -12H4C4 -10 6 -9 6 -6V10C6 12 -6 12 -6 10Z", "#f8f6f2", { s: 1.6 }) + part(rrD(-4.6, -14, 9.2, 4, 1.4), "#6aa8d8", { s: 0.4, w: 1.1 }) + fill(rrD(-6, 0, 12, 5, 1), "#9ac8e8") + hi(-3.5, -4, 1, 2.6, 0.8),
  wool: () => [[-5, 4, 6], [5, 4, 6], [-6, -3, 5.5], [5, -3, 5.5], [0, -6, 6], [0, 2, 7]].map(([x, y, r]) => circle(x, y, r, "#f6ecd8", { s: 1.2, lo: dark("#f6ecd8", 0.2) })).join("") + fill(ellD(-2, -6, 3, 2), "#fffaf0", 0.9) + line("M-4 4q2 -2 4 0M2 6q2 -2 4 0", 0.9, dark("#f6ecd8", 0.3)),
  apple: () => part("M0 -6C-3 -9 -11 -8 -11 1C-11 9 -5 12 0 10C5 12 11 9 11 1C11 -8 3 -9 0 -6Z", "#e0403a", { s: 2 }) + line("M0 -6Q0 -10 2 -12", 1.6, "#6a4a3a") + leaf([1, -9], 145, 8, 2.6, "#7cc06a") + hi(-5, -2, 1.8, 2.8, 0.7),
  honey: () => jar("#f2b43a", "#f6e6c8") + part(rrD(-5, -1, 10, 8, 1.5), "#fff4d8", { s: 0, w: 1 }) + part(polyD([[0, 0.5], [2.6, 2], [2.6, 5], [0, 6.5], [-2.6, 5], [-2.6, 2]]), "#f6c63c", { s: 0, w: 0.9 }) + fill("M-7 -5C-7 -2 -5 -2 -5 -5Z", "#f2b43a"),
  cheese: () => part("M-12 8V-1L8 -9L12 -1V8Z", "#f6d25a", { s: 1.8 }) + part("M-12 -1L8 -9L12 -1Z", lite("#f6d25a", 0.3), { s: 0, w: 1.3 }) + fill(ellD(-6, 3, 1.8, 1.6), "#d8a830") + fill(ellD(3, 4.5, 1.4, 1.2), "#d8a830") + fill(ellD(7, 1, 1, 1), "#d8a830"),
  healing_salve: () => part("M-4 -6V-8H4V-6C9 -4 11 0 11 4C11 10 6 12 0 12C-6 12 -11 10 -11 4C-11 0 -9 -4 -4 -6Z", "#e4f0ec", { s: 1.4 }) + part("M-10 3C-8 5 8 5 10 3C10 9 6 11 0 11C-6 11 -10 9 -10 3Z", "#6ac870", { s: 0, w: 0 }) + part(rrD(-4, -13, 8, 6, 2), "#b07a4a", { s: 0.6, w: 1.1 }) + part("M-1.2 -1H1.2V1.4H3.6V3.8H1.2V6.2H-1.2V3.8H-3.6V1.4H-1.2Z", "#fff", { s: 0, w: 0 }) + hi(-6, -1, 1.4, 2.4, 0.7),
  guild_badge: () => part("M-6 4L-9 14L-4 11L-2 15L0 5ZM6 4L9 14L4 11L2 15L0 5Z", "#5a7ab8", { s: 0.6, w: 1.1 }) + circle(0, -2, 10, "#c8844a", { s: 1.8, lo: "#8a5030" }) + part(polyD([[0, -9], [2, -4.4], [7, -4], [3.2, -0.6], [4.4, 4.4], [0, 1.8], [-4.4, 4.4], [-3.2, -0.6], [-7, -4], [-2, -4.4]]), "#e8a860", { s: 0.6, w: 1 }) + hi(-5, -7, 1.8, 1.2, 0.6),

  bronze_sword: () => part("M-4 4L8 -11L12 -12L11 -8L-4 4Z", "#f0a850", { s: 1, lo: "#c8743a" }) + part(capD([-8, 1], [-1, 8], 3.4, 3.4), "#b8783a", { s: 0.6, w: 1.2 }) + part(capD([-5, 5], [-10, 10], 3.2, 3.2), "#6a4a3a", { s: 0.6, w: 1.2 }) + circle(-11, 11, 2.2, "#b8783a", { s: 0.4, w: 1.1 }) + line("M-1 1L9 -9", 0.9, "#fff4d8", 0.8),
  ironwood_blade: () => part("M-4 4L8 -11L12 -12L11 -8L-4 4Z", "#3e5a5c", { s: 1, lo: "#26383c" }) + line("M-1.5 1.5L8.5 -8.5", 1.4, "#f0a040") + fill(ellD(3.5, -3.5, 1.3, 1.3), "#ffd070") + part(capD([-8, 1], [-1, 8], 3.4, 3.4), "#f0a040", { s: 0.6, w: 1.2 }) + part(capD([-5, 5], [-10, 10], 3.2, 3.2), "#2e3a3a", { s: 0.6, w: 1.2 }) + circle(-11, 11, 2.2, "#f0a040", { s: 0.4, w: 1.1 }),

  leather_cap: () => part("M-11 4C-11 -10 11 -10 11 4Z", "#a8703a", { s: 1.8 }) + line("M0 -7V3M-6 -4Q-5 0 -5 3M6 -4Q5 0 5 3", 0.9, lite("#a8703a", 0.35), 0.9) + part(rrD(-13, 2, 26, 5.6, 2.8), "#8a5530", { s: 0.8, w: 1.3 }) + circle(0, -8.4, 1.8, "#6a4a3a", { s: 0.4, w: 1 }) + hi(-5, -3, 1.6, 2.4, 0.5),
  iron_helm: () => part("M-11 7C-12 -9 12 -9 11 7Z", "#aab4bc", { s: 1.8, lo: dark("#aab4bc", 0.35) }) + line("M0 -9V2", 2.2, lite("#aab4bc", 0.45)) + part(rrD(-12, 1, 24, 5, 2), "#8a949e", { s: 0.6, w: 1.2 }) + part(rrD(-1.8, 1, 3.6, 9, 1.6), "#8a949e", { s: 0.6, w: 1.2 }) + fill(ellD(-8, 3.5, 0.9, 0.9), "#5a6068") + fill(ellD(8, 3.5, 0.9, 0.9), "#5a6068") + hi(-5, -3, 1.6, 2.6, 0.7),
  warden_hood: () => part("M-11 12C-13 2 -10 -8 -2 -13C-1 -9 4 -10 7 -8C12 -4 13 4 11 12Z", "#3f7a4a", { s: 1.8, lo: "#2a5238" }) + part(ellD(0, 4, 6.4, 7), "#4a3040", { s: 0, w: 1.2 }) + fill(ellD(0, 6, 4.6, 4.4), "#f0c8a0", 0.9) + leaf([0, 12], 150, 7, 3, "#c8d86a") + leaf([0, 12], 210, 7, 3, "#a8c85a") + hi(-6, -4, 1.6, 2.6, 0.45),

  padded_vest: () => part("M-8 -12L-3 -12L0 -4L3 -12L8 -12L12 -6L11 12H-11L-12 -6Z", "#ecdab0", { s: 1.8 }) + line("M-10 -1H-2M2 -1H10M-11 5H-2M2 5H11M-6 -8V11M6 -8V11", 0.9, dark("#ecdab0", 0.3), 0.9) + line("M0 -4V12", 1.2, INK) + circle(-1.9, 1.5, 1, "#b07a4a", { s: 0, w: 0.8 }) + circle(-1.9, 7.5, 1, "#b07a4a", { s: 0, w: 0.8 }) + hi(-8, -6, 1.2, 2.4, 0.6),
  thornback_armor: () => part("M-12 -7C-8 -12 -4 -11 0 -6C4 -11 8 -12 12 -7L10 11C4 13 -4 13 -10 11Z", "#8a5a3a", { s: 1.8 }) + line("M-8 -4Q0 0 8 -4M-7 3Q0 6 7 3", 1, lite("#8a5a3a", 0.35), 0.9) + line("M0 -3V11", 0.9, dark("#8a5a3a", 0.35)) + part(capD([-10, 6], [10, 6], 3.6, 3.6), "#5a3a2a", { s: 0.4, w: 1.1 }) + part(rrD(-2.6, 3.6, 5.2, 4.8, 1.2), "#f6ecd8", { s: 0.4, w: 1 }) + [[-12, -5, -14, -15, -5, -10], [12, -5, 14, -15, 5, -10]].map(([ax, ay, tx, ty, bx, by]) => part(`M${ax} ${ay}Q${(ax + tx) / 2 - 1} ${(ay + ty) / 2} ${tx} ${ty}Q${(bx + tx) / 2} ${(by + ty) / 2 + 1} ${bx} ${by}Z`, "#f6ecd8", { s: 0.5, w: 1 })).join("") + hi(-6, -5, 1.8, 1.2, 0.45),
  ironwood_mail: () => part("M-8 -12H8L13 -7L11 -1L9 -2V12H-9V-2L-11 -1L-13 -7Z", "#4f6a6c", { s: 1.8, lo: "#324648" }) + line("M-9 -2H9M-9 3H9M-9 8H9M-4 -7V-2M4 -7V-2M0 -2V3M-5 3V8M5 3V8M0 8V12", 1, "#2a3a3c", 0.9) + line("M-8 -1H8M-8 4H8M-8 9H8", 0.8, lite("#4f6a6c", 0.35), 0.8) + fill(ellD(0, -12, 3.6, 2.2), INK) + circle(0, -7, 1.6, "#f0a040", { s: 0.4, w: 0.9 }),

  sturdy_boots: () => boot("#9a6038", "#c8905a", "#4a3a3a"),
  swift_boots: () => part("M-7 -8C-13 -11 -16 -6 -14 -4C-16 -2 -14 1 -11 0C-12 3 -9 4 -7 1Z", "#fff", { s: 0.6, w: 1.1 }) + boot("#aab8f0", "#e0e8ff", "#6a6aa8") + line("M6 -8Q10 -10 9 -13Q12 -12 11 -8", 1, "#b89aff", 0.9),

  slime_charm: () => cord() + circle(0, -6, 1.8, "#f2c24a", { s: 0.4, w: 1 }) + part("M0 -4C4 1 9 4 9 8C9 12 5 14 0 14C-5 14 -9 12 -9 8C-9 4 -4 1 0 -4Z", "#7cc86a", { s: 1.8, lo: dark("#7cc86a", 0.3) }) + fill(ellD(-2.6, 8.4, 0.9, 1.3), INK) + fill(ellD(2.6, 8.4, 0.9, 1.3), INK) + hi(-4.5, 4.5, 1.6, 1.2, 0.85),
  tusk_pendant: () => cord() + part("M-6 -3C-9 6 -2 13 9 11C2 8 -1 3 -1 -3Z", "#f6ecd8", { s: 1.4 }) + line("M-5 4L-2 3M-3 8L0 6", 0.8, dark("#f6ecd8", 0.3), 0.8) + part(rrD(-7, -6, 7, 4, 1.4), "#8a5a4a", { s: 0.5, w: 1.1 }) + hi(-5, 2, 0.8, 1.8, 0.7),
  wisp_lantern: () => line("M-4 -10Q0 -16 4 -10", 1.6, INK) + part("M-6 -7L-4 -11H4L6 -7Z", "#c8944a", { s: 0.6, w: 1.2 }) + part(rrD(-7, -7, 14, 14, 3), "#ece6f8", { s: 1 }) + part("M-4 5C-5 0 -2 -2 0 -5C2 -2 5 0 4 5Z", "#8a6ac8", { s: 0.8, w: 1 }) + fill(ellD(0, 2.6, 1.8, 2.2), "#f0e4ff") + line("M-3 -7V7M3 -7V7", 0.9, dark("#c8944a", 0.3), 0.6) + part(rrD(-8, 6, 16, 4.4, 1.6), "#c8944a", { s: 0.6, w: 1.2 }) + fill(ellD(-10, -3, 1, 1), "#b89aff") + fill(ellD(10, 1, 0.8, 0.8), "#b89aff") + hi(-5, -3, 0.9, 2.4, 0.8),
  moon_amulet: () => cord() + circle(2.4, -5.6, 1.6, "#c8d0dc", { s: 0.4, w: 1 }) + part("M3 -4.5A9 9 0 1 0 3 12.5A9.5 9.5 0 0 1 3 -4.5Z", "#dfe6ee", { s: 1.4, lo: dark("#dfe6ee", 0.3) }) + circle(-5.6, 4, 2.6, "#a8d8ff", { s: 0.6, w: 1 }) + fill(ellD(-6.3, 3.2, 0.9, 0.8), "#fff", 0.9) + fill(polyD([[8, -1], [8.8, 1.2], [11, 2], [8.8, 2.8], [8, 5], [7.2, 2.8], [5, 2], [7.2, 1.2]]), "#fff0a8"),

  squeaky_ball: () => circle(0, 0, 11, "#d4e64a", { s: 2, lo: "#a8b83a" }) + seam("M-5 -10Q3 0 -5 10") + seam("M5 -10Q-3 0 5 10") + hi(-6, -5, 2.2, 1.4, 0.7),
  farm_breakfast: () =>
    part(ellD(0, 3, 14, 9), "#f4f0ea", { s: 1.4, lo: "#c8c0d0" }) + fill(ellD(0, 2, 10.5, 6.2), "#fffaf2") +
    part(rrD(-12, -8, 11, 11, 3), "#c8844a", { s: 1 }) + fill(rrD(-10.4, -6.4, 7.8, 7.8, 2), "#f4d49a") +
    part("M1 -4C2 -8 8 -9 11 -5C13 -2 10 3 6 2C3 4 -1 0 1 -4Z", "#fffdf6", { s: 0.8, lo: "#e0d8e0" }) + circle(6, -2.6, 2.6, "#f6b02c", { s: 0.6, w: 1.1 }) + fill(ellD(5.2, -3.4, 0.8, 0.7), "#fff", 0.8) +
    part(capD([-7, 7], [4, 8.5], 4.6, 4.6), "#b8584a", { s: 0.8 }) + line("M-4 6.2L-3 7.8M0 6.6L1 8.2", 0.8, dark("#b8584a", 0.35)) + hi(-4, 6, 2, 0.7, 0.55),
  spicy_stirfry: () =>
    line("M-2 -4L11 -15M1 -3L14 -12", 3.4, INK) + line("M-2 -4L11 -15M1 -3L14 -12", 1.8, "#c8904a") +
    part("M-12 -1H12C12 8 6 12 0 12C-6 12 -12 8 -12 -1Z", "#f4f0f4", { s: 1.6 }) + fill("M-11.6 2.4H11.6C11.2 4 10.6 5 10 6H-10C-10.6 5 -11.2 4 -11.6 2.4Z", "#6a8ad8") +
    fill(ellD(0, -1, 11, 3.2), "#e0582a") + fill(ellD(-3, -2, 5, 1.4), "#f0843a") +
    part("M-9 -2C-7 -6 -2 -6 1 -3C-2 -3 -6 -3 -9 -2Z", "#e8303a", { s: 0.4, w: 1 }) + line("M1 -3L3 -4.6", 1.4, "#5a9a4a") +
    circle(4, -1.4, 1.4, "#7cc06a", { s: 0, w: 0.9 }) + circle(7.5, -0.6, 1.2, "#f6c63c", { s: 0, w: 0.9 }) + circle(-4, 0.2, 1.2, "#7cc06a", { s: 0, w: 0.9 }) + hi(-8, 5, 1, 2, 0.5),
  fisher_chowder: () =>
    part("M-12 -1H12C12 8 6 12 0 12C-6 12 -12 8 -12 -1Z", "#6aa8c8", { s: 1.6 }) + line("M-10 5Q0 8 10 5", 1, lite("#6aa8c8", 0.4), 0.8) +
    fill(ellD(0, -1, 11, 3.2), "#f6ecd0") +
    part("M3 -1C4 -4 5 -6 5 -8L1 -12C4 -12.4 6 -11.4 7 -9.6C8 -11.6 10 -13.4 13 -12.6L9.4 -7.6C9.4 -5 8.6 -3 8 -1Z", "#8ab0c8", { s: 0.8, w: 1.2 }) + line("M5 -8L7 -9.6L9.4 -7.6", 0.8, dark("#8ab0c8", 0.3), 0.8) +
    part(rrD(-8, -2.6, 3, 2.6, 0.8), "#f6d88a", { s: 0, w: 0.9 }) + part(rrD(-3, -1.2, 2.6, 2.2, 0.8), "#f08a4a", { s: 0, w: 0.9 }) +
    fill(ellD(-4.5, -3, 0.9, 0.7), "#7cc06a") + fill(ellD(0.5, -3.4, 0.8, 0.6), "#7cc06a") + fill(ellD(-9, 0, 0.8, 0.6), "#7cc06a") + hi(-8, 4, 1, 2, 0.5),
  honey_apple: () =>
    part(capD([0, 4], [0, 15], 2.8, 2.6), "#e8cc98", { s: 0.6, w: 1.2 }) +
    part("M0 -9C-3 -12 -11 -11 -11 -2C-11 6 -5 9 0 7C5 9 11 6 11 -2C11 -11 3 -12 0 -9Z", "#d8303a", { s: 2 }) +
    part("M-10.6 -6C-10 -11 -4 -12 0 -9C4 -12 10 -11 10.6 -6C10.4 -4 9 -4 8.6 -2C8.2 0.4 6.2 0.4 6 -2.6C5 -4 3 -3.4 2.2 -3.2C2 0 -0.6 0.4 -0.8 -3C-2 -4 -4 -3.4 -5 -3.8C-5.4 -0.8 -7.6 -0.8 -7.6 -4C-8.6 -4.8 -10 -4.6 -10.6 -6Z", "#f6b83c", { s: 0.8, w: 1.1, lo: "#e0902a" }) +
    line("M0 -9Q0 -13 2 -14.5", 1.6, "#6a4a3a") + hi(-5, -8, 2.2, 1, 0.8) + hi(-6, 1, 1, 2, 0.5) + fill(ellD(6.2, 3.4, 1, 1.3), "#f6b83c"),
  stuffed_pumpkin: () =>
    line("M-4 -10Q-2 -13 -4 -16M3 -10Q5 -13 3 -16", 1.1, "#fff", 0.8) +
    part(ellD(0, 4, 12.5, 8.5), "#f08a3a", { s: 2 }) + line("M-6 -3Q-9 4 -6 12M6 -3Q9 4 6 12", 1.1, dark("#f08a3a", 0.35)) +
    fill(ellD(0, -2.4, 7.6, 2.8), dark("#f08a3a", 0.45)) +
    part("M-7 -2.6C-7 -8.6 7 -8.6 7 -2.6C3 -1.4 -3 -1.4 -7 -2.6Z", "#d8a860", { s: 0.8, w: 1.1 }) +
    fill(ellD(-3, -5, 1, 0.8), "#7cc06a") + fill(ellD(2, -6, 1, 0.8), "#e8566a") + fill(ellD(4, -4, 0.9, 0.7), "#7cc06a") + fill(ellD(-0.5, -3.4, 0.9, 0.7), "#8a5a3a") +
    hi(-7, 2, 1.6, 2.4, 0.5),
  moonbloom_tea: () =>
    line("M-4 -9Q-2 -12 -4 -15M2 -9Q4 -12 2 -15", 1.1, "#fff", 0.8) +
    part(ellD(-1, 10, 13, 2.8), "#c8b8e8", { s: 0.6, w: 1.2 }) +
    line("M7 -2C13 -3 13 5 6 5", 3.6, INK) + line("M7 -2C13 -3 13 5 6 5", 1.8, "#f4f0f8") +
    part("M-10 -4H8C8 5 4 10 -1 10C-6 10 -10 5 -10 -4Z", "#f4f0f8", { s: 1.4, lo: "#c8c0dc" }) + line("M-9 1Q-1 3 7.4 1", 1, "#9a8ad0", 0.7) +
    part(ellD(-1, -4, 9, 2.2), "#8cc8ec", { s: 0, w: 1.2 }) + part(leafD([-2, -4.2], 115, 6.4, 3.4), "#e4dcff", { s: 0.8, w: 1, lo: "#a898e0" }) + part(leafD([-2, -4.2], 250, 5.4, 3), "#e4dcff", { s: 0.8, w: 1, lo: "#a898e0" }) + fill(ellD(-2, -4.2, 1, 0.8), "#f6d86a") + hi(-7, 2, 1, 2.2, 0.6),
  strawberry_cake: () =>
    part("M-12 -1L12 -4V9L-12 12Z", "#f2c67a", { s: 1.2 }) + fill("M-12 3.4L12 0.6V3.6L-12 6.6Z", "#fff6ee") +
    fill(ellD(-6, 4.6, 1.6, 1.1), "#e8475a") + fill(ellD(0, 3.9, 1.6, 1.1), "#e8475a") + fill(ellD(6, 3.2, 1.6, 1.1), "#e8475a") +
    part("M-12 -1L6 -9L12 -4Z", "#fff6ee", { s: 0.6, lo: "#e8d8d8" }) +
    part(ellD(5, -7, 4.6, 2.6), "#ffffff", { s: 0.4, lo: "#e8e0e8", w: 1.1 }) +
    part("M2 -12C2 -16 8 -16 8 -12C8 -9 6 -7 5 -7C4 -7 2 -9 2 -12Z", "#e8475a", { s: 0.8, w: 1.1 }) + fill(polyD([[2.6, -14.4], [5, -16.6], [7.4, -14.4], [5, -13.6]]), "#7cc06a") + fill(ellD(3.6, -11.6, 0.6, 0.6), "#ffe8a0") + fill(ellD(6, -10.8, 0.6, 0.6), "#ffe8a0") +
    hi(-7, 8, 2.6, 0.8, 0.4),
};

/** White tennis-ball seam with an ink edge. */
function seam(d) {
  return line(d, 3.2, INK) + line(d, 1.8, "#fffdf2");
}

/** Single boot with a turned cuff and sole (feet equipment). */
function boot(c, cuff, sole) {
  return part("M-7 -10H3V1C8 1 12 3 12 7V10H-7Z", c, { s: 1.8 }) + line("M-2 -5H2M-2 -1H2", 1, dark(c, 0.35)) + part(rrD(-9, -13, 14, 4.6, 2), cuff, { s: 0.6, w: 1.2 }) + part(rrD(-9, 9, 23, 4, 1.8), sole, { s: 0.4, w: 1.2 }) + hi(-4, 0, 1.2, 3, 0.55) + hi(7, 4, 1.2, 0.8, 0.5);
}

/** Neck cord for charms: two strands meeting above the pendant. */
function cord() {
  return line("M-10 -15Q-5 -6 0 -6Q5 -6 10 -15", 2.8, INK) + line("M-10 -15Q-5 -6 0 -6Q5 -6 10 -15", 1.4, "#a8784a");
}

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
