/**
 * Chibi person sprites from a look record:
 * `{ skin, hair, hairColor, eyes, top, bottom, hat, hatColor?, apron?, beard? }`.
 *
 * Units: feet at y = 0, head centre near y = -33, about 50 units tall (a
 * tile and a half). Directions are "down" (front), "up" (back) and "side"
 * (facing right; left is drawn flipped). Frames: 0 idle, 1-2 walk steps,
 * 3 tool use, 4 riding.
 */

import { part, limb, oval, circle, hi, fill, line, ellD, rrD, capD, polar, outlined, sprite, toSvg, lite, dark, INK } from "./cozy-kit.js";

export const SKINS = ["#fde3cf", "#f6cba8", "#e5a97f", "#c0835a", "#8f5b3c", "#5f3b28"];
export const HAIR_STYLES = ["short", "bob", "long", "ponytail", "buns", "curly"];
export const HAIR_COLORS = ["#3a2a2a", "#6b4230", "#b0603a", "#e8c170", "#f0a3b8", "#7aa6d8", "#eeeae2", "#c0472f"];
export const EYE_COLORS = ["#6a3f2a", "#3f6fb0", "#3f8a5a", "#7a4fa0", "#5a6470"];
export const HATS = ["none", "straw", "beanie", "cap", "flower"];
export const OUTFIT_COLORS = ["#f4a6b8", "#f6c86a", "#9fd08a", "#7cbfd8", "#9a8ad8", "#f08a6a", "#fdf3e1", "#5a6e9a", "#8a5a44", "#4a8a6a"];

export const BOX = [-23, -55, 46, 60];
const SHOE = "#6e4a3a";

/** Where the hands are in the tool-use frame, per direction (art units from the feet). */
export const USE_HAND = { down: [0, -14], up: [0, -22], side: [10, -18] };

export function lookKey(look) {
  const s = JSON.stringify(look);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

const skinOf = (look) => (typeof look.skin === "number" ? SKINS[look.skin] : look.skin);

// ── Hair ────────────────────────────────────────────────────────────────────

/** Hair drawn behind the head (and body) for the given direction. */
function hairBack(style, dir, c) {
  const o = { s: 2 };
  if (dir === "down") {
    if (style === "long") return part("M-13 -35C-16 -24 -15 -17 -11 -14L11 -14C15 -17 16 -24 13 -35Z", c, o);
    if (style === "bob") return part("M-13.5 -35C-15.5 -28 -14 -23.5 -10 -22.5L10 -22.5C14 -23.5 15.5 -28 13.5 -35Z", c, o);
    if (style === "buns") return circle(-11, -43, 5.2, c, o) + circle(11, -43, 5.2, c, o);
    if (style === "curly") return part(curlyRing(0, -34, 14.5, 13.5), c, o);
    if (style === "ponytail") return part("M10 -40C17 -40 18 -30 15 -24C14 -29 12 -33 9 -35Z", c, o);
  } else if (dir === "side") {
    if (style === "long") return part("M-12 -34C-15 -24 -12 -16 -6 -14L-2 -18C-4 -24 -4 -30 -3 -34Z", c, o);
    if (style === "bob") return part("M-12.5 -34C-14 -27 -11 -22.5 -5 -22.5L-2 -27C-3 -30 -3 -33 -3 -34Z", c, o);
    if (style === "buns") return circle(-8, -44, 5.4, c, o);
    if (style === "curly") return part(curlyRing(-1, -34, 13.5, 13.5), c, o);
    if (style === "ponytail") return part("M-9 -38C-17 -38 -21 -30 -18 -20C-15 -25 -12 -28 -8 -30Z", c, o) + fill(ellD(-10, -36, 2.2, 2.2), "#f06a8a");
  } else {
    if (style === "buns") return circle(-11, -43, 5.2, c, o) + circle(11, -43, 5.2, c, o);
  }
  return "";
}

/** Bumpy closed curve for curly hair. */
function curlyRing(cx, cy, rx, ry) {
  let d = "";
  const n = 11;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1.05 + (i / n) * 0.9);
    const r = i % 2 ? 1.12 : 1;
    const x = cx + Math.cos(a) * rx * r;
    const y = cy + Math.sin(a) * ry * r;
    d += (i ? "L" : "M") + `${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + `L${cx + rx * 0.95} ${cy + 6}L${cx - rx * 0.95} ${cy + 6}Z`;
}

/** Hair drawn over the head (fringe / full back cover). */
function hairFront(style, dir, c) {
  const o = { s: 1.8 };
  if (dir === "down") {
    let fringe = "M-13 -30C-14.5 -47 14.5 -47 13 -30C11.5 -35 8 -37.5 4.5 -35.5C2.5 -38.5 -3 -38.5 -5 -35.5C-8.5 -37.5 -11.5 -35 -13 -30Z";
    if (style === "short") fringe = "M-12.8 -31C-14 -47 14 -47 12.8 -31C11 -36 7 -38 3 -36.5C0 -39 -5 -38 -7 -36C-10 -37 -12 -35 -12.8 -31Z";
    if (style === "curly") fringe = "M-13.5 -30C-15 -48 15 -48 13.5 -30C12 -33 10 -36 7 -35.5C6 -38 2 -38 0.5 -36C-1.5 -38.5 -5 -38 -6 -35.5C-9 -36.5 -12 -34 -13.5 -30Z";
    return part(fringe, c, o) + hi(-5, -42.5, 3.5, 1.4, 0.45);
  }
  if (dir === "up") {
    let m = part("M-13.2 -32C-14.5 -48 14.5 -48 13.2 -32C13 -27 9 -24.5 0 -24.5C-9 -24.5 -13 -27 -13.2 -32Z", c, o);
    if (style === "long") m = part("M-13.2 -32C-14.5 -48 14.5 -48 13.2 -32C14 -24 13 -17 10 -14L-10 -14C-13 -17 -14 -24 -13.2 -32Z", c, o);
    if (style === "bob") m = part("M-13.4 -32C-14.5 -48 14.5 -48 13.4 -32C14 -27 12.5 -23 9 -22L-9 -22C-12.5 -23 -14 -27 -13.4 -32Z", c, o);
    if (style === "curly") m = part(curlyRing(0, -33, 14.5, 14), c, o);
    if (style === "ponytail") m += part("M-3 -30C-5 -24 -3 -17 0 -15C3 -17 5 -24 3 -30Z", c, o) + fill(rrD(-3, -31.5, 6, 3, 1.5), "#f06a8a");
    return m + hi(-5, -42, 3.5, 1.5, 0.4);
  }
  // side, facing right
  let m = "M11.8 -35.5C11.5 -45 1 -48.5 -6 -46C-12.5 -43.5 -14.2 -34 -11.8 -26C-9.5 -24.8 -6.5 -25.5 -5.2 -27C-4.6 -31 -3.5 -35 1 -37C5 -37.8 9 -36.8 11.8 -35.5Z";
  if (style === "curly") m = "M12.4 -35C12.5 -46.5 1 -50 -6.5 -47C-13.8 -44 -15.4 -34 -12.4 -25C-9.5 -23.8 -6.5 -25 -5 -27C-4.4 -31 -3 -35.5 1.5 -37.5C3 -36 5 -39 7 -37C9 -38 11 -36 12.4 -35Z";
  return part(m, c, o) + hi(0, -43.5, 4, 1.4, 0.45);
}

// ── Hats ────────────────────────────────────────────────────────────────────

function hat(kind, dir, c) {
  if (kind === "none" || !kind) return "";
  const sx = dir === "side" ? 1 : 0;
  if (kind === "straw") {
    const straw = c || "#f2d07a";
    return (
      part(ellD(sx, -40.5, 18, dir === "side" ? 3.6 : 5), straw, { s: 1.6 }) +
      part(`M${sx - 10} -41C${sx - 10} -52 ${sx + 10} -52 ${sx + 10} -41Z`, straw, { s: 1.6 }) +
      fill(rrD(sx - 10, -44.5, 20, 3.4, 1.2), "#e8667a") +
      line(`M${sx - 14} -40.5Q${sx} -38 ${sx + 14} -40.5`, 0.8, dark(straw, 0.45))
    );
  }
  if (kind === "beanie") {
    const b = c || "#e8667a";
    return (
      part("M-13.4 -36C-13.4 -51 13.4 -51 13.4 -36Z", b, { s: 1.8 }) +
      part(rrD(-14, -39, 28, 5.2, 2.6), lite(b, 0.25), { s: 1 }) +
      circle(0, -50, 3.4, "#fff4ea", { s: 1 })
    );
  }
  if (kind === "cap") {
    const b = c || "#6fa8dc";
    const bill = dir === "down" ? part(ellD(0, -36.5, 11, 3.4), dark(b, 0.12), { s: 1 }) : dir === "side" ? part(capD([7, -37.5], [18, -36.5], 4, 3.2), dark(b, 0.12), { s: 1 }) : "";
    return part("M-12.8 -36C-12.6 -49.5 12.6 -49.5 12.8 -36Z", b, { s: 1.8 }) + circle(0, -48.5, 1.6, lite(b, 0.4), { s: 0, w: 1 }) + bill;
  }
  if (kind === "bucket") {
    const b = c || "#e8c86a";
    return part("M-17 -37L-11 -46C-6 -50 6 -50 11 -46L17 -37C8 -39 -8 -39 -17 -37Z", b, { s: 1.8 }) + line("M-12 -42Q0 -44 12 -42", 0.9, dark(b, 0.4));
  }
  if (kind === "flower") {
    let m = "";
    const cols = ["#f7a6c1", "#fff2a8", "#b8d8f8", "#f7a6c1", "#fff2a8"];
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (1.15 + i * 0.175);
      const x = sx + Math.cos(a) * 12.5;
      const y = -34 + Math.sin(a) * 11.5;
      m += circle(x, y, 2.9, cols[i], { s: 0.8, w: 1.1 }) + fill(ellD(x, y, 1, 1), "#f6b93c");
    }
    return m;
  }
  return "";
}

// ── Body ────────────────────────────────────────────────────────────────────

function face(look, dir) {
  const eye = look.eyes || EYE_COLORS[0];
  const eyeAt = (x, y) =>
    fill(ellD(x, y, 2.1, 2.8), INK) + fill(ellD(x, y + 1, 1.5, 1.3), eye) + fill(ellD(x + 0.7, y - 1.1, 0.85, 0.85), "#fff");
  const blush = (x, y) => fill(ellD(x, y, 2.3, 1.3), "#f07a8a", 0.4);
  if (dir === "down") {
    let m = eyeAt(-4.4, -31.5) + eyeAt(4.4, -31.5) + blush(-7.3, -27.8) + blush(7.3, -27.8);
    if (look.beard) m += part("M-9.5 -30C-10 -23 -5 -20.5 0 -20.5C5 -20.5 10 -23 9.5 -30C7 -26 -7 -26 -9.5 -30Z", look.hairColor, { s: 1.4, w: 1.2 });
    return m + line("M-1.8 -26.6Q0 -25 1.8 -26.6", 1.1, look.beard ? lite(INK, 0.1) : INK);
  }
  if (dir === "side") {
    let m = eyeAt(6.4, -31.5) + blush(6.8, -27.6);
    if (look.beard) m += part("M-1 -29C0 -22 5 -20.5 9 -21.5C11.5 -23 12 -26 11.5 -28C8 -26 3 -26 -1 -29Z", look.hairColor, { s: 1.4, w: 1.2 });
    return m + line("M9.4 -26.4Q10.4 -25.6 11.2 -26.4", 1.1);
  }
  return "";
}

/**
 * @param {object} look
 * @param {"down"|"up"|"side"} dir
 * @param {number} frame 0 idle, 1-2 steps, 3 use, 4 ride
 */
export function personSprite(look, dir, frame) {
  const skin = skinOf(look);
  const top = look.top;
  const bot = look.bottom;
  const hairC = look.hairColor;
  const style = look.hair;
  let m = "";

  m += hairBack(style, dir, hairC);

  if (dir === "side") {
    const hip = [0, -12];
    const sh = [0.5, -22];
    const swing = frame === 1 ? 28 : frame === 2 ? -28 : 0;
    // Far arm and leg sit behind the body in a darker tone.
    if (frame !== 4) {
      const backFoot = polar([-0.8, -12], -swing, 10);
      m += limb([-0.8, -12], backFoot, 5.4, 5, dark(bot, 0.22), { s: 1.4 }) + oval(backFoot[0] + 1.3, backFoot[1] + 0.2, 3.4, 2.2, dark(SHOE, 0.2), { s: 0.8 });
    }
    const backHand = frame === 3 ? [9, -20] : frame === 4 ? [8, -17] : polar([-1, -22], swing * 0.9, 8.5);
    m += limb([-1, -22], backHand, 4.4, 4, dark(top, 0.22), { s: 1.2 }) + circle(backHand[0], backHand[1] + 0.8, 2.2, dark(skin, 0.18), { s: 0.8 });
    if (frame === 4) {
      m += limb(hip, [5, -5], 5.8, 5.2, bot, { s: 1.6 }) + limb([5, -5], [3.5, 2], 5.2, 4.8, bot, { s: 1.4 }) + oval(5, 2.5, 3.6, 2.2, SHOE, { s: 1 });
    } else {
      const foot = polar(hip, swing, 10);
      m += limb(hip, foot, 5.6, 5.2, bot, { s: 1.6 }) + oval(foot[0] + 1.3, foot[1] + 0.2, 3.6, 2.3, SHOE, { s: 1 });
    }
    m += part(rrD(-6.2, -14.5, 12.4, 5, 2.5), bot, { s: 1.2 });
    m += part(rrD(-6.5, -25, 13, 13.5, 5.5), top, { s: 2.4 }) + hi(-2.8, -21.5, 1.4, 3, 0.35);
    if (look.apron) m += part(rrD(1, -21, 5.8, 11.5, 2.6), look.apron, { s: 1.2, w: 1.1 });
    const hand = frame === 3 ? USE_HAND.side : frame === 4 ? [9, -16.5] : polar(sh, -swing * 0.9, 8.5);
    m += limb(sh, hand, 4.6, 4.2, top, { s: 1.4 }) + circle(hand[0], hand[1] + 0.8, 2.4, skin, { s: 0.9 });
    m += part(ellD(0.5, -33, 11.8, 11), skin, { s: 2.2 }) + hi(-3.5, -39, 3, 1.8, 0.5);
    m += face(look, "side") + hairFront(style, "side", hairC);
    m += circle(-1.8, -31, 2.7, skin, { s: 1 }) + hat(look.hat, "side", look.hatColor);
  } else {
    const front = dir === "down";
    // Legs: a step lifts one foot (shorter leg), the other plants.
    const liftL = frame === 1 ? 3 : 0;
    const liftR = frame === 2 ? 3 : 0;
    if (frame === 4) {
      m += limb([-4, -12], [-9.5, -4], 5.6, 5, bot, { s: 1.4 }) + oval(-10, -2.8, 3.2, 2.3, SHOE, { s: 1 });
      m += limb([4, -12], [9.5, -4], 5.6, 5, bot, { s: 1.4 }) + oval(10, -2.8, 3.2, 2.3, SHOE, { s: 1 });
    } else {
      m += limb([-3.6, -12], [-3.7, -3 - liftL], 5.8, 5.4, bot, { s: 1.6 }) + oval(-3.9, -2 - liftL, 3.5, 2.4, SHOE, { s: 1 });
      m += limb([3.6, -12], [3.7, -3 - liftR], 5.8, 5.4, bot, { s: 1.6 }) + oval(3.9, -2 - liftR, 3.5, 2.4, SHOE, { s: 1 });
    }
    m += part(rrD(-7.2, -15, 14.4, 5.5, 2.6), bot, { s: 1.4 });
    // Back view: arms go under the torso edge; front view: over it.
    const swingL = frame === 1 ? -1.8 : frame === 2 ? 1.6 : 0;
    const swingR = -swingL;
    let handL = [-9.8, -13.2 + swingL];
    let handR = [9.8, -13.2 + swingR];
    if (frame === 3) {
      handL = front ? [-3, -14.5] : [-5, -23];
      handR = front ? [3, -14.5] : [5, -23];
    } else if (frame === 4) {
      handL = [-4.5, -16];
      handR = [4.5, -16];
    }
    const arms =
      limb([-7.4, -22], handL, 4.6, 4.2, top, { s: 1.4 }) + circle(handL[0], handL[1], 2.4, skin, { s: 0.9 }) +
      limb([7.4, -22], handR, 4.6, 4.2, top, { s: 1.4 }) + circle(handR[0], handR[1], 2.4, skin, { s: 0.9 });
    const torso = part(rrD(-7.8, -25, 15.6, 13.8, 5.5), top, { s: 2.4 }) + hi(-4, -21.8, 1.5, 3.2, 0.35);
    const hideArms = !front && frame === 3;
    if (front) {
      m += torso;
      m += line("M-3 -24.6L0 -21.8L3 -24.6", 1.1, dark(top, 0.5));
      if (look.apron) m += part("M-6 -21.5H6V-13.5C6 -11.6 4.8 -11 3.4 -11H-3.4C-4.8 -11 -6 -11.6 -6 -13.5Z", look.apron, { s: 1.2, w: 1.1 }) + line("M-5 -21.5L-6.5 -24.5M5 -21.5L6.5 -24.5", 1, INK);
      m += arms;
    } else {
      if (!hideArms) m += arms;
      m += torso;
    }
    // Head
    m += circle(-12, -31.5, 2.6, skin, { s: 1 }) + circle(12, -31.5, 2.6, skin, { s: 1 });
    m += part(ellD(0, -33, 12.2, 11.2), skin, { s: 2.4 }) + (front ? hi(-5, -38.5, 3, 1.8, 0.5) : "");
    m += face(look, dir);
    m += hairFront(style, dir, hairC);
    m += hat(look.hat, dir, look.hatColor);
  }
  return sprite(BOX, [outlined(m)]);
}

/** Full set for an actor: frames[dir][frame] = { key, sprite }. */
export function personFrames(look, prefix = "p") {
  const k = `${prefix}:${lookKey(look)}`;
  const out = {};
  for (const dir of ["down", "up", "side"]) {
    out[dir] = [];
    for (let fr = 0; fr < 5; fr++) out[dir].push({ key: `${k}:${dir}:${fr}`, sprite: personSprite(look, dir, fr) });
  }
  return out;
}

/** Inline SVG of the front idle pose (DOM previews and portraits). */
export const personSvg = (look, dir = "down", frame = 0, cls = "") => toSvg(personSprite(look, dir, frame), cls);

/** Head-and-shoulders portrait. */
export function portraitSvg(look, cls = "portrait") {
  const s = personSprite(look, "down", 0);
  return toSvg({ ...s, box: [-21, -55, 42, 42] }, cls);
}

