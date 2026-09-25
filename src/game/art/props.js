/**
 * World props: trees (per season), rocks and debris, buildings, farm
 * structures, town furniture and interior furniture. Origins sit at the
 * ground contact point (tree trunk base, building footprint bottom-centre)
 * so y-sorting on the origin reads correctly.
 */

import { part, circle, hi, fill, line, ellD, rrD, capD, polyD, outlined, sprite, lite, dark, f, INK } from "./cozy-kit.js";

/** Scalloped ellipse (tree canopies, bushes): arcs bulging outward between points. */
export function scallopD(cx, cy, rx, ry, n, seed = 1, bulge = 0.6) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const j = Math.sin(seed * 12.9898 + i * 78.233) * 0.12;
    const a = ((i + j) / n) * Math.PI * 2;
    const r = 1 + Math.sin(seed * 3.1 + i * 2.7) * 0.05;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const rr = Math.hypot(b[0] - a[0], b[1] - a[1]) * bulge;
    d += `A${f(rr)} ${f(rr)} 0 0 1 ${f(b[0])} ${f(b[1])}`;
  }
  return d + "Z";
}

const L = (markup, extra = {}) => ({ markup: outlined(markup), ...extra });

// ── Seasonal palettes ───────────────────────────────────────────────────────

export const FOLIAGE = [
  { leaf: "#86c867", deep: "#5d9f55", acc: "#f7b3c8" },
  { leaf: "#5fae52", deep: "#3f8a4c", acc: "#9ad46a" },
  { leaf: "#f0a040", deep: "#d0643a", acc: "#f6d25a" },
  { leaf: "#dfe8f0", deep: "#b8c4d4", acc: "#ffffff" },
];

// ── Trees ───────────────────────────────────────────────────────────────────

const BARK = "#9a6a48";
const TREE_BOX = [-50, -124, 100, 130];

function trunk(h = 48, w = 7) {
  return (
    part(`M${-w} 0C${-w + 1} -10 ${-w + 2} ${-h * 0.6} ${-w + 1} ${-h}L${w - 1} ${-h}C${w - 2} ${-h * 0.6} ${w - 1} -10 ${w} 0C${w + 3} 3 ${-w - 3} 3 ${-w} 0Z`, BARK, { s: 2.4 }) +
    line(`M-2 -8Q-1 -18 -3 -26M3 -14Q2 -22 3 -30`, 1, dark(BARK, 0.35), 0.8)
  );
}

function canopy(season, seed, cherry) {
  const p = FOLIAGE[season];
  let leafC = p.leaf;
  if (cherry && season === 0) leafC = "#f5b6cc";
  let m = part(scallopD(0, -74, 38, 32, 12, seed), leafC, { s: 5, lo: dark(leafC, 0.25) });
  m += fill(scallopD(-10, -84, 20, 15, 8, seed + 2), lite(leafC, 0.22), 0.9);
  m += fill(scallopD(-16, -88, 8, 6, 6, seed + 5), lite(leafC, 0.45), 0.8);
  m += line("M10 -66q4 3 8 0M-20 -60q4 3 8 0M2 -52q4 3 8 0", 1.2, dark(leafC, 0.35), 0.7);
  if (season === 0 && !cherry) for (const [x, y] of [[-18, -78], [12, -90], [22, -70], [-4, -60], [-26, -66], [4, -80]]) m += circle(x, y, 2.6, p.acc, { s: 0.6, w: 1 }) + fill(ellD(x, y, 0.9, 0.9), "#f6d25a");
  if (cherry && season === 0) for (const [x, y] of [[-18, -78], [12, -90], [22, -70], [-4, -60], [-26, -66]]) m += fill(ellD(x, y, 2, 2), "#fff4f8");
  if (season === 2) for (const [x, y, c] of [[-18, -72, "#e0503a"], [14, -86, "#f6d25a"], [20, -64, "#e0503a"], [-6, -58, "#f6d25a"], [0, -92, "#e0503a"]]) m += fill(scallopD(x, y, 7, 5, 5, x), c, 0.85);
  if (season === 1) for (const [x, y] of [[-14, -70], [16, -80], [8, -60]]) m += fill(scallopD(x, y, 6, 4.5, 5, y), p.acc, 0.6);
  return m;
}

function bareBranches() {
  const br = "M0 -44C-2 -60 -6 -70 -16 -82M-4 -60C-14 -64 -22 -62 -28 -70M0 -50C6 -64 12 -72 20 -88M8 -66C16 -66 24 -70 30 -78M-8 -70C-6 -80 -4 -88 -2 -98";
  let m = line(br, 6.5, INK) + line(br, 4, BARK);
  for (const [x, y, w] of [[-16, -84, 7], [-28, -72, 6], [20, -90, 8], [30, -80, 6], [-2, -100, 6]]) m += part(capD([x - w / 2, y], [x + w / 2, y], 3.4, 3.4), "#ffffff", { s: 0.6, w: 1.2 });
  return m;
}

export function oakSprite(season, seed = 1, cherry = false) {
  const t = L(trunk() + groundTuft(season));
  if (season === 3) return sprite(TREE_BOX, [t, L(bareBranches(), { anim: { type: "sway", pivot: [0, -40], amp: 0.01, speed: 1.1, phase: seed } })]);
  return sprite(TREE_BOX, [t, L(canopy(season, seed, cherry), { anim: { type: "sway", pivot: [0, -10], amp: 0.018, speed: 1.1, phase: seed } })]);
}

function groundTuft(season) {
  if (season === 3) return fill(ellD(0, 1, 14, 3.5), "#ffffff", 0.9);
  const g = FOLIAGE[season].deep;
  return fill(`M-12 2q2 -6 4 0q2 -5 3 0M8 2q2 -6 3 0q2 -5 3 0`, g);
}

export function pineSprite(season, seed = 1) {
  const g = season === 0 ? "#5aa877" : season === 2 ? "#4f9570" : season === 3 ? "#4a8a74" : "#3f9468";
  let m = "";
  const tiers = [[-34, 46, 44], [-58, 38, 40], [-80, 28, 34]];
  for (let i = 0; i < 3; i++) {
    const [y, w, h] = tiers[i];
    const d = `M${-w} ${y}C${-w * 0.6} ${y - h * 0.3} -6 ${y - h + 4} 0 ${y - h}C6 ${y - h + 4} ${w * 0.6} ${y - h * 0.3} ${w} ${y}C${w * 0.5} ${y + 6} ${w * 0.25} ${y + 1} 0 ${y + 5}C${-w * 0.25} ${y + 1} ${-w * 0.5} ${y + 6} ${-w} ${y}Z`;
    m += part(d, i === 2 ? lite(g, 0.08) : g, { s: 4, lo: dark(g, 0.3) });
    m += line(`M${-w * 0.45} ${y - h * 0.25}Q-4 ${y - h * 0.62} -2 ${y - h + 8}`, 2, lite(g, 0.3), 0.7);
    if (season === 3) m += fill(`M${-w * 0.7} ${y - h * 0.22}C-8 ${y - h * 0.8} 8 ${y - h * 0.8} ${w * 0.7} ${y - h * 0.22}C${w * 0.3} ${y - h * 0.35} ${-w * 0.3} ${y - h * 0.3} ${-w * 0.7} ${y - h * 0.22}Z`, "#fbfdff", 0.95);
  }
  return sprite(TREE_BOX, [L(trunk(30, 6) + groundTuft(season)), L(m, { anim: { type: "sway", pivot: [0, -10], amp: 0.014, speed: 1, phase: seed } })]);
}

/** Ironwood: a tall, near-black pine of the Wildwood thicket (chop it for ironwood). */
export function ironwoodSprite(season, seed = 1) {
  const g = season === 3 ? "#3e5c5e" : "#2f5452";
  let m = "";
  const tiers = [[-38, 44, 46], [-64, 36, 42], [-88, 26, 36], [-106, 16, 24]];
  for (let i = 0; i < tiers.length; i++) {
    const [y, w, h] = tiers[i];
    const d = `M${-w} ${y}C${-w * 0.6} ${y - h * 0.3} -6 ${y - h + 4} 0 ${y - h}C6 ${y - h + 4} ${w * 0.6} ${y - h * 0.3} ${w} ${y}C${w * 0.5} ${y + 6} ${w * 0.25} ${y + 1} 0 ${y + 5}C${-w * 0.25} ${y + 1} ${-w * 0.5} ${y + 6} ${-w} ${y}Z`;
    m += part(d, i === tiers.length - 1 ? lite(g, 0.1) : g, { s: 4, lo: dark(g, 0.35) });
    m += line(`M${-w * 0.45} ${y - h * 0.25}Q-4 ${y - h * 0.62} -2 ${y - h + 8}`, 1.8, "#9fc8c0", 0.55);
    if (season === 3) m += fill(`M${-w * 0.7} ${y - h * 0.22}C-8 ${y - h * 0.8} 8 ${y - h * 0.8} ${w * 0.7} ${y - h * 0.22}C${w * 0.3} ${y - h * 0.35} ${-w * 0.3} ${y - h * 0.3} ${-w * 0.7} ${y - h * 0.22}Z`, "#fbfdff", 0.95);
  }
  const bark = part("M-7 0C-6 -10 -5 -22 -5 -34L5 -34C5 -22 6 -10 7 0C10 3 -10 3 -7 0Z", "#5a4a4e", { s: 2.2 }) + line("M-2 -6V-28M2 -10V-30", 1, "#3a2e34", 0.8);
  return sprite([-50, -134, 100, 140], [L(bark + groundTuft(season)), L(m, { anim: { type: "sway", pivot: [0, -10], amp: 0.01, speed: 0.8, phase: seed } })]);
}

export function stumpSprite() {
  return sprite([-20, -24, 40, 28], [L(part("M-9 0C-9 -6 -9 -12 -8 -14L8 -14C9 -12 9 -6 9 0C11 3 -11 3 -9 0Z", BARK, { s: 2 }) + part(ellD(0, -14, 8.5, 3.6), "#e8c08a", { s: 0.6 }) + line("M-4 -14.5a4 1.6 0 1 0 8 0", 0.9, dark("#e8c08a", 0.4)))]);
}

// ── Rocks & debris ──────────────────────────────────────────────────────────

export function rockSprite(season, big = true) {
  const c = "#b5acb6";
  const s = big ? 1 : 0.6;
  const d = `M${-14 * s} 0C${-17 * s} ${-8 * s} ${-10 * s} ${-19 * s} 0 ${-19 * s}C${10 * s} ${-20 * s} ${17 * s} ${-9 * s} ${14 * s} 0C${9 * s} ${3 * s} ${-9 * s} ${3 * s} ${-14 * s} 0Z`;
  let m = part(d, c, { s: 3, lo: dark(c, 0.3) }) + hi(-5 * s, -12 * s, 5 * s, 2.4 * s, 0.55) + line(`M${3 * s} ${-14 * s}L${6 * s} ${-8 * s}L${4 * s} ${-4 * s}`, 1.1, dark(c, 0.45));
  if (season === 3) m += fill(`M${-11 * s} ${-12 * s}C${-6 * s} ${-21 * s} ${8 * s} ${-21 * s} ${12 * s} ${-11 * s}C${4 * s} ${-14 * s} ${-4 * s} ${-13 * s} ${-11 * s} ${-12 * s}Z`, "#fbfdff");
  else if (big) m += fill(scallopD(-8, -4, 5, 2.4, 5, 3), "#8cbf6a", 0.8);
  return sprite([-22, -28, 44, 32], [L(m)]);
}

export function weedSprite(season) {
  const g = season === 2 ? "#c89a4a" : season === 3 ? "#b4a48a" : season === 1 ? "#4f9e4a" : "#6ab85a";
  let m = "";
  for (const [a, l] of [[150, 11], [170, 14], [190, 13], [210, 10], [130, 8], [230, 8]]) {
    const r = (a * Math.PI) / 180;
    const tip = [Math.sin(r) * l, Math.cos(r) * l - 1];
    m += part(`M-2 0Q${f(tip[0] * 0.3 - 2)} ${f(tip[1] * 0.6)} ${f(tip[0])} ${f(tip[1])}Q${f(tip[0] * 0.3 + 2)} ${f(tip[1] * 0.6)} 2 0Z`, g, { s: 0.8, w: 1.2 });
  }
  return sprite([-18, -22, 36, 26], [L(m, { anim: { type: "sway", pivot: [0, 0], amp: 0.05, speed: 2 } })]);
}

export function twigSprite() {
  const m = line("M-10 -2L9 -6M0 -4L4 -10", 5, INK) + line("M-10 -2L9 -6M0 -4L4 -10", 3, BARK) + fill(ellD(-10, -2, 1.4, 1.4), "#e8c08a");
  return sprite([-16, -16, 32, 20], [m]);
}

export function bushSprite(season, seed = 1, berries = null) {
  const p = FOLIAGE[season];
  const c = season === 3 ? "#cfdbe4" : p.leaf;
  let m = part(scallopD(0, -12, 17, 12, 9, seed), c, { s: 3.5, lo: dark(c, 0.28) });
  m += fill(scallopD(-5, -16, 8, 5, 6, seed + 1), lite(c, 0.25), 0.9);
  if (berries) for (const [x, y] of [[-8, -12], [4, -16], [9, -8], [-2, -6]]) m += circle(x, y, 2.4, berries, { s: 0.6, w: 1 });
  else if (season === 0) for (const [x, y] of [[-8, -12], [6, -17], [8, -7]]) m += circle(x, y, 2.2, "#fff2f6", { s: 0.4, w: 1 });
  return sprite([-24, -30, 48, 34], [L(m, { anim: { type: "sway", pivot: [0, 0], amp: 0.012, speed: 1.3, phase: seed } })]);
}

export function flowerPatchSprite(season, seed = 1) {
  if (season === 3) return sprite([-12, -12, 24, 14], [""]);
  const cols = [["#f7a6c1", "#fff2a8", "#b8d8f8"], ["#f6d25a", "#f08a6a", "#ffffff"], ["#f0a040", "#d0643a", "#f6d25a"]][season];
  let m = "";
  const pts = [[-6, -3], [4, -5], [0, 0], [8, 1], [-8, 2]];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    m += line(`M${x} ${y + 4}V${y}`, 1.2, "#5f9a4a") + circle(x, y, 2.4, cols[(i + seed) % 3], { s: 0.5, w: 1 }) + fill(ellD(x, y, 0.8, 0.8), "#f6b93c");
  }
  return sprite([-14, -10, 28, 16], [m]);
}

// ── Buildings ───────────────────────────────────────────────────────────────

/**
 * Building styles. Footprint w×d tiles; the sprite origin is the footprint
 * bottom-centre. `windows` are [x, y, w, h] relative to the origin (for the
 * night glow), `door` the door rect.
 */
export const BUILDINGS = {
  house: { w: 6, d: 4, wallH: 72, wall: "#f6e7cf", roof: "#d8705a", door: "#6fae7c", trim: "#fffaf0", chimney: true },
  bakery: { w: 6, d: 4, wallH: 72, wall: "#f8d2cf", roof: "#9a6048", door: "#e89aa0", trim: "#fffaf0", awning: ["#f08aa0", "#fff4f0"], sign: "bread" },
  carpenter: { w: 6, d: 4, wallH: 72, wall: "#dcaa72", roof: "#5f9e8c", door: "#8a5a3a", trim: "#f4e2c4", planks: true, sign: "saw" },
  cabin: { w: 4, d: 3, wallH: 62, wall: "#a8c8e0", roof: "#4a6a8a", door: "#e8c86a", trim: "#fffaf0", planks: true },
  stable: { w: 5, d: 4, wallH: 70, wall: "#d0645a", roof: "#8a4040", door: null, trim: "#fff4ea", barn: true },
  coop: { w: 4, d: 3, wallH: 56, wall: "#f3d88a", roof: "#b0704a", door: "#8a5a3a", trim: "#fffaf0", coop: true },
  lodge: { w: 6, d: 4, wallH: 72, wall: "#b8865a", roof: "#4f7a5a", door: "#6a4a32", trim: "#f4e2c4", planks: true, sign: "sword" },
  store: { w: 6, d: 4, wallH: 72, wall: "#f6ecd4", roof: "#5a7ab8", door: "#e8c86a", trim: "#fffaf0", awning: ["#6a9ad8", "#fff8ec"], sign: "bag" },
  ranch: { w: 6, d: 4, wallH: 72, wall: "#f8f4ee", roof: "#8a5a4a", door: "#c0584a", trim: "#fffaf0", chimney: true },
  barn: { w: 6, d: 5, wallH: 84, wall: "#c8484a", roof: "#6a3a3a", door: null, trim: "#fff4ea", barn: true },
  cottage: { w: 4, d: 3, wallH: 60, wall: "#d8c8ec", roof: "#7a5a9a", door: "#f2c46a", trim: "#fffaf0" },
  cottage2: { w: 4, d: 3, wallH: 60, wall: "#cdeadb", roof: "#c07050", door: "#6a9ac8", trim: "#fffaf0" },
  clinic: { w: 5, d: 4, wallH: 70, wall: "#fbf8f4", roof: "#3f9a9a", door: "#8ad0c8", trim: "#fffaf0", sign: "cross" },
};

export function buildingWindows(kind) {
  const b = BUILDINGS[kind];
  const W = b.w * 32;
  const out = [];
  if (b.barn) return out;
  const n = b.w >= 6 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const cx = n === 1 ? W / 4 + 2 : (i ? 1 : -1) * (W / 4 + 8);
    out.push([cx - 12, -b.wallH + 20, 24, 20]);
  }
  return out;
}

function windowM(x, y, w, h, trim) {
  return (
    part(rrD(x - 2, y - 2, w + 4, h + 4, 4), trim, { s: 1 }) +
    fill(rrD(x, y, w, h, 3), "#9fd4ee") + fill(`M${x + 2} ${y + h - 2}L${x + w - 6} ${y + 2}H${x + w - 2}L${x + 6} ${y + h - 2}Z`, "#e8f8ff", 0.6) +
    line(`M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}`, 1.6, trim) + `<path d="${rrD(x, y, w, h, 3)}" fill="none" stroke="${INK}" stroke-width="1.2"/>`
  );
}

function awningM(x, y, w, cols) {
  let m = "";
  const n = 5;
  const sw = w / n;
  for (let i = 0; i < n; i++) m += fill(`M${x + i * sw} ${y}H${x + (i + 1) * sw}V${y + 8}A${sw / 2} ${sw / 2.4} 0 0 1 ${x + i * sw} ${y + 8}Z`, cols[i % 2]);
  let edge = `M${x} ${y}H${x + w}V${y + 8}`;
  for (let i = n - 1; i >= 0; i--) edge += `A${sw / 2} ${sw / 2.4} 0 0 1 ${x + i * sw} ${y + 8}`;
  return m + `<path d="${edge}Z" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
}

function signM(kind, y) {
  let icon = "";
  if (kind === "bread") icon = part("M-8 4C-9 -3 -4 -6 0 -6C4 -6 9 -3 8 4Z", "#e0a060", { s: 1.2 }) + line("M-4 -3L-2 0M1 -4L3 -1", 1, "#9a6040");
  if (kind === "saw") icon = part("M-9 -3H6L9 3H-9Z", "#c4d0da", { s: 0.8 }) + part(rrD(-12, -5, 5, 8, 2), "#c98a4a", { s: 0.6 }) + line("M-5 3l1.5 -2l1.5 2l1.5 -2l1.5 2l1.5 -2l1.5 2", 0.8, INK);
  if (kind === "sword") icon = part("M-9 3L5 -5L7 -3L-7 5Z", "#d8e2ea", { s: 0.6, w: 1.1 }) + part("M5 -5L9 -7L7 -3Z", "#d8e2ea", { s: 0, w: 1.1 }) + part(capD([-8, -1], [-4, 6], 2.6, 2.6), "#e8c86a", { s: 0.4, w: 1 }) + part(capD([-8, 4], [-11, 6], 2.4, 2.4), "#8a5a3a", { s: 0, w: 1 });
  if (kind === "bag") icon = part("M-7 -2C-8 5 -5 6 0 6C5 6 8 5 7 -2C6 -5 -6 -5 -7 -2Z", "#d8b06a", { s: 1 }) + part("M-3 -4L-4 -7H4L3 -4Z", "#d8b06a", { s: 0.4, w: 1 }) + line("M-3.5 -4.2H3.5", 1.2, "#8a5a3a") + circle(0, 1.5, 2, "#f6d25a", { s: 0.4, w: 0.9 });
  if (kind === "cross") icon = part("M-2.6 -7H2.6V-2.6H7V2.6H2.6V7H-2.6V2.6H-7V-2.6H-2.6Z", "#6ab85a", { s: 1 }) + hi(-1, -5, 0.8, 1.2, 0.6);
  return `<g transform="translate(0 ${y})">${part(rrD(-17, -10, 34, 18, 5), "#f6e2b8", { s: 1.4 })}${icon}</g>`;
}

export function buildingSprite(kind, season = 0) {
  const b = BUILDINGS[kind];
  const W = b.w * 32;
  const D = b.d * 32;
  const x0 = -W / 2 + 6;
  const ww = W - 12;
  const top = -(D + 26);
  const eave = -b.wallH + 10;
  let m = "";
  // Walls + foundation
  m += part(rrD(x0, -b.wallH, ww, b.wallH, 4), b.wall, { s: 4 });
  if (b.planks) for (let x = x0 + 12; x < x0 + ww - 4; x += 12) m += line(`M${x} ${-b.wallH + 12}V-8`, 1, dark(b.wall, 0.3), 0.6);
  if (b.barn) m += line(`M${x0 + 8} -10L${x0 + 34} ${-b.wallH + 16}M${x0 + 8} ${-b.wallH + 16}L${x0 + 34} -10M${-x0 - 8} -10L${-x0 - 34} ${-b.wallH + 16}M${-x0 - 8} ${-b.wallH + 16}L${-x0 - 34} -10`, 3, b.trim) + `<path d="${rrD(x0 + 6, -b.wallH + 14, 30, b.wallH - 22, 2)}M${-x0 - 36} ${-b.wallH + 14}h30v${b.wallH - 22}h-30Z" fill="none" stroke="${b.trim}" stroke-width="3"/>`;
  m += part(rrD(x0 - 3, -9, ww + 6, 9, 3), "#c4b4ac", { s: 1.6 });
  for (let x = x0 + 4; x < x0 + ww; x += 16) m += line(`M${x} -8.5V-0.5`, 0.8, dark("#c4b4ac", 0.35), 0.8);
  // Windows (+ awning / flower boxes)
  for (const [x, y, w, h] of buildingWindows(kind)) {
    m += windowM(x, y, w, h, b.trim);
    if (b.awning) m += awningM(x - 5, y - 12, w + 10, b.awning);
    else m += part(rrD(x - 3, y + h + 2, w + 6, 6, 2), "#b0704a", { s: 1 }) + circle(x + 3, y + h + 1, 2.6, "#f28aa6", { s: 0.5, w: 1 }) + circle(x + w / 2, y + h, 2.6, "#f6d25a", { s: 0.5, w: 1 }) + circle(x + w - 3, y + h + 1, 2.6, "#f28aa6", { s: 0.5, w: 1 });
  }
  if (b.coop) m += circle(-W / 4 + 2, -b.wallH + 30, 7, "#9fd4ee", { s: 1 }) + line(`M${-W / 4 + 2} ${-b.wallH + 23}v14`, 1.2, b.trim);
  // Door
  if (b.barn) {
    m += part(`M-24 0V${-b.wallH + 30}A24 18 0 0 1 24 ${-b.wallH + 30}V0Z`, "#4a2e30", { s: 0, w: 1.6 });
    m += fill(`M-18 0C-16 -8 -8 -14 0 -12C8 -14 16 -8 18 0Z`, "#e8c86a") + line("M-14 -4l3 -5M-4 -9l2 -5M6 -8l2 -5", 1, "#c89a4a");
  } else if (b.door) {
    const dw = b.coop ? 10 : 13;
    const dh = b.coop ? 28 : 42;
    m += part(`M${-dw} 0V${-dh + dw}A${dw} ${dw} 0 0 1 ${dw} ${-dh + dw}V0Z`, b.door, { s: 2.4 });
    m += line(`M${-dw + 4} ${-dh + dw + 2}V-4M${dw - 4} ${-dh + dw + 2}V-4`, 1, dark(b.door, 0.3), 0.7);
    m += circle(dw - 4.5, -dh / 2 + 2, 1.6, "#f6d25a", { s: 0.4, w: 1 });
    if (b.coop) m += part("M-10 0L-14 12H14L10 0Z", "#c98a4a", { s: 1 });
    else m += part(rrD(-dw - 4, -1, dw * 2 + 8, 6, 3), "#c4b4ac", { s: 1 });
  }
  // Roof
  const rw = ww / 2 + 12;
  const tw = ww / 2 - 18;
  const roofD = `M${-rw} ${eave}Q${-rw + 2} ${eave - 4} ${-rw + 6} ${eave - 8}L${-tw} ${top + 4}Q${-tw + 2} ${top} ${-tw + 8} ${top}H${tw - 8}Q${tw - 2} ${top} ${tw} ${top + 4}L${rw - 6} ${eave - 8}Q${rw - 2} ${eave - 4} ${rw} ${eave}Z`;
  m += part(roofD, b.roof, { s: 5, lo: dark(b.roof, 0.28) });
  const rows = Math.floor((eave - top) / 13);
  for (let i = 1; i < rows; i++) {
    const y = top + i * 13;
    const k = (y - top) / (eave - top);
    const hw = tw + (rw - tw) * k - 6;
    const n = Math.floor((hw * 2) / 12);
    let d = `M${f(-n * 6)} ${y}`;
    for (let j = 0; j < n; j++) d += `q6 5 12 0`;
    m += line(d, 1.2, dark(b.roof, 0.3), 0.75);
  }
  m += part(capD([-tw + 4, top + 2], [tw - 4, top + 2], 7, 7), dark(b.roof, 0.15), { s: 1.4 });
  if (season === 3) m += fill(`M${-tw - 2} ${top + 6}C${-tw} ${top - 4} ${tw} ${top - 4} ${tw + 2} ${top + 6}C${tw * 0.6} ${top + 16} ${tw * 0.2} ${top + 10} 0 ${top + 16}C${-tw * 0.3} ${top + 10} ${-tw * 0.6} ${top + 18} ${-tw - 2} ${top + 6}Z`, "#fbfdff") + fill(`M${-rw + 4} ${eave - 2}C${-rw / 2} ${eave - 8} ${rw / 2} ${eave - 8} ${rw - 4} ${eave - 2}C${rw / 3} ${eave + 2} ${-rw / 3} ${eave + 2} ${-rw + 4} ${eave - 2}Z`, "#fbfdff", 0.9);
  if (b.chimney) m += part(rrD(tw - 30, top - 16, 16, 30, 3), "#c4786a", { s: 2 }) + part(rrD(tw - 32, top - 20, 20, 7, 3), "#a86258", { s: 1 });
  if (b.sign) m += signM(b.sign, -b.wallH - 6);
  if (b.barn) m += part(rrD(-14, -b.wallH - 6, 28, 16, 4), b.trim, { s: 1 }) + fill(ellD(0, -b.wallH + 2, 5, 4), "#4a2e30");
  const box = [-W / 2 - 18, top - 30, W + 36, -top + 44];
  const layers = [L(m)];
  if (b.chimney) layers.push({ markup: circle(tw - 22, top - 30, 6, "#f4f0f4", { s: 1.2, w: 1 }) + circle(tw - 14, top - 38, 4.5, "#f4f0f4", { s: 1, w: 1 }), anim: { type: "float", amp: 2.5, speed: 1.4 }, opacity: 0.85 });
  return sprite(box, layers);
}

// ── Farm & town props ───────────────────────────────────────────────────────

export function binSprite() {
  const w = "#c98a4a";
  const m =
    part(rrD(-16, -20, 32, 20, 3), w, { s: 2.4 }) + line("M-16 -10H16M-8 -20V0M8 -20V0", 1.1, dark(w, 0.35), 0.8) +
    part("M-18 -20C-18 -30 18 -30 18 -20Z", lite(w, 0.1), { s: 2 }) + part(rrD(-4, -24, 8, 6, 2), "#e8c86a", { s: 0.8 });
  return sprite([-22, -34, 44, 38], [L(m)]);
}

export function wellSprite(season = 0) {
  const st = "#b8b0bc";
  let m = "";
  m += line("M-22 -18V-58M22 -18V-58", 6, INK) + line("M-22 -18V-58M22 -18V-58", 4, "#9a6a48");
  m += part(ellD(0, -14, 26, 12), st, { s: 3 }) + fill(ellD(0, -18, 18, 6), "#3a4a6a") + fill(ellD(-4, -19, 8, 2), "#7fb0d8", 0.6);
  m += part("M-26 -14C-26 -2 26 -2 26 -14V-4C26 8 -26 8 -26 -4Z", st, { s: 2 });
  for (const x of [-18, -6, 6, 18]) m += line(`M${x} ${-3 + Math.abs(x) * 0.1}V${3 - Math.abs(x) * 0.1}`, 1, dark(st, 0.4), 0.7);
  m += part("M-32 -52L0 -72L32 -52C20 -55 -20 -55 -32 -52Z", "#c8664f", { s: 2 });
  if (season === 3) m += fill("M-30 -53L0 -71L30 -53C16 -58 -16 -58 -30 -53Z", "#fbfdff");
  m += line("M-18 -40H18", 2, "#7a4a32") + part(rrD(-4, -40, 8, 10, 2), "#9a6a48", { s: 0.8 });
  return sprite([-36, -78, 72, 88], [L(m)]);
}

export function boardSprite() {
  const w = "#b07a4a";
  let m = line("M-14 0V-30M14 0V-30", 5, INK) + line("M-14 0V-30M14 0V-30", 3, w);
  m += part(rrD(-18, -40, 36, 24, 3), "#c98a4a", { s: 2 }) + part(rrD(-14, -37, 11, 13, 1), "#fff8e8", { s: 0.6, w: 1 }) + part(rrD(0, -38, 13, 10, 1), "#fbe2a8", { s: 0.6, w: 1 }) + part(rrD(2, -27, 10, 8, 1), "#d8ecff", { s: 0.6, w: 1 });
  m += line("M-12 -33H-5M-12 -30H-6M2 -35H10", 0.8, INK, 0.7) + circle(-8, -38, 1.4, "#e8566a", { s: 0, w: 0.8 }) + part(rrD(-20, -44, 40, 6, 3), "#8a5a3a", { s: 1 });
  return sprite([-24, -48, 48, 52], [L(m)]);
}

export function lampSprite() {
  let m = line("M0 0V-44", 5, INK) + line("M0 0V-44", 3, "#4a4a5a") + part(rrD(-5, -2, 10, 4, 2), "#4a4a5a", { s: 0.4 });
  m += part("M-7 -44H7L5 -58H-5Z", "#fff0b8", { s: 1.6 }) + part("M-9 -58H9L0 -66Z", "#4a4a5a", { s: 0.6 }) + line("M-6 -44H6", 2, "#4a4a5a");
  return sprite([-14, -72, 28, 76], [L(m)]);
}

export function benchSprite() {
  const w = "#c98a4a";
  const m = part(rrD(-20, -22, 40, 8, 3), w, { s: 1.4 }) + part(rrD(-22, -12, 44, 6, 3), lite(w, 0.1), { s: 1 }) + line("M-17 -6V0M17 -6V0", 3.5, INK) + line("M-17 -6V0M17 -6V0", 2, dark(w, 0.3));
  return sprite([-26, -26, 52, 30], [L(m)]);
}

export function barrelSprite() {
  const w = "#b07a4a";
  const m = part("M-10 0C-12 -8 -12 -18 -10 -24H10C12 -18 12 -8 10 0Z", w, { s: 2 }) + part(ellD(0, -24, 10, 3.5), lite(w, 0.2), { s: 0.8 }) + line("M-11 -6H11M-11.5 -18H11.5", 2, "#7a7a8a");
  return sprite([-16, -32, 32, 36], [L(m)]);
}

export function planterSprite(season) {
  const c = ["#f7a6c1", "#f6d25a", "#f08a4a", "#e8f0f8"][season];
  let m = part(rrD(-14, -12, 28, 12, 3), "#c4786a", { s: 1.6 });
  if (season < 3) for (const x of [-8, 0, 8]) m += line(`M${x} -12V-18`, 1.4, "#5f9a4a") + circle(x, -19, 3.2, c, { s: 0.6, w: 1 }) + fill(ellD(x, -19, 1, 1), "#fff4b0");
  else m += fill(scallopD(0, -13, 13, 4, 6, 2), "#fbfdff");
  return sprite([-18, -26, 36, 30], [L(m)]);
}

export function lilySprite(seed = 0) {
  const m = part("M0 0C-9 1 -10 -8 -3 -9L0 -3L2 -9C9 -8 9 1 0 0Z", "#6ab870", { s: 1.4, w: 1.2 }) + (seed % 2 ? circle(3, -5, 2.6, "#f7b3c8", { s: 0.6, w: 1 }) : "");
  return sprite([-12, -12, 24, 16], [{ markup: m, anim: { type: "float", amp: 0.6, speed: 1.2, phase: seed } }]);
}

// ── Structures (buildable) ──────────────────────────────────────────────────

/** Fence piece; `mask` bits: 1 left, 2 right, 4 up, 8 down neighbour. */
/**
 * Fence piece for a neighbour mask (1 left, 2 right, 4 up, 8 down) in one of
 * the styles: wood (the original), gate, rustic logs, picket, stone wall or
 * hedge. `color` paints wood, gate and picket.
 */
export function fenceSprite(mask, season = 0, style = "wood", color = null) {
  if (style === "rustic") return rusticFence(mask, season);
  if (style === "picket") return picketFence(mask, season, color ?? "#f4ece0");
  if (style === "stone") return stoneWall(mask, season);
  if (style === "hedge") return hedge(mask, season);
  if (style === "gate") return gate(mask, season, color ?? "#c98a4a");
  const w = color ?? "#c98a4a";
  let m = "";
  if (mask & 4) m += part(rrD(-2.5, -30, 5, 20, 2), dark(w, 0.08), { s: 0.8, w: 1.2 });
  if (mask & 1) m += part(rrD(-16, -20, 16, 4.5, 2), w, { s: 0.8, w: 1.2 }) + part(rrD(-16, -11, 16, 4.5, 2), w, { s: 0.8, w: 1.2 });
  if (mask & 2) m += part(rrD(0, -20, 16, 4.5, 2), w, { s: 0.8, w: 1.2 }) + part(rrD(0, -11, 16, 4.5, 2), w, { s: 0.8, w: 1.2 });
  m += part("M-4 0V-22L0 -26L4 -22V0Z", lite(w, 0.1), { s: 1.4 });
  if (season === 3) m += part(capD([-4, -23], [4, -23], 4, 4), "#fbfdff", { s: 0.4, w: 1 });
  if (mask & 8) m += part(rrD(-2.5, -8, 5, 18, 2), dark(w, 0.08), { s: 0.8, w: 1.2 });
  return sprite([-18, -32, 36, 44], [L(m)]);
}

const snowCap = (x, y, w) => part(capD([x - w, y], [x + w, y], 4, 4), "#fbfdff", { s: 0.4, w: 1 });

function rusticFence(mask, season) {
  const w = "#9a6a48";
  let m = "";
  const rail = (x0, x1, y) => part(capD([x0, y], [x1, y], 3.2, 3.2), w, { s: 0.8, w: 1.2 }) + line(`M${x0 + 3} ${y - 0.6}H${x1 - 3}`, 0.8, lite(w, 0.25), 0.8);
  if (mask & 4) m += part(rrD(-3, -30, 6, 20, 3), dark(w, 0.1), { s: 0.8, w: 1.2 });
  if (mask & 1) m += rail(-17, 0, -19) + rail(-17, 0, -9);
  if (mask & 2) m += rail(0, 17, -19) + rail(0, 17, -9);
  m += part(rrD(-4.5, -25, 9, 25, 4), w, { s: 1.4 }) + part(ellD(0, -25, 4.5, 2), lite(w, 0.3), { s: 0.4, w: 1 }) + circle(0, -25, 1.2, dark(w, 0.2), { s: 0, w: 0 });
  if (season === 3) m += snowCap(0, -26, 4);
  if (mask & 8) m += part(rrD(-3, -8, 6, 18, 3), dark(w, 0.1), { s: 0.8, w: 1.2 });
  return sprite([-18, -32, 36, 44], [L(m)]);
}

function picketFence(mask, season, c) {
  let m = "";
  const picket = (x) => part(`M${x - 2.4} 0V-19L${x} -23L${x + 2.4} -19V0Z`, c, { s: 0.8, w: 1.1 });
  if (mask & 4) m += part(rrD(-2.5, -30, 5, 20, 1.5), dark(c, 0.08), { s: 0.8, w: 1.2 });
  if (mask & 1) m += part(rrD(-16, -16, 16, 3.4, 1.2), dark(c, 0.1), { s: 0.6, w: 1.1 }) + picket(-11) + picket(-5.5);
  if (mask & 2) m += part(rrD(0, -16, 16, 3.4, 1.2), dark(c, 0.1), { s: 0.6, w: 1.1 }) + picket(5.5) + picket(11);
  m += part("M-3.5 0V-24L0 -28.5L3.5 -24V0Z", lite(c, 0.08), { s: 1.2 });
  if (season === 3) m += snowCap(0, -25, 3);
  if (mask & 8) m += part(rrD(-2.5, -8, 5, 18, 1.5), dark(c, 0.08), { s: 0.8, w: 1.2 });
  return sprite([-18, -32, 36, 44], [L(m)]);
}

function stoneWall(mask, season) {
  const c = "#b4acb4";
  let m = "";
  const block = (x, y, w, h, k) => part(rrD(x, y, w, h, 2), k ? dark(c, 0.06) : c, { s: 0.8, w: 1.1, lo: dark(c, 0.2) });
  if (mask & 4) m += block(-5, -30, 10, 10, 1) + block(-5, -22, 10, 8, 0);
  if (mask & 1) m += block(-17, -16, 9, 8, 0) + block(-9, -16, 9, 8, 1) + block(-17, -9, 11, 9, 1) + block(-7, -9, 7, 9, 0);
  if (mask & 2) m += block(0, -16, 9, 8, 1) + block(8, -16, 9, 8, 0) + block(0, -9, 7, 9, 0) + block(6, -9, 11, 9, 1);
  m += block(-6, -18, 12, 9, 0) + block(-6, -10, 12, 10, 1);
  if (season === 3) m += snowCap(0, -18.5, 5);
  else m += fill(ellD(-3, -17.4, 2.2, 0.8), "#7cae62", 0.8);
  if (mask & 8) m += block(-5, -4, 10, 12, 0);
  return sprite([-18, -32, 36, 44], [L(m)]);
}

function hedge(mask, season) {
  const c = season === 3 ? "#7a9a8a" : season === 2 ? "#8a9a4a" : "#5f9a54";
  let m = "";
  const puff = (x, y, r) => circle(x, y, r, c, { s: 1.2 });
  if (mask & 4) m += puff(0, -24, 7);
  if (mask & 1) m += puff(-11, -10, 8);
  if (mask & 2) m += puff(11, -10, 8);
  m += puff(0, -12, 10) + hi(-4, -16, 3, 1.5, 0.35);
  if (season === 0) m += circle(-4, -8, 1.3, "#f8b8c8", { s: 0, w: 0.8 }) + circle(5, -15, 1.3, "#fff4c0", { s: 0, w: 0.8 });
  if (season === 3) m += fill(ellD(0, -20, 7, 2.4), "#fbfdff");
  if (mask & 8) m += puff(0, 2, 7);
  return sprite([-20, -34, 40, 46], [L(m)]);
}

/** Gate: two posts and a swinging board you can walk through. */
function gate(mask, season, w) {
  const horiz = !(mask & 12) || mask & 3;
  let m = "";
  if (horiz) {
    m += part(rrD(-15, -20, 30, 4.5, 2), w, { s: 0.8, w: 1.2 }) + part(rrD(-15, -11, 30, 4.5, 2), w, { s: 0.8, w: 1.2 }) + line("M-13 -9L13 -18", 3, dark(w, 0.12));
    m += part("M-18 0V-22L-14.5 -25L-11 -22V0Z", lite(w, 0.1), { s: 1.2 }) + part("M11 0V-22L14.5 -25L18 -22V0Z", lite(w, 0.1), { s: 1.2 });
    m += circle(10, -13, 1.3, "#e8c86a", { s: 0.4, w: 1 });
  } else {
    m += part(rrD(-2.5, -30, 5, 40, 2), w, { s: 0.8, w: 1.2 }) + part("M-4 -2V-24L0 -28L4 -24V-2Z", lite(w, 0.1), { s: 1.2 });
  }
  if (season === 3) m += snowCap(horiz ? 0 : 0, horiz ? -21 : -25, horiz ? 13 : 3);
  return sprite([-20, -32, 40, 44], [L(m)]);
}

export function scarecrowSprite() {
  let m = line("M0 0V-40M-14 -28H14", 5, INK) + line("M0 0V-40M-14 -28H14", 3, "#9a6a48");
  m += part(rrD(-9, -32, 18, 16, 5), "#7cbfd8", { s: 1.6 }) + part("M-9 -18L-12 -12H12L9 -18Z", "#e8c86a", { s: 0.6, w: 1.1 });
  m += circle(0, -40, 7.5, "#f4e2c4", { s: 1.4 }) + fill(ellD(-2.6, -41, 1.1, 1.3), INK) + fill(ellD(2.6, -41, 1.1, 1.3), INK) + line("M-2.5 -37Q0 -35.5 2.5 -37", 1, INK);
  m += part(ellD(0, -46, 14, 3.4), "#f2d07a", { s: 1 }) + part("M-7 -46C-7 -54 7 -54 7 -46Z", "#f2d07a", { s: 1 }) + fill(rrD(-7, -49, 14, 2.6, 1), "#e8566a");
  m += fill(polyD([[-14, -30], [-18, -26], [-13, -26]]), "#e8c86a") + fill(polyD([[14, -30], [18, -26], [13, -26]]), "#e8c86a");
  return sprite([-22, -58, 44, 62], [L(m, { anim: { type: "sway", pivot: [0, 0], amp: 0.02, speed: 1.4 } })]);
}

export function sprinklerSprite() {
  const c = "#9fb4c4";
  const m = part("M-9 0C-10 -6 -6 -10 0 -10C6 -10 10 -6 9 0Z", c, { s: 1.6 }) + part(rrD(-2, -16, 4, 7, 1.5), "#d8a84a", { s: 0.6, w: 1.2 }) + circle(0, -17, 2.6, "#e8c86a", { s: 0.6, w: 1.2 }) + hi(-4, -6, 2, 1, 0.6);
  return sprite([-14, -22, 28, 26], [L(m)]);
}

/** Preserves jar: glass crock with a wooden lid; `busy` fills it with amber jam. */
export function preservesJarSprite(busy) {
  let m = part(rrD(-10, -24, 20, 24, 6), busy ? "#e8a04a" : "#d4ecf4", { s: 1.6 });
  if (busy) m += fill(ellD(-3, -14, 1.6, 1.6), "#fff2c8", 0.8) + fill(ellD(3, -9, 1.2, 1.2), "#fff2c8", 0.7);
  m += hi(-6, -18, 1.6, 4, 0.6) + part(rrD(-11, -28, 22, 6, 2), "#b07a4a", { s: 0.8 }) + part(rrD(-3, -31, 6, 4, 1.5), "#8a5a3a", { s: 0.4, w: 1.1 });
  return sprite([-15, -35, 30, 38], [L(m)]);
}

/** Mayo machine: a cream box with a hopper and crank; `busy` lights the window. */
export function mayoMachineSprite(busy) {
  let m = part("M-8 -30L8 -30L4 -24H-4Z", "#c8b8a0", { s: 0.8 });
  m += part(rrD(-12, -24, 24, 24, 4), "#efe2c6", { s: 1.8 }) + part(rrD(-6, -18, 12, 8, 2), busy ? "#f6d86a" : "#c8c0b0", { s: 0.6, w: 1.2 });
  m += line("M12 -14H17V-20", 2.2, INK) + circle(17, -21, 2, "#e8566a", { s: 0.4, w: 1 }) + hi(-8, -20, 1.4, 3, 0.5);
  return sprite([-16, -34, 36, 38], [L(m)]);
}

// ── Bicycle ─────────────────────────────────────────────────────────────────

const BIKE = "#e8566a";
const TIRE = "#3a3a44";
/** Seat height the rider sits at, per facing (art units, rider's feet origin). */
export const BIKE_OFFSET = { side: [-3, -12], down: [0, -11], up: [0, -11] };

/**
 * Bicycle with a wicker basket. `under` is drawn beneath the rider and
 * `over` on top (handlebars and basket when it faces you).
 */
export function bikeSprite(sd, layer) {
  const wheel = (x) => circle(x, -7, 7, TIRE, { s: 0.6 }) + circle(x, -7, 4.2, "#c8ccd4", { s: 0, w: 0 }) + circle(x, -7, 1.4, TIRE, { s: 0, w: 0 });
  if (sd === "side") {
    if (layer === "over") return sprite([-22, -30, 44, 32], [L(part(rrD(9, -24, 9, 6, 2), "#c8945a", { s: 0.6, w: 1.2 }) + line("M10 -22H17M10 -20H17", 0.7, dark("#c8945a", 0.35)))]);
    const frame = line("M-11 -7L-3 -17L8 -19L11 -7M-3 -17L0 -7L-11 -7M8 -19L9 -22", 2.6, BIKE);
    return sprite([-22, -30, 44, 32], [L(wheel(-11) + wheel(11) + frame + part(ellD(-4, -18.5, 3.4, 1.4), "#6a4a3a", { s: 0.4, w: 1 }) + line("M6 -22H12", 2, TIRE))]);
  }
  // Facing toward (down) or away (up): one narrow wheel under the rider.
  if (layer === "over") {
    if (sd !== "down") return sprite([-12, -26, 24, 28], [L(line("M-8 -18H8", 2.2, TIRE))]);
    return sprite([-12, -26, 24, 28], [L(line("M-8 -18H8", 2.2, TIRE) + part(rrD(-5, -17, 10, 6, 2), "#c8945a", { s: 0.6, w: 1.2 }))]);
  }
  return sprite([-12, -26, 24, 28], [L(part(ellD(0, -7, 2.4, 7), TIRE, { s: 0.4 }) + line("M0 -14V-18", 2.4, BIKE))]);
}

/** Flat stepping-stone path tile (drawn on the ground layer). */
export function pathTileSprite(season) {
  const c = season === 3 ? "#d8d4dc" : "#d4c8b8";
  let m = "";
  for (const [x, y, rx, ry] of [[9, 9, 7, 5.5], [23, 10, 6.5, 5], [15, 22, 8, 6], [27, 25, 4, 3.5], [4, 23, 3.5, 3]]) m += part(ellD(x, y, rx, ry), c, { s: 1.4, w: 1.1, lo: dark(c, 0.2) });
  return sprite([0, 0, 32, 32], [m]);
}

// ── Interior furniture ──────────────────────────────────────────────────────

export function bedSprite() {
  const q = "#9ad0e8";
  let m = part(rrD(-26, -60, 52, 16, 5), "#b07a4a", { s: 2 });
  m += part(rrD(-24, -48, 48, 48, 6), "#fff6ea", { s: 2 });
  m += part(rrD(-18, -46, 36, 12, 5), "#ffffff", { s: 1.4 });
  m += part(rrD(-24, -32, 48, 32, 6), q, { s: 3 });
  for (let x = -16; x <= 16; x += 16) for (let y = -24; y <= -8; y += 12) m += fill(ellD(x, y, 2.4, 2.4), "#f7b3c8");
  m += line("M-24 -32Q0 -28 24 -32", 1.4, dark(q, 0.3));
  return sprite([-30, -64, 60, 68], [L(m)]);
}

export function tableSprite() {
  const w = "#c98a4a";
  const m = line("M-14 -6V0M14 -6V0", 4, INK) + line("M-14 -6V0M14 -6V0", 2.4, dark(w, 0.25)) + part(ellD(0, -14, 22, 12), w, { s: 3 }) + part(ellD(0, -15, 14, 7), "#fff4ea", { s: 1, w: 1.1 }) + part("M-4 -16C-4 -22 4 -22 4 -16Z", "#9fd4ee", { s: 0.6, w: 1 }) + circle(-2, -24, 2.4, "#f7a6c1", { s: 0.4, w: 1 }) + circle(2, -25, 2.4, "#f6d25a", { s: 0.4, w: 1 });
  return sprite([-26, -30, 52, 34], [L(m)]);
}

export function rugSprite(w = 80, h = 56, c = "#e8a0b0") {
  let m = part(rrD(-w / 2, -h, w, h, h / 2.4), c, { s: 3, w: 1.4 });
  m += `<path d="${rrD(-w / 2 + 6, -h + 6, w - 12, h - 12, h / 3)}" fill="none" stroke="${lite(c, 0.45)}" stroke-width="2.4" stroke-dasharray="4 4"/>`;
  return sprite([-w / 2 - 4, -h - 4, w + 8, h + 8], [m]);
}

export function fireplaceSprite() {
  const s = "#c4a49c";
  let m = part(rrD(-30, -64, 60, 64, 6), s, { s: 3 });
  for (let y = -54; y < 0; y += 12) m += line(`M-30 ${y}H30`, 1, dark(s, 0.3), 0.6);
  m += part(rrD(-34, -70, 68, 10, 4), "#9a6a48", { s: 1.6 }) + part("M-18 0V-26A18 16 0 0 1 18 -26V0Z", "#3a2530", { s: 0, w: 1.4 });
  const fire = fill("M-10 0C-12 -10 -4 -12 -2 -22C2 -14 6 -18 8 -24C12 -14 14 -6 10 0Z", "#f6a33c") + fill("M-5 0C-6 -6 -1 -8 0 -14C3 -8 6 -9 6 -4C6 -1 4 0 4 0Z", "#ffe08a");
  return sprite([-38, -76, 76, 80], [L(m), { markup: fire, anim: { type: "flicker", speed: 2, min: 0.75 }, shade: false }]);
}

export function counterSprite(bread = true) {
  const w = "#c98a4a";
  let m = part(rrD(-48, -30, 96, 30, 4), w, { s: 3 }) + part(rrD(-50, -34, 100, 8, 3), "#f4e2c4", { s: 1.2 });
  for (let x = -40; x < 48; x += 16) m += line(`M${x} -24V-4`, 1, dark(w, 0.3), 0.6);
  if (bread) for (const x of [-34, -14, 26]) m += part(`M${x - 8} -34C${x - 9} -40 ${x - 4} -43 ${x} -43C${x + 4} -43 ${x + 9} -40 ${x + 8} -34Z`, "#e0a060", { s: 1 }) + line(`M${x - 3} -40l2 3M${x + 1} -41l2 3`, 0.9, "#9a6040");
  m += part("M6 -34C6 -40 14 -40 14 -34Z", "#f6d25a", { s: 0.8, w: 1.1 }) + circle(10, -41, 1.4, "#f6d25a", { s: 0, w: 1 });
  return sprite([-54, -48, 108, 52], [L(m)]);
}

export function shelfSprite() {
  const w = "#b07a4a";
  let m = part(rrD(-24, -56, 48, 56, 3), w, { s: 3 });
  for (const y of [-40, -22]) m += part(rrD(-22, y, 44, 4, 1), lite(w, 0.15), { s: 0.6, w: 1 });
  const jars = [["#f7a6c1", -14, -44], ["#9fd4ee", -2, -44], ["#f6d25a", 11, -44], ["#9fd08a", -12, -26], ["#e8a060", 4, -26]];
  for (const [c, x, y] of jars) m += part(rrD(x - 5, y - 9, 10, 10, 3), c, { s: 1, w: 1.1 });
  return sprite([-28, -60, 56, 64], [L(m)]);
}

export function plantSprite() {
  const m = part("M-8 0L-10 -12H10L8 0Z", "#d8805a", { s: 1.4 }) + part(scallopD(0, -22, 12, 10, 7, 4), "#6ab870", { s: 2.4 }) + fill(scallopD(-4, -26, 5, 4, 5, 2), lite("#6ab870", 0.3));
  return sprite([-16, -36, 32, 40], [L(m)]);
}

export function workbenchSprite() {
  const w = "#b07a4a";
  const m = part(rrD(-34, -26, 68, 10, 3), lite(w, 0.1), { s: 1.4 }) + line("M-28 -16V0M28 -16V0", 5, INK) + line("M-28 -16V0M28 -16V0", 3, dark(w, 0.2)) + part("M-20 -26L-14 -30H6L0 -26Z", "#c4d0da", { s: 0.6, w: 1 }) + part(rrD(10, -32, 14, 6, 2), "#e8c86a", { s: 0.6, w: 1 });
  return sprite([-38, -36, 76, 40], [L(m)]);
}

export function sparkleSprite() {
  const m = fill("M0 -7L1.6 -1.6L7 0L1.6 1.6L0 7L-1.6 1.6L-7 0L-1.6 -1.6Z", "#fffbe0");
  return sprite([-8, -8, 16, 16], [{ markup: m, anim: { type: "pulse", speed: 4, min: 0.2, max: 1 } }]);
}

