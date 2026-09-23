/**
 * Animal sprites: pet dog / cat / bird, the horse and coop chickens.
 * Side views face right (left is drawn flipped), feet at y = 0. Tails and
 * wings are their own layers so they can wag/flutter as canvas transforms.
 */

import { part, limb, oval, circle, hi, fill, line, ellD, rrD, capD, polyD, outlined, sprite, lite, dark, INK } from "./cozy-kit.js";

export const PET_KINDS = ["dog", "cat", "bird"];
export const PET_COATS = {
  dog: ["#d9a066", "#f1e4d4", "#7a5040"],
  cat: ["#f0a050", "#7a7a8a", "#f6f0e8"],
  bird: ["#7cc0e8", "#f6d04a", "#f39ab0"],
};

const eye = (x, y, r = 1.4) => fill(ellD(x, y, r, r * 1.2), INK) + fill(ellD(x + r * 0.35, y - r * 0.45, r * 0.4, r * 0.4), "#fff");
const L = (markup, extra = {}) => ({ markup: outlined(markup), ...extra });

// ── Dog ─────────────────────────────────────────────────────────────────────

function dog(c, frame) {
  const sw = frame === 1 ? 3.5 : frame === 2 ? -3.5 : 0;
  const d = dark(c, 0.25);
  const sit = frame === 3;
  const tail = sit
    ? L(limb([-11, -6], [-19, -4], 4, 2.8, c, { s: 1 }))
    : L(limb([-10, -14], [-16, -22], 4.2, 2.6, c, { s: 1 }), { anim: { type: "sway", pivot: [-10, -14], amp: 0.35, speed: 10 } });
  let m = "";
  if (sit) {
    m += limb([6, -12], [6.5, -0.5], 4.2, 3.8, d, { s: 1 });
    m += `<g transform="rotate(-32 -2 -10)">${oval(-2, -10, 10, 6.8, c)}</g>`;
    m += circle(-6, -5.5, 5.5, c) + oval(-3, -1, 3.4, 2, lite(c, 0.2), { s: 0.8 });
    m += limb([8.5, -12], [9, -0.5], 4.4, 4, c, { s: 1 }) + oval(10, -0.5, 2.8, 1.8, lite(c, 0.2), { s: 0.8 });
  } else {
    m += limb([-8, -9], [-8 - sw, -0.5], 4.2, 3.8, d, { s: 1 }) + limb([6, -9], [6 + sw, -0.5], 4.2, 3.8, d, { s: 1 });
    m += oval(-1, -11, 11.5, 6.8, c) + fill(ellD(0, -7.5, 7, 2.6), lite(c, 0.3)) + hi(-5, -14.5, 3.5, 1.3, 0.4);
    m += limb([-5, -9], [-5 + sw, -0.5], 4.4, 4, c, { s: 1 }) + limb([8.5, -9], [8.5 - sw, -0.5], 4.4, 4, c, { s: 1 });
    m += oval(-4.2 + sw, -0.5, 2.8, 1.8, lite(c, 0.2), { s: 0.8 }) + oval(9.3 - sw, -0.5, 2.8, 1.8, lite(c, 0.2), { s: 0.8 });
  }
  const hy = sit ? -5 : 0;
  const hx = sit ? -3 : 0;
  m += line(`M${4 + hx} ${-16 + hy}Q${6.5 + hx} ${-13 + hy} ${6 + hx} ${-10.5 + hy}`, 2.6, "#e8566a");
  m += circle(9 + hx, -19 + hy, 7.2, c) + hi(6 + hx, -22.5 + hy, 2.4, 1.3, 0.5);
  m += oval(14.6 + hx, -16.4 + hy, 4.6, 3.4, lite(c, 0.4), { s: 1 });
  m += fill(ellD(18.2 + hx, -17.6 + hy, 1.6, 1.3), INK);
  m += oval(14.2 + hx, -12.6 + hy, 1.3, 1.9, "#f27a8a", { s: 0.5, w: 1 });
  m += eye(11.5 + hx, -20.5 + hy);
  m += part(`M${4 + hx} ${-24 + hy}C${1 + hx} ${-23 + hy} ${0 + hx} ${-16 + hy} ${3 + hx} ${-13.5 + hy}C${5.5 + hx} ${-14 + hy} ${7 + hx} ${-19 + hy} ${8 + hx} ${-23 + hy}Z`, d, { s: 1 });
  return sprite([-26, -34, 50, 38], [tail, L(m)]);
}

// ── Cat ─────────────────────────────────────────────────────────────────────

function cat(c, frame) {
  const sw = frame === 1 ? 3 : frame === 2 ? -3 : 0;
  const d = dark(c, 0.25);
  const sit = frame === 3;
  const tailD = sit ? "M-8 -3C-14 -2 -18 -4 -17 -9" : "M-9 -11C-15 -12 -18 -18 -15 -25";
  const tail = L(line(tailD, 6, INK) + line(tailD, 3.6, c) + line(tailD, 1, lite(c, 0.4), 0.8), sit ? {} : { anim: { type: "sway", pivot: [-9, -11], amp: 0.14, speed: 3 } });
  let m = "";
  if (sit) {
    m += `<g transform="rotate(-38 -2 -9)">${oval(-2, -9, 9, 5.8, c)}</g>`;
    m += circle(-5, -5, 5, c);
    m += limb([6, -10], [6.5, -0.5], 3.4, 3, c, { s: 0.8 });
  } else {
    m += limb([-7, -8], [-7 - sw, -0.5], 3.4, 3, d, { s: 0.8 }) + limb([5.5, -8], [5.5 + sw, -0.5], 3.4, 3, d, { s: 0.8 });
    m += oval(-1, -10, 10, 5.6, c) + fill(ellD(0, -7, 6, 2), lite(c, 0.3)) + hi(-4, -13.5, 3, 1.1, 0.4);
    m += limb([-4.5, -8], [-4.5 + sw, -0.5], 3.4, 3, c, { s: 0.8 }) + limb([7.5, -8], [7.5 - sw, -0.5], 3.4, 3, c, { s: 0.8 });
  }
  const hx = sit ? -2 : 0;
  const hy = sit ? -4 : 0;
  const ear = (a, b, e) => part(polyD([a, b, e]), c, { s: 0.8 }) + fill(polyD([[a[0] + 1, a[1] - 0.8], [b[0], b[1] + 2], [e[0] - 1, e[1] - 0.6]]), "#f5a8b8");
  m += ear([4 + hx, -20 + hy], [5.5 + hx, -27.5 + hy], [9 + hx, -22.5 + hy]) + ear([10 + hx, -23 + hy], [14 + hx, -27.5 + hy], [14.5 + hx, -19.5 + hy]);
  m += circle(9.5 + hx, -17 + hy, 6.8, c) + hi(7 + hx, -20.5 + hy, 2.2, 1.2, 0.5);
  m += oval(13.3 + hx, -14.6 + hy, 3, 2.2, lite(c, 0.5), { s: 0.6, w: 1 });
  m += fill(ellD(15.6 + hx, -15.6 + hy, 1, 0.8), "#f07a8a");
  m += eye(12 + hx, -18.2 + hy, 1.3);
  m += line(`M${14 + hx} ${-14 + hy}L${19 + hx} ${-15 + hy}M${14 + hx} ${-13.4 + hy}L${18.6 + hx} ${-12.4 + hy}`, 0.6, INK, 0.7);
  if (c === PET_COATS.cat[0]) m += line(`M${-4} -14.5l1.2 3M0 -15l1 3M4 -14l0.5 2.6`, 1.3, dark(c, 0.3));
  return sprite([-24, -32, 46, 36], [tail, L(m)]);
}

// ── Bird ────────────────────────────────────────────────────────────────────

function bird(c, frame) {
  const fly = frame === 3;
  const d = dark(c, 0.2);
  let m = "";
  if (!fly) m += line(frame ? "M-1.5 -3L-2 -1M1.5 -3L2 -1" : "M-1.5 -3L-1.5 0M1.5 -3L1.8 0", 1.3, "#e39a3a");
  m += part(polyD([[-6, -10], [-13, -14], [-12, -8]]), d, { s: 1 });
  m += circle(0, -10, 7.6, c) + fill(ellD(1.8, -7.6, 4.6, 3.8), lite(c, 0.5)) + hi(-2.5, -14, 2.4, 1.3, 0.55);
  m += part("M-1 -17C-2 -21 1 -22 2 -18Z", d, { s: 0.6, w: 1.1 });
  m += part(polyD([[6.6, -12], [11, -10.4], [6.6, -8.8]]), "#f6a33c", { s: 0.6, w: 1.1 });
  m += eye(4.4, -12.8, 1.25) + fill(ellD(5, -9.6, 1.4, 0.9), "#f07a8a", 0.5);
  const wing = fly
    ? L(part("M-1 -11C-6 -24 -12 -22 -10 -16C-8 -12 -4 -10 -1 -10Z", d, { s: 1 }), { anim: { type: "sway", pivot: [-1, -10.5], amp: 0.5, speed: 22 } })
    : L(part("M-8 -8.5C-7.5 -12.5 -2 -12.5 -0.5 -8C-2 -4.8 -5.5 -4.8 -8 -8.5Z", d, { s: 1 }), { anim: { type: "sway", pivot: [-1, -9], amp: 0.06, speed: 2 } });
  return sprite([-16, -26, 30, 29], [L(m), wing]);
}

export function petSprite(kind, coat, frame) {
  if (kind === "cat") return cat(coat, frame);
  if (kind === "bird") return bird(coat, frame);
  return dog(coat, frame);
}

export const PET_FRAMES = 4; // 0 idle, 1-2 walk, 3 sit / fly

// ── Horse ───────────────────────────────────────────────────────────────────

const HORSE = { coat: "#b9814e", mane: "#5a3626", blanket: "#e0667a", saddle: "#7a4a32" };
export const HORSE_BOX = [-44, -76, 90, 80];
/** Where the rider's feet origin sits relative to the horse, per direction. */
export const RIDE_OFFSET = { side: [-3, -31], down: [0, -33], up: [0, -30] };

function horseSide(frame) {
  const { coat: c, mane, blanket, saddle } = HORSE;
  const d = dark(c, 0.25);
  const sw = frame === 1 ? 6 : frame === 2 ? -6 : 0;
  const tail = L(part("M-22 -40C-32 -40 -34 -26 -30 -14C-27 -18 -25 -26 -21 -33Z", mane, { s: 1.6 }), { anim: { type: "sway", pivot: [-22, -38], amp: 0.1, speed: 3 } });
  let m = "";
  const leg = (x, dx, col) => limb([x, -26], [x + dx, -3], 6, 5, col, { s: 1.4 }) + oval(x + dx + 0.5, -1.8, 3.6, 2.4, "#4a3430", { s: 0.8 });
  m += leg(-17, -sw, d) + leg(11, sw, d);
  m += limb([12, -36], [21, -54], 14, 10, c, { s: 2 });
  m += oval(-3, -34, 23, 12, c) + fill(ellD(-2, -27, 15, 3.5), lite(c, 0.25)) + hi(-10, -41, 7, 2, 0.35);
  m += leg(-12, sw, c) + leg(15, -sw, c);
  m += part("M20 -61C12 -60 8 -50 8 -40C12 -44 16 -50 22 -53Z", mane, { s: 1.4 });
  m += part(polyD([[19.5, -59], [20.5, -67.5], [24, -60]]), c, { s: 0.8 });
  m += limb([22.5, -57], [33, -46], 12, 8, c, { s: 1.6 }) + oval(32, -46.5, 4.8, 4, lite(c, 0.3), { s: 1 });
  m += fill(ellD(34, -47.8, 0.9, 0.9), INK) + eye(25.5, -55.5, 1.5);
  m += part(rrD(-11, -47, 18, 11, 3.5), blanket, { s: 1.4 }) + line("M-9 -38.5H5", 1, lite(blanket, 0.5), 0.8);
  m += part("M-8 -45C-7 -50 3 -50 5 -45C3 -44 -6 -44 -8 -45Z", saddle, { s: 1 });
  m += line("M31 -44C24 -40 16 -42 8 -45", 1.1, "#5a3020");
  return { main: sprite(HORSE_BOX, [tail, L(m)]), over: null };
}

function horseFront(frame) {
  const { coat: c, mane, blanket, saddle } = HORSE;
  const lift = (i) => (frame === i + 1 ? 3 : 0);
  let body = "";
  body += oval(0, -40, 14, 10, dark(c, 0.1)) + part(rrD(-9, -49, 18, 9, 3.5), blanket, { s: 1.2 }) + part(ellD(0, -48.5, 7, 3), saddle, { s: 0.8 });
  body += limb([-6.5, -28], [-6.5, -3 - lift(0)], 6, 5, c, { s: 1.4 }) + oval(-6.5, -2 - lift(0), 3.8, 2.4, "#4a3430", { s: 0.8 });
  body += limb([6.5, -28], [6.5, -3 - lift(1)], 6, 5, c, { s: 1.4 }) + oval(6.5, -2 - lift(1), 3.8, 2.4, "#4a3430", { s: 0.8 });
  body += oval(0, -32, 11, 9, c) + hi(-4, -35, 3, 2, 0.35);
  // Head hangs low in front of the chest so the rider's face stays clear.
  let head = "";
  head += part(polyD([[-6, -52], [-5, -61], [-1.5, -53]]), c, { s: 0.8 }) + part(polyD([[6, -52], [5, -61], [1.5, -53]]), c, { s: 0.8 });
  head += limb([0, -51], [0, -36], 12.5, 10, c, { s: 1.8 });
  head += oval(0, -34.5, 6.5, 5, lite(c, 0.35), { s: 1 }) + fill(ellD(-2.4, -34, 0.9, 1.2), INK) + fill(ellD(2.4, -34, 0.9, 1.2), INK);
  head += fill(capD([0, -50], [0, -42], 3, 2), lite(c, 0.55));
  head += eye(-4.8, -46, 1.4) + eye(4.8, -46, 1.4);
  head += part("M-5 -55C-2 -58 3 -58 5 -55C3 -51 -3 -51 -5 -55Z", mane, { s: 0.8 });
  return { main: sprite(HORSE_BOX, [L(body)]), over: sprite(HORSE_BOX, [L(head)]) };
}

function horseBack(frame) {
  const { coat: c, mane, blanket, saddle } = HORSE;
  const lift = (i) => (frame === i + 1 ? 3 : 0);
  let m = "";
  m += limb([0, -54], [0, -64], 10, 8, c, { s: 1.2 }) + part(polyD([[-5, -62], [-4, -70], [-1, -63]]), c, { s: 0.8 }) + part(polyD([[5, -62], [4, -70], [1, -63]]), c, { s: 0.8 });
  m += part("M-4 -66C-4 -58 -3 -52 0 -48C3 -52 4 -58 4 -66Z", mane, { s: 1 });
  m += limb([-7, -28], [-7, -3 - lift(0)], 6.5, 5, c, { s: 1.4 }) + oval(-7, -2 - lift(0), 3.8, 2.4, "#4a3430", { s: 0.8 });
  m += limb([7, -28], [7, -3 - lift(1)], 6.5, 5, c, { s: 1.4 }) + oval(7, -2 - lift(1), 3.8, 2.4, "#4a3430", { s: 0.8 });
  m += oval(0, -36, 15, 13, c) + hi(-6, -42, 4, 2, 0.35);
  m += part(rrD(-9, -52, 18, 9, 3.5), blanket, { s: 1.2 }) + part(ellD(0, -50.5, 7, 3), saddle, { s: 0.8 });
  const tail = L(part("M-3.5 -40C-5 -30 -4 -20 0 -14C4 -20 5 -30 3.5 -40Z", mane, { s: 1.2 }), { anim: { type: "sway", pivot: [0, -40], amp: 0.12, speed: 3 } });
  return { main: sprite(HORSE_BOX, [L(m), tail]), over: null };
}

/** Horse sprites: `{ main, over }` (over = head drawn above the rider, front view only). */
export function horseSprite(dir, frame) {
  if (dir === "down") return horseFront(frame);
  if (dir === "up") return horseBack(frame);
  return horseSide(frame);
}

// ── Chicken ─────────────────────────────────────────────────────────────────

export function chickenSprite(frame) {
  const c = "#fbf4ea";
  let m = "";
  m += line(frame ? "M-1.5 -4L-2.5 0M2 -4L2 0" : "M-1.5 -4L-1.5 0M2 -4L2.5 0", 1.3, "#e39a3a");
  m += part(polyD([[-6, -12], [-12, -17], [-10, -8]]), dark(c, 0.15), { s: 1 });
  m += oval(0, -10, 8, 6.5, c) + hi(-3, -13, 2.5, 1.2, 0.6);
  const hx = frame ? 3 : 0;
  const hy = frame ? 5 : 0;
  m += circle(5 + hx, -16 + hy, 4.4, c);
  m += part(`M${3 + hx} ${-20 + hy}C${3 + hx} ${-23 + hy} ${6 + hx} ${-23 + hy} ${6.5 + hx} ${-20 + hy}Z`, "#e8485a", { s: 0.6, w: 1.1 });
  m += part(polyD([[8.8 + hx, -17 + hy], [12 + hx, -15.5 + hy], [8.8 + hx, -14.2 + hy]]), "#f6a33c", { s: 0.5, w: 1 });
  m += eye(6.5 + hx, -16.8 + hy, 0.9);
  m += part("M-4 -10C-2 -13 3 -12 3 -9C1 -7 -3 -7 -4 -10Z", dark(c, 0.1), { s: 0.8, w: 1.1 });
  return sprite([-15, -27, 30, 29], [L(m)]);
}

