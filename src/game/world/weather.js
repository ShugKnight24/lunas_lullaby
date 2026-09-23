/**
 * Screen-space weather and world-space effect particles from fixed pools.
 * Weather particles live in screen pixels but are shifted by camera motion
 * so they feel anchored to the world; effects (pops, hearts, splashes,
 * leaves) live in world units.
 */

const N = 260;
const wx = new Float32Array(N);
const wy = new Float32Array(N);
const wv = new Float32Array(N);
const wp = new Float32Array(N);

let inited = false;
let lastCamX = 0;
let lastCamY = 0;

function init(w, h) {
  for (let i = 0; i < N; i++) {
    wx[i] = Math.random() * w;
    wy[i] = Math.random() * h;
    wv[i] = 0.6 + Math.random() * 0.8;
    wp[i] = Math.random() * 6.28;
  }
  inited = true;
}

/**
 * @param {"rain"|"snow"|"leaves"|"petals"|null} kind
 */
export function drawWeather(ctx, view, kind, dt, t, camX, camY, z) {
  if (!inited) init(view.w, view.h);
  const mx = (camX - lastCamX) * z;
  const my = (camY - lastCamY) * z;
  lastCamX = camX;
  lastCamY = camY;
  if (!kind) return;
  const W = view.w;
  const H = view.h;
  const n = kind === "rain" ? N : kind === "snow" ? 160 : 36;
  if (kind === "rain") {
    ctx.strokeStyle = "rgba(200,225,255,0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
  }
  for (let i = 0; i < n; i++) {
    const v = wv[i];
    if (kind === "rain") {
      wx[i] += -120 * v * dt - mx;
      wy[i] += 700 * v * dt - my;
    } else if (kind === "snow") {
      wx[i] += Math.sin(t * 0.8 + wp[i]) * 18 * dt - mx;
      wy[i] += 40 * v * dt - my;
    } else {
      wx[i] += (Math.sin(t * 0.9 + wp[i]) * 30 + 22) * dt - mx;
      wy[i] += 34 * v * dt - my;
    }
    if (wy[i] > H + 20) (wy[i] -= H + 40), (wx[i] = Math.random() * W);
    else if (wy[i] < -20) wy[i] += H + 40;
    if (wx[i] > W + 20) wx[i] -= W + 40;
    else if (wx[i] < -20) wx[i] += W + 40;
    const x = wx[i];
    const y = wy[i];
    if (kind === "rain") {
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3 * v, y + 14 * v);
    } else if (kind === "snow") {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + v * 1.6, 0, 6.283);
      ctx.fill();
    } else {
      const a = t * 2 * v + wp[i];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(a)));
      ctx.fillStyle = kind === "petals" ? (i % 2 ? "#f9c6d6" : "#fff0f5") : i % 3 === 0 ? "#e0603a" : i % 3 === 1 ? "#f0a040" : "#f6d25a";
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 2.6, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
    }
  }
  if (kind === "rain") ctx.stroke();
}

// ── World effects ───────────────────────────────────────────────────────────

const FX = 160;
const fx = [];
for (let i = 0; i < FX; i++) fx.push({ on: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, c: "", icon: null, key: "" });

export const FXK = { DUST: 0, HEART: 1, DROP: 2, SPLASH: 3, LEAF: 4, CHIP: 5, SPARK: 6 };

export function spawnFx(kind, x, y, vx, vy, life, c = "#fff") {
  for (const p of fx) {
    if (p.on) continue;
    p.on = true;
    p.kind = kind;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = p.max = life;
    p.c = c;
    return p;
  }
  return null;
}

export function burst(kind, x, y, n, speed, life, c) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283;
    const s = speed * (0.4 + Math.random() * 0.6);
    spawnFx(kind, x, y, Math.cos(a) * s, Math.sin(a) * s - speed * 0.6, life * (0.7 + Math.random() * 0.5), c);
  }
}

export function updateFx(dt) {
  for (const p of fx) {
    if (!p.on) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.on = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === FXK.HEART || p.kind === FXK.SPARK) p.vy -= 10 * dt;
    else if (p.kind === FXK.LEAF) {
      p.vy = 16;
      p.vx = Math.sin(p.life * 4) * 20;
    } else p.vy += 260 * dt;
  }
}

export function drawFx(ctx, ox, oy, z) {
  for (const p of fx) {
    if (!p.on) continue;
    const k = p.life / p.max;
    const x = ox + p.x * z;
    const y = oy + p.y * z;
    ctx.globalAlpha = Math.min(1, k * 2);
    if (p.kind === FXK.HEART) {
      const s = (5 + (1 - k) * 3) * z * 0.6;
      ctx.fillStyle = "#f26a8a";
      ctx.strokeStyle = "#3a2530";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y + s);
      ctx.bezierCurveTo(x - s * 2, y - s * 0.4, x - s * 0.8, y - s * 1.9, x, y - s * 0.7);
      ctx.bezierCurveTo(x + s * 0.8, y - s * 1.9, x + s * 2, y - s * 0.4, x, y + s);
      ctx.fill();
      ctx.stroke();
    } else if (p.kind === FXK.SPARK) {
      ctx.fillStyle = p.c;
      const s = 3 * z * (0.5 + k);
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s * 0.3, y - s * 0.3);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x + s * 0.3, y + s * 0.3);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s * 0.3, y + s * 0.3);
      ctx.lineTo(x - s, y);
      ctx.lineTo(x - s * 0.3, y - s * 0.3);
      ctx.fill();
    } else {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      const r = (p.kind === FXK.DUST ? 3 + (1 - k) * 3 : p.kind === FXK.LEAF ? 3 : 2) * z * 0.7;
      if (p.kind === FXK.LEAF) ctx.ellipse(x, y, r * 1.4, r * 0.7, p.life * 3, 0, 6.283);
      else ctx.arc(x, y, r, 0, 6.283);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
