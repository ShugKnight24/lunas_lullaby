/**
 * Cozy canvas HUD: clock/date/season/weather dial, gold and tonight's
 * shipping, energy bar, the hotbar with item icons, the E prompt bubble,
 * toasts, the fishing bar, the tutorial's world arrow and the minimap.
 * Static panel art is baked once per size into offscreen canvases; only
 * text, bars and icons are drawn per frame, from cached strings.
 */

import { HOTBAR, MAX_ENERGY, CAN_CAPACITY } from "../config.js";
import { ITEMS } from "../data/items.js";
import { timeLabel, weekday, seasonName } from "../rules/clock.js";
import { QUALITY, qualityName } from "../rules/quality.js";
import { settle } from "../rules/shipping.js";
import { qualityBands } from "../rules/fishing.js";
import { sellMult } from "../rules/skills.js";
import { TUTORIAL } from "../data/tutorial.js";
import { FARM_WELL, BIN } from "../world/map.js";
import { doorOf } from "../actors/actors.js";
import { drawMinimap, minimapRect } from "./minimap.js";
import { drawSvgSprite } from "../../engine/sprite.js";
import { DEFS, iconSpr, iconKey } from "../art/index.js";

export const INK = "#3a2530";
const CREAM = "#fff6e6";
const FONT_D = "Fredoka, 'Nunito', system-ui, sans-serif";
const F = {
  big: `600 22px ${FONT_D}`,
  mid: `600 17px ${FONT_D}`,
  small: `600 13px ${FONT_D}`,
  tiny: `700 11px ${FONT_D}`,
  count: `700 13px ${FONT_D}`,
};
const NUMS = Array.from({ length: 1000 }, (_, i) => String(i));
const OPT = { alpha: 1, flip: false, cap: 256 };
const SEASON_C = ["#f28aa6", "#f6c63c", "#e8783a", "#8ab8e0"];

// ── Toasts ──────────────────────────────────────────────────────────────────

export function toast(g, text, icon = null) {
  const list = g.toasts;
  if (list.length && list[list.length - 1].text === text) {
    list[list.length - 1].t = 3.2;
    return;
  }
  list.push({ text, icon, t: 3.2 });
  if (list.length > 4) list.shift();
}

export function updateHud(g, dt) {
  const list = g.toasts;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].t -= dt;
    if (list[i].t <= 0) list.splice(i, 1);
  }
  if (g.s && g.s.sel !== g.hudSel) {
    g.hudSel = g.s.sel;
    g.hudFlash = 1.6;
  }
  if (g.hudFlash > 0) g.hudFlash -= dt;
}

// ── Baked panels ────────────────────────────────────────────────────────────

const baked = new Map();
const FILLS = [CREAM, "#ffe3ea"];
function panel(w, h, r, k, fill = CREAM) {
  const key = (((w * 1000 + h) * 100 + r) * 64 + k * 8) * 4 + FILLS.indexOf(fill);
  let c = baked.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  const pad = 6;
  c.width = Math.ceil((w + pad * 2) * k);
  c.height = Math.ceil((h + pad * 2) * k);
  const x = c.getContext("2d");
  x.scale(k, k);
  x.translate(pad, pad);
  x.fillStyle = "rgba(58,37,48,0.28)";
  x.beginPath();
  x.roundRect(1, 4, w, h, r);
  x.fill();
  x.fillStyle = fill;
  x.strokeStyle = INK;
  x.lineWidth = 2.5;
  x.beginPath();
  x.roundRect(0, 0, w, h, r);
  x.fill();
  x.stroke();
  x.strokeStyle = "rgba(255,255,255,0.7)";
  x.lineWidth = 1.5;
  x.beginPath();
  x.roundRect(4, 4, w - 8, h - 8, Math.max(2, r - 4));
  x.stroke();
  baked.set(key, c);
  c.pad = pad;
  return c;
}

function blitPanel(ctx, w, h, r, x, y, k, fill) {
  const c = panel(w, h, r, k, fill);
  ctx.drawImage(c, x - c.pad, y - c.pad, w + c.pad * 2, h + c.pad * 2);
}

function text(ctx, s, x, y, font, color = INK, align = "left") {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
}

function outlined(ctx, s, x, y, font, color = "#fff", align = "right") {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.lineJoin = "round";
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function icon(ctx, id, x, y, ppu, t) {
  OPT.alpha = 1;
  drawSvgSprite(ctx, iconKey(id), iconSpr(id), DEFS, Math.round(x), Math.round(y), ppu, t, OPT);
}

/** Silver/gold star in a slot's corner. */
function qualityStar(ctx, q, x, y) {
  if (!q) return;
  ctx.fillStyle = QUALITY[q].color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 2.6 : 6;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// Cached HUD strings.
const cache = { min: -1, time: "", day: -1, date: "", season: "", gold: -1, goldS: "", bin: null, binS: "", energy: -1, energyS: "" };

function strings(g) {
  const c = g.s.clock;
  if (c.min !== cache.min) {
    cache.min = c.min;
    cache.time = timeLabel(c.min);
  }
  const dk = c.day + c.season * 100 + c.year * 1000;
  if (dk !== cache.day) {
    cache.day = dk;
    cache.date = `${weekday(c)} ${c.day}`;
    cache.season = `${seasonName(c.season)} · Year ${c.year}`;
  }
  if (g.s.gold !== cache.gold) {
    cache.gold = g.s.gold;
    cache.goldS = `${g.s.gold.toLocaleString()}g`;
  }
  if (g.s.bin !== cache.bin) {
    cache.bin = g.s.bin;
    const total = settle(g.s.bin, ITEMS, (id) => sellMult(g.s.professions, id, ITEMS[id])).total;
    cache.binS = total ? `+${total.toLocaleString()}g tonight` : "";
  }
  if (g.s.energy !== cache.energy) {
    cache.energy = g.s.energy;
    cache.energyS = String(Math.round(g.s.energy));
  }
}

const skyGrad = { x: -1, g: null };

// ── Pieces ──────────────────────────────────────────────────────────────────

function drawClock(ctx, view, g, k) {
  const w = 236;
  const h = 96;
  const x = view.w - w - 16;
  const y = 14;
  blitPanel(ctx, w, h, 18, x, y, k);
  const c = g.s.clock;
  // Dial: a half sky showing the day's progress with a sun/moon marker.
  const dx = x + 50;
  const dy = y + 62;
  const R = 34;
  if (skyGrad.x !== dx) {
    skyGrad.x = dx;
    skyGrad.g = ctx.createLinearGradient(dx - R, 0, dx + R, 0);
    skyGrad.g.addColorStop(0, "#ffd2b0");
    skyGrad.g.addColorStop(0.5, "#a8dcf4");
    skyGrad.g.addColorStop(0.8, "#f4a6a0");
    skyGrad.g.addColorStop(1, "#5a5a9a");
  }
  ctx.fillStyle = skyGrad.g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(dx, dy, R, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const k01 = Math.max(0, Math.min(1, (c.min - 360) / (1560 - 360)));
  const a = Math.PI + k01 * Math.PI;
  const mx = dx + Math.cos(a) * (R - 9);
  const my = dy + Math.sin(a) * (R - 9);
  ctx.fillStyle = c.min < 1140 ? "#ffd84a" : "#fff8e0";
  ctx.beginPath();
  ctx.arc(mx, my, 7, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SEASON_C[c.season];
  ctx.beginPath();
  ctx.arc(dx, dy, 7, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  text(ctx, cache.date, x + 98, y + 30, F.big);
  text(ctx, cache.season, x + 98, y + 50, F.small, "#7a5a68");
  text(ctx, cache.time, x + 98, y + 80, F.big);
  drawWeatherIcon(ctx, g.s.weather, x + w - 26, y + 72, c.min >= 1200);
  // Gold
  const gy = y + h + 10;
  blitPanel(ctx, 128, 36, 16, view.w - 128 - 16, gy, k);
  ctx.fillStyle = "#f6c63c";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(view.w - 128, gy + 18, 9, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff4b8";
  ctx.fillRect(view.w - 131, gy + 13, 2.5, 7);
  text(ctx, cache.goldS, view.w - 28, gy + 25, F.mid, INK, "right");
  // What the shipping bin will pay out tonight.
  if (cache.binS) {
    ctx.font = F.small;
    const bw = Math.ceil((ctx.measureText(cache.binS).width + 24) / 8) * 8;
    blitPanel(ctx, bw, 28, 14, view.w - bw - 16, gy + 44, k, "#eaf6dc");
    text(ctx, cache.binS, view.w - 28, gy + 63, F.small, "#3f6a2a", "right");
  }
}

function drawWeatherIcon(ctx, w, x, y, night) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  if (w === "sun" && night) {
    ctx.fillStyle = "#fff2b0";
    ctx.beginPath();
    ctx.arc(x, y, 9, 0.6, Math.PI * 2 - 0.6 + Math.PI * 0.4, false);
    ctx.arc(x + 5, y - 3, 7, Math.PI * 2 - 0.2, 0.9, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }
  if (w === "sun") {
    ctx.fillStyle = "#ffd84a";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 6.283);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.283;
      ctx.moveTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11);
      ctx.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14);
    }
    ctx.stroke();
    return;
  }
  ctx.fillStyle = "#f4f0f8";
  ctx.beginPath();
  ctx.arc(x - 5, y, 6, 0, 6.283);
  ctx.arc(x + 3, y - 3, 8, 0, 6.283);
  ctx.arc(x + 8, y + 2, 5, 0, 6.283);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x - 11, y - 2, 24, 9, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = w === "rain" ? "#5aa8e0" : "#b8d0ec";
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    ctx.moveTo(x - 6 + i * 6, y + 11);
    ctx.lineTo(x - 8 + i * 6, y + 16);
  }
  ctx.stroke();
}

function drawEnergy(ctx, view, g, k) {
  const w = 30;
  const h = 170;
  const x = view.w - w - 18;
  // Beside the hotbar when there's room, otherwise stacked above it.
  const bar = hotbarRect(view);
  const y = bar.x + bar.w + 8 < x ? view.h - h - 20 : bar.y - h - 26;
  blitPanel(ctx, w, h, 14, x, y, k);
  const f = g.s.energy / MAX_ENERGY;
  const ih = h - 30;
  const fh = Math.max(0, ih * f);
  ctx.fillStyle = f > 0.5 ? "#8fd06a" : f > 0.25 ? "#f6c63c" : "#f0706a";
  ctx.beginPath();
  ctx.roundRect(x + 7, y + 8 + ih - fh, w - 14, fh, 6);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(x + 9, y + 10 + ih - fh, 4, Math.max(0, fh - 6));
  text(ctx, "E", x + w / 2, y + h - 7, F.mid, INK, "center");
  outlined(ctx, cache.energyS, x + w / 2, y - 6, F.count, "#fff", "center");
}

const SLOT_GAP = 6;

/**
 * Hotbar panel rectangle and slot size for a view (shared with click
 * hit-testing): 50px slots, shrunk to fit narrow screens.
 */
export function hotbarRect(view) {
  const S = Math.min(50, Math.floor((view.w - 24 - 20 - (HOTBAR - 1) * SLOT_GAP) / HOTBAR));
  const w = HOTBAR * S + (HOTBAR - 1) * SLOT_GAP + 20;
  const h = S + 20;
  return { x: Math.round(view.w / 2 - w / 2), y: view.h - h - 14, w, h, S };
}

/** Hotbar slot under a screen point, or -1. */
export function hotbarSlotAt(view, x, y) {
  const r = hotbarRect(view);
  if (y < r.y || y > r.y + r.h || x < r.x + 10 || x > r.x + r.w - 10) return -1;
  const i = Math.floor((x - r.x - 10) / (r.S + SLOT_GAP));
  return i >= 0 && i < HOTBAR ? i : -1;
}

function drawHotbar(ctx, view, g, t, k) {
  const gap = SLOT_GAP;
  const { x: x0, y: y0, w, h, S } = hotbarRect(view);
  blitPanel(ctx, w, h, 20, x0, y0, k);
  const inv = g.s.inv;
  for (let i = 0; i < HOTBAR; i++) {
    const x = x0 + 10 + i * (S + gap);
    const sel = i === g.s.sel;
    const y = y0 + 10 - (sel ? 4 : 0);
    ctx.fillStyle = sel ? "#ffe3ea" : "#f3e2c8";
    ctx.strokeStyle = sel ? "#e8566a" : "rgba(58,37,48,0.45)";
    ctx.lineWidth = sel ? 3 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, S, S, 12);
    ctx.fill();
    ctx.stroke();
    const s = inv[i];
    if (s) {
      icon(ctx, s.id, x + S / 2, y + S / 2, 1.25 * (S / 50), t);
      qualityStar(ctx, s.q, x + 9, y + S - 9);
      if (s.n > 1) outlined(ctx, NUMS[Math.min(999, s.n)], x + S - 5, y + S - 5, F.count);
      if (s.id === "can") {
        const f = g.s.water / CAN_CAPACITY;
        ctx.fillStyle = "rgba(58,37,48,0.35)";
        ctx.fillRect(x + 7, y + S - 8, S - 14, 4);
        ctx.fillStyle = "#5ab4f0";
        ctx.fillRect(x + 7, y + S - 8, (S - 14) * f, 4);
      }
    }
    text(ctx, NUMS[i + 1], x + 6, y + 13, F.tiny, "rgba(58,37,48,0.55)");
  }
  // Selected item name, briefly after changing slots.
  const s = inv[g.s.sel];
  if (s && g.hudFlash > 0) {
    const name = qualityName(ITEMS[s.id].name, s.q);
    ctx.globalAlpha = Math.min(1, g.hudFlash * 2);
    ctx.font = F.mid;
    const tw = ctx.measureText(name).width + 28;
    blitPanel(ctx, Math.ceil(tw / 8) * 8, 30, 15, Math.round(view.w / 2 - Math.ceil(tw / 8) * 4), y0 - 42, k);
    text(ctx, name, view.w / 2, y0 - 21, F.mid, INK, "center");
    ctx.globalAlpha = 1;
  }
}

function drawPrompt(ctx, g, ox, oy, z, k) {
  const pr = g.prompt;
  if (!pr.on || g.mode !== "play" || g.ui.isOpen()) return;
  const x = ox + pr.x * z;
  const y = oy + pr.y * z;
  ctx.font = F.small;
  const tw = ctx.measureText(pr.text).width;
  const w = Math.ceil((tw + 42) / 8) * 8;
  blitPanel(ctx, w, 28, 14, Math.round(x - w / 2), Math.round(y - 28), k);
  ctx.fillStyle = "#e8566a";
  ctx.beginPath();
  ctx.roundRect(Math.round(x - w / 2) + 5, Math.round(y - 23), 20, 18, 6);
  ctx.fill();
  text(ctx, "E", Math.round(x - w / 2) + 15, Math.round(y - 9), F.small, "#fff", "center");
  text(ctx, pr.text, Math.round(x - w / 2) + 31, Math.round(y - 9), F.small);
}

function drawToasts(ctx, view, g, t, k) {
  let y = 16;
  for (const m of g.toasts) {
    const a = Math.min(1, m.t * 2, (3.2 - m.t) * 6);
    ctx.globalAlpha = a;
    ctx.font = F.small;
    const tw = ctx.measureText(m.text).width;
    const w = Math.ceil((tw + (m.icon ? 58 : 32)) / 8) * 8;
    const x = Math.round(view.w / 2 - w / 2);
    blitPanel(ctx, w, 32, 16, x, y, k);
    if (m.icon) icon(ctx, m.icon, x + 20, y + 16, 0.8, t);
    text(ctx, m.text, x + (m.icon ? 38 : 16), y + 21, F.small);
    y += 40;
  }
  ctx.globalAlpha = 1;
}

/**
 * Point (art units, in the current level) the current tutorial step points
 * at, or null. `anywhere` gives the outdoor spot even while you're indoors
 * (for the minimap).
 */
function tutorialPoint(g, anywhere = false) {
  const tut = g.s.tutorial;
  const step = !tut.done && g.s.flags.intro && TUTORIAL[tut.step];
  if (!step?.point) return null;
  const T = 32;
  if (!anywhere && step.point === "house" && g.lv.id === "house") {
    const bed = g.lv.objects.find((o) => o.name === "bed");
    return bed && [bed.x, bed.y - 70];
  }
  if (!anywhere && g.lv.id !== "world") return null;
  if (step.point === "well") return [(FARM_WELL.tx + 1) * T, FARM_WELL.ty * T - 30];
  if (step.point === "bin") return [(BIN.tx + 0.5) * T, BIN.ty * T - 20];
  if (step.point === "house") {
    const [dx, dy] = doorOf("house");
    return [(dx + 0.5) * T, dy * T - 10];
  }
  return null;
}

function drawTutorialArrow(ctx, g, ox, oy, z, t) {
  if (g.mode !== "play") return;
  const p = tutorialPoint(g);
  if (!p) return;
  const x = ox + p[0] * z;
  const y = oy + p[1] * z - 8 - Math.abs(Math.sin(t * 3)) * 8;
  ctx.fillStyle = "#f6c63c";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 11, y - 14);
  ctx.lineTo(x - 5, y - 14);
  ctx.lineTo(x - 5, y - 26);
  ctx.lineTo(x + 5, y - 26);
  ctx.lineTo(x + 5, y - 14);
  ctx.lineTo(x + 11, y - 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawFishingBar(ctx, g, ox, oy, z, k) {
  const f = g.fishing;
  const p = g.player;
  const x = ox + p.x * z;
  const y = oy + (p.y - 70) * z;
  if (f.phase === "bite") {
    blitPanel(ctx, 30, 34, 12, Math.round(x - 15), Math.round(y - 40), k, "#ffe3ea");
    text(ctx, "!", x, y - 14, F.big, "#e8566a", "center");
    return;
  }
  if (f.phase !== "reel") return;
  const w = 180;
  const bx = Math.round(x - w / 2);
  const by = Math.round(y - 30);
  blitPanel(ctx, w, 26, 12, bx, by, k);
  ctx.fillStyle = "#e8d8c0";
  ctx.fillRect(bx + 8, by + 8, w - 16, 10);
  ctx.fillStyle = "#8fd06a";
  ctx.fillRect(bx + 8 + (w - 16) * f.zone, by + 8, (w - 16) * f.zoneW, 10);
  // Silver (middle half) and gold (middle fifth) bands, as in rules/fishing.catchQuality.
  const mid = f.zone + f.zoneW / 2;
  const [goldK, silverK] = qualityBands(f.lucky);
  for (const [k, q] of [[silverK, 1], [goldK, 2]]) {
    ctx.fillStyle = QUALITY[q].color;
    ctx.fillRect(bx + 8 + (w - 16) * (mid - (f.zoneW / 2) * k), by + 10, (w - 16) * f.zoneW * k, 6);
  }
  ctx.fillStyle = "#e8566a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bx + 8 + (w - 16) * f.pos - 3, by + 3, 6, 20, 3);
  ctx.fill();
  ctx.stroke();
  text(ctx, "Space!", x, by - 6, F.small, "#fff", "center");
}

export function drawHud(ctx, view, g, t, ox, oy, z) {
  if (g.mode === "title") return;
  const m = ctx.getTransform();
  const k = Math.max(1, Math.round(Math.hypot(m.a, m.b) * 4) / 4);
  strings(g);
  ctx.textBaseline = "alphabetic";
  if (g.mode === "build") return drawToasts(ctx, view, g, t, k);
  drawPrompt(ctx, g, ox, oy, z, k);
  drawTutorialArrow(ctx, g, ox, oy, z, t);
  if (g.mode === "fishing") drawFishingBar(ctx, g, ox, oy, z, k);
  drawClock(ctx, view, g, k);
  drawEnergy(ctx, view, g, k);
  if (g.mode === "play" || g.mode === "fishing") drawMinimap(ctx, g, t, minimapRect(view, hotbarRect(view), g.levels.world), (w, h, x, y) => blitPanel(ctx, w, h, 14, x, y, k), tutorialPoint(g, true));
  drawHotbar(ctx, view, g, t, k);
  drawToasts(ctx, view, g, t, k);
}
