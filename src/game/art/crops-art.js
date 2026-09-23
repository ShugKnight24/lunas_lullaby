/**
 * Crop sprites per visual stage (0 seed, 1 sprout, 2 young, 3 grown, 4 ripe,
 * "dead") and the tilled / watered soil tiles. Crop origin sits at the tile
 * centre, 8 units above its bottom edge; drawn 1.35× the leaf units below.
 */

import { part, circle, hi, fill, line, ellD, rrD, polyD, polar, outlined, sprite, lite, dark, INK } from "./cozy-kit.js";

const BOX = [-32, -86, 64, 96];
const SCALE = 1.35;

/** Leaf from `base` pointing `deg` (polar convention, 180 = up). */
export function leafD(base, deg, len, w) {
  const tip = polar(base, deg, len);
  const m1 = polar(base, deg + 90, w);
  const m2 = polar(base, deg - 90, w);
  const c1 = [(base[0] + tip[0]) / 2 + (m1[0] - base[0]), (base[1] + tip[1]) / 2 + (m1[1] - base[1])];
  const c2 = [(base[0] + tip[0]) / 2 + (m2[0] - base[0]), (base[1] + tip[1]) / 2 + (m2[1] - base[1])];
  return `M${base[0].toFixed(1)} ${base[1].toFixed(1)}Q${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)}Q${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${base[0].toFixed(1)} ${base[1].toFixed(1)}Z`;
}
const leaf = (base, deg, len, w, c) => part(leafD(base, deg, len, w), c, { s: 1, w: 1.2 });
const stem = (d, c = "#5f9a4a", w = 2.2) => line(d, w + 2, INK) + line(d, w, c);

const mound = () => part("M-9 0C-9 -4 9 -4 9 0Z", "#8a5a3e", { s: 0.8, w: 1.2 });

function seed() {
  return mound() + fill(ellD(-3, -1.5, 1.1, 0.9), "#f3e0b0") + fill(ellD(1, -2.2, 1.1, 0.9), "#f3e0b0") + fill(ellD(4, -1.2, 1.1, 0.9), "#f3e0b0");
}

function sprout(g) {
  return mound() + stem("M0 -1V-7", g, 1.6) + leaf([0, -7], 140, 7, 2.6, g) + leaf([0, -7], 220, 7, 2.6, g);
}

function young(g) {
  return mound() + stem("M0 -1V-12", g, 2) + leaf([0, -5], 115, 10, 3.4, g) + leaf([0, -5], 245, 10, 3.4, g) + leaf([0, -11], 160, 9, 3.2, lite(g, 0.15)) + leaf([0, -11], 200, 9, 3.2, g);
}

function bushy(g, r = 1) {
  let m = "";
  const angs = [100, 130, 160, 180, 200, 230, 260];
  for (const a of angs) m += leaf([0, -3], a, 13 * r, 4.4 * r, a === 180 ? lite(g, 0.15) : g);
  return m;
}

function grown(id, def) {
  const g = def.accent;
  if (id === "sunflower") return stem("M0 0V-34", "#6aa24a", 2.6) + leaf([0, -14], 120, 11, 4, g) + leaf([0, -22], 240, 11, 4, g) + circle(0, -36, 5, "#7fb85a", { s: 1 });
  if (id === "tomato") return stem("M5 0V-30", "#a8784a", 2) + bushy(g, 1.05) + circle(-4, -14, 3, "#8ccf6a", { s: 0.8, w: 1.1 }) + circle(5, -19, 3, "#8ccf6a", { s: 0.8, w: 1.1 });
  if (id === "pumpkin") return mound() + leaf([0, -2], 110, 14, 5, g) + leaf([0, -2], 250, 14, 5, g) + leaf([0, -3], 180, 12, 5, lite(g, 0.1)) + circle(5, -4, 4, "#9ccf6a", { s: 0.8 });
  if (id === "strawberry") return mound() + bushy(g, 0.85) + circle(-5, -10, 2.2, "#fff8f0", { s: 0.6, w: 1 }) + circle(5, -12, 2.2, "#fff8f0", { s: 0.6, w: 1 });
  if (id === "moonbloom") return stem("M0 0V-24", "#4f7a98", 2.2) + leaf([0, -8], 125, 10, 3.6, g) + leaf([0, -14], 235, 10, 3.6, g) + circle(0, -26, 3.6, lite(g, 0.3), { s: 1 });
  return mound() + bushy(g, id === "turnip" ? 0.95 : 0.9);
}

function ripe(id, def) {
  const c = def.color;
  const g = def.accent;
  if (id === "turnip")
    return (
      leaf([0, -8], 150, 14, 5, g) + leaf([0, -8], 210, 14, 5, g) + leaf([0, -8], 180, 16, 4.5, lite(g, 0.15)) +
      part("M-8 -5C-8 -12 8 -12 8 -5C8 0 3 3 0 5C-3 3 -8 0 -8 -5Z", c, { s: 1.6 }) +
      fill("M-7.6 -7C-6 -11.5 6 -11.5 7.6 -7C4 -8.5 -4 -8.5 -7.6 -7Z", "#b06ac0") + hi(-3.5, -6, 1.6, 2.2, 0.7)
    );
  if (id === "strawberry") {
    const berry = (x, y) => part(`M${x - 3.5} ${y - 2}C${x - 3.5} ${y - 5} ${x + 3.5} ${y - 5} ${x + 3.5} ${y - 2}C${x + 3.5} ${y + 1} ${x + 1} ${y + 3.5} ${x} ${y + 4}C${x - 1} ${y + 3.5} ${x - 3.5} ${y + 1} ${x - 3.5} ${y - 2}Z`, c, { s: 1, w: 1.2 }) + fill(ellD(x - 1, y - 2, 0.5, 0.5), "#ffe8a0") + fill(ellD(x + 1.2, y, 0.5, 0.5), "#ffe8a0");
    return mound() + bushy(g, 0.85) + berry(-6, -8) + berry(5, -12) + berry(1, -4);
  }
  if (id === "tomato") {
    const tom = (x, y) => circle(x, y, 3.8, c, { s: 1.2, w: 1.2 }) + hi(x - 1.2, y - 1.3, 1, 0.8, 0.8) + fill(polyD([[x - 1.5, y - 3.5], [x, y - 4.8], [x + 1.5, y - 3.5]]), g);
    return stem("M5 0V-30", "#a8784a", 2) + bushy(g, 1.05) + tom(-5, -12) + tom(5, -19) + tom(1, -6);
  }
  if (id === "sunflower") {
    let petals = "";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 360;
      petals += part(leafD([0, -40], a, 10, 3.2), c, { s: 0.6, w: 1.1 });
    }
    return stem("M0 0V-36", "#6aa24a", 2.8) + leaf([0, -14], 120, 12, 4.4, g) + leaf([0, -24], 240, 12, 4.4, g) + petals + circle(0, -40, 5.5, "#7a4a2a", { s: 1 }) + fill(ellD(-1.5, -41.5, 1.5, 1.2), "#a86a3a");
  }
  if (id === "pumpkin")
    return (
      leaf([0, -2], 110, 14, 5, g) + leaf([0, -2], 250, 14, 5, g) +
      part(ellD(0, -7, 12, 8.5), c, { s: 2 }) + line("M-4 -14Q-6 -7 -4 0M4 -14Q6 -7 4 0M0 -15V1", 1.1, dark(c, 0.35)) +
      hi(-6, -10, 2, 2.6, 0.55) + stem("M0 -15Q1 -18 3 -19", "#6a8a3a", 2)
    );
  if (id === "moonbloom") {
    // Pale five-point bloom on a slim stem, with a moon-gold heart.
    let petals = "";
    for (let i = 0; i < 5; i++) petals += part(leafD([0, -28], i * 72, 9, 4.4), c, { s: 0.8, w: 1.1 });
    return stem("M0 0V-26", "#4f7a98", 2.2) + leaf([0, -8], 125, 11, 4, g) + leaf([0, -15], 235, 11, 4, g) + petals + circle(0, -28, 3, "#f6d86a", { s: 0.8 }) + hi(-2.5, -31, 1.4, 1, 0.8);
  }
  if (id === "cranberry") {
    let m = mound() + bushy(g, 0.95);
    const pts = [[-7, -9], [-3, -14], [3, -11], [7, -7], [0, -6], [-5, -4], [5, -15], [1, -17]];
    for (const [x, y] of pts) m += circle(x, y, 2, c, { s: 0.6, w: 1 }) + fill(ellD(x - 0.6, y - 0.6, 0.6, 0.6), "#fff", 0.8);
    return m;
  }
  return bushy(g);
}

function dead() {
  const b = "#a07a4a";
  return mound() + stem("M0 -1Q1 -6 -1 -10", "#8a6a3a", 1.8) + leaf([0, -6], 70, 9, 2.6, b) + leaf([-1, -9], 290, 8, 2.4, dark(b, 0.1)) + leaf([0, -4], 110, 7, 2.2, b);
}

/** Crop sprite: stage 0..4 or "dead". Tall ripe crops sway a little. */
export function cropSprite(id, def, stage) {
  let m;
  if (stage === "dead") m = dead();
  else if (stage === 0) m = seed();
  else if (stage === 1) m = sprout(def.accent);
  else if (stage === 2) m = young(def.accent);
  else if (stage === 3) m = grown(id, def);
  else m = ripe(id, def);
  const anim = stage >= 2 && stage !== "dead" ? { type: "sway", pivot: [0, 0], amp: 0.025, speed: 1.6, phase: id.length } : undefined;
  return sprite(BOX, [{ markup: outlined(`<g transform="scale(${SCALE})">${m}</g>`), anim }]);
}

// ── Soil ────────────────────────────────────────────────────────────────────

export function soilSprite(wet) {
  const c = wet ? "#6a4232" : "#a8704a";
  const lo = wet ? "#50302a" : "#8a5638";
  let m = part(rrD(2, 3, 28, 27, 7), c, { s: 2, w: 0, lo });
  m += `<path d="${rrD(2, 3, 28, 27, 7)}" fill="none" stroke="${dark(c, 0.35)}" stroke-width="1.2"/>`;
  for (let y = 10; y < 28; y += 6) m += line(`M7 ${y}Q16 ${y - 1.5} 25 ${y}`, 1.4, lo, 0.9) + line(`M7 ${y - 1.4}Q16 ${y - 2.9} 25 ${y - 1.4}`, 0.9, lite(c, 0.25), 0.7);
  if (wet) m += fill(ellD(11, 9, 3, 1.3), "#8fb4d8", 0.35) + fill(ellD(21, 20, 3.5, 1.4), "#8fb4d8", 0.3);
  return sprite([0, 0, 32, 32], [m]);
}
