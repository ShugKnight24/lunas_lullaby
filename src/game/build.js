/**
 * Build mode (carpenter board): the camera jumps to the farm, WASD pans,
 * the mouse drives a ghost that is tinted valid/invalid, click places.
 * Move picks a structure up and puts it down for free; Remove refunds half
 * the materials.
 */

import { TILE } from "./config.js";
import { STRUCTURES } from "./data/structures.js";
import { canPlace, affordable, refund } from "./rules/structures.js";
import { newCoop } from "./rules/animals.js";
import { countItem, removeItem, addItem } from "./rules/inventory.js";
import { GR, inFarm, FARM } from "./world/map.js";
import { snapCamera, updateCamera } from "./world/camera.js";
import { resolveObject } from "./art/index.js";
import { addStructureObject } from "./game.js";
import { burst, FXK } from "./world/weather.js";
import { toast } from "./ui/hud.js";

const world = (g) => g.levels.world;

const WALLET = { gold: 0, wood: 0, stone: 0 };
/** What the player can spend (one reused object). */
export function wallet(g) {
  WALLET.gold = g.s.gold;
  WALLET.wood = countItem(g.s.inv, "wood");
  WALLET.stone = countItem(g.s.inv, "stone");
  return WALLET;
}

/** Placement queries for rules/structures.canPlace (built once per game). */
export function placementQuery(g) {
  if (g._pq) return g._pq;
  const lv = world(g);
  return (g._pq = {
    buildable(x, y) {
      const ptx = Math.floor(g.player.x / TILE);
      const pty = Math.floor(g.player.y / TILE);
      if (!inFarm(x, y)) return false;
      const gr = lv.ground[y * lv.w + x];
      if (gr !== GR.GRASS && gr !== GR.FIELD && gr !== GR.SAND) return false;
      if (lv.doors.has(y * lv.w + x)) return false;
      const plv = g.mode === "build" ? g.build.prevLevel : g.lv;
      return !(plv === lv && x === ptx && y === pty);
    },
    blocked(x, y) {
      const o = lv.at(x, y);
      return !!(o && !o.gone && o.kind !== "flowers");
    },
    tilled: (x, y) => !!g.s.soil[y * lv.w + x],
  });
}

export function enterBuild(g, type) {
  g.build.active = true;
  g.build.type = type;
  g.build.mode = "place";
  g.build.moving = null;
  g.build.prevLevel = g.lv;
  g.lv = world(g);
  g.mode = "build";
  snapCamera(g.cam, g.lv, ((FARM.x0 + FARM.x1) / 2) * TILE, 20 * TILE, g.view);
  g.ui.buildBar(true);
}

export function exitBuild(g) {
  if (g.build.moving) placeBack(g);
  g.build.active = false;
  g.lv = g.build.prevLevel ?? world(g);
  g.mode = "play";
  snapCamera(g.cam, g.lv, g.player.x, g.player.y - 20, g.view);
  g.ui.buildBar(false);
}

/** Ghost anchor (top-left tile) under the mouse. */
function hoverTile(g, def) {
  const m = g.input.mouse;
  const z = g.cam.z;
  const wx = (m.x - g.view.w / 2) / z + g.cam.x;
  const wy = (m.y - g.view.h / 2) / z + g.cam.y;
  g.build.tx = Math.floor(wx / TILE - (def.w - 1) / 2);
  g.build.ty = Math.floor(wy / TILE - (def.h - 1) / 2);
}

export function updateBuild(g, dt) {
  const b = g.build;
  const input = g.input;
  const sp = 520 * dt;
  const lv = world(g);
  updateCamera(g.cam, lv, g.cam.x + input.axis("left", "right") * sp * 3, g.cam.y + input.axis("up", "down") * sp * 3, g.view, dt);
  const type = b.moving ? b.moving.type : b.type;
  const def = STRUCTURES[type];
  hoverTile(g, b.mode === "place" || b.moving ? def : { w: 1, h: 1 });
  if (b.mode === "place" || b.moving) {
    b.valid = canPlace(def, b.tx, b.ty, placementQuery(g)) && (b.moving || affordable(def.cost, wallet(g)));
  } else {
    const o = lv.at(b.tx, b.ty);
    b.valid = !!(o && o.kind === "structure");
  }
  if (input.mouse.rightClicked) return exitBuild(g);
  if (!input.mouse.clicked) return; // canvas clicks only: the DOM UI sits above it
  if (b.moving) {
    if (!b.valid) return toast(g, "Can't put it there.");
    const st = b.moving;
    st.tx = b.tx;
    st.ty = b.ty;
    g.s.structures.push(st);
    addStructureObject(g, st);
    b.moving = null;
    fenceMasks(g);
    return;
  }
  if (b.mode === "place") placeStructure(g, b.type, b.tx, b.ty);
  else {
    const o = lv.at(b.tx, b.ty);
    if (!o || o.kind !== "structure") return;
    if (b.mode === "remove") removeStructure(g, o, true);
    else {
      b.moving = removeStructure(g, o, false);
      b.valid = false;
    }
  }
}

/** Pay for and place a structure; returns false when invalid or unaffordable. */
export function placeStructure(g, type, tx, ty) {
  const def = STRUCTURES[type];
  if (!canPlace(def, tx, ty, placementQuery(g))) {
    toast(g, "Can't build there.");
    return false;
  }
  if (!affordable(def.cost, wallet(g))) {
    toast(g, "Not enough materials.");
    return false;
  }
  g.s.gold -= def.cost.gold ?? 0;
  if (def.cost.wood) removeItem(g.s.inv, "wood", def.cost.wood);
  if (def.cost.stone) removeItem(g.s.inv, "stone", def.cost.stone);
  const lv = world(g);
  for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) {
    const o = lv.at(tx + x, ty + y);
    if (o && o.kind === "flowers") (o.gone = true), lv.index(o, null);
  }
  const st = { uid: g.s.uid++, type, tx, ty };
  if (type === "coop") Object.assign(st, newCoop(st.uid));
  g.s.structures.push(st);
  const o = addStructureObject(g, st);
  fenceMasks(g);
  burst(FXK.DUST, o.x, o.y, 10, 60, 0.6, "rgba(200,170,130,0.8)");
  return true;
}

/** Take a structure off the map; `refundIt` returns half the materials. */
export function removeStructure(g, o, refundIt) {
  const lv = world(g);
  const i = g.s.structures.findIndex((s) => s.uid === o.uid);
  const st = g.s.structures[i];
  g.s.structures.splice(i, 1);
  lv.remove(o);
  if (o.chickens) g.chickens = g.chickens.filter((c) => !o.chickens.includes(c));
  if (refundIt) {
    const r = refund(STRUCTURES[st.type].cost);
    for (const k in r) if (r[k]) addItem(g.s.inv, k, r[k]);
    if (st.eggs) st.eggs.forEach((n, q) => n && addItem(g.s.inv, "egg", n, q));
    const def = STRUCTURES[st.type];
    if (def.item) addItem(g.s.inv, def.item);
    if (st.input) addItem(g.s.inv, st.input, 1, st.q);
    if (st.out) addItem(g.s.inv, st.out, 1, st.q);
  }
  fenceMasks(g);
  return st;
}

function placeBack(g) {
  const st = g.build.moving;
  g.s.structures.push(st);
  addStructureObject(g, st);
  g.build.moving = null;
  fenceMasks(g);
}

/** Recompute fence connection masks (fixed fences and built ones). */
export function fenceMasks(g) {
  const lv = world(g);
  const isFence = (x, y) => {
    const o = lv.at(x, y);
    return !!(o && !o.gone && (o.kind === "fence" || (o.kind === "structure" && o.type === "fence")));
  };
  for (const o of lv.objects) {
    if (!(o.kind === "fence" || (o.kind === "structure" && o.type === "fence"))) continue;
    const m = (isFence(o.tx - 1, o.ty) ? 1 : 0) | (isFence(o.tx + 1, o.ty) ? 2 : 0) | (isFence(o.tx, o.ty - 1) ? 4 : 0) | (isFence(o.tx, o.ty + 1) ? 8 : 0);
    if (m !== o.mask || !o.spr) {
      o.mask = m;
      resolveObject(o, g.s.clock.season);
    }
  }
}
