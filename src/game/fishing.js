/**
 * Fishing: cast toward water, wait for a bite, then a timing bar — stop the
 * bouncing marker inside the green zone to land the fish. The fish is picked
 * at cast time from rules/fishing.js (water, season, hour, weather), and its
 * difficulty sets the bar; stopping near the middle raises its quality.
 */

import { TILE } from "./config.js";
import { ITEMS } from "./data/items.js";
import { FISH } from "./data/fish.js";
import { waterKind } from "./world/map.js";
import { fishPool, pickFish, barParams, catchQuality, logCatch } from "./rules/fishing.js";
import { QUALITY } from "./rules/quality.js";
import { toolEnergy, fishingZone, XP, has } from "./rules/skills.js";
import { countItem } from "./rules/inventory.js";
import { award, level } from "./progress.js";
import { sfx } from "./audio/sfx.js";
import { give } from "./actions.js";
import { removeItem } from "./rules/inventory.js";
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
  const cost = toolEnergy(ITEMS.rod.energy, level(g, "fishing"));
  if (g.s.energy < cost) return toast(g, "You're too tired to fish.");
  setEnergy(g, g.s.energy - cost);
  sfx(g, "cast");
  const k = Math.min(3, hit + 1);
  const f = g.fishing;
  f.on = true;
  f.phase = "cast";
  f.t = 0;
  f.bx = (tx0 + dx * k + 0.5) * TILE;
  f.by = (ty0 + dy * k + 0.5) * TILE;
  if (!g.lv.isWater(tx0 + dx * k, ty0 + dy * k)) (f.bx = (tx0 + dx * hit + 0.5) * TILE), (f.by = (ty0 + dy * hit + 0.5) * TILE);
  const s = g.s;
  const pool = fishPool(FISH, { where: waterKind(Math.floor(f.bx / TILE), Math.floor(f.by / TILE)), season: s.clock.season, min: s.clock.min, weather: s.weather });
  f.fish = pickFish(pool, Math.random());
  const bar = barParams(f.fish ? FISH[f.fish].diff : 0, fishingZone(level(g, "fishing")));
  f.wait = 1.2 + Math.random() * 2.4 + (f.fish ? 0 : 2.5);
  // Bait in the bag is used up one per cast and halves the wait.
  f.bait = f.fish && removeItem(s.inv, "bait", 1);
  if (f.bait) f.wait *= 0.5;
  const patient = has(s.professions, "patient");
  if (patient) f.wait *= 0.5;
  f.pos = 0;
  f.vel = bar.vel * (0.9 + Math.random() * 0.2);
  f.zoneW = bar.zoneW;
  f.zone = 0.1 + Math.random() * (0.8 - bar.zoneW);
  f.biteWin = bar.bite + (patient ? 0.3 : 0);
  f.lucky = countItem(s.inv, "lucky_lure") > 0;
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
    sfx(g, "splash");
    f.t = 0;
    burst(FXK.SPLASH, f.bx, f.by, 6, 50, 0.5, "#cfeeff");
  } else if (f.phase === "wait") {
    if (press) {
      sfx(g, "miss");
      toast(g, "Too early! The fish swam off.");
      return end(g);
    }
    if (f.t > f.wait) {
      if (!f.fish) {
        toast(g, "Nothing's biting here right now.");
        return end(g);
      }
      (f.phase = "bite"), (f.t = 0), burst(FXK.SPLASH, f.bx, f.by, 8, 60, 0.5, "#cfeeff");
      sfx(g, "bite");
    }
  } else if (f.phase === "bite") {
    if (press) (f.phase = "reel"), (f.t = 0);
    else if (f.t > f.biteWin) {
      sfx(g, "miss");
      toast(g, "It got away...");
      return end(g);
    }
  } else if (f.phase === "reel") {
    f.pos += f.vel * dt;
    if (f.pos > 1) (f.pos = 2 - f.pos), (f.vel = -f.vel);
    else if (f.pos < 0) (f.pos = -f.pos), (f.vel = -f.vel);
    if (press) {
      const q = catchQuality(f.pos, f.zone, f.zoneW, f.lucky);
      if (q === null) sfx(g, "miss"), toast(g, "Snap! The line went slack.");
      else if (give(g, f.fish, 1, f.bx, f.by, q)) {
        const first = !g.s.fishLog[f.fish];
        g.s.fishLog = logCatch(g.s.fishLog, f.fish, q);
        award(g, "fishing", XP.catch(FISH[f.fish].diff, q));
        if (first) toast(g, `New fish for your log: ${FISH[f.fish].name}!`, f.fish);
        else if (q === 2) toast(g, "Perfect catch!");
        burst(FXK.SPLASH, f.bx, f.by, 12, 90, 0.7, "#cfeeff");
        sfx(g, "catch");
        if (q) sfx(g, "quality");
        if (q) burst(FXK.SPARK, f.bx, f.by - 10, 8, 80, 0.7, QUALITY[q].color);
      }
      return end(g);
    }
    if (f.t > 6) {
      sfx(g, "miss");
      toast(g, "The fish wriggled free.");
      return end(g);
    }
  }
}
