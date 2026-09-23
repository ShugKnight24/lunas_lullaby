/**
 * Brand art: the "Luna's Lullaby" wordmark, the moon-cradle mark (Luna asleep
 * in a crescent moon) and the lockups and icons built from them.
 *
 * Same cozy comic rules as the sprites: warm plum ink, chunky rounded shapes,
 * cel shading from the upper left. The letters are Fredoka outlines baked into
 * brand-glyphs.js, so the logo renders identically in the game and in the
 * exported files (scripts/brand.mjs) without the web font loaded.
 */

import { INK, f, P, ellD, capD, part, fill, line, hi, oval, circle, lite, dark, mix, nid } from "./cozy-kit.js";
import { GLYPHS, TAG_GLYPHS } from "./brand-glyphs.js";

export const BRAND = {
  ink: INK,
  cream: "#fff6e6",
  gold: "#ffd46e",
  rose: "#e8566a",
  sky: "#a8dcf4",
  night: "#2b2140",
  dusk: "#4f3a66",
  coat: "#c8965a",
};
const WHITE = "#f4ece0";
const MASK = "#4a3228";

// ── Small shapes ────────────────────────────────────────────────────────────

/** Four-point sparkle. */
export const sparkD = (cx, cy, r, k = 0.28) =>
  `M${P(cx, cy - r)}Q${P(cx + r * k, cy - r * k)} ${P(cx + r, cy)}Q${P(cx + r * k, cy + r * k)} ${P(cx, cy + r)}` +
  `Q${P(cx - r * k, cy + r * k)} ${P(cx - r, cy)}Q${P(cx - r * k, cy - r * k)} ${P(cx, cy - r)}Z`;

export const spark = (cx, cy, r, c = BRAND.gold, w = r * 0.22) => part(sparkD(cx, cy, r), c, { s: r * 0.14, w });

/**
 * Crescent: disc (cx, cy, R) with a disc of radius r bitten out at offset
 * (ox, oy). The bite must overlap the rim.
 */
export function crescentD(cx, cy, R, ox, oy, r) {
  const d = Math.hypot(ox, oy);
  const a = (R * R - r * r + d * d) / (2 * d);
  const h = Math.sqrt(R * R - a * a);
  const [ux, uy] = [ox / d, oy / d];
  const [bx, by] = [cx + ux * a, cy + uy * a];
  const p1 = [bx - uy * h, by + ux * h];
  const p2 = [bx + uy * h, by - ux * h];
  return `M${P(...p1)}A${f(R)} ${f(R)} 0 1 1 ${P(...p2)}A${f(r)} ${f(r)} 0 ${a > d ? 1 : 0} 0 ${P(...p1)}Z`;
}

/** Tiny hand-drawn "z" (for the sleeping mark). */
const zz = (x, y, s, w) => line(`M${P(x, y)}h${f(s)}l${f(-s)} ${f(s)}h${f(s)}`, w);

// ── Luna asleep ─────────────────────────────────────────────────────────────

/**
 * Luna curled up asleep, facing right, lying on y = 0 and about 62 wide.
 * Head is the same blocky profile as her sprite (animals.js), eye closed.
 */
export function lunaAsleep(c = BRAND.coat) {
  const d = dark(c, 0.18);
  let m = "";
  // Tail curls round the rump, white tip tucked by the back foot.
  const tail = "M-22 -9C-34 -12 -34 2 -20 2";
  m += line(tail, 8.4, INK) + line(tail, 6, c) + circle(-18, 1.2, 3.2, WHITE, { s: 0.6, w: 1.4 });
  // Body loaf, pale belly, haunch.
  m += part("M-24 -6C-26 -18 -12 -24 2 -22C14 -21 22 -16 22 -8C22 -2 18 1 10 1L-18 1C-22 1 -24 -2 -24 -6Z", c, { s: 2.6, w: 1.8 });
  m += fill(ellD(4, -3.4, 12, 3.4), WHITE) + hi(-8, -18.5, 7, 2, 0.35);
  m += part("M-22 -4C-23 -13 -14 -16 -9 -12C-6 -9 -7 -2 -11 0L-18 0.6C-21 0.6 -22 -1.5 -22 -4Z", d, { s: 1.6, w: 1.6 });
  m += oval(-10, -0.6, 4, 2, WHITE, { s: 0.8, w: 1.4 });
  // Front paws stretched forward, white socks.
  m += part(capD([10, -3], [30, -2.4], 6.4, 6), WHITE, { s: 1.2, w: 1.6 });
  m += part(capD([6, -1], [26, 0], 6.4, 6), WHITE, { s: 1.2, w: 1.6 });
  // Head resting on the paws (sprite profile, nose tipped down a little).
  let hd = fill("M3 -19L6 -28L13 -26L12 -14Z", c) + fill(ellD(10.5, -19, 3.2, 5), WHITE, 0.95);
  hd += part("M5 -30C5 -35.5 11 -37 15 -35C17 -34 18 -32 19.5 -31.2L26.5 -30C29.3 -29.5 29.7 -25 27.2 -24L18 -21.8C14 -21 9 -21.4 6.5 -24C4.8 -25.8 4.8 -28 5 -30Z", c, { s: 1.4, w: 1.8 });
  hd += hi(9, -33.5, 3, 1.2, 0.45);
  hd += fill("M17.5 -27L27.6 -27.8C29.2 -26.3 28.7 -24.4 27.2 -24L18 -21.8C16 -22 15.4 -25.2 17.5 -27Z", "#e4ddd4");
  hd += fill("M16.5 -31.6L26.5 -30L26.8 -28.6L17.2 -29.4Z", MASK, 0.5);
  hd += fill(ellD(27.9, -27.9, 2, 1.7), INK) + fill(ellD(27.4, -28.6, 0.7, 0.4), "#fff", 0.5);
  hd += fill(ellD(15.2, -30, 3.2, 2.4), MASK, 0.85) + fill(ellD(13.4, -32.8, 2.6, 0.9), MASK, 0.55);
  hd += line("M13.4 -30.2Q15.4 -28.6 17.4 -30.2", 1.3) + fill(ellD(12.6, -27.2, 1.8, 1), "#f27a8a", 0.55);
  hd += part("M9.5 -34.6C6.5 -38 1 -38.2 -1.5 -35C-2.8 -33 -2 -30.2 -0.2 -29.4C1.2 -31.4 4 -32.8 8.6 -31.8Z", c, { s: 1, w: 1.6 });
  hd += fill("M-1.5 -35C-2.8 -33 -2 -30.2 -0.2 -29.4C0.4 -30.4 0.6 -31.8 0 -33.4Z", MASK, 0.75);
  m += `<g transform="translate(4 17) rotate(14 16 -24)">${hd}</g>`;
  return m;
}

/**
 * The mark: Luna asleep in a crescent-moon cradle with sparkles and a "z".
 * Centered on (0, 0), roughly 120 across.
 */
export function moonCradle({ zs = true, sparks = true } = {}) {
  const moon = crescentD(0, 4, 50, 0, -22, 44);
  let m = "";
  m += `<path d="${moon}" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`;
  m += part(moon, BRAND.gold, { s: 5, w: 0, lo: mix(BRAND.gold, "#e89a4a", 0.55) });
  m += fill(crescentD(-2, 6, 44, 0, -16, 41), lite(BRAND.gold, 0.45), 0.55);
  m += `<circle cx="-30" cy="30" r="4" fill="${dark(BRAND.gold, 0.18)}" opacity=".5"/><circle cx="24" cy="40" r="3" fill="${dark(BRAND.gold, 0.18)}" opacity=".5"/>`;
  m += `<g transform="translate(-2 34) scale(1.15)">${lunaAsleep()}</g>`;
  if (sparks) m += spark(58, -50, 10) + spark(-52, -40, 6.5, BRAND.cream) + spark(36, -70, 5);
  if (zs) m += zz(12, -12, 7, 2.6) + zz(22, -26, 5, 2.2);
  return m;
}

// ── Wordmark ────────────────────────────────────────────────────────────────

const INK_W = 11; // outline width on the 100-unit em

/**
 * Lay out text as sticker letters with a gentle lullaby wave.
 * The apostrophe becomes a little star.
 * @returns {{ w: number, letters: { ch: string, x: number, y: number, rot: number, s: number, c: string }[] }}
 */
function layout(text, { wave = 4, colors = [], track = 1.5, space = 22 } = {}) {
  const letters = [];
  let x = 0;
  let i = 0;
  for (const ch of text) {
    if (ch === " ") {
      x += space;
      continue;
    }
    const g = GLYPHS[ch];
    const s = ch === "L" ? 1.12 : 1;
    const y = -Math.sin(i * 0.75) * wave;
    const rot = Math.cos(i * 0.75) * wave * 0.9 * (i % 2 ? -1 : 1);
    const adv = ch === "'" ? 26 : g.adv * s;
    letters.push({ ch, x, y, rot, s, c: colors[i] ?? BRAND.cream, adv });
    x += adv + track;
    i++;
  }
  return { w: x - track, letters };
}

/** Glyph (or the apostrophe star) at a letter's transform. */
function glyph(l, body) {
  const g = GLYPHS[l.ch];
  return `<g transform="translate(${f(l.x)} ${f(l.y)}) rotate(${f(l.rot)} ${f(l.adv / 2)} -30) scale(${l.s})">${body(l.ch === "'" ? sparkD(l.adv / 2, -56, 12, 0.3) : g.d)}</g>`;
}

/**
 * Sticker wordmark: a cream plate, a drop, one merged ink outline, then cel
 * shaded letters. Baseline at y = 0, starts at x = 0.
 */
export function wordmark(text = "Luna's Lullaby", o = {}) {
  const lay = layout(text, o);
  const plate = o.plate ?? true;
  let out = "";
  if (plate) out += lay.letters.map((l) => glyph(l, (d) => `<path d="${d}" fill="${BRAND.cream}" stroke="${BRAND.cream}" stroke-width="${INK_W + 16}" stroke-linejoin="round"/>`)).join("");
  out += lay.letters.map((l) => glyph(l, (d) => `<path d="${d}" fill="${INK}" stroke="${INK}" stroke-width="${INK_W}" stroke-linejoin="round" transform="translate(0 7)"/>`)).join("");
  out += lay.letters.map((l) => glyph(l, (d) => `<path d="${d}" fill="${INK}" stroke="${INK}" stroke-width="${INK_W}" stroke-linejoin="round"/>`)).join("");
  out += lay.letters
    .map((l) =>
      glyph(l, (d) => {
        const id = nid();
        const lo = mix(l.c, "#e0906a", 0.42);
        return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${lo}"/><g clip-path="url(#${id})"><path d="${d}" fill="${l.c}" transform="translate(-2.4 -3.4)"/></g>`;
      }),
    )
    .join("");
  return { markup: out, w: lay.w, h: 100 };
}

/** Tagline in plain ink. */
export function tagline(text = "a cozy little farming life", size = 100, c = INK) {
  let x = 0;
  let m = "";
  for (const ch of text) {
    const g = TAG_GLYPHS[ch];
    if (g.d) m += `<path d="${g.d}" transform="translate(${f(x)} 0)"/>`;
    x += g.adv + 1;
  }
  const k = size / 100;
  return { markup: `<g fill="${c}" transform="scale(${f(k)})">${m}</g>`, w: x * k };
}

/** Rounded pill with inked border around the tagline, centered on cx, baseline cy. */
function tagPill(cx, cy, size) {
  const t = tagline(undefined, size);
  const w = t.w + size * 0.9;
  const h = size * 0.98;
  const x = cx - w / 2;
  const y = cy - h * 0.72;
  const r = h / 2;
  const d = `M${P(x + r, y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${P(x + w - r, y + h)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${P(x + r, y)}Z`;
  return (
    `<path d="${d}" fill="${INK}" transform="translate(0 ${f(size * 0.12)})"/>` +
    part(d, BRAND.cream, { s: size * 0.06, w: size * 0.09, lo: "#f3d9bd" }) +
    `<g transform="translate(${f(cx - t.w / 2)} ${f(cy)})">${t.markup}</g>`
  );
}

// ── Lockups ─────────────────────────────────────────────────────────────────

const LUNA_GOLD = [BRAND.gold, BRAND.gold, BRAND.gold, BRAND.gold, BRAND.gold, BRAND.gold];

/**
 * Full logo lockups as standalone <svg> strings.
 * variant: "horizontal" | "stacked" | "badge" | "wordmark" | "mark"
 */
export function logoSvg(variant = "horizontal", { tag = true, title = "Luna's Lullaby" } = {}) {
  const svg = (vb, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(f).join(" ")}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>`;

  if (variant === "mark") return svg([-80, -80, 160, 160], moonCradle());

  if (variant === "wordmark") {
    const wm = wordmark(undefined, { colors: LUNA_GOLD });
    return svg([-20, -104, wm.w + 40, 136], wm.markup);
  }

  if (variant === "horizontal") {
    const wm = wordmark(undefined, { colors: LUNA_GOLD });
    const mark = `<g class="brand-mark"><g transform="translate(84 -40) scale(1.3)">${moonCradle()}</g></g>`;
    const x0 = 184;
    let body = mark + `<g transform="translate(${x0} 0)">${wm.markup}</g>`;
    if (tag) body += tagPill(x0 + wm.w / 2, 70, 30);
    return svg([-20, -150, x0 + wm.w + 40, tag ? 260 : 200], body);
  }

  if (variant === "stacked") {
    const top = wordmark("Luna's", { colors: LUNA_GOLD, wave: 3 });
    const bot = wordmark("Lullaby", { wave: 4 });
    const W = Math.max(top.w * 0.8, bot.w * 1.1);
    let body = `<g transform="translate(0 -120) scale(1.05)">${moonCradle()}</g>`;
    body += `<g transform="translate(${f(-top.w * 0.4)} 34) scale(.8)">${top.markup}</g>`;
    body += `<g transform="translate(${f(-bot.w * 0.55)} 140) scale(1.1)">${bot.markup}</g>`;
    if (tag) body += tagPill(0, 212, 28);
    return svg([-W / 2 - 28, -212, W + 56, tag ? 460 : 400], body);
  }

  // badge: night disc, the mark, wordmark across the lower rim
  const id = nid();
  const wm = wordmark(undefined, { colors: LUNA_GOLD, wave: 3 });
  const k = 300 / wm.w;
  let body = `<defs><radialGradient id="${id}" cx="50%" cy="38%" r="65%"><stop offset="0" stop-color="${BRAND.dusk}"/><stop offset="1" stop-color="${BRAND.night}"/></radialGradient></defs>`;
  body += `<circle cx="0" cy="0" r="150" fill="${INK}" transform="translate(0 8)"/>`;
  body += `<circle cx="0" cy="0" r="150" fill="url(#${id})" stroke="${INK}" stroke-width="8"/>`;
  body += `<circle cx="0" cy="0" r="138" fill="none" stroke="${BRAND.cream}" stroke-width="2.5" stroke-dasharray="2 9" stroke-linecap="round" opacity=".45"/>`;
  body += `<circle cx="0" cy="-28" r="84" fill="${BRAND.gold}" opacity=".13"/>`;
  for (const [x, y, r] of [[-96, -60, 3], [-70, -104, 2], [92, -86, 2.5], [108, -30, 2], [-112, 6, 2], [60, -118, 1.8]]) body += `<circle cx="${x}" cy="${y}" r="${r}" fill="${BRAND.cream}" opacity=".8"/>`;
  body += `<g transform="translate(0 -30) scale(1.2)">${moonCradle()}</g>`;
  body += `<g transform="translate(${f(-150)} 100) scale(${f(k)})">${wm.markup}</g>`;
  return svg([-170, -170, 340, 350], body);
}

/**
 * App / favicon art as standalone <svg>.
 * kind: "favicon" (bold crescent, reads at 16px) | "app" (rounded tile with
 * the full mark) | "maskable" (full-bleed, mark inside the 80% safe zone)
 */
export function iconSvg(kind = "app") {
  const id = nid();
  const grad = `<defs><radialGradient id="${id}" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="${BRAND.dusk}"/><stop offset="1" stop-color="${BRAND.night}"/></radialGradient></defs>`;
  const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${grad}${body}</svg>`;
  if (kind === "favicon") {
    const moon = crescentD(30, 34, 22, 9, -9, 19);
    return svg(
      `<rect x="1" y="1" width="62" height="62" rx="15" fill="url(#${id})" stroke="${INK}" stroke-width="2"/>` +
        `<path d="${moon}" fill="${BRAND.gold}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>` +
        `<path d="${crescentD(28.5, 35.5, 18, 7, -7, 16.5)}" fill="#ffe7a8" opacity=".6"/>` +
        `<path d="${sparkD(48, 16, 8.5, 0.26)}" fill="${BRAND.cream}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
    );
  }
  const full = kind === "maskable";
  const tile = full ? `<rect width="64" height="64" fill="url(#${id})"/>` : `<rect x="1" y="1" width="62" height="62" rx="14" fill="url(#${id})" stroke="${INK}" stroke-width="1.6"/>`;
  const s = full ? 0.3 : 0.37;
  const dots = [[10, 14, 0.9], [54, 44, 0.7], [14, 50, 0.6], [44, 8, 0.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${BRAND.cream}" opacity=".75"/>`).join("");
  return svg(`${tile}${dots}<g transform="translate(32 ${full ? 33 : 34}) scale(${s})">${moonCradle()}</g>`);
}
