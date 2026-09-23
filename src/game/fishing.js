/**
 * Fishing stub: cast toward water, wait for a bite, then a timing bar —
 * stop the bouncing marker inside the green zone to land the fish.
 */

import { TILE } from "./config.js";
import { ITEMS } from "./data/items.js";
import { FISH } from "./data/forage.js";
import { give } from "./actions.js";
import { setEnergy } from "./game.js";
import { burst, FXK } from "./world/weather.js";
import { toast } from "./ui/hud.js";

export function startFishing(g) {
  const p = g.player;
  const dx = p.dir === "left" ? -1 : p.dir === "right" ? 1 : 0;
  const dy = p.dir === "up" ? -1 : p.dir === "down" ? 1 : 0;
  const tx0 = Math.floor(p.x / TILE);
  const ty0 = Math.floor((p.y - 4) / TILE);
  let hit = 0;
  for (let k = 1; k <= 3 && !hit; k++) if (g.lv.isWater(tx0 + dx * k, ty0 + dy * k)) hit = k;
  if (!hit) return toast(g, "Face the water to cast your line.");
  if (g.s.energy < ITEMS.rod.energy) return toast(g, "You're too tired to fish.");
  setEnergy(g, g.s.energy - ITEMS.rod.energy);
  const k = Math.min(3, hit + 1);
  const f = g.fishing;
  f.on = true;
  f.phase = "cast";
  f.t = 0;
  f.bx = (tx0 + dx * k + 0.5) * TILE;
  f.by = (ty0 + dy * k + 0.5) * TILE;
  if (!g.lv.isWater(tx0 + dx * k, ty0 + dy * k)) (f.bx = (tx0 + dx * hit + 0.5) * TILE), (f.by = (ty0 + dy * hit + 0.5) * TILE);
  f.wait = 1.2 + Math.random() * 2.4;
  f.pos = 0;
  f.vel = 1.1 + Math.random() * 0.5;
  f.zone = 0.2 + Math.random() * 0.55;
  f.zoneW = 0.2;
  p.useItem = "rod";
  g.mode = "fishing";
}

function end(g) {
  g.fishing.on = false;
  g.player.useT = 0;
  g.mode = "play";
}

export function updateFishing(g, dt) {
  const f = g.fishing;
  const input = g.input;
  const press = input.pressed("use") || input.pressed("interact") || input.mouse.clicked;
  f.t += dt;
  g.player.useT = g.player.useMax * 0.4;
  if (input.pressed("pause")) return end(g);
  if (f.phase === "cast" && f.t > 0.4) {
    f.phase = "wait";
    f.t = 0;
    burst(FXK.SPLASH, f.bx, f.by, 6, 50, 0.5, "#cfeeff");
  } else if (f.phase === "wait") {
    if (press) {
      toast(g, "Too early! The fish swam off.");
      return end(g);
    }
    if (f.t > f.wait) (f.phase = "bite"), (f.t = 0), burst(FXK.SPLASH, f.bx, f.by, 8, 60, 0.5, "#cfeeff");
  } else if (f.phase === "bite") {
    if (press) (f.phase = "reel"), (f.t = 0);
    else if (f.t > 0.9) {
      toast(g, "It got away...");
      return end(g);
    }
  } else if (f.phase === "reel") {
    f.pos += f.vel * dt;
    if (f.pos > 1) (f.pos = 2 - f.pos), (f.vel = -f.vel);
    else if (f.pos < 0) (f.pos = -f.pos), (f.vel = -f.vel);
    if (press) {
      if (f.pos >= f.zone && f.pos <= f.zone + f.zoneW) {
        const id = FISH[Math.floor(Math.random() * FISH.length)];
        give(g, id, 1, f.bx, f.by);
        burst(FXK.SPLASH, f.bx, f.by, 12, 90, 0.7, "#cfeeff");
      } else toast(g, "Snap! The line went slack.");
      return end(g);
    }
    if (f.t > 6) {
      toast(g, "The fish wriggled free.");
      return end(g);
    }
  }
}
