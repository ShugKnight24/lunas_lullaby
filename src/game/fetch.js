/**
 * Fetch: throw the Squeaky Ball (Space) and your companion runs it back.
 * The ball flies in an arc, bounces, rests; your companion trots over,
 * picks it up and brings it to you. Each return cheers them up a little
 * (up to a daily cap), gives a bit of companion XP, and counts a streak.
 */

import { TILE } from "./config.js";
import { addItem, takeFromSlot } from "./rules/inventory.js";
import { petGainXp } from "./rules/combat.js";
import { dayIndex } from "./rules/clock.js";
import { diary } from "./progress.js";
import { burst, FXK } from "./world/weather.js";
import { sfx } from "./audio/sfx.js";
import { toast } from "./ui/hud.js";

const GRAVITY = 620;
const THROW = 270;
const GIVE_UP = 9;
const HAPPY_PER_DAY = 5;
const DIRV = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

export function throwBall(g) {
  const p = g.player;
  if (g.fetch) return toast(g, `${g.pet.name} is still after the last one!`);
  if (!g.lv.outdoor) return toast(g, "Better throw it outside.");
  if (p.mounted || p.biking) return toast(g, "Hop down first.");
  const [dx, dy] = DIRV[p.dir];
  takeFromSlot(g.s.inv, g.s.sel);
  g.fetch = { phase: "fly", x: p.x + dx * 10, y: p.y + dy * 6, h: 22, vx: dx * THROW, vy: dy * THROW * 0.8, vh: 190, t: 0, lv: g.lv.id };
  p.useT = p.useMax = 0.22;
  p.useItem = "squeaky_ball";
  sfx(g, "swing");
}

/** Advance the ball and steer your companion; runs before updatePet each frame. */
export function updateFetch(g, dt) {
  const f = g.fetch;
  if (!f) return;
  const a = g.pet;
  const p = g.player;
  if (f.lv !== g.lv.id) return giveBack(g, false);
  f.t += dt;
  if (f.phase === "fly" || f.phase === "rest") {
    if (f.phase === "fly") {
      const nx = f.x + f.vx * dt;
      const ny = f.y + f.vy * dt;
      if (g.lv.blocked(Math.floor(nx / TILE), Math.floor(ny / TILE))) {
        f.vx *= -0.3;
        f.vy *= -0.3;
      } else {
        f.x = nx;
        f.y = ny;
      }
      f.vh -= GRAVITY * dt;
      f.h += f.vh * dt;
      if (f.h <= 0) {
        f.h = 0;
        f.vh = -f.vh * 0.4;
        f.vx *= 0.55;
        f.vy *= 0.55;
        sfx(g, "step");
        if (f.vh < 40) f.phase = "rest";
      }
    }
    // Off it goes (a combat target, if any, comes first: combat.js set a.goal).
    if (!a.goal) {
      a.goal = a.fetchPt ??= { x: 0, y: 0 };
      a.goal.x = f.x;
      a.goal.y = f.y + 2;
    }
    if (f.phase === "rest" && Math.abs(a.x - f.x) < 16 && Math.abs(a.y - f.y) < 12) {
      f.phase = "carry";
      a.state = "follow";
      if (g.s.profile.pet.kind === "anatolian" || g.s.profile.pet.kind === "dog") sfx(g, "woof");
    }
    if (f.t > GIVE_UP) giveBack(g, false);
    return;
  }
  // Carrying it home.
  f.x = a.x + (a.dir === "left" ? -12 : 12);
  f.y = a.y - 1;
  f.h = 10;
  if (!a.goal) {
    a.goal = a.fetchPt;
    a.goal.x = p.x + (a.x < p.x ? -18 : 18);
    a.goal.y = p.y + 4;
  }
  if (Math.abs(a.x - p.x) < 34 && Math.abs(a.y - p.y) < 24) giveBack(g, true);
  else if (f.t > GIVE_UP * 2) giveBack(g, false);
}

function giveBack(g, fetched) {
  g.fetch = null;
  g.pet.goal = null;
  addItem(g.s.inv, "squeaky_ball", 1);
  if (!fetched) {
    g.fetchStreak = 0;
    return toast(g, "The ball rolled back to you.", "squeaky_ball");
  }
  const s = g.s.pet;
  const day = dayIndex(g.s.clock);
  const fresh = s.fetchDay !== day;
  const count = fresh ? 0 : s.fetches ?? 0;
  let pet = { ...s, fetchDay: day, fetches: count + 1 };
  if (count < HAPPY_PER_DAY) pet.happy = Math.min(100, (pet.happy ?? 0) + 2);
  const r = petGainXp(pet, 3);
  pet = r.pet;
  g.s.pet = pet;
  g.fetchStreak = (g.fetchStreak ?? 0) + 1;
  burst(FXK.HEART, g.pet.x, g.pet.y - 24, 3, 30, 1);
  sfx(g, "pet");
  if (!g.s.stats.fetches) diary(g, `Played fetch with ${g.pet.name}. They brought it straight back, tail going like mad.`, "pet");
  g.s.stats.fetches = (g.s.stats.fetches ?? 0) + 1;
  toast(g, g.fetchStreak > 1 ? `Good ${g.pet.name}! Fetch ×${g.fetchStreak}` : `Good ${g.pet.name}!`, "squeaky_ball");
  if (r.levelUp) toast(g, `${g.pet.name} grew to level ${r.levelUp}!`, "pet_treat");
}

/** The ball, with its shadow on the ground. */
export function drawFetch(ctx, g, ox, oy, z) {
  const f = g.fetch;
  if (!f || f.lv !== g.lv.id) return;
  const x = ox + f.x * z;
  const y = oy + f.y * z;
  ctx.fillStyle = "rgba(58,37,48,0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y, 5 * z, 2 * z, 0, 0, 6.283);
  ctx.fill();
  const by = y - (f.h + 4) * z;
  ctx.fillStyle = "#c8e84a";
  ctx.strokeStyle = "#3a2530";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, by, 4.2 * z, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#fffaf0";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x - 3 * z, by, 3.4 * z, -1, 1);
  ctx.stroke();
}
