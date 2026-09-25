/**
 * Races at runtime: countdown, gates, timer, medals. `g.race` is
 * `{ id, gate, t, count }` while one is running; bests live in
 * `s.stats.races[id] = { best, medal }` (medal: best index earned, lower is better).
 */

import { TILE } from "./config.js";
import { RACES, MEDALS, GATE_R, medalFor } from "./data/races.js";
import { diary } from "./progress.js";
import { burst, FXK } from "./world/weather.js";
import { sfx } from "./audio/sfx.js";
import { toast } from "./ui/hud.js";

const COUNT = 3;
const fmt = (s) => `${s.toFixed(1)}s`;

export const raceAt = (o) => (o?.kind === "raceflag" ? RACES[o.race] : null);

/** E at a flag: start the race (or give up the one you're on). */
export function flagInteract(g, o) {
  const race = RACES[o.race];
  if (g.race) {
    g.race = null;
    return toast(g, "Race cancelled.");
  }
  const rec = g.s.stats.races?.[o.race];
  const best = rec ? ` Your best: ${fmt(rec.best)}${rec.medal >= 0 ? ` (${MEDALS[rec.medal]})` : ""}.` : "";
  g.ui.confirm(`${race.name}: ${race.gates.length} gates and back to the flag. Gold under ${race.par[0]}s, silver ${race.par[1]}s, bronze ${race.par[2]}s. Horse and bike allowed!${best}`, "Ready!", "Not now", () => {
    g.race = { id: o.race, gate: 0, t: 0, count: COUNT };
    sfx(g, "bell");
  });
}

/** Where the next gate is (world units), or the flag for the finish. */
function target(race, gate) {
  const [tx, ty] = gate < race.gates.length ? race.gates[gate] : [race.flag.tx, race.flag.ty + 1];
  return [(tx + 0.5) * TILE, (ty + 0.5) * TILE];
}

export function updateRace(g, dt) {
  const r = g.race;
  if (!r) return;
  const race = RACES[r.id];
  if (g.lv.id !== race.level) {
    g.race = null;
    return toast(g, "You left the course. Race cancelled.");
  }
  if (r.count > 0) {
    const before = Math.ceil(r.count);
    r.count -= dt;
    if (r.count <= 0) sfx(g, "task");
    else if (Math.ceil(r.count) !== before) sfx(g, "bell");
    return;
  }
  r.t += dt;
  const [x, y] = target(race, r.gate);
  const p = g.player;
  if ((p.x - x) ** 2 + (p.y - y) ** 2 > (GATE_R * TILE) ** 2) return;
  burst(FXK.SPARK, x, y - 10, 10, 90, 0.6, "#fff2a0");
  if (r.gate < race.gates.length) {
    r.gate++;
    sfx(g, "pickup");
    return;
  }
  finish(g, race, r);
}

function finish(g, race, r) {
  g.race = null;
  const secs = r.t;
  const medal = medalFor(race, secs);
  const races = { ...(g.s.stats.races ?? {}) };
  const prev = races[r.id];
  const best = !prev || secs < prev.best;
  const was = prev?.medal ?? -1;
  const upgraded = medal >= 0 && (was < 0 || medal < was);
  races[r.id] = { best: best ? secs : prev.best, medal: upgraded ? medal : was };
  g.s.stats = { ...g.s.stats, races };
  sfx(g, "quest");
  if (upgraded) {
    // Pay every medal tier newly reached (bronze → gold pays silver and gold too).
    let pay = 0;
    for (let m = medal; m < (was < 0 ? MEDALS.length : was); m++) pay += race.pay[m];
    g.s.gold += pay;
    diary(g, `Ran the ${race.name} in ${fmt(secs)} and won ${MEDALS[medal]}!`, "level");
    toast(g, `${fmt(secs)}: ${MEDALS[medal]} medal! +${pay}g`, "guild_badge");
  } else toast(g, `${fmt(secs)}${best ? " · new best!" : ""}${medal < 0 ? ` · bronze is under ${race.par[2]}s` : ""}`);
}

// ── Drawing ─────────────────────────────────────────────────────────────────

/** The next gate as a pulsing ring on the ground, with the one after it faint. */
export function drawRaceGround(ctx, g, ox, oy, z, t) {
  const r = g.race;
  if (!r) return;
  const race = RACES[r.id];
  if (g.lv.id !== race.level) return;
  for (let k = 1; k >= 0; k--) {
    const gi = r.gate + k;
    if (gi > race.gates.length) continue;
    const [x, y] = target(race, gi);
    const sx = ox + x * z;
    const sy = oy + y * z;
    const rr = GATE_R * TILE * z * (k ? 0.8 : 1 + Math.sin(t * 6) * 0.05);
    ctx.globalAlpha = k ? 0.25 : 0.9;
    ctx.lineWidth = 5 * z;
    ctx.strokeStyle = gi === race.gates.length ? "#e8566a" : "#f6c63c";
    ctx.beginPath();
    ctx.ellipse(sx, sy, rr, rr * 0.55, 0, 0, 6.283);
    ctx.stroke();
    ctx.lineWidth = 2 * z;
    ctx.strokeStyle = "#fffaf0";
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Timer and countdown at the top, and an arrow toward the next gate when it's off screen. */
export function drawRaceHud(ctx, view, g, ox, oy, z, text) {
  const r = g.race;
  if (!r) return;
  const race = RACES[r.id];
  if (r.count > 0) {
    text(ctx, String(Math.ceil(r.count)), view.w / 2, view.h / 2 - 60, "700 64px Fredoka, Nunito, sans-serif");
    return;
  }
  if (r.t < 0.8) text(ctx, "Go!", view.w / 2, view.h / 2 - 60, "700 64px Fredoka, Nunito, sans-serif");
  const label = `${race.name} · ${r.gate < race.gates.length ? `gate ${r.gate + 1}/${race.gates.length}` : "back to the flag!"} · ${r.t.toFixed(1)}s`;
  text(ctx, label, view.w / 2, view.h - 110, "700 18px Fredoka, Nunito, sans-serif");
  const [x, y] = target(race, r.gate);
  const sx = ox + x * z;
  const sy = oy + y * z;
  if (sx > 40 && sx < view.w - 40 && sy > 40 && sy < view.h - 40) return;
  const cx = view.w / 2;
  const cy = view.h / 2;
  const a = Math.atan2(sy - cy, sx - cx);
  const d = Math.min(view.w, view.h) / 2 - 50;
  ctx.save();
  ctx.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
  ctx.rotate(a);
  ctx.fillStyle = "#f6c63c";
  ctx.strokeStyle = "#3a2530";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-10, -13);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-10, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
