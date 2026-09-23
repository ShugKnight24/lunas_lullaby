/**
 * What the player's hands do: tool use toward the facing tile, the E
 * interaction (talk, gift, pet, ride, ship, harvest, forage, bed, shop,
 * build board, coop) and the prompt preview that tells them which one E will do.
 */

import { TILE, CAN_CAPACITY, MAX_ENERGY } from "./config.js";
import { ITEMS, isGiftable } from "./data/items.js";
import { CROPS } from "./data/crops.js";
import { FORAGE_RESPAWN_DAYS } from "./data/forage.js";
import { LINES, GIFT_LINES, HEART_EVENTS } from "./data/dialogue.js";
import { GR, inFarm } from "./world/map.js";
import { addItem, takeFromSlot } from "./rules/inventory.js";
import { stockHay, petHen, eggCount, henHearts, FEEDS, COOP_HAY_CAP } from "./rules/animals.js";
import { sellPrice, qualityName } from "./rules/quality.js";
import { TOOL_SKILL, toolEnergy, XP, farmingBonus, forageDouble, ranchingPet } from "./rules/skills.js";
import { award, progress, level } from "./progress.js";
import { plant, water, harvest, isRipe, clearDead, emptySoil, fertilize } from "./rules/crops.js";
import { shipItem } from "./rules/shipping.js";
import { dayIndex } from "./rules/clock.js";
import { talk, gift, hearts, eventReady } from "./rules/relationships.js";
import { pickLine, fillLine } from "./rules/dialogue.js";
import { resolveObject } from "./art/index.js";
import { burst, spawnFx, FXK } from "./world/weather.js";
import { boxFree } from "./world/collide.js";
import { syncSoil, sleep, setEnergy } from "./game.js";
import { startFishing } from "./fishing.js";
import { toast } from "./ui/hud.js";

const REGROW = { tree: 7, rock: 4, weed: 5, twig: 5 };

export const selected = (g) => g.s.inv[g.s.sel];
const today = (g) => dayIndex(g.s.clock);
const tileIdx = (g, tx, ty) => ty * g.levels.world.w + tx;
const cx = (tx) => tx * TILE + TILE / 2;
const cy = (ty) => ty * TILE + TILE / 2;

/** Add items (at quality q) to the bag with a toast; returns false if nothing fit. */
export function give(g, id, n, x, y, q = 0) {
  const left = addItem(g.s.inv, id, n, q);
  if (left === n) {
    toast(g, "Your bag is full!");
    return false;
  }
  toast(g, `+${n - left} ${qualityName(ITEMS[id].name, q)}`, id);
  if (x !== undefined) burst(FXK.SPARK, x, y - 10, 5, 60, 0.6, "#fff6c8");
  return true;
}

function spend(g, cost) {
  if (g.s.energy < cost) {
    toast(g, "You're too tired... eat something or rest.");
    return false;
  }
  setEnergy(g, g.s.energy - cost);
  return true;
}

function persist(g, o) {
  const st = (g.s.objs[o.id] ??= {});
  st.hp = o.hp;
  if (o.stump) st.stump = true;
  if (o.gone) {
    st.gone = true;
    const days = REGROW[o.kind];
    if (days && !(inFarm(o.tx, o.ty) && o.kind !== "tree")) st.back = today(g) + days;
  }
}

function removeObj(g, o) {
  o.gone = true;
  g.lv.index(o, null);
  persist(g, o);
}

// ── Tools ───────────────────────────────────────────────────────────────────

export function useTool(g) {
  const p = g.player;
  if (p.useT > 0 || p.mounted) return;
  const slot = selected(g);
  if (!slot) return;
  const def = ITEMS[slot.id];
  const [tx, ty] = g.target;
  if (def.kind === "food") return eat(g);
  if (def.kind === "seed") return sow(g, slot, tx, ty);
  if (def.kind === "fertilizer") return feedSoil(g, slot, tx, ty);
  if (def.kind !== "tool") return toast(g, def.kind === "crop" || def.kind === "forage" || def.kind === "fish" || def.kind === "animal" ? "Ship it in the bin or give it as a gift (E)." : `${def.name}: nothing to do with it here.`);
  if (slot.id === "rod") return startFishing(g);
  if (!spend(g, toolEnergy(def.energy, level(g, TOOL_SKILL[slot.id])))) return;
  p.useT = p.useMax;
  p.useItem = slot.id;
  const lv = g.lv;
  const o = lv.at(tx, ty);
  const x = cx(tx);
  const y = cy(ty);
  if (slot.id === "hoe") return hoe(g, tx, ty, o);
  if (slot.id === "can") return waterTile(g, tx, ty, o);
  if (slot.id === "axe" && o && !o.gone) return chop(g, o);
  if (slot.id === "scythe") {
    if (o && !o.gone && o.kind === "weed") {
      removeObj(g, o);
      burst(FXK.LEAF, x, y, 6, 40, 0.8, "#7cc05a");
      if (Math.random() < 0.6) give(g, "fiber", 1, x, y);
      return;
    }
    const idx = tileIdx(g, tx, ty);
    if (lv.id === "world" && g.s.soil[idx]) return reap(g, idx, tx, ty);
  }
  burst(FXK.DUST, x, y + 8, 3, 30, 0.4, "rgba(200,170,130,0.7)");
}

function hoe(g, tx, ty, o) {
  const lv = g.lv;
  const x = cx(tx);
  const y = cy(ty);
  if (lv.id !== "world" || !inFarm(tx, ty)) return toast(g, "You can only till soil on your farm.");
  const idx = tileIdx(g, tx, ty);
  const cur = g.s.soil[idx];
  if (cur) {
    if (cur.crop?.dead) {
      g.s.soil[idx] = clearDead(cur);
      syncSoil(g, idx);
    }
    return;
  }
  const gr = lv.ground[idx];
  if (gr !== GR.GRASS && gr !== GR.FIELD) return;
  if (o && !o.gone) {
    if (o.kind !== "flowers") return;
    removeObj(g, o);
  }
  if (Math.abs(g.player.x - x) < 10 && Math.abs(g.player.y - y) < 10) return;
  g.s.soil[idx] = { ...emptySoil(), watered: g.s.weather === "rain" };
  syncSoil(g, idx);
  burst(FXK.DUST, x, y + 6, 6, 50, 0.5, "rgba(170,120,80,0.8)");
  progress(g, "till");
}

function isWaterSource(g, tx, ty, o) {
  if (g.lv.isWater(tx, ty)) return true;
  return !!(o && !o.gone && (o.kind === "well" || (o.kind === "structure" && o.type === "well")));
}

function waterTile(g, tx, ty, o) {
  const x = cx(tx);
  const y = cy(ty);
  if (isWaterSource(g, tx, ty, o)) {
    g.s.water = CAN_CAPACITY;
    burst(FXK.SPLASH, x, y, 8, 70, 0.6, "#bfe6ff");
    progress(g, "refill");
    return toast(g, "Watering can refilled!", "can");
  }
  const idx = tileIdx(g, tx, ty);
  const t = g.lv.id === "world" && g.s.soil[idx];
  if (!t) return;
  if (g.s.water <= 0) return toast(g, "Your watering can is empty. Refill it at the pond or a well.");
  g.s.water--;
  g.s.soil[idx] = water(t);
  if (t.crop) progress(g, "water");
  for (let i = 0; i < 6; i++) spawnFx(FXK.DROP, x + (Math.random() - 0.5) * 16, y - 18, (Math.random() - 0.5) * 30, 20, 0.45, "#8fd0ff");
}

function sow(g, slot, tx, ty) {
  if (g.lv.id !== "world") return;
  const idx = tileIdx(g, tx, ty);
  const def = CROPS[ITEMS[slot.id].crop];
  const r = plant(g.s.soil[idx], def, ITEMS[slot.id].crop, g.s.clock.season);
  if (r.error) return toast(g, r.error);
  g.s.soil[idx] = r.tile;
  takeFromSlot(g.s.inv, g.s.sel);
  syncSoil(g, idx);
  g.player.useT = 0.18;
  g.player.useItem = null;
  burst(FXK.DUST, cx(tx), cy(ty) + 6, 3, 25, 0.4, "rgba(170,120,80,0.7)");
  progress(g, "plant");
}

function feedSoil(g, slot, tx, ty) {
  if (g.lv.id !== "world") return;
  const idx = tileIdx(g, tx, ty);
  const r = fertilize(g.s.soil[idx], ITEMS[slot.id].tier);
  if (r.error) return toast(g, r.error);
  g.s.soil[idx] = r.tile;
  takeFromSlot(g.s.inv, g.s.sel);
  g.player.useT = 0.18;
  g.player.useItem = null;
  burst(FXK.DUST, cx(tx), cy(ty) + 6, 5, 30, 0.5, "rgba(120,90,160,0.7)");
}

function reap(g, idx, tx, ty) {
  const t = g.s.soil[idx];
  if (!t.crop) return false;
  if (t.crop.dead) {
    g.s.soil[idx] = clearDead(t);
    syncSoil(g, idx);
    return true;
  }
  const def = CROPS[t.crop.id];
  const h = harvest(t, def, Math.random(), farmingBonus(level(g, "farming")));
  if (!h) return false;
  if (!give(g, h.item, h.qty, cx(tx), cy(ty), h.q)) return true;
  award(g, "farming", XP.harvest(ITEMS[h.item].sell) * h.qty);
  g.s.soil[idx] = h.tile;
  syncSoil(g, idx);
  const d = g.cropDraw.get(idx);
  if (d) d.pop = 0.4;
  burst(FXK.SPARK, cx(tx), cy(ty) - 12, 8, 90, 0.7, "#fff2a0");
  burst(FXK.LEAF, cx(tx), cy(ty) - 6, 4, 50, 0.6, def.accent);
  return true;
}

function chop(g, o) {
  const x = o.x;
  const y = o.y;
  o.shake = 0.3;
  if (o.kind === "tree") {
    o.hp--;
    burst(FXK.CHIP, x, y - 20, 4, 70, 0.5, "#c8945a");
    if (!o.stump && g.s.clock.season !== 3) burst(FXK.LEAF, x + (Math.random() - 0.5) * 40, y - 70, 3, 30, 1.2, o.variant === "pine" ? "#4f9570" : "#f0a040");
    if (o.hp <= 0) {
      if (!o.stump) {
        o.stump = true;
        o.hp = 3;
        resolveObject(o, g.s.clock.season);
        give(g, "wood", 5, x, y);
        award(g, "foraging", XP.tree);
        burst(FXK.LEAF, x, y - 40, 12, 90, 1.4, o.variant === "pine" ? "#4f9570" : "#8cc86a");
      } else {
        removeObj(g, o);
        give(g, "wood", 2, x, y);
      }
    }
    persist(g, o);
    return;
  }
  if (o.kind === "rock") {
    o.hp--;
    burst(FXK.CHIP, x, y - 10, 5, 80, 0.5, "#b5acb6");
    if (o.hp <= 0) {
      removeObj(g, o);
      give(g, "stone", o.small ? 1 : 3, x, y);
    } else persist(g, o);
    return;
  }
  if (o.kind === "twig") {
    removeObj(g, o);
    give(g, "wood", 1, x, y);
  }
}

function eat(g) {
  const slot = selected(g);
  const def = ITEMS[slot.id];
  if (g.s.energy >= MAX_ENERGY) return toast(g, "You're not hungry right now.");
  takeFromSlot(g.s.inv, g.s.sel);
  setEnergy(g, g.s.energy + def.energy);
  toast(g, `Yum! ${def.name} restored ${def.energy} energy.`, slot.id);
}

// ── Interaction (E) ─────────────────────────────────────────────────────────

const near = (a, x, y, r) => Math.abs(a.x - x) < r && Math.abs(a.y - y) < r;
const front = [0, 0];
function frontPoint(p) {
  front[0] = p.x + (p.dir === "left" ? -22 : p.dir === "right" ? 22 : 0);
  front[1] = p.y + (p.dir === "up" ? -20 : p.dir === "down" ? 18 : 0);
  return front;
}

/** Is the (unmounted) horse within reach of the point in front of the player? */
function horseNear(g) {
  const f = frontPoint(g.player);
  return g.lv.id === g.horse.level && Math.abs(g.horse.x - f[0]) < 46 && Math.abs(g.horse.y - f[1]) < 30;
}

function villagerAt(g, x, y) {
  for (const v of g.villagers) if (v.level === g.lv.id && near(v, x, y, 26)) return v;
  return null;
}

function show(pr, text, x, y) {
  pr.on = true;
  pr.text = text;
  pr.x = x;
  pr.y = y;
}

/** What E would do right now: sets g.prompt for the HUD. */
export function updateTarget(g, tile) {
  g.target[0] = tile[0];
  g.target[1] = tile[1];
  const pr = g.prompt;
  pr.on = false;
  const p = g.player;
  const f = frontPoint(p);
  const fx = f[0];
  const fy = f[1];
  const v = villagerAt(g, fx, fy);
  const slot = selected(g);
  if (p.mounted) return;
  if (v) return show(pr, slot && isGiftable(slot.id) && g.s.rel[v.id].met ? "Give gift" : "Talk", v.x, v.y - 58);
  if (near(g.pet, fx, fy, 24)) return show(pr, "Pet", g.pet.x, g.pet.y - 30);
  const hen = !coopWants(g, g.lv.at(tile[0], tile[1])) && chickenAt(g, fx, fy);
  if (hen) return show(pr, `Pet ${henOf(g, hen).name}`, hen.x, hen.y - 30);
  if (horseNear(g)) return show(pr, g.s.horse.name ? "Ride" : "Name horse", g.horse.x, g.horse.y - 80);
  const tx = tile[0];
  const ty = tile[1];
  const o = g.lv.at(tx, ty);
  if (o && !o.gone) {
    if (o.kind === "bin") return show(pr, "Ship", o.x, o.y - 40);
    if (o.kind === "board" || (o.kind === "furniture" && o.build)) return show(pr, "Build", o.x, o.y - 56);
    if (o.kind === "furniture" && o.shop) return show(pr, "Shop", o.x, o.y - 56);
    if (o.kind === "furniture" && o.name === "bed") return show(pr, "Sleep", o.x, o.y - 70);
    if (o.kind === "structure" && o.type === "coop") {
      const st = coopState(g, o);
      return show(pr, eggCount(st) ? "Collect eggs" : slot && FEEDS.includes(slot.id) ? "Add feed" : "Coop", o.x, o.y - 100);
    }
  }
  if (g.lv.id === "world") {
    const idx = tileIdx(g, tx, ty);
    const sp = g.spotAt.get(idx);
    if (sp && g.s.forage[sp.id]?.item) return show(pr, "Pick up", cx(tx), cy(ty) - 26);
    const t = g.s.soil[idx];
    if (t?.crop && isRipe(t.crop, CROPS[t.crop.id])) return show(pr, "Harvest", cx(tx), cy(ty) - 40);
  }
}

export function interact(g) {
  const p = g.player;
  if (p.mounted) return toggleMount(g);
  const [fx, fy] = frontPoint(p);
  const v = villagerAt(g, fx, fy);
  if (v) return chat(g, v);
  if (near(g.pet, fx, fy, 24)) return petPet(g);
  const hen = !coopWants(g, g.lv.at(g.target[0], g.target[1])) && chickenAt(g, fx, fy);
  if (hen) return petChicken(g, hen);
  if (horseNear(g)) return toggleMount(g);
  const [tx, ty] = g.target;
  const o = g.lv.at(tx, ty);
  if (o && !o.gone) {
    if (o.kind === "bin") return ship(g);
    if (o.kind === "board" || (o.kind === "furniture" && o.build)) return g.ui.buildMenu();
    if (o.kind === "furniture" && o.shop) return g.ui.shop();
    if (o.kind === "furniture" && o.name === "bed") return g.ui.confirm("Go to bed and end the day?", "Sleep", "Not yet", () => (progress(g, "sleep"), sleep(g)));
    if (o.kind === "structure" && o.type === "coop") return tendCoop(g, o);
  }
  if (g.lv.id === "world") {
    const idx = tileIdx(g, tx, ty);
    const sp = g.spotAt.get(idx);
    const fo = sp && g.s.forage[sp.id];
    if (fo?.item) {
      const n = Math.random() < forageDouble(level(g, "foraging")) ? 2 : 1;
      if (give(g, fo.item, n, cx(tx), cy(ty))) {
        g.s.forage[sp.id] = { item: null, next: today(g) + FORAGE_RESPAWN_DAYS };
        award(g, "foraging", XP.forage);
        progress(g, "forage");
      }
      return;
    }
    if (g.s.soil[idx]?.crop && reap(g, idx, tx, ty)) return;
  }
  const slot = selected(g);
  if (slot && ITEMS[slot.id].kind === "food") eat(g);
}

function ship(g) {
  const slot = selected(g);
  const def = slot && ITEMS[slot.id];
  if (!def || def.kind === "tool" || !def.sell) return toast(g, "Hold something to sell, then press E at the bin.");
  g.s.bin = shipItem(g.s.bin, slot.id, slot.n, slot.q);
  progress(g, "ship");
  toast(g, `Shipped ${slot.n} × ${qualityName(def.name, slot.q)} (${slot.n * sellPrice(def.sell, slot.q)}g tonight)`, slot.id);
  g.s.inv[g.s.sel] = null;
}

const coopState = (g, o) => g.s.structures.find((st) => st.uid === o.uid);
const henOf = (g, c) => g.s.structures.find((st) => st.uid === c.coop).hens[c.hen];

/** The coop has something for E to do (eggs, or feed in hand), so it wins over a hen in the way. */
function coopWants(g, o) {
  if (!o || o.gone || o.kind !== "structure" || o.type !== "coop") return false;
  const slot = selected(g);
  return eggCount(coopState(g, o)) > 0 || !!(slot && FEEDS.includes(slot.id));
}

function chickenAt(g, x, y) {
  if (g.lv.id !== "world") return null;
  for (const c of g.chickens) if (near(c, x, y, 20)) return c;
  return null;
}

function petChicken(g, c) {
  const st = g.s.structures.find((s) => s.uid === c.coop);
  const r = petHen(st.hens[c.hen], today(g), ranchingPet(level(g, "ranching")));
  st.hens[c.hen] = r.hen;
  const hearts = "♥".repeat(henHearts(r.hen)) || "♡";
  if (!r.gained) return toast(g, `${r.hen.name} is content. ${hearts}`);
  burst(FXK.HEART, c.x, c.y - 20, 3, 30, 1);
  award(g, "ranching", XP.petHen);
  toast(g, `${r.hen.name} clucks happily! ${hearts}`, "egg");
}

/** E at the coop: collect eggs first, otherwise stock the feed in hand. */
function tendCoop(g, o) {
  const st = coopState(g, o);
  const total = eggCount(st);
  if (total) {
    const left = st.eggs.map((n, q) => (n ? addItem(g.s.inv, "egg", n, q) : 0));
    const got = total - eggCount({ eggs: left });
    if (!got) return toast(g, "Your bag is full!");
    const fine = st.eggs[1] - left[1] + st.eggs[2] - left[2];
    st.eggs = left;
    award(g, "ranching", XP.egg * got);
    toast(g, `+${got} Egg${got > 1 ? "s" : ""}${fine ? ` (${fine} extra fine!)` : ""}`, "egg");
    burst(FXK.SPARK, o.x, o.y - 40, 6, 60, 0.6, "#fff6c8");
    return;
  }
  const slot = selected(g);
  if (!slot || !FEEDS.includes(slot.id)) return toast(g, `Feed: ${st.hay}/${COOP_HAY_CAP} hay. Hold hay or fiber and press E to stock it.`);
  const r = stockHay(st, slot.n);
  if (!r.used) return toast(g, "The feed bin is full.");
  takeFromSlot(g.s.inv, g.s.sel, r.used);
  st.hay = r.st.hay;
  toast(g, `Stocked ${r.used} ${ITEMS[slot.id].name} · ${st.hay}/${COOP_HAY_CAP} hay`, slot.id);
}

function petPet(g) {
  const a = g.pet;
  const d = today(g);
  burst(FXK.HEART, a.x, a.y - 22, g.s.pet.petted === d ? 1 : 4, 30, 1.1);
  a.state = "sit";
  a.stateT = 2;
  if (g.s.pet.petted !== d) {
    g.s.pet.petted = d;
    g.s.pet.happy = Math.min(100, g.s.pet.happy + 10);
    toast(g, `${a.name} loves you! ♥`);
  }
}

export function toggleMount(g) {
  const p = g.player;
  if (p.mounted) {
    if (!g.lv.outdoor) return;
    const offs = p.dir === "left" || p.dir === "right" ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
    for (const [ox, oy] of offs) {
      const x = p.x + ox * 26;
      const y = p.y + oy * 22;
      if (boxFree(g.lv, x, y)) {
        p.mounted = false;
        g.horse.x = p.x;
        g.horse.y = p.y;
        g.horse.dir = p.dir;
        p.x = x;
        p.y = y;
        return;
      }
    }
    return toast(g, "No room to hop off here.");
  }
  if (!horseNear(g)) return;
  if (!g.s.horse.name) {
    return g.ui.askName("Your horse looks at you expectantly. What will you name them?", "Clover", (name) => {
      g.s.horse.name = name;
      toast(g, `${name} nickers happily!`);
    });
  }
  p.mounted = true;
  p.x = g.horse.x;
  p.y = g.horse.y;
  if (g.horse.dir === "left" || g.horse.dir === "right") p.dir = g.horse.dir;
  burst(FXK.DUST, p.x, p.y, 6, 50, 0.5, "rgba(200,170,130,0.7)");
}

// ── Villagers ───────────────────────────────────────────────────────────────

function chat(g, v) {
  progress(g, "talk");
  const rel = g.s.rel[v.id];
  const slot = selected(g);
  const d = today(g);
  v.pause = 4;
  const p = g.player;
  v.dir = Math.abs(p.x - v.x) > Math.abs(p.y - v.y) ? (p.x < v.x ? "left" : "right") : p.y < v.y ? "up" : "down";
  const vars = { name: g.s.profile.name, farm: g.s.profile.farm };
  if (slot && isGiftable(slot.id) && rel.met) {
    const r = gift(rel, slot.id, v.def, d, slot.q);
    if (r.refused) return g.ui.dialogue(v, [`You've already given ${v.def.name} a gift today.`]);
    g.s.rel[v.id] = r.rel;
    takeFromSlot(g.s.inv, g.s.sel);
    if (r.delta > 0) burst(FXK.HEART, v.x, v.y - 50, r.taste === "love" ? 6 : 3, 40, 1.2);
    return g.ui.dialogue(v, [GIFT_LINES[v.id][r.taste]]);
  }
  const ev = (HEART_EVENTS[v.id] ?? []).find((e) => eventReady(rel, e));
  if (ev) {
    g.s.rel[v.id] = { ...rel, events: { ...rel.events, [ev.hearts]: true } };
    return g.ui.dialogue(v, ev.lines.map((l) => fillLine(l, vars)), () => ev.reward && give(g, ev.reward, ev.n ?? 1, p.x, p.y), true);
  }
  const ctx = { season: g.s.clock.season, weather: g.s.weather, hearts: hearts(rel), day: d, met: rel.met };
  const line = fillLine(pickLine(LINES[v.id], ctx), vars);
  const r = talk(rel, d);
  g.s.rel[v.id] = { ...r.rel, met: true };
  if (r.gained) burst(FXK.HEART, v.x, v.y - 50, 2, 30, 1);
  g.ui.dialogue(v, [line]);
}
