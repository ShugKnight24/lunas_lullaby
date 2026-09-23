/**
 * Game runtime: owns the save state, levels, actors and camera; runs the
 * clock, level transitions, sleeping/day rollover and save/load. Tool use
 * and interactions live in actions.js, building in build.js, drawing in
 * render.js; the DOM panels talk to it through `g.ui`.
 */

import { TILE, TICK_SECONDS, TICK_MIN, ZOOM, ZOOM_MIN, ZOOM_MAX, HOTBAR, MAX_ENERGY } from "./config.js";
import { newState, save } from "./state.js";
import { buildWorld, HIDDEN, INTERIORS } from "./world/map.js";
import { createWorldLevel, createInterior, makeObject } from "./world/level.js";
import { GroundCache } from "./world/ground.js";
import { createCamera, snapCamera, updateCamera } from "./world/camera.js";
import { updateFx } from "./world/weather.js";
import { resolveObject, cropKey, cropSpr, DEFS } from "./art/index.js";
import { warmSvgSprites } from "../engine/sprite.js";
import { visualStage } from "./rules/crops.js";
import { createPlayer, createPet, createVillager, createChicken, movePlayer, updatePet, teleportPet, updateVillager, placeVillager, updateChicken, facingTile } from "./actors/actors.js";
import { tick, dayIndex, weekday } from "./rules/clock.js";
import { endDay, respawnForage } from "./rules/day.js";
import { CROPS } from "./data/crops.js";
import { ITEMS } from "./data/items.js";
import { STRUCTURES } from "./data/structures.js";
import { MACHINES } from "./data/machines.js";
import { sellMult } from "./rules/skills.js";
import { FORAGE, RARE_FORAGE } from "./data/forage.js";
import { VILLAGERS, VILLAGER_IDS } from "./data/villagers.js";
import { useTool, interact, updateTarget, toggleMount } from "./actions.js";
import { updateBuild, exitBuild, fenceMasks } from "./build.js";
import { updateFishing } from "./fishing.js";
import { renderGame } from "./render.js";
import { toast, updateHud, hotbarSlotAt } from "./ui/hud.js";
import { queueIntro, updateIntro, updateProfessions } from "./progress.js";

const WORLD_DATA = buildWorld(7);

export function createGame(input, ui) {
  const g = {
    s: null,
    levels: {},
    lv: null,
    ground: null,
    rooms: new Map(),
    player: null,
    pet: null,
    horse: { x: 0, y: 0, dir: "right", level: "world" },
    villagers: [],
    chickens: [],
    spots: WORLD_DATA.spots,
    spotAt: new Map(),
    cropDraw: new Map(),
    cam: createCamera(),
    view: { w: 1280, h: 720 },
    input,
    ui,
    mode: "title",
    tickAcc: 0,
    fade: { a: 0, target: 0, speed: 4, cb: null },
    target: [0, 0],
    prompt: { text: "", x: 0, y: 0, on: false },
    build: { active: false, type: "fence", mode: "place", tx: 0, ty: 0, valid: false, moving: null },
    fishing: { on: false },
    toasts: [],
    hudFlash: 0,
    time: 0,
    attract: 0,
  };
  g.cam.z = ZOOM;
  for (const sp of g.spots) g.spotAt.set(sp.ty * WORLD_DATA.w + sp.tx, sp);
  loadState(g, newState());
  g.mode = "title";
  return g;
}

// ── State ↔ runtime ─────────────────────────────────────────────────────────

/** Rebuild levels and actors from a save state. */
export function loadState(g, s) {
  g.s = s;
  g._pq = null;
  const world = createWorldLevel(WORLD_DATA);
  g.levels = { world };
  for (const id in INTERIORS) g.levels[id] = createInterior(id);
  g.ground?.release();
  g.ground = new GroundCache(world);
  g.rooms.clear();
  // World object overrides (chopped, broken, regrowing).
  for (const o of world.objects) {
    const st = s.objs[o.id];
    if (!st) continue;
    if (st.gone) world.index(o, null), (o.gone = true);
    if (st.stump) o.stump = true;
    if (st.hp !== undefined) o.hp = st.hp;
  }
  g.chickens = [];
  for (const st of s.structures) addStructureObject(g, st);
  fenceMasks(g);
  if (!Object.keys(s.forage).length) s.forage = respawnForage({}, g.spots, dayIndex(s.clock), s.clock.season, FORAGE, RARE_FORAGE);
  g.player = createPlayer(s.profile.look);
  Object.assign(g.player, { x: s.player.x, y: s.player.y, dir: s.player.dir, mounted: !!s.horse.mounted });
  g.pet = createPet(s.profile.pet);
  g.horse = { x: s.horse.x, y: s.horse.y, dir: s.horse.dir, level: s.horse.level };
  g.villagers = VILLAGER_IDS.map((id) => createVillager(id, VILLAGERS[id]));
  for (const v of g.villagers) placeVillager(v, s.clock.min, routineCtx(s));
  g.lv = g.levels[s.player.level] ?? world;
  teleportPet(g.pet, g.player, g.lv);
  resolveSeason(g);
  syncAllSoil(g);
  g.tickAcc = 0;
  snapCamera(g.cam, g.lv, g.player.x, g.player.y - 20, g.view);
}

/** What villager routines depend on today. */
const routineCtx = (s) => ({ weather: s.weather, weekday: weekday(s.clock) });

/** Runtime object for a built structure (coops also bring their chickens). */
export function addStructureObject(g, st) {
  const def = STRUCTURES[st.type];
  const lv = g.levels.world;
  const o = makeObject({ kind: "structure", type: st.type, tx: st.tx, ty: st.ty, w: def.w, h: def.h, uid: st.uid }, 100000 + st.uid);
  o.solid = !def.floor;
  o.flat = !!def.floor;
  if (st.type === "coop") {
    o.style = "coop";
    o.y = (st.ty + def.h) * TILE - 2;
    o.chickens = st.hens.map((_, i) => Object.assign(createChicken(o.x + (i ? 20 : -20), o.y + 20), { coop: st.uid, hen: i }));
    g.chickens.push(...o.chickens);
  }
  if (st.type === "well") o.y = (st.ty + 2) * TILE - 4;
  if (MACHINES[st.type]) o.busy = !!st.input;
  lv.add(o);
  resolveObject(o, g.s.clock.season);
  return o;
}

/** Re-resolve every sprite for the current season, re-bake the ground and start decoding the new art. */
export function resolveSeason(g) {
  const season = g.s.clock.season;
  const warm = {};
  for (const id in g.levels) for (const o of g.levels[id].objects) {
    resolveObject(o, season);
    if (id === "world" && o.spr) warm[o.key] = o.spr;
  }
  g.ground.setSeason(season);
  warmSvgSprites(warm, DEFS, g.cam.z * (g.view.k || 1));
}

/** Crop draw records mirror the soil map. */
export function syncSoil(g, idx) {
  const t = g.s.soil[idx];
  const w = g.levels.world.w;
  let d = g.cropDraw.get(idx);
  if (!t) {
    g.cropDraw.delete(idx);
    return;
  }
  if (!d) {
    const tx = idx % w;
    const ty = (idx / w) | 0;
    d = { dk: "crop", idx, tx, ty, x: tx * TILE + TILE / 2, y: ty * TILE + TILE - 7, pop: 0, key: "", spr: null };
    g.cropDraw.set(idx, d);
  }
  if (t.crop) {
    const st = t.crop.dead ? "dead" : visualStage(t.crop, CROPS[t.crop.id]);
    d.key = cropKey(t.crop.id, st);
    d.spr = cropSpr(t.crop.id, st);
  } else d.spr = null;
}

function syncAllSoil(g) {
  g.cropDraw.clear();
  for (const k in g.s.soil) syncSoil(g, +k);
}

export function writeSave(g) {
  const s = g.s;
  s.player = { level: g.lv.id, x: g.player.x, y: g.player.y, dir: g.player.dir };
  s.horse = { ...s.horse, x: g.horse.x, y: g.horse.y, dir: g.horse.dir, level: g.horse.level, mounted: g.player.mounted };
  return save.write(s);
}

export function newGame(g, profile) {
  save.clear();
  loadState(g, newState(profile));
  g.mode = "play";
  fadeIn(g);
  writeSave(g);
  queueIntro(g);
}

export function continueGame(g) {
  const s = save.load();
  if (!s) return false;
  loadState(g, s);
  g.mode = "play";
  fadeIn(g);
  toast(g, `Welcome back, ${s.profile.name}.`);
  queueIntro(g);
  return true;
}

// ── Transitions ─────────────────────────────────────────────────────────────

export function fadeOut(g, cb, speed = 4) {
  g.fade.target = 1;
  g.fade.speed = speed;
  g.fade.cb = cb;
}

export function fadeIn(g, speed = 3) {
  g.fade.a = Math.max(g.fade.a, 0.999);
  g.fade.target = 0;
  g.fade.speed = speed;
  g.fade.cb = null;
}

/** Move the player to another level through a fade. */
export function goTo(g, levelId, tx, ty, dir) {
  if (g.fade.target === 1) return;
  const busy = g.mode;
  g.mode = "fade";
  fadeOut(g, () => {
    g.lv = g.levels[levelId];
    g.player.x = tx * TILE + TILE / 2;
    g.player.y = ty * TILE + TILE / 2 + 6;
    g.player.dir = dir;
    teleportPet(g.pet, g.player, g.lv);
    snapCamera(g.cam, g.lv, g.player.x, g.player.y - 20, g.view);
    g.mode = busy === "fade" ? "play" : busy;
    fadeIn(g);
  });
}

// ── Day cycle ───────────────────────────────────────────────────────────────

/** End the day: ship, grow, roll over, autosave, show the summary card. */
export function sleep(g, passedOut = false) {
  g.mode = "fade";
  fadeOut(
    g,
    () => {
      const before = g.s.clock.season;
      const { state, report } = endDay(g.s, { crops: CROPS, items: ITEMS, w: g.levels.world.w, spots: g.spots, forage: FORAGE, rareForage: RARE_FORAGE, passedOut, mult: (id) => sellMult(g.s.professions, id, ITEMS[id]) });
      g.s = state;
      g.s.stats.earned += report.total;
      regrowWorld(g);
      for (const o of g.levels.world.objects) if (o.kind === "structure" && MACHINES[o.type]) {
        o.busy = !!g.s.structures.find((st) => st.uid === o.uid)?.input;
        resolveObject(o, g.s.clock.season);
      }
      if (g.s.clock.season !== before) resolveSeason(g);
      syncAllSoil(g);
      // Wake up in bed.
      g.lv = g.levels.house;
      g.player.mounted = false;
      g.player.x = 4 * TILE + TILE / 2;
      g.player.y = 5 * TILE + 10;
      g.player.dir = "down";
      if (g.horse.level === "world" && g.s.horse.name) placeHorseAtStable(g);
      teleportPet(g.pet, g.player, g.lv);
      for (const v of g.villagers) placeVillager(v, g.s.clock.min, routineCtx(g.s));
      snapCamera(g.cam, g.lv, g.player.x, g.player.y - 20, g.view);
      g.tickAcc = 0;
      writeSave(g);
      g.mode = "summary";
      g.ui.summary(report, g.s, () => {
        g.mode = "play";
        fadeIn(g, 2);
        if (report.seasonChanged) toast(g, `A new season begins!`);
      });
    },
    passedOut ? 1.2 : 1.6,
  );
}

function placeHorseAtStable(g) {
  g.horse.x = 5.5 * TILE;
  g.horse.y = 25.6 * TILE;
  g.horse.dir = "right";
}

/** Daily regrowth: stumps become trees, broken rocks return. */
function regrowWorld(g) {
  const day = dayIndex(g.s.clock);
  const lv = g.levels.world;
  for (const o of lv.objects) {
    const st = g.s.objs[o.id];
    if (!st || st.back === undefined || st.back > day) continue;
    if (lv.at(o.tx, o.ty) && lv.at(o.tx, o.ty) !== o) continue;
    if (g.s.soil[o.ty * lv.w + o.tx]) continue;
    o.gone = false;
    o.stump = false;
    o.hp = o.kind === "tree" ? 6 : o.small ? 1 : 4;
    lv.index(o, o);
    delete g.s.objs[o.id];
    resolveObject(o, g.s.clock.season);
  }
}

// ── Frame update ────────────────────────────────────────────────────────────

const TGT = [0, 0];
const SLOT_KEYS = Array.from({ length: HOTBAR }, (_, i) => `slot${i + 1}`);

export function update(g, dt, t) {
  g.time = t;
  const f = g.fade;
  if (f.a !== f.target) {
    const step = dt * f.speed;
    f.a = f.a < f.target ? Math.min(f.target, f.a + step) : Math.max(f.target, f.a - step);
    if (f.a === f.target && f.cb) {
      const cb = f.cb;
      f.cb = null;
      cb();
    }
  }
  updateFx(dt);
  updateHud(g, dt);
  if (g.tutFlash > 0) g.tutFlash -= dt;
  g.ui.syncHud(g);
  const input = g.input;

  if (g.mode === "title") {
    g.attract += dt;
    const lv = g.levels.world;
    const cx = (36 + Math.sin(g.attract * 0.05) * 18) * TILE;
    const cy = (30 + Math.cos(g.attract * 0.04) * 6) * TILE;
    g.lv = lv;
    updateCamera(g.cam, lv, cx, cy, g.view, dt * 0.5);
    for (const v of g.villagers) if (v.level === "world") updateVillager(v, g.s.clock.min, routineCtx(g.s), g.levels, dt);
    return;
  }

  if (g.ui.isOpen()) return;

  if (g.mode === "build") {
    updateBuild(g, dt);
    if (input.pressed("pause")) exitBuild(g);
    return;
  }
  if (g.mode === "fishing") {
    updateFishing(g, dt);
    advanceClock(g, dt);
    return;
  }
  if (g.mode !== "play") return;
  updateIntro(g, dt);
  updateProfessions(g);

  if (input.pressed("pause")) return g.ui.pause();
  if (input.pressed("journal")) return g.ui.journal("friends");
  if (input.pressed("craft")) return g.ui.journal("craft");
  if (input.pressed("friends")) return g.ui.journal("friends");
  if (input.pressed("inventory")) return g.ui.journal("items");

  // Hotbar selection.
  for (let i = 0; i < HOTBAR; i++) if (input.pressed(SLOT_KEYS[i])) g.s.sel = i;
  if (input.mouse.wheel) g.s.sel = (g.s.sel + (input.mouse.wheel > 0 ? 1 : HOTBAR - 1)) % HOTBAR;
  if (input.pressed("zoomIn")) g.cam.z = Math.min(ZOOM_MAX, g.cam.z + 0.15);
  if (input.pressed("zoomOut")) g.cam.z = Math.max(ZOOM_MIN, g.cam.z - 0.15);

  const p = g.player;
  if (p.useT > 0) p.useT = Math.max(0, p.useT - dt);
  const ax = input.axis("left", "right");
  const ay = input.axis("up", "down");
  movePlayer(p, g.lv, ax, ay, dt);
  if (p.mounted) {
    g.horse.x = p.x;
    g.horse.y = p.y;
    g.horse.dir = p.dir;
  }
  checkDoors(g, ax, ay);
  checkHidden(g);

  updateTarget(g, facingTile(p, TGT));
  const slotClicked = input.mouse.clicked ? hotbarSlotAt(g.view, input.mouse.x, input.mouse.y) : -1;
  if (slotClicked >= 0) (g.s.sel = slotClicked), (g.hudFlash = 1.2);
  else if (input.pressed("use") || (input.mouse.clicked && !g.ui.pointerOnUi)) useTool(g);
  if (input.pressed("interact") || input.mouse.rightClicked) interact(g);
  if (input.pressed("mount")) toggleMount(g);

  updatePet(g.pet, p, g.lv, dt, t);
  for (const v of g.villagers) updateVillager(v, g.s.clock.min, routineCtx(g.s), g.levels, dt);
  if (g.lv.id === "world") for (const c of g.chickens) updateChicken(c, g.lv, dt);
  for (const o of g.lv.objects) if (o.shake > 0) o.shake = Math.max(0, o.shake - dt);
  for (const d of g.cropDraw.values()) if (d.pop > 0) d.pop = Math.max(0, d.pop - dt);

  advanceClock(g, dt);
  updateCamera(g.cam, g.lv, p.x, p.y - 20, g.view, dt);
}

function advanceClock(g, dt) {
  g.tickAcc += dt;
  while (g.tickAcc >= TICK_SECONDS) {
    g.tickAcc -= TICK_SECONDS;
    const r = tick(g.s.clock);
    g.s.clock = r.clock;
    if (g.s.clock.min === 22 * 60) toast(g, "It's getting late... time for bed soon.");
    if (r.passOut) {
      g.mode = "fade";
      toast(g, "You collapse from exhaustion...");
      return sleep(g, true);
    }
  }
}

/** Smooth minute for lighting between ticks. */
export const smoothMinute = (g) => g.s.clock.min + (g.tickAcc / TICK_SECONDS) * TICK_MIN;

let doorWarned = 0;
function checkDoors(g, ax, ay) {
  const p = g.player;
  const lv = g.lv;
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor((p.y - 2) / TILE);
  const door = lv.doors.get(ty * lv.w + tx);
  if (door && !p.mounted) {
    const into = door.to === "world" ? ay > 0 : ay < 0;
    if (into || door.to === "world") goTo(g, door.to, door.tx, door.ty, door.dir);
    return;
  }
  if (p.mounted && (ax || ay)) {
    const fx = Math.floor((p.x + ax * 14) / TILE);
    const fy = Math.floor((p.y + ay * 10 - 2) / TILE);
    if (lv.doors.has(fy * lv.w + fx) && g.time - doorWarned > 3) {
      doorWarned = g.time;
      toast(g, `Hop off ${g.s.horse.name || "the horse"} first (F).`);
    }
  }
}

function checkHidden(g) {
  if (g.lv.id !== "world") return;
  const tx = Math.floor(g.player.x / TILE);
  const ty = Math.floor(g.player.y / TILE);
  for (const h of HIDDEN) {
    if (g.s.flags.found[h.id] || tx < h.x0 || tx > h.x1 || ty < h.y0 || ty > h.y1) continue;
    g.s.flags.found[h.id] = true;
    toast(g, `You discovered ${h.name}!`, "star_shard");
  }
}

/** Refresh the facing tile now (scripted actions outside the frame loop). */
export const retarget = (g) => updateTarget(g, facingTile(g.player, TGT));

export function setEnergy(g, v) {
  g.s.energy = Math.max(0, Math.min(MAX_ENERGY, v));
}

export const render = renderGame;
