/**
 * Day/night grade. A multiply tint by hour (dawn peach, clear noon,
 * rose-gold dusk, deep blue night) and `darkness` 0..1, which drives the
 * additive lantern and window glows drawn after the tint.
 */

// [minute, r, g, b, darkness]
const KEYS = [
  [0, 70, 84, 150, 1],
  [300, 76, 88, 156, 1],
  [360, 236, 196, 184, 0.35],
  [420, 255, 226, 206, 0.08],
  [540, 255, 250, 244, 0],
  [960, 255, 250, 240, 0],
  [1050, 255, 214, 178, 0.05],
  [1140, 236, 164, 150, 0.3],
  [1200, 150, 120, 170, 0.62],
  [1260, 88, 96, 160, 0.9],
  [1440, 70, 84, 150, 1],
  [1560, 66, 80, 146, 1],
];

const out = { r: 255, g: 255, b: 255, dark: 0 };

/** Tint for a minute of the day (reuses one result object). */
export function lightAt(min) {
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1][0] <= min) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = Math.max(0, Math.min(1, (min - a[0]) / (b[0] - a[0] || 1)));
  const s = t * t * (3 - 2 * t);
  out.r = a[1] + (b[1] - a[1]) * s;
  out.g = a[2] + (b[2] - a[2]) * s;
  out.b = a[3] + (b[3] - a[3]) * s;
  out.dark = a[4] + (b[4] - a[4]) * s;
  return out;
}

let glow = null;
/** Soft warm radial sprite for additive glows (built once). */
export function glowSprite() {
  if (glow) return glow;
  glow = document.createElement("canvas");
  glow.width = glow.height = 128;
  const g = glow.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,214,140,0.95)");
  grd.addColorStop(0.35, "rgba(255,180,100,0.45)");
  grd.addColorStop(1, "rgba(255,150,80,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return glow;
}
