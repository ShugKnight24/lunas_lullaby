/**
 * Cozy comic SVG primitives: warm plum ink, rounded chunky shapes and soft
 * cel shading (one light, one shadow tone per material, a small highlight).
 *
 * Every helper returns markup strings; nothing here runs per frame. Parts are
 * cel shaded by drawing the shape in its shadow tone and the base tone on
 * top, shifted up-left and clipped to the shape, so the lower-right edge
 * keeps a crescent of shadow (light comes from the upper left).
 */

export const INK = "#3a2530";
export const INK_W = 1.5;
const LIGHT = "#fff6e6";
const SHADOW = "#5a2f55";

export const f = (n) => Math.round(n * 10) / 10;
export const P = (x, y) => `${f(x)} ${f(y)}`;

function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend two #rrggbb colours (t = 0 → a, 1 → b). */
export function mix(a, b, t) {
  const A = hex(a);
  const B = hex(b);
  let s = "#";
  for (let i = 0; i < 3; i++) s += Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, "0");
  return s;
}

export const lite = (c, t = 0.3) => mix(c, LIGHT, t);
export const dark = (c, t = 0.3) => mix(c, SHADOW, t);

let uid = 0;
/** Unique id inside one layer document (clip paths). */
export const nid = () => `c${(uid++).toString(36)}`;

// ── Path builders ───────────────────────────────────────────────────────────

export const ellD = (cx, cy, rx, ry = rx) =>
  `M${P(cx - rx, cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0Z`;

export function rrD(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  return `M${P(x + r, y)}H${f(x + w - r)}Q${P(x + w, y)} ${P(x + w, y + r)}V${f(y + h - r)}Q${P(x + w, y + h)} ${P(x + w - r, y + h)}H${f(x + r)}Q${P(x, y + h)} ${P(x, y + h - r)}V${f(y + r)}Q${P(x, y)} ${P(x + r, y)}Z`;
}

/** Tapered capsule from a (width wa) to b (width wb). */
export function capD(a, b, wa, wb = wa) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  const ra = wa / 2;
  const rb = wb / 2;
  return (
    `M${P(a[0] + nx * ra, a[1] + ny * ra)}L${P(b[0] + nx * rb, b[1] + ny * rb)}` +
    `A${f(rb)} ${f(rb)} 0 0 0 ${P(b[0] - nx * rb, b[1] - ny * rb)}` +
    `L${P(a[0] - nx * ra, a[1] - ny * ra)}A${f(ra)} ${f(ra)} 0 0 0 ${P(a[0] + nx * ra, a[1] + ny * ra)}Z`
  );
}

export const polyD = (pts) => "M" + pts.map((p) => P(p[0], p[1])).join("L") + "Z";

/** Smooth closed blob through points (quadratic midpoints). */
export function blobD(pts) {
  const n = pts.length;
  const mid = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  let d = `M${P(...mid(n - 1))}`;
  for (let i = 0; i < n; i++) d += `Q${P(pts[i][0], pts[i][1])} ${P(...mid(i))}`;
  return d + "Z";
}

/** Point `len` away from p at `deg` (0 = straight down, +90 = right). */
export function polar(p, deg, len) {
  const r = (deg * Math.PI) / 180;
  return [p[0] + Math.sin(r) * len, p[1] + Math.cos(r) * len];
}

// ── Painted parts ───────────────────────────────────────────────────────────

/**
 * Cel-shaded, inked shape.
 * @param {string} d path
 * @param {string} c base colour
 * @param {{ s?: number, sx?: number, sy?: number, w?: number, lo?: string, flat?: boolean }} [o]
 *   s: shadow depth (default 2.2), w: ink width (0 = none), flat: no shadow
 */
export function part(d, c, o = {}) {
  const w = o.w ?? INK_W;
  const ink = w ? `<path d="${d}" fill="none" stroke="${o.ink ?? INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>` : "";
  if (o.flat) return `<path d="${d}" fill="${c}"/>` + ink;
  const s = o.s ?? 2.2;
  const id = nid();
  return (
    `<clipPath id="${id}"><path d="${d}"/></clipPath>` +
    `<path d="${d}" fill="${o.lo ?? dark(c)}"/>` +
    `<g clip-path="url(#${id})"><path d="${d}" fill="${c}" transform="translate(${f(-(o.sx ?? s))} ${f(-(o.sy ?? s))})"/></g>` +
    ink
  );
}

/** Soft white highlight blob. */
export const hi = (cx, cy, rx, ry = rx, op = 0.75) =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="#fff" opacity="${op}"/>`;

/** Plain filled shape without ink. */
export const fill = (d, c, op = 1) => `<path d="${d}" fill="${c}"${op < 1 ? ` opacity="${op}"` : ""}/>`;

/** Ink stroke (open line). */
export const line = (d, w = INK_W, c = INK, op = 1) =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` stroke-opacity="${op}"` : ""}/>`;

export const circle = (cx, cy, r, c, o) => part(ellD(cx, cy, r, r), c, o);
export const oval = (cx, cy, rx, ry, c, o) => part(ellD(cx, cy, rx, ry), c, o);
export const limb = (a, b, wa, wb, c, o) => part(capD(a, b, wa, wb), c, o);

/** Soft contact shadow on the ground. */
export const groundShadow = (cx, cy, rx, ry, op = 0.2) =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${INK}" opacity="${op}"/>`;

/** Wrap a figure so it gets a chunkier outer contour (see DEFS #ol). */
export const outlined = (m) => `<g filter="url(#ol)">${m}</g>`;

/** Shared <defs> for every sprite document. */
export const DEFS =
  `<filter id="ol" x="-25%" y="-25%" width="150%" height="150%">` +
  `<feMorphology in="SourceAlpha" operator="dilate" radius="1" result="d"/>` +
  `<feFlood flood-color="${INK}"/><feComposite in2="d" operator="in"/>` +
  `<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
  `<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>`;

/** Sprite record. */
export const sprite = (box, layers) => ({ box, layers: layers.map((l) => (typeof l === "string" ? { markup: l } : l)) });

/** One inline <svg> for DOM previews (creator, portraits). */
export function toSvg(spr, cls = "") {
  const [x, y, w, h] = spr.box;
  let body = "";
  for (const l of spr.layers) body += l.markup;
  return `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}"><defs>${DEFS}</defs>${body}</svg>`;
}
