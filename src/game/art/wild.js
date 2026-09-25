/**
 * Wildwood art: forest creatures (slimes, boars, shroomlings, wisps), the
 * Gloomroot boss and its projectiles, treasure chests, ore nodes, the moon
 * shrine and forest gate, plus ranch animals and market / orchard props.
 * Side views face right (left is drawn flipped); origins sit where the feet
 * touch the ground, except round projectiles, which are centred on theirs.
 */

import { part, limb, oval, circle, hi, fill, line, ellD, rrD, capD, polyD, outlined, sprite, lite, dark, mix, groundShadow, INK } from "./cozy-kit.js";
import { leafD } from "./crops-art.js";
import { FOLIAGE, scallopD } from "./props.js";

const L = (markup, extra = {}) => ({ markup: outlined(markup), ...extra });
const eye = (x, y, r = 1.4) => fill(ellD(x, y, r, r * 1.2), INK) + fill(ellD(x + r * 0.35, y - r * 0.45, r * 0.4, r * 0.4), "#fff");
const blush = (x, y, r = 1.8) => fill(ellD(x, y, r, r * 0.6), "#f27a8a", 0.45);
const leaf = (b, deg, len, w, c) => part(leafD(b, deg, len, w), c, { s: 0.8, w: 1.1 });
const thorn = (x, y, dx, dy, c) => fill(polyD([[x - dy * 0.35, y + dx * 0.35], [x + dx, y + dy], [x + dy * 0.35, y - dx * 0.35]]), c);
/** Emissive (unshaded) glow blob. */
const glow = (cx, cy, rx, ry, c, op = 0.6) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${op}" filter="url(#soft)"/>`;
const sparkle = (x, y, r, c = "#fffbe0") => fill(`M${x} ${y - r}L${x + r * 0.23} ${y - r * 0.23}L${x + r} ${y}L${x + r * 0.23} ${y + r * 0.23}L${x} ${y + r}L${x - r * 0.23} ${y + r * 0.23}L${x - r} ${y}L${x - r * 0.23} ${y - r * 0.23}Z`, c);

const BRAMBLE = "#5e3f55";
const BRAMBLE_LEAF = "#5f9a4a";

// ── Bramble Slime ───────────────────────────────────────────────────────────

/** frame 0 rest, 1 squashed (hop anticipation), 2 stretched mid-hop. */
export function slimeSprite(color = "#7cc86a", frame = 0) {
  const c = color;
  const [w, h, lift] = frame === 1 ? [13.5, 11, 0] : frame === 2 ? [8.5, 21, 3] : [11, 16, 0];
  const y0 = -lift;
  const top = y0 - h;
  const body = `M${-w} ${y0}C${-w - 1.2} ${y0 - h * 0.55} ${-w * 0.6} ${top} 0 ${top}C${w * 0.6} ${top} ${w + 1.2} ${y0 - h * 0.55} ${w} ${y0}C${w * 0.5} ${y0 + 1.6} ${-w * 0.5} ${y0 + 1.6} ${-w} ${y0}Z`;
  const k = w / 11;
  let m = "";
  // Bramble sprig on top: a curled stem with thorns and one leaf.
  const sx = 0.5;
  const sy = top + 1;
  m += line(`M${sx} ${sy}Q${sx - 1} ${sy - 4} ${sx + 2.5} ${sy - 6}`, 3, INK) + line(`M${sx} ${sy}Q${sx - 1} ${sy - 4} ${sx + 2.5} ${sy - 6}`, 1.6, BRAMBLE);
  m += thorn(sx - 0.8, sy - 2.5, -2, -0.6, BRAMBLE) + thorn(sx + 1.4, sy - 5.2, 0.6, -2, BRAMBLE);
  m += leaf([sx + 2.5, sy - 6], 130, 7, 2.4, BRAMBLE_LEAF);
  m += part(body, c, { s: 2.4, lo: dark(c, 0.3) });
  // Jelly: a lighter inner glow near the bottom, glossy highlights up top.
  m += fill(ellD(0, y0 - h * 0.28, w * 0.6, h * 0.2), lite(c, 0.25), 0.7);
  m += hi(-w * 0.5, top + h * 0.28, 2.6 * k, 1.5, 0.8) + hi(-w * 0.2, top + h * 0.16, 0.9, 0.9, 0.8);
  const ey = y0 - h * 0.5;
  m += eye(-3.4 * k, ey, 1.5) + eye(3.4 * k, ey, 1.5);
  m += line(`M${-1.3} ${ey + 2.6}Q0 ${ey + 3.8} 1.3 ${ey + 2.6}`, 1, INK);
  m += blush(-6 * k, ey + 2.2, 1.7) + blush(6 * k, ey + 2.2, 1.7);
  return sprite([-17, -40, 34, 44], [groundShadow(0, 0.5, w * 0.9, 2.4, frame === 2 ? 0.14 : 0.22), L(m)]);
}

// ── Thornback boar ──────────────────────────────────────────────────────────

const BOAR = "#8a5a4a";
const BOAR_D = "#6a4238";
const TUSK = "#f6ecd8";

function spines(pts, c = BRAMBLE) {
  let m = "";
  for (const [x, y, deg, len] of pts) {
    const r = (deg * Math.PI) / 180;
    const tip = [x + Math.sin(r) * len, y + Math.cos(r) * len];
    const px = Math.cos(r) * 2.4;
    const py = -Math.sin(r) * 2.4;
    m += part(polyD([[x - px, y - py], tip, [x + px, y + py]]), c, { s: 0.6, w: 1.1 });
  }
  return m;
}

function boarSide(frame) {
  const c = BOAR;
  const charge = frame === 2;
  const sw = frame === 1 ? 3 : frame === 0 ? -3 : 0;
  let m = "";
  // Curly tail.
  m += line("M-18 -17Q-23 -19 -22 -14Q-21 -11 -24 -12", 2.6, INK) + line("M-18 -17Q-23 -19 -22 -14Q-21 -11 -24 -12", 1.2, dark(c, 0.1));
  const leg = (x, dx, col) => limb([x, -9], [x + dx, -1], 4.2, 3.6, col, { s: 0.8 }) + oval(x + dx + 0.4, -0.9, 2.4, 1.4, "#3a2a2a", { s: 0.4, w: 1 });
  if (charge) m += leg(-13, -5, BOAR_D) + leg(8, 4, BOAR_D);
  else m += leg(-13, sw, BOAR_D) + leg(8, -sw, BOAR_D);
  // Bramble spines along the back (behind the body outline).
  const tilt = charge ? 2 : 0;
  m += spines([[-15, -19 + tilt * 0.2, 215, 7], [-10, -22, 200, 8], [-4, -23.5, 188, 9], [2, -23.5 + tilt * 0.4, 172, 8.5], [7.5, -22 + tilt * 0.6, 158, 7]]);
  m += leaf([-7, -23], 230, 6, 2, BRAMBLE_LEAF) + leaf([4, -23], 140, 5.5, 1.8, BRAMBLE_LEAF);
  m += part(ellD(-2, -14 + tilt * 0.3, 17, 9.5), c, { s: 2, lo: dark(c, 0.3) });
  m += fill(ellD(-1, -8.5, 12, 2.6), lite(c, 0.18), 0.8) + hi(-9, -19, 4, 1.3, 0.35);
  if (charge) m += leg(-8, -6, c) + leg(12, 5, c);
  else m += leg(-8, -sw, c) + leg(12, sw, c);
  // Head: a wedge ending in a flat pink-grey snout; lowered when charging.
  const [hx, hy, rot] = charge ? [1, 5, 22] : [0, 0, 0];
  m += `<g transform="translate(${hx} ${hy}) rotate(${rot} 12 -15)">`;
  m += part(polyD([[13, -22], [15.5, -27.5], [18, -21]]), BOAR_D, { s: 0.6, w: 1.1 });
  m += part("M9 -20C12 -25 18 -23 21 -19L27 -14.5C28.5 -13 28 -9.5 26 -9L18 -7C13 -6.5 9 -9 8.5 -13Z", c, { s: 1.4 });
  m += part(ellD(27, -11.8, 2.2, 3.2), "#c89088", { s: 0.6, w: 1.1 }) + fill(ellD(27.4, -12.8, 0.6, 0.8), INK) + fill(ellD(27.4, -10.6, 0.6, 0.8), INK);
  m += part("M22 -9.5C22.5 -13 24 -15.5 25.5 -16.2C24.8 -14 24.4 -12 24.5 -9.5Z", TUSK, { s: 0.4, w: 1 });
  m += eye(17.5, -17, 1.3) + line(charge ? "M15 -19.6L19.5 -18.4" : "M15.5 -19.4Q17.5 -20.2 19.5 -19.4", 1.1, INK);
  m += part(polyD([[11, -21], [11.5, -27], [15, -22]]), c, { s: 0.6, w: 1.1 });
  m += "</g>";
  if (charge) m += fill(ellD(-22, -3, 3, 2), "#c8b8a8", 0.6) + fill(ellD(-27, -6, 2.2, 1.6), "#c8b8a8", 0.45);
  return sprite([-32, -36, 66, 40], [groundShadow(0, 0, 18, 3), L(m)]);
}

function boarFront(frame) {
  const c = BOAR;
  const charge = frame === 2;
  const lift = (i) => (frame === i ? 2 : 0);
  let m = "";
  m += spines([[-9, -22, 200, 7], [-3, -25, 186, 8], [3, -25, 174, 8], [9, -22, 160, 7]]);
  m += part(ellD(0, -14, 13, 10), dark(c, 0.08), { s: 2 });
  m += limb([-7, -8], [-7, -1 - lift(0)], 4.4, 3.8, BOAR_D, { s: 0.8 }) + oval(-7, -1 - lift(0), 2.6, 1.4, "#3a2a2a", { s: 0.4, w: 1 });
  m += limb([7, -8], [7, -1 - lift(1)], 4.4, 3.8, BOAR_D, { s: 0.8 }) + oval(7, -1 - lift(1), 2.6, 1.4, "#3a2a2a", { s: 0.4, w: 1 });
  const hy = charge ? 3 : 0;
  m += part(polyD([[-9, -17 + hy], [-12, -24 + hy], [-5, -20 + hy]]), c, { s: 0.6, w: 1.1 }) + part(polyD([[9, -17 + hy], [12, -24 + hy], [5, -20 + hy]]), c, { s: 0.6, w: 1.1 });
  m += part(ellD(0, -13 + hy, 9.5, 8.5), c, { s: 1.6 }) + hi(-4, -18 + hy, 2.6, 1.2, 0.4);
  m += eye(-4, -15 + hy, 1.3) + eye(4, -15 + hy, 1.3);
  if (charge) m += line(`M-6.5 ${-18 + hy}L-2 ${-16.6 + hy}M6.5 ${-18 + hy}L2 ${-16.6 + hy}`, 1.2, INK);
  m += part(`M-5 ${-9 + hy}C-6 ${-6 + hy} -5 ${-8.5 + hy} -7.5 ${-12 + hy}C-6.5 ${-10 + hy} -5 ${-10.5 + hy} -3.6 ${-9.5 + hy}Z`, TUSK, { s: 0.3, w: 1 });
  m += part(`M5 ${-9 + hy}C6 ${-6 + hy} 5 ${-8.5 + hy} 7.5 ${-12 + hy}C6.5 ${-10 + hy} 5 ${-10.5 + hy} 3.6 ${-9.5 + hy}Z`, TUSK, { s: 0.3, w: 1 });
  m += part(ellD(0, -8.5 + hy, 5, 3.4), "#c89088", { s: 0.6, w: 1.1 }) + fill(ellD(-1.6, -8.5 + hy, 0.8, 1.1), INK) + fill(ellD(1.6, -8.5 + hy, 0.8, 1.1), INK);
  return sprite([-18, -36, 36, 40], [groundShadow(0, 0, 13, 3), L(m)]);
}

function boarBack(frame) {
  const c = BOAR;
  const lift = (i) => (frame === i ? 2 : 0);
  let m = "";
  m += part(polyD([[-8, -22], [-11, -29], [-4, -24]]), c, { s: 0.6, w: 1.1 }) + part(polyD([[8, -22], [11, -29], [4, -24]]), c, { s: 0.6, w: 1.1 });
  m += limb([-7, -8], [-7, -1 - lift(0)], 4.6, 4, BOAR_D, { s: 0.8 }) + oval(-7, -1 - lift(0), 2.6, 1.4, "#3a2a2a", { s: 0.4, w: 1 });
  m += limb([7, -8], [7, -1 - lift(1)], 4.6, 4, BOAR_D, { s: 0.8 }) + oval(7, -1 - lift(1), 2.6, 1.4, "#3a2a2a", { s: 0.4, w: 1 });
  m += part(ellD(0, -15, 13.5, 11), c, { s: 2 }) + hi(-6, -20, 3, 1.4, 0.35);
  // A ridge of spines down the spine, seen from behind.
  m += spines([[-7, -22, 196, 6], [7, -22, 164, 6], [-3.5, -24.5, 186, 7.5], [3.5, -24.5, 174, 7.5]]);
  m += spines([[0, -16, 180, 5], [0, -10, 180, 4]]);
  m += line("M0 -6Q-3 -4 -1.5 -2Q0 -1 1 -3", 2.6, INK) + line("M0 -6Q-3 -4 -1.5 -2Q0 -1 1 -3", 1.2, dark(c, 0.1));
  return sprite([-18, -36, 36, 40], [groundShadow(0, 0, 13, 3), L(m)]);
}

/** Thornback boar: dir "side" (faces right), "down" or "up"; frames 0-1 walk, 2 charge. */
export function boarSprite(dir = "side", frame = 0) {
  if (dir === "down") return boarFront(frame);
  if (dir === "up") return boarBack(frame);
  return boarSide(frame);
}

// ── Shroomling ──────────────────────────────────────────────────────────────

const CAP = "#c0583a";
const STEM = "#f4e6d0";

export function shroomSprite(frame = 0) {
  const puff = frame === 2;
  const tilt = frame === 1 ? 5 : frame === 0 ? -5 : 0;
  const step = frame === 1 ? 1.6 : frame === 0 ? -1.6 : 0;
  let m = "";
  m += oval(-3.5 + step, -1.2, 3, 1.8, dark(STEM, 0.25), { s: 0.6, w: 1.1 }) + oval(3.5 - step, -1.2, 3, 1.8, dark(STEM, 0.25), { s: 0.6, w: 1.1 });
  m += `<g transform="rotate(${tilt} 0 -2)">`;
  m += limb([-5, -8], [-8.5, puff ? -12 : -5], 2.4, 2, STEM, { s: 0.5, w: 1.1 }) + limb([5, -8], [8.5, puff ? -12 : -5], 2.4, 2, STEM, { s: 0.5, w: 1.1 });
  m += part(rrD(-6, -14, 12, 13, 5), STEM, { s: 1.4 });
  m += eye(-2.3, -8, 1.1) + eye(2.3, -8, 1.1) + blush(-4, -5.8, 1.2) + blush(4, -5.8, 1.2);
  m += puff ? part("M-1.2 -5.2C-1.2 -3.2 1.2 -3.2 1.2 -5.2Z", "#8a3a3a", { s: 0, w: 0.9 }) : line("M-1 -5Q0 -4.2 1 -5", 0.9, INK);
  const [cw, ch, cy] = puff ? [12.5, 7, -12] : [10.5, 10, -12.5];
  m += part(`M${-cw} ${cy}C${-cw - 1} ${cy - ch * 0.8} ${-cw * 0.5} ${cy - ch} 0 ${cy - ch}C${cw * 0.5} ${cy - ch} ${cw + 1} ${cy - ch * 0.8} ${cw} ${cy}C${cw * 0.5} ${cy + 2} ${-cw * 0.5} ${cy + 2} ${-cw} ${cy}Z`, CAP, { s: 1.8 });
  for (const [x, y, r] of [[-5.5, 0.35, 1.7], [1, 0.62, 2], [6, 0.3, 1.4], [-1.5, 0.2, 1]]) m += fill(ellD(x * (cw / 10.5), cy - ch * y, r, r * 0.85), "#fff4e4");
  m += hi(-cw * 0.55, cy - ch * 0.62, 1.8, 1, 0.5);
  m += "</g>";
  const layers = [groundShadow(0, 0, 9, 2.2), L(m)];
  if (puff) {
    let s = "";
    for (const [x, y, r] of [[-11, -24, 2.6], [-5, -28, 2], [3, -29, 2.8], [10, -25, 2.2], [13, -19, 1.6], [-14, -18, 1.6]]) s += circle(x, y, r, "#d8e86a", { s: 0.6, w: 1 }) + fill(ellD(x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.35), "#fff", 0.7);
    layers.push({ markup: s, anim: { type: "float", amp: 1.2, speed: 5 } });
  }
  return sprite([-17, -33, 34, 37], layers);
}

// ── Gloom Wisp ──────────────────────────────────────────────────────────────

const WISP = "#5a3a8a";
const WISP_IN = "#9a78d8";

export function wispSprite(frame = 0) {
  const charge = frame === 2;
  const cy = -18;
  const tips = frame === 1 ? [[-5, -34], [1, -38], [6, -33]] : [[-6, -33], [0, -37], [5, -35]];
  const [a, b, c] = tips;
  const body = `M-8 ${cy}C-10 ${cy - 6} -8 ${cy - 10} ${a[0]} ${a[1]}C-3 ${cy - 11} -2 ${cy - 12} ${b[0]} ${b[1]}C2 ${cy - 12} 3 ${cy - 11} ${c[0]} ${c[1]}C8 ${cy - 10} 10 ${cy - 6} 8.5 ${cy}C8 ${cy + 6} 3 ${cy + 9} 0 ${cy + 9}C-3 ${cy + 9} -8 ${cy + 6} -8 ${cy}Z`;
  let m = part(body, WISP, { s: 2.4, lo: dark(WISP, 0.35) });
  m += fill(`M-5 ${cy + 1}C-6 ${cy - 4} -3 ${cy - 7} -1 ${cy - 12}C1 ${cy - 7} 5 ${cy - 5} 5 ${cy + 1}C5 ${cy + 5} 2 ${cy + 6} 0 ${cy + 6}C-2 ${cy + 6} -5 ${cy + 5} -5 ${cy + 1}Z`, charge ? lite(WISP_IN, 0.35) : WISP_IN, 0.75);
  m += hi(-5, cy - 5, 1.5, 2.2, 0.35);
  const eyes =
    fill(ellD(-3, cy - 1, 1.8, 2.4), charge ? "#fff8c8" : "#e8f4ff") + fill(ellD(3, cy - 1, 1.8, 2.4), charge ? "#fff8c8" : "#e8f4ff") +
    fill(ellD(-3, cy - 1, 0.8, 1.2), charge ? "#f6c63c" : "#8ad8f0") + fill(ellD(3, cy - 1, 0.8, 1.2), charge ? "#f6c63c" : "#8ad8f0");
  const aura = glow(0, cy - 2, charge ? 14 : 11, charge ? 16 : 13, charge ? "#c8a0ff" : "#8a6ac8", charge ? 0.7 : 0.45);
  const core = charge ? glow(0, cy + 1, 5, 6, "#fff4ff", 0.9) : "";
  const float = { type: "float", amp: 1.6, speed: 2.6 };
  return sprite([-18, -42, 36, 46], [
    groundShadow(0, 0, 7, 2, 0.14),
    { markup: aura, anim: { ...float }, shade: false, opacity: 0.9 },
    L(m, { anim: { ...float } }),
    { markup: core + eyes, anim: { ...float }, shade: false },
  ]);
}

// ── The Gloomroot (boss) ────────────────────────────────────────────────────

/** frame 0 idle, 1 attack (branches raised); `enraged` darkens the bark and reddens the glow. */
export function gloomrootSprite(frame = 0, enraged = false) {
  const bark = enraged ? "#4a3036" : "#6a5058";
  const bd = dark(bark, 0.3);
  const gl = enraged ? "#ff5a4a" : "#c890ff";
  const glCore = enraged ? "#ffd0a0" : "#f4e8ff";
  const vine = enraged ? "#6a2a4a" : "#4a2e6a";
  const atk = frame === 1;
  // Root tendrils splayed across the ground.
  let roots = "";
  for (const [x0, x1, y1, w] of [[-14, -54, -2, 9], [-8, -38, 5, 8], [14, 55, -3, 9], [8, 36, 6, 8], [-2, -18, 8, 6], [4, 20, 9, 6]]) {
    roots += part(`M${x0 - w / 2} -10Q${(x0 + x1) / 2} ${y1 - 12} ${x1} ${y1}Q${(x0 + x1) / 2 + (x1 > 0 ? -2 : 2)} ${y1 - 4} ${x0 + w / 2} -4Z`, bark, { s: 1.4, lo: bd });
  }
  // Gnarled trunk.
  let t = "";
  t += part("M-26 -4C-22 -20 -24 -44 -20 -64C-17 -80 -22 -92 -16 -104L16 -104C21 -92 17 -78 20 -64C24 -44 22 -20 27 -4C14 2 -14 2 -26 -4Z", bark, { s: 4, lo: bd });
  t += line("M-14 -12Q-10 -30 -15 -48M12 -16Q16 -36 11 -56M-6 -70Q-9 -84 -4 -98M8 -76Q10 -88 6 -100", 1.4, bd, 0.8);
  t += hi(-15, -60, 2.2, 9, 0.18);
  // Corrupted vines wound around the trunk, with thorns.
  t += line("M-24 -20C-10 -26 10 -16 24 -26M-22 -82C-8 -90 8 -78 20 -88", 3.4, INK) + line("M-24 -20C-10 -26 10 -16 24 -26M-22 -82C-8 -90 8 -78 20 -88", 2, vine);
  for (const [x, y, dx, dy] of [[-12, -23, -1, -2.4], [8, -21, 1, 2.4], [-8, -87, -1, -2.4], [10, -83, 1, 2.4]]) t += thorn(x, y, dx, dy, vine);
  // Face: hollow brows, glowing slit eyes (glow layer) and a jagged hollow mouth.
  t += part("M-17 -86C-12 -92 -4 -90 -2 -84C-7 -84 -13 -83 -17 -86Z", bd, { s: 0.6, w: 1.2 }) + part("M17 -86C12 -92 4 -90 2 -84C7 -84 13 -83 17 -86Z", bd, { s: 0.6, w: 1.2 });
  t += fill(ellD(-9, -80, 5.5, 3.6), "#1e1420") + fill(ellD(9, -80, 5.5, 3.6), "#1e1420");
  const mouth = atk ? "M-10 -68L-6 -64L-3 -68L0 -63L3 -68L6 -64L10 -68C9 -58 -9 -58 -10 -68Z" : "M-9 -67L-5 -65L-2 -67.5L1 -65L4 -67.5L7 -65L9 -67C7 -62 -7 -62 -9 -67Z";
  t += part(mouth, "#1e1420", { s: 0, w: 1.3 });
  // Chest cavity that holds the heart-crystal.
  t += part("M-10 -48C-10 -58 10 -58 10 -48C10 -38 4 -34 0 -34C-4 -34 -10 -38 -10 -48Z", "#1e1420", { s: 0, w: 1.4 });
  // Branch-arms: droop outward idle, thrown up when attacking.
  const arm = (s) => {
    const sx = s * 16;
    const sy = -76;
    const el = atk ? [s * 36, -106] : [s * 40, -70];
    const hand = atk ? [s * 44, -126] : [s * 52, -54];
    let a = limb([sx, sy], el, 11, 8, bark, { s: 1.6, lo: bd }) + limb(el, hand, 8, 4, bark, { s: 1.2, lo: bd });
    const fingers = atk ? [[s * 50, -130], [s * 40, -133], [s * 50, -120]] : [[s * 58, -50], [s * 54, -46], [s * 50, -47]];
    for (const fp of fingers) a += limb(hand, fp, 3.6, 1.6, bark, { s: 0.6, w: 1.2, lo: bd });
    a += leaf(atk ? [s * 30, -98] : [s * 30, -74], s > 0 ? 150 : 210, 8, 2.6, vine);
    return a;
  };
  // Twisted crown with a few blighted leaves.
  let crown = "";
  const br = "M-6 -102C-10 -114 -20 -118 -26 -128M-2 -104C0 -116 -4 -124 -2 -134M6 -102C12 -112 22 -114 28 -124M10 -104C18 -106 26 -104 32 -110";
  crown += line(br, 6, INK) + line(br, 4, bark);
  for (const [x, y, d] of [[-26, -128, 200], [-2, -134, 180], [28, -124, 160], [32, -110, 140], [-18, -120, 230]]) crown += leaf([x, y], d, 8, 3, vine);
  // Glow: eyes and the heart crystal (emissive, pulsing).
  let g = glow(0, -47, 13, 14, gl, 0.55);
  g += part(polyD([[0, -58], [6, -48], [0, -36], [-6, -48]]), gl, { s: 1.2, lo: mix(gl, "#3a1a4a", 0.35), w: 1.3 });
  g += fill(polyD([[0, -55], [3, -48], [0, -41], [-2, -48]]), glCore, 0.9) + hi(-2, -51, 1, 2, 0.8);
  let eyes = fill(ellD(-9, -80, 3.6, 1.6), glCore) + fill(ellD(9, -80, 3.6, 1.6), glCore) + glow(-9, -80, 6, 4, gl, 0.7) + glow(9, -80, 6, 4, gl, 0.7);
  // Drifting gloom motes.
  let motes = "";
  for (const [x, y, r] of [[-38, -92, 2.2], [40, -84, 1.8], [-30, -40, 1.6], [34, -30, 2], [0, -120, 1.6]]) motes += fill(ellD(x, y, r, r), gl, 0.7);
  const armAnim = atk ? {} : { anim: { type: "sway", pivot: [0, -76], amp: 0.02, speed: 1.4 } };
  return sprite([-66, -150, 132, 162], [
    groundShadow(0, 2, 56, 8, 0.25),
    L(roots),
    L(crown, { anim: { type: "sway", pivot: [0, -100], amp: 0.015, speed: 1.2 } }),
    L(arm(-1) + arm(1), armAnim),
    L(t),
    { markup: g, anim: { type: "pulse", speed: enraged ? 6 : 3, min: 0.7, max: 1 }, shade: false },
    { markup: eyes, anim: { type: "pulse", speed: enraged ? 5 : 2, min: 0.75, max: 1 }, shade: false },
    { markup: motes, anim: { type: "float", amp: 3, speed: 1.3 }, shade: false },
  ]);
}

// ── Projectiles ─────────────────────────────────────────────────────────────

/** "spore" and "gloom" are centred on the origin; "root" stands on it. */
export function projectileSprite(kind) {
  if (kind === "root") {
    const c = "#6a5058";
    let m = part("M-4 0C-3 -6 -2 -12 1 -17C2 -11 4 -5 5 0Z", c, { s: 1.2, lo: dark(c, 0.3) });
    m += thorn(-2.4, -6, -2.4, -1, c) + thorn(2.8, -9, 2.2, -1.2, c) + hi(-1, -9, 0.6, 2.4, 0.3);
    m += part(ellD(-6, -0.5, 3.2, 2), "#8a6a50", { s: 0.6, w: 1.1 }) + part(ellD(6.5, -0.2, 3, 1.8), "#8a6a50", { s: 0.6, w: 1.1 }) + part(ellD(0, 0.5, 2.4, 1.4), "#9a7a5a", { s: 0.4, w: 1 });
    return sprite([-11, -20, 22, 23], [groundShadow(0, 0.5, 8, 2), L(m)]);
  }
  if (kind === "gloom") {
    const m = glow(0, 0, 7, 7, "#a878ff", 0.6) + circle(0, 0, 4.4, "#6a44b0", { s: 1, w: 1.2, lo: "#4a2e80" }) + fill(ellD(0, 0, 2.2, 2.2), "#f0e4ff") + hi(-1.8, -1.8, 1, 0.8, 0.9);
    return sprite([-8, -8, 16, 16], [{ markup: m, anim: { type: "pulse", speed: 12, min: 0.8, max: 1 }, shade: false }]);
  }
  const c = "#c8dc5a";
  let m = circle(-2, 1, 3.2, c, { s: 0.8, w: 1.1 }) + circle(2.4, 0.6, 3.4, c, { s: 0.8, w: 1.1 }) + circle(0, -2, 3.6, lite(c, 0.1), { s: 0.8, w: 1.1 });
  m += hi(-1.2, -3.2, 1.2, 0.8, 0.8) + fill(ellD(2.6, 1.6, 0.7, 0.7), "#fff8c0");
  return sprite([-8, -8, 16, 16], [m]);
}

// ── Treasure chest ──────────────────────────────────────────────────────────

export function chestSprite(open = false, rare = false) {
  const wood = rare ? "#7a5aa8" : "#a86a3e";
  const band = rare ? "#f2c24a" : "#8a8a9a";
  let back = "";
  let m = "";
  if (open) {
    // Lid swung back: we see its dark inside face above the box.
    back += part("M-13 -14L-12 -28C-6 -31 6 -31 12 -28L13 -14Z", dark(wood, 0.15), { s: 1.2 }) + fill("M-10.5 -15L-9.8 -26C-5 -28 5 -28 9.8 -26L10.5 -15Z", dark(wood, 0.45));
    back += line("M-12.6 -21H12.6", 2, band);
  }
  m += part(rrD(-13, -15, 26, 15, 3), wood, { s: 1.8 });
  m += line("M-13 -7.5H13", 0.9, dark(wood, 0.35), 0.8);
  m += part(rrD(-10, -15, 3.4, 15, 1), band, { s: 0.5, w: 1 }) + part(rrD(6.6, -15, 3.4, 15, 1), band, { s: 0.5, w: 1 });
  if (open) {
    m += part(rrD(-12, -17, 24, 4, 1.5), dark(wood, 0.5), { s: 0, w: 1.1 });
    m += fill(ellD(0, -16.5, 10, 2.6), rare ? "#fff0a8" : "#f6d86a", 0.9);
    m += circle(-4, -17, 2.2, "#f6c63c", { s: 0.5, w: 1 }) + circle(1, -17.6, 2.4, "#f6c63c", { s: 0.5, w: 1 }) + circle(5, -16.8, 2, rare ? "#b8e0ff" : "#f6c63c", { s: 0.5, w: 1 });
  } else {
    m += part("M-13 -15C-13 -24 13 -24 13 -15Z", lite(wood, 0.08), { s: 1.4 });
    m += part("M-10 -15C-10 -22.6 -6.6 -22.8 -6.6 -22.8V-15Z", band, { s: 0.4, w: 1 }) + part("M10 -15C10 -22.6 6.6 -22.8 6.6 -22.8V-15Z", band, { s: 0.4, w: 1 });
    m += hi(-5, -20, 3, 1, 0.45);
  }
  m += part(rrD(-3, -17, 6, 7, 1.5), band, { s: 0.6, w: 1.1 }) + fill(ellD(0, -13.8, 0.9, 1.2), INK);
  if (rare) m += fill(ellD(0, -16, 0.9, 0.9), "#e8566a");
  const layers = [groundShadow(0, 0, 14, 2.6), L(back + m)];
  if (open) {
    layers.push({ markup: glow(0, -20, 11, 6, "#fff4b0", 0.6) + sparkle(-6, -24, 3) + sparkle(5, -28, 3.6) + sparkle(1, -22, 2), anim: { type: "pulse", speed: 4, min: 0.5, max: 1 }, shade: false });
  }
  return sprite([-17, -33, 34, 36], layers);
}

// ── Ore nodes ───────────────────────────────────────────────────────────────

const ORES = {
  amber: { rock: "#a89c9c", gem: "#f0a040" },
  moonstone: { rock: "#9a98ac", gem: "#c8e4ff" },
  iron: { rock: "#8e8a94", gem: null },
};

const crystal = (x, y, deg, len, w, c) => {
  const r = (deg * Math.PI) / 180;
  const tip = [x + Math.sin(r) * len, y - Math.cos(r) * len];
  const nx = Math.cos(r) * w;
  const ny = Math.sin(r) * w;
  const sh = [x + Math.sin(r) * len * 0.75, y - Math.cos(r) * len * 0.75];
  return part(polyD([[x - nx, y - ny], [sh[0] - nx, sh[1] - ny], tip, [sh[0] + nx, sh[1] + ny], [x + nx, y + ny]]), c, { s: 1, w: 1.2 }) + fill(polyD([[x - nx * 0.4, y - ny * 0.4], [sh[0] - nx * 0.4, sh[1] - ny * 0.4], tip, [sh[0], sh[1]], [x, y]]), lite(c, 0.45), 0.6);
};

/** Resource rock: "amber", "moonstone" or "iron". */
export function oreSprite(kind = "iron") {
  const o = ORES[kind] ?? ORES.iron;
  const c = o.rock;
  let back = "";
  if (o.gem) back += crystal(-6, -14, -18, 13, 3.2, o.gem) + crystal(3, -15, 12, 16, 3.6, o.gem);
  let m = part("M-14 0C-17 -7 -12 -17 -2 -17C8 -18 16 -10 14 0C9 3 -9 3 -14 0Z", c, { s: 2.6, lo: dark(c, 0.3) });
  m += hi(-7, -11, 4, 1.8, 0.45) + line("M4 -12L6 -7L4 -3", 1.1, dark(c, 0.45));
  if (o.gem) m += crystal(9, -5, 40, 9, 2.6, o.gem) + crystal(-10, -4, -40, 7, 2.2, o.gem);
  else for (const [x, y, r] of [[-7, -6, 1.6], [3, -9, 1.3], [8, -4, 1.8], [-2, -3, 1.1], [-4, -12, 1]]) m += fill(ellD(x, y, r, r * 0.8), "#b8683a") + fill(ellD(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.3), "#e8a070", 0.8);
  if (!o.gem) m += fill(ellD(6, -12, 2.4, 1), "#e8eef4", 0.7);
  const layers = [L(back + m)];
  if (kind === "moonstone") layers.unshift({ markup: glow(0, -16, 14, 12, "#b8dcff", 0.5), anim: { type: "pulse", speed: 2, min: 0.5, max: 1 }, shade: false });
  return sprite([-19, -36, 38, 40], layers);
}

// ── Moon shrine ─────────────────────────────────────────────────────────────

export function shrineSprite(cleansed = false) {
  const st = cleansed ? "#c8c2cc" : "#9e96a6";
  const sd = dark(st, 0.3);
  const vine = cleansed ? "#6aae5a" : "#4a2e6a";
  let m = "";
  // Stepped base.
  m += part(rrD(-48, -8, 96, 8, 3), dark(st, 0.08), { s: 1.4, lo: sd }) + part(rrD(-40, -14, 80, 7, 3), st, { s: 1.2, lo: sd });
  // Pillars (the right one broken off lower), and the arch between them.
  const pillar = (x, h) => part(rrD(x - 7, -14 - h, 14, h, 2), st, { s: 2, lo: sd }) + part(rrD(x - 9, -18 - h, 18, 6, 2), lite(st, 0.1), { s: 1, lo: sd }) + line(`M${x - 3} ${-20 - h + 10}V-18M${x + 3} ${-20 - h + 14}V-20`, 1, sd, 0.6);
  m += pillar(-32, 62) + pillar(32, 62);
  m += line("M28 -40L31 -46L29 -52M-36 -60L-33 -64", 1.1, sd, 0.9);
  m += part("M-41 -76C-38 -106 38 -106 41 -76L31 -76C28 -96 -28 -96 -31 -76Z", st, { s: 2, lo: sd });
  m += fill(polyD([[33, -90], [39, -86], [37, -80], [32, -83]]), dark(st, 0.45));
  m += part(polyD([[34, -2], [41, -3], [43, 3], [35, 4]]), dark(st, 0.08), { s: 0.6, w: 1.1, lo: sd });
  // Crescent on the keystone.
  const moon = cleansed ? "#fff0a8" : "#8a8494";
  m += part("M2 -120C-12 -120 -14 -98 2 -96C-5 -100 -6 -116 2 -120Z", moon, { s: 1, lo: dark(moon, 0.2) });
  m += part(rrD(-8, -98, 16, 7, 2), st, { s: 1, lo: sd });
  // Altar in the middle.
  m += part(rrD(-9, -30, 18, 16, 2), st, { s: 1.4, lo: sd }) + part(rrD(-12, -34, 24, 5, 2), lite(st, 0.08), { s: 0.8, lo: sd });
  m += cleansed ? circle(0, -38, 3.4, "#fff0a8", { s: 0.6, w: 1.1 }) : part(polyD([[0, -44], [3.5, -37], [0, -34], [-3.5, -37]]), "#5a3a8a", { s: 0.8, w: 1.1 });
  // Vines up the pillars.
  const v = "M-38 -14C-26 -30 -38 -44 -27 -58C-34 -68 -30 -76 -36 -84M38 -14C27 -26 38 -38 27 -50C31 -56 34 -60 38 -64";
  m += line(v, 3.4, INK) + line(v, 2, vine);
  const leaves = [[-31, -24, 130], [-34, -44, 230], [-28, -58, 140], [-34, -76, 220], [33, -22, 220], [30, -42, 140], [34, -58, 220]];
  for (const [x, y, d] of leaves) m += leaf([x, y], d, 6, 2.2, cleansed ? lite(vine, 0.1) : vine);
  if (cleansed) {
    for (const [x, y, c] of [[-44, -9, "#f7a6c1"], [-24, -16, "#fff2a8"], [22, -16, "#b8d8f8"], [42, -9, "#f7a6c1"], [-31, -44, "#fff2a8"], [30, -52, "#f7a6c1"], [-6, -16, "#f7a6c1"], [8, -16, "#fff2a8"]]) m += circle(x, y, 2.6, c, { s: 0.5, w: 1 }) + fill(ellD(x, y, 0.9, 0.9), "#f6b93c");
  } else {
    for (const [x, y, dx, dy] of [[-33, -34, -2.4, -1], [-30, -66, 2.4, -1], [32, -32, 2.4, -1], [-27, -52, 2, 1.4]]) m += thorn(x, y, dx, dy, vine);
  }
  const layers = [L(m)];
  if (cleansed) {
    layers.unshift({ markup: glow(0, -60, 32, 44, "#fff4c8", 0.35), shade: false });
    layers.push({ markup: glow(-7, -106, 9, 12, "#fff0a8", 0.7) + glow(0, -38, 6, 6, "#fff6c8", 0.8) + sparkle(-16, -108, 2.6) + sparkle(8, -114, 2), anim: { type: "pulse", speed: 1.6, min: 0.6, max: 1 }, shade: false });
  } else {
    let g = "";
    for (const [x, y, rx, ry] of [[-20, -10, 20, 5], [18, -8, 22, 5], [0, -26, 14, 6], [-36, -50, 7, 10]]) g += glow(x, y, rx, ry, "#4a2a6a", 0.5);
    for (const [x, y] of [[-14, -48], [12, -60], [-4, -72]]) g += fill(ellD(x, y, 1.6, 1.6), "#9a70d8", 0.8);
    layers.push({ markup: g, anim: { type: "float", amp: 2, speed: 0.9 } });
  }
  return sprite([-52, -124, 104, 130], layers);
}

// ── Forest gate arch ────────────────────────────────────────────────────────

export function archSprite() {
  const w = "#9a6a48";
  const wl = lite(w, 0.12);
  let m = "";
  // Log posts and a crossbeam with a little shingled cap.
  m += part(rrD(-45, -86, 10, 88, 4), w, { s: 2, lo: dark(w, 0.3) }) + part(rrD(35, -86, 10, 88, 4), w, { s: 2, lo: dark(w, 0.3) });
  m += line("M-41 -76V-10M39 -70V-14", 1, dark(w, 0.35), 0.7);
  m += part(capD([-52, -84], [52, -84], 9, 9), wl, { s: 1.4, lo: dark(w, 0.25) }) + oval(-52, -84, 3, 4.5, "#e8c08a", { s: 0.5, w: 1.1 }) + oval(52, -84, 3, 4.5, "#e8c08a", { s: 0.5, w: 1.1 });
  m += part("M-48 -89L-40 -100H40L48 -89Z", "#5f8a5a", { s: 1.6, lo: dark("#5f8a5a", 0.3) }) + line("M-36 -94q4 3 8 0q4 3 8 0q4 3 8 0q4 3 8 0q4 3 8 0q4 3 8 0q4 3 8 0q4 3 8 0q4 3 8 0", 1, dark("#5f8a5a", 0.3), 0.7);
  // Diagonal braces.
  m += line("M-40 -64L-26 -80M40 -64L26 -80", 5, INK) + line("M-40 -64L-26 -80M40 -64L26 -80", 3, w);
  // Hanging blank sign on two ropes.
  m += line("M-16 -80V-70M16 -80V-70", 1.1, "#c8a878");
  m += part(rrD(-24, -71, 48, 15, 3), "#d8a870", { s: 1.6 }) + line("M-22 -63.5H22", 0.8, dark("#d8a870", 0.3), 0.6) + circle(-16, -68, 1, "#8a8a9a", { s: 0, w: 0.8 }) + circle(16, -68, 1, "#8a8a9a", { s: 0, w: 0.8 });
  // Ivy tufts climbing the posts.
  for (const [x, y, d] of [[-45, -20, 230], [-35, -34, 130], [-45, -48, 220], [35, -18, 130], [45, -30, 140], [35, -46, 220]]) m += leaf([x, y], d, 6, 2.2, "#6aae5a");
  // Lanterns hung from brackets on the posts' outer side.
  const lantern = (x) => line(`M${x} -72H${x + Math.sign(x) * 6}V-68`, 1.6, INK) + part(`M${x + Math.sign(x) * 6 - 4} -68H${x + Math.sign(x) * 6 + 4}L${x + Math.sign(x) * 6 + 3} -58H${x + Math.sign(x) * 6 - 3}Z`, "#fff0b8", { s: 0.8, w: 1.2 }) + part(rrD(x + Math.sign(x) * 6 - 4.5, -58, 9, 2.6, 1), "#4a4a5a", { s: 0, w: 1 }) + part(polyD([[x + Math.sign(x) * 6 - 5, -68], [x + Math.sign(x) * 6, -72], [x + Math.sign(x) * 6 + 5, -68]]), "#4a4a5a", { s: 0, w: 1 });
  m += lantern(-45) + lantern(45);
  const lights = glow(-51, -63, 7, 7, "#ffd88a", 0.7) + glow(51, -63, 7, 7, "#ffd88a", 0.7);
  return sprite([-62, -106, 124, 112], [L(m), { markup: lights, anim: { type: "flicker", speed: 1.5, min: 0.7 }, shade: false }]);
}

// ── Ranch animals ───────────────────────────────────────────────────────────

const COW = "#f6f0e8";
const PATCH = "#3a3438";

/** Side view facing right; frame 0 stand, 1 walking / grazing (head down). */
export function cowSprite(frame = 0) {
  const c = COW;
  const g = frame === 1;
  const sw = g ? 2.5 : 0;
  const tail = L(line("M-19 -24Q-24 -20 -23 -10", 2.8, INK) + line("M-19 -24Q-24 -20 -23 -10", 1.4, c) + part(ellD(-23, -9, 1.8, 2.8), PATCH, { s: 0.4, w: 1 }), { anim: { type: "sway", pivot: [-19, -24], amp: 0.2, speed: 2.4 } });
  const leg = (x, dx, col) => limb([x, -14], [x + dx, -2], 5, 4.4, col, { s: 0.8 }) + part(rrD(x + dx - 2.6, -3, 5.2, 3, 1), "#5a4a4a", { s: 0.3, w: 1 });
  let m = "";
  m += leg(-14, -sw, dark(c, 0.12)) + leg(9, sw, dark(c, 0.12));
  m += part(rrD(-20, -32, 38, 20, 9), c, { s: 2.2 });
  m += fill("M-12 -31.6C-8 -28 -4 -26 -6 -21C-10 -18 -14 -22 -17 -24C-19.5 -27 -18 -31 -12 -31.6Z", PATCH) + fill("M4 -32C6 -27 12 -26 13 -22C10 -19 5 -20 2 -24C0 -27 1 -31 4 -32Z", PATCH) + fill(ellD(-4, -15, 4, 2.4), PATCH);
  m += hi(-12, -28, 5, 1.4, 0.4);
  m += part(ellD(-2, -12, 4.6, 2.6), "#f4a8b4", { s: 0.6, w: 1.1 });
  m += leg(-9, sw, c) + leg(13, -sw, c);
  const [hx, hy, rot] = g ? [3, 12, 30] : [0, 0, 0];
  m += `<g transform="translate(${hx} ${hy}) rotate(${rot} 19 -30)">`;
  m += part(polyD([[14.5, -36], [12, -40.5], [16.5, -37.5]]), "#f0e0b8", { s: 0.4, w: 1 }) + part(polyD([[22, -37], [24, -41.5], [20, -37.5]]), "#f0e0b8", { s: 0.4, w: 1 });
  m += part(ellD(12.5, -33, 3.6, 1.8), c, { s: 0.6, w: 1.1 });
  m += part(rrD(15, -37, 11, 14, 5), c, { s: 1.4 }) + fill("M15.8 -35C18 -37 21 -37 22 -35C21 -32 17 -31 15.6 -32Z", PATCH);
  m += part(rrD(19, -28, 9.5, 7, 3.2), "#f4b8c0", { s: 0.8, w: 1.1 }) + fill(ellD(26, -25.5, 0.7, 1), INK) + eye(22, -31.5, 1.3);
  m += "</g>";
  return sprite([-30, -46, 62, 50], [groundShadow(0, 0, 18, 3), tail, L(m)]);
}

export function sheepSprite(frame = 0) {
  const g = frame === 1;
  const sw = g ? 2 : 0;
  const face = "#4a3a3a";
  const wool = "#f6ecd8";
  let m = "";
  const leg = (x, dx) => limb([x, -9], [x + dx, -1], 3, 2.6, face, { s: 0.4, w: 1.2 });
  m += leg(-8, -sw) + leg(6, sw);
  m += part(scallopD(-1, -16, 14, 9.5, 11, 3, 0.7), wool, { s: 2, lo: dark(wool, 0.22) });
  m += fill(scallopD(-4, -19, 7, 4.5, 7, 5, 0.7), lite(wool, 0.4), 0.9);
  m += leg(-4, sw) + leg(9, -sw);
  const [hx, hy, rot] = g ? [2, 9, 35] : [0, 0, 0];
  m += `<g transform="translate(${hx} ${hy}) rotate(${rot} 12 -20)">`;
  m += part(ellD(10.5, -21, 3.6, 1.8), face, { s: 0.4, w: 1.1 });
  m += part("M12 -25C15 -27 20 -25 21.5 -21C22.5 -18 21 -15.5 18.5 -15.5C15 -15.5 12 -18 11.5 -21Z", face, { s: 1 });
  m += part(scallopD(14, -25.5, 4.2, 2.8, 6, 2, 0.7), wool, { s: 0.6, w: 1.1 });
  m += fill(ellD(20.6, -18.4, 0.6, 0.6), "#1e1418") + fill(ellD(17.5, -21.5, 1.1, 1.3), "#f4ece0") + fill(ellD(17.8, -21.4, 0.6, 0.8), INK);
  m += "</g>";
  return sprite([-20, -32, 46, 36], [groundShadow(0, 0, 13, 2.6), L(m)]);
}

// ── Market & farm props ─────────────────────────────────────────────────────

function stripes(x, y, w, cols, n = 6) {
  let m = "";
  const sw = w / n;
  for (let i = 0; i < n; i++) m += fill(`M${x + i * sw} ${y}H${x + (i + 1) * sw}V${y + 8}A${sw / 2} ${sw / 2.4} 0 0 1 ${x + i * sw} ${y + 8}Z`, cols[i % 2]);
  let edge = `M${x} ${y}H${x + w}V${y + 8}`;
  for (let i = n - 1; i >= 0; i--) edge += `A${sw / 2} ${sw / 2.4} 0 0 1 ${x + i * sw} ${y + 8}`;
  return m + `<path d="${edge}Z" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
}

/** Sloped striped canopy from y0 (back) to y1 (front edge), half-width hw. */
function canopy(hw, y0, y1, cols) {
  let m = part(`M${-hw + 4} ${y0}H${hw - 4}L${hw} ${y1}H${-hw}Z`, cols[0], { s: 1.4 });
  const n = 6;
  for (let i = 1; i < n; i += 2) {
    const a = -hw + ((2 * hw) / n) * i;
    const b = a + (2 * hw) / n;
    const ta = -hw + 4 + ((2 * hw - 8) / n) * i;
    const tb = ta + (2 * hw - 8) / n;
    m += fill(`M${ta} ${y0 + 0.7}H${tb}L${b} ${y1}H${a}Z`, cols[1]);
  }
  return m + `<path d="M${-hw + 4} ${y0}H${hw - 4}L${hw} ${y1}H${-hw}Z" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>` + stripes(-hw, y1, hw * 2, cols);
}

const crate = (x, w, y, c = "#c98a4a") => part(rrD(x - w / 2, y - 10, w, 10, 1.5), c, { s: 1, w: 1.2 }) + line(`M${x - w / 2 + 1} ${y - 5}H${x + w / 2 - 1}`, 0.8, dark(c, 0.35), 0.8);

const produce = (x, y, c, n = 3) => {
  let m = "";
  const pts = [[-4, 0], [0, -1.6], [4, 0], [-2, -3], [2, -3.4]].slice(0, n);
  for (const [dx, dy] of pts) m += circle(x + dx, y + dy, 2.6, c, { s: 0.6, w: 1 });
  return m + fill(ellD(x - 1.4, y - 2.6, 0.8, 0.6), "#fff", 0.6);
};

/** Player's roadside stand, 2 tiles wide; `stocked` fills the crates. */
export function farmStandSprite(stocked = false) {
  const w = "#b07a4a";
  let m = "";
  m += line("M-26 -24V-58M26 -24V-58", 5, INK) + line("M-26 -24V-58M26 -24V-58", 3, dark(w, 0.15));
  m += canopy(32, -66, -54, ["#7cb870", "#fff4e4"]);
  m += part(rrD(-30, -24, 60, 24, 3), w, { s: 2.2 }) + line("M-30 -12H30", 1, dark(w, 0.35), 0.7) + line("M-14 -22V-2M14 -22V-2", 1, dark(w, 0.35), 0.6);
  m += part(rrD(-32, -27, 64, 5, 2), lite(w, 0.15), { s: 0.8 });
  m += crate(-17, 16, -27) + crate(0, 14, -27, "#b8844e") + crate(17, 16, -27);
  if (stocked) m += produce(-17, -36, "#e8484a", 5) + produce(0, -36, "#f08a3a", 4) + produce(17, -36, "#8ac85a", 5);
  // Little price slate hanging off the front.
  m += part(rrD(-8, -16, 16, 10, 2), "#4a4a52", { s: 0.6, w: 1.2 }) + line("M-4 -11H4", 1, "#f4f0e8", 0.7);
  return sprite([-38, -72, 76, 76], [groundShadow(0, 1, 32, 3), L(m)]);
}

/** Market stall, 2 tiles wide, striped awning in `color`. */
export function stallSprite(color = "#e8566a") {
  const w = "#a8744a";
  let m = "";
  m += line("M-26 -24V-58M26 -24V-58", 5, INK) + line("M-26 -24V-58M26 -24V-58", 3, dark(w, 0.15));
  m += canopy(32, -66, -54, [color, "#fff8ee"]);
  m += part(rrD(-30, -26, 60, 26, 3), w, { s: 2.2 });
  // Cloth draped over the counter front.
  m += part("M-31 -27H31V-16C26 -12 21 -18 16 -14C11 -10 6 -16 0 -13C-6 -10 -11 -16 -16 -13C-21 -10 -26 -16 -31 -13Z", lite(color, 0.55), { s: 1 });
  // Goods: a basket of loaves, jars, a folded cloth stack.
  m += part("M-26 -27C-26 -34 -10 -34 -10 -27Z", "#c8945a", { s: 0.8, w: 1.2 }) + part("M-24 -30C-24 -36 -14 -36 -14 -30Z", "#e0a060", { s: 0.8, w: 1.1 });
  for (const [x, c] of [[-4, "#f6c63c"], [2.5, "#e8566a"], [9, "#9fd08a"]]) m += part(rrD(x - 2.8, -35, 5.6, 8, 2), c, { s: 0.6, w: 1.1 }) + part(rrD(x - 3.2, -37, 6.4, 2.6, 1), "#b07a4a", { s: 0, w: 1 });
  m += part(rrD(14, -31, 14, 4, 1.4), "#9ac8e8", { s: 0.6, w: 1.1 }) + part(rrD(15, -35, 12, 4, 1.4), "#f4c8d8", { s: 0.6, w: 1.1 });
  return sprite([-38, -72, 76, 76], [groundShadow(0, 1, 32, 3), L(m)]);
}

/** Town notice board with pinned notes under a little roof, 1 tile wide. */
export function questBoardSprite() {
  const w = "#9a6a48";
  let m = line("M-11 0V-40M11 0V-40", 5, INK) + line("M-11 0V-40M11 0V-40", 3, w);
  m += part(rrD(-14, -44, 28, 28, 2), "#d8a870", { s: 1.8 });
  m += part(rrD(-11, -41, 10, 12, 1), "#fff8e8", { s: 0.6, w: 1 }) + part(rrD(1, -42, 10, 9, 1), "#fbe2a8", { s: 0.6, w: 1 }) + part(rrD(-9, -27, 9, 8, 1), "#d8ecff", { s: 0.6, w: 1 }) + part(rrD(2, -30, 9, 11, 1), "#f8d0d8", { s: 0.6, w: 1 });
  m += line("M-9 -37H-3M-9 -34H-4M3 -39H9M4 -25H9M4 -22H8", 0.8, INK, 0.7);
  m += circle(-6, -41, 1.2, "#e8566a", { s: 0, w: 0.8 }) + circle(6, -42, 1.2, "#6aa8d8", { s: 0, w: 0.8 }) + circle(-4.5, -27, 1.2, "#6ab870", { s: 0, w: 0.8 }) + circle(6.5, -30, 1.2, "#f6c63c", { s: 0, w: 0.8 });
  m += part("M-19 -43L0 -56L19 -43Z", "#c8664f", { s: 1.6 }) + line("M-12 -46q3 2.4 6 0q3 2.4 6 0q3 2.4 6 0q3 2.4 6 0", 1, dark("#c8664f", 0.3), 0.7);
  return sprite([-22, -60, 44, 64], [groundShadow(0, 0.5, 14, 2.4), L(m)]);
}

// ── Orchard & farm props ────────────────────────────────────────────────────

const BARK = "#9a6a48";
const TREE_BOX = [-50, -124, 100, 130];

function trunk(h = 44, w = 7) {
  return (
    part(`M${-w} 0C${-w + 1} -10 ${-w + 2} ${-h * 0.6} ${-w + 1} ${-h}L${w - 1} ${-h}C${w - 2} ${-h * 0.6} ${w - 1} -10 ${w} 0C${w + 3} 3 ${-w - 3} 3 ${-w} 0Z`, BARK, { s: 2.4 }) +
    line(`M-2 -8Q-1 -18 -3 -26M3 -14Q2 -22 3 -30`, 1, dark(BARK, 0.35), 0.8)
  );
}

const APPLE_LEAF = ["#86c867", "#5fae52", "#a8b850", "#dfe8f0"];

/** Orchard tree (seasons 0..3): blossom in spring, red apples in summer and fall, bare in winter. */
export function appleTreeSprite(season = 0, seed = 1) {
  const tuft = season === 3 ? fill(ellD(0, 1, 14, 3.5), "#ffffff", 0.9) : fill("M-12 2q2 -6 4 0q2 -5 3 0M8 2q2 -6 3 0q2 -5 3 0", FOLIAGE[season].deep);
  const t = L(trunk() + tuft);
  if (season === 3) {
    const br = "M0 -40C-4 -54 -12 -60 -22 -66M-6 -54C-14 -52 -22 -54 -30 -50M0 -44C6 -56 14 -62 24 -70M10 -60C18 -58 26 -58 32 -52M-2 -56C0 -66 -2 -74 2 -84";
    let m = line(br, 6.5, INK) + line(br, 4, BARK);
    for (const [x, y, w] of [[-22, -68, 7], [-30, -52, 6], [24, -72, 8], [32, -54, 6], [2, -86, 6]]) m += part(capD([x - w / 2, y], [x + w / 2, y], 3.4, 3.4), "#ffffff", { s: 0.6, w: 1.2 });
    return sprite(TREE_BOX, [t, L(m, { anim: { type: "sway", pivot: [0, -40], amp: 0.01, speed: 1.1, phase: seed } })]);
  }
  const lc = APPLE_LEAF[season];
  let m = part(scallopD(0, -68, 36, 30, 14, seed, 0.55), lc, { s: 5, lo: dark(lc, 0.25) });
  m += fill(scallopD(-9, -78, 20, 13, 9, seed + 2, 0.55), lite(lc, 0.22), 0.9);
  m += fill(scallopD(-15, -84, 8, 5, 6, seed + 5), lite(lc, 0.45), 0.8);
  m += line("M10 -60q4 3 8 0M-20 -56q4 3 8 0M-2 -48q4 3 8 0", 1.2, dark(lc, 0.35), 0.7);
  const spots = [[-20, -70], [12, -84], [22, -64], [-6, -54], [-24, -58], [4, -72], [16, -52], [-10, -86], [26, -76]];
  if (season === 0) for (const [x, y] of spots) m += circle(x, y, 2.6, "#fff0f4", { s: 0.5, w: 1 }) + fill(ellD(x, y, 1, 1), "#f7a6c1");
  else for (const [x, y] of spots.slice(0, season === 2 ? 9 : 7)) m += circle(x, y, 3.2, "#e0403a", { s: 0.8, w: 1.1 }) + fill(ellD(x - 1, y - 1.2, 0.9, 0.8), "#fff", 0.7) + line(`M${x} ${y - 3}l0.8 -1.6`, 1, "#6a4a3a");
  return sprite(TREE_BOX, [t, L(m, { anim: { type: "sway", pivot: [0, -10], amp: 0.018, speed: 1.1, phase: seed } })]);
}

/** Straw skep hive on a stump, with bees buzzing about. */
export function beehiveSprite() {
  const straw = "#e8b85a";
  let m = part("M-9 0C-9 -4 -9 -8 -8 -10L8 -10C9 -8 9 -4 9 0C11 2 -11 2 -9 0Z", BARK, { s: 1.4 });
  m += part("M-13 -10C-14 -26 -8 -34 0 -34C8 -34 14 -26 13 -10Z", straw, { s: 2.2 });
  for (const y of [-15, -20, -25, -30]) {
    const hw = Math.sqrt(Math.max(0, 1 - ((y + 12) / 23) ** 2)) * 13;
    m += line(`M${-hw + 1} ${y}Q0 ${y + 2.2} ${hw - 1} ${y}`, 1, dark(straw, 0.35), 0.8);
  }
  m += part(ellD(0, -13, 3, 2.6), "#4a2e30", { s: 0, w: 1.1 }) + hi(-6, -26, 2.2, 1.4, 0.5);
  m += fill("M3 -34C5 -30 4 -27 6 -24C7 -27 7 -31 5 -34Z", "#f6a33c", 0.9);
  const bee = (x, y) => fill(ellD(x, y, 2.2, 1.6), "#f6c63c") + line(`M${x - 0.6} ${y - 1.4}V${y + 1.4}M${x + 0.8} ${y - 1.3}V${y + 1.3}`, 0.7, INK) + fill(ellD(x - 0.6, y - 2, 1.3, 0.9), "#fff", 0.85) + `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.6" fill="none" stroke="${INK}" stroke-width="0.7"/>`;
  return sprite([-18, -44, 36, 48], [groundShadow(0, 1, 12, 2.4), L(m), { markup: bee(-12, -34) + bee(12, -28), anim: { type: "float", amp: 1.5, speed: 7 } }]);
}

export function hayBaleSprite() {
  const c = "#e8c86a";
  let m = part(rrD(-16, -18, 32, 18, 5), c, { s: 2 });
  m += line("M-13 -13H13M-13 -8H13M-13 -3H13", 0.9, dark(c, 0.3), 0.7);
  m += fill(rrD(-8, -18, 3.4, 18, 1), "#b0603a") + fill(rrD(5, -18, 3.4, 18, 1), "#b0603a");
  m += hi(-9, -14, 4, 1.2, 0.55) + line("M-17 -4l-2 2M17 -6l2 -1M-12 -18l-1 -2M10 -18l1 -2", 1, dark(c, 0.15));
  return sprite([-21, -24, 42, 28], [groundShadow(0, 0.5, 17, 2.6), L(m)]);
}

export function troughSprite() {
  const w = "#a8744a";
  let m = line("M-16 0V-8M16 0V-8", 4, INK) + line("M-16 0V-8M16 0V-8", 2.4, dark(w, 0.2));
  m += part("M-22 -16H22L19 -5H-19Z", w, { s: 1.8 }) + line("M-20.5 -10.5H20.5", 0.9, dark(w, 0.35), 0.7);
  m += part(ellD(0, -16, 22, 3.2), dark(w, 0.25), { s: 0, w: 1.3 }) + fill(ellD(0, -15.8, 19.5, 2.2), "#7fb8e0") + fill(ellD(-6, -16.2, 7, 0.8), "#d8f0ff", 0.8);
  return sprite([-26, -22, 52, 26], [groundShadow(0, 0.5, 20, 2.4), L(m)]);
}

/** Farm silo: 2 tiles wide, ~110 tall. */
export function siloSprite() {
  const c = "#c8584a";
  const cap = "#b8c4d0";
  let m = "";
  m += part("M-22 0V-84H22V0C12 4 -12 4 -22 0Z", c, { s: 4, lo: dark(c, 0.28) });
  for (const y of [-64, -42, -20]) m += part(`M-22.4 ${y - 2.4}C-12 ${y + 1} 12 ${y + 1} 22.4 ${y - 2.4}V${y + 1.4}C12 ${y + 4.8} -12 ${y + 4.8} -22.4 ${y + 1.4}Z`, "#f4ece0", { s: 0.6, w: 1.1 });
  m += hi(-14, -52, 2.4, 20, 0.2);
  m += part("M-25 -82C-25 -104 -14 -112 0 -112C14 -112 25 -104 25 -82C12 -79 -12 -79 -25 -82Z", cap, { s: 3 });
  m += line("M-12 -86C-12 -100 -6 -108 0 -110M12 -86C12 -100 6 -108 0 -110", 1, dark(cap, 0.3), 0.8) + hi(-10, -100, 3, 5, 0.5);
  m += part(rrD(-3, -116, 6, 5, 1.5), dark(cap, 0.1), { s: 0.4, w: 1.1 });
  // Ladder up the right side and a little hatch.
  m += line("M11 -2V-80M17 -2V-78", 1.6, "#5a5a66");
  for (let y = -8; y > -78; y -= 7) m += line(`M11 ${y}H17`, 1.1, "#5a5a66");
  m += part(rrD(-10, -24, 12, 20, 2), dark(c, 0.3), { s: 0.8, w: 1.2 }) + line("M-8 -14H0", 1, "#f4ece0", 0.8);
  return sprite([-32, -122, 64, 128], [groundShadow(0, 1, 26, 4), L(m)]);
}

/** Silverleaf: a low silvery herb with a glint, picked with E in the Wildwood. */
export function herbSprite() {
  let m = groundShadow(0, 0, 9, 2.5, 0.16);
  for (const [deg, len, w] of [[160, 13, 5], [200, 13, 5], [130, 10, 4.2], [230, 10, 4.2], [180, 15, 5.4]]) m += part(leafD([0, -1], deg, len, w), "#b8d0cc", { s: 1, w: 1.2, lo: "#7fa0a0" });
  m += line("M0 -1V-12", 1, "#6f8f8a");
  m += hi(-3, -9, 1.6, 1, 0.8);
  return sprite([-14, -22, 28, 26], [m, { markup: fill("M6 -18l1 -3l1 3l3 1l-3 1l-1 3l-1 -3l-3 -1Z", "#ffffff"), anim: { type: "pulse", amp: 0.3, speed: 2.2 } }]);
}

/** Race start post, 1 tile: a pole with a checkered pennant and a little arrow sign. */
export function raceFlagSprite() {
  const w = "#9a6a48";
  const PLUM = "#6a3a6a";
  const CREAM = "#fff4e0";
  let m = part("M-14 0C-14 -4 -2 -4 -2 0Z", "#8a9a5a", { s: 0.8, w: 1.2 });
  m += line("M-8 1V-63", 5, INK) + line("M-8 1V-63", 3, w) + line("M-8.6 -8V-58", 0.8, lite(w, 0.35), 0.8);
  m += circle(-8, -65, 2.6, "#f2c24a", { s: 0.6, w: 1.1 });
  m += part(rrD(-18, -33, 20, 11, 2.4), "#c8945a", { s: 1.2 }) + line("M-14 -27.5H-5M-8 -30.4L-5 -27.5L-8 -24.6", 1.4, PLUM);
  m += fill(ellD(-16, -30.6, 0.7, 0.7), INK) + fill(ellD(0, -24.4, 0.7, 0.7), INK);
  // Flag: a 4×3 check grid bent by a soft wave so it reads as cloth.
  const x0 = -7;
  const cw = 6.2;
  const y0 = -62;
  const ch = 6;
  const pt = (i, j) => {
    const x = x0 + i * cw;
    const k = i / 4;
    return [x, y0 + j * ch * (1 - k * 0.12) + k * 2 + Math.sin(k * Math.PI * 1.6) * 1.8];
  };
  const edge = [];
  for (let i = 0; i <= 4; i++) edge.push(pt(i, 0));
  for (let i = 4; i >= 0; i--) edge.push(pt(i, 3));
  const flagD = polyD(edge);
  let g = part(flagD, CREAM, { s: 1.2 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) g += fill(polyD([pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)]), PLUM);
  g += line(flagD);
  g += fill(ellD(-3, -59, 2.4, 1), "#fff", 0.35);
  g += circle(-8, -60, 1.4, "#8a8a9a", { s: 0, w: 0.9 }) + circle(-8, -46, 1.4, "#8a8a9a", { s: 0, w: 0.9 });
  return sprite([-20, -70, 40, 74], [groundShadow(-8, 0.5, 9, 2.2), L(m), L(g, { anim: { type: "sway", pivot: [-8, -54], amp: 0.05, speed: 2.2 } })]);
}
