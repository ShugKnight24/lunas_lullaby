/**
 * Action combat in the Wildwood: sword swings and the charged spin, creature
 * populations per zone, projectiles and root spikes, the Gloomroot, your
 * companion fighting beside you, loot drops, damage numbers, screen shake,
 * hit-stop and fainting. The rules (damage, XP, drops) are in rules/combat.js.
 */

import { TILE } from "./config.js";
import { ITEMS } from "./data/items.js";
import { ZONE_SPAWNS, CLEANSED_SPAWN_MULT } from "./data/monsters.js";
import { QUESTS, BOARD_POOL } from "./data/quests.js";
import { VILLAGERS } from "./data/villagers.js";
import { BOSS_HOME, PLACES } from "./world/wildwood.js";
import { createEnemy, updateEnemy, airborne } from "./actors/enemies.js";
import { activeBuff } from "./rules/cooking.js";
import { BUFFS } from "./data/cooking.js";
import { dayIndex } from "./rules/clock.js";
import { statsFor, reduce, equip as wearRule, unequip as takeOffRule, pointsFree } from "./rules/equipment.js";
import { swingDamage, applyDamage, knockback, inArc, rollDrops, rollGold, faintPenalty, IFRAMES, CHARGE_TIME, petDamage, petGainXp, petCanFight, petHasPerk, petMaxHp } from "./rules/combat.js";
import { advance, questDef, isReady, goalProgress } from "./rules/quests.js";
import { careerRank } from "./rules/careers.js";
import { has, XP } from "./rules/skills.js";
import { addItem, countItem } from "./rules/inventory.js";
import { award, level, diary } from "./progress.js";
import { burst, FXK } from "./world/weather.js";
import { boxFree, moveBox } from "./world/collide.js";
import { resolveObject, projSpr, iconKey, iconSpr, enemySpr, DEFS } from "./art/index.js";
import { drawSvgSprite, warmSvgSprites } from "../engine/sprite.js";
import { personFrames } from "./art/person.js";
import { sfx } from "./audio/sfx.js";
import { toast } from "./ui/hud.js";
import { fadeOut, fadeIn, setEnergy } from "./game.js";
import { snapCamera } from "./world/camera.js";
import { teleportPet } from "./actors/actors.js";

const RESPAWN_SECONDS = 16;
const PET_BITE_CD = 1.05;
const MAGNET = 48;
const MAGNET_FETCH = 120;

/** Player and companion as creature targets (reused, no per-frame objects). */
const PT = { x: 0, y: 0, alive: true, who: "player" };
const CT = { x: 0, y: 0, alive: false, who: "pet" };
const TARGETS = [PT, CT];

export function resetCombat(g) {
  g.enemies = [];
  g.shots = [];
  g.drops = [];
  g.nums = [];
  g.sparks = [];
  g.shake = 0;
  g.shakeX = g.shakeY = 0;
  g.hitStop = 0;
  g.combatLv = null;
  g.spawnT = 0;
  g.swingId = 0;
  g.boss = null;
  g.petCd = 0;
  g.howlCd = 0;
  g.sniffT = 0;
  g.sniffed = new Set();
}

export const inWild = (g) => g.lv?.id === "wildwood";

/**
 * Derived stats for the current save (rules/equipment.js statsFor),
 * recomputed only when what they depend on changes.
 */
export function playerStats(g) {
  const s = g.s;
  const c = (g._stats ??= { equip: null, attrs: null, xp: -1, guild: -1, buff: null, v: null });
  const buff = buffNow(g);
  if (c.equip !== s.equip || c.attrs !== s.attrs || c.xp !== s.skills.combat || c.guild !== s.guild || c.buff !== buff) {
    c.equip = s.equip;
    c.attrs = s.attrs;
    c.xp = s.skills.combat;
    c.guild = s.guild;
    c.buff = buff;
    c.v = statsFor(s, ITEMS, careerRank(s, "adventurer"), buff);
  }
  return c.v;
}
export const playerMaxHp = (g) => playerStats(g).maxHp;

/** Today's cooking buff (data/cooking.js BUFFS), or null. */
export const buffNow = (g) => activeBuff(g.s, dayIndex(g.s.clock), BUFFS);
const weaponOf = (g) => g.s.equip.weapon;

/** Your look with what you're wearing (art/person.js draws the gear). */
export const playerLook = (s) => ({ ...s.profile.look, gear: s.equip });

/** Rebuild your sprite frames after changing gear. */
export function refreshLook(g) {
  const look = playerLook(g.s);
  g.player.frames = personFrames(look, "p");
  g.player.weapon = g.s.equip.weapon;
  g.player.swingFrames = g.s.equip.weapon ? personFrames({ ...look, gear: { ...look.gear, weapon: null } }, "p") : null;
}

/** Put on the gear in bag slot `i`. */
export function wear(g, i) {
  const id = g.s.inv[i]?.id;
  const r = wearRule(g.s, g.s.inv, i, ITEMS);
  if (r.error) return toast(g, r.error), false;
  g.s.equip = r.equip;
  g.s.hp = Math.min(g.s.hp, playerMaxHp(g));
  refreshLook(g);
  sfx(g, "craft");
  toast(g, `Equipped ${ITEMS[id].name}${ITEMS[id].slot === "weapon" ? " · Q to swing" : ""}`, id);
  return true;
}

/** New gear goes straight on when its slot is empty (and you can wear it). */
export function autoWear(g, id) {
  const it = ITEMS[id];
  if (!it?.slot || g.s.equip[it.slot] || (it.lvl ?? 0) > level(g, "combat")) return;
  const i = g.s.inv.findIndex((x) => x?.id === id);
  if (i >= 0) wear(g, i);
}

/** Take off whatever is in `slot`. */
export function takeOff(g, slot) {
  const id = g.s.equip[slot];
  const r = takeOffRule(g.s, g.s.inv, slot);
  if (r.error) return toast(g, r.error), false;
  g.s.equip = r.equip;
  g.s.hp = Math.min(g.s.hp, playerMaxHp(g));
  refreshLook(g);
  if (id) toast(g, `Took off ${ITEMS[id].name}`, id);
  return true;
}

/** Q, click or Space in the Wildwood: swing, or queue the next hit of a combo mid-swing. */
export function attack(g) {
  const w = weaponOf(g);
  if (!w) return toast(g, "No weapon equipped. Open your gear with C.");
  const p = g.player;
  if (p.useT > 0) {
    if (p.useItem === w && !p.spin) p.queued = true;
    return;
  }
  startSwing(g, w);
}

export { pointsFree };
const isNight = (g) => g.s.clock.min >= 19 * 60 || g.s.clock.min < 6 * 60;

// ── Quests ──────────────────────────────────────────────────────────────────

export const defOf = (id) => questDef(id, QUESTS, BOARD_POOL, ITEMS);

/** Report a game event to every active quest. */
export function questEvent(g, ev) {
  const r = advance(g.s.quests, ev, defOf);
  if (!r.changed.length) return;
  g.s.quests = r.qs;
  const count = (id) => countItem(g.s.inv, id);
  for (const id of r.changed) {
    const def = defOf(id);
    const gp = goalProgress(g.s.quests, id, def, count);
    if (isReady(g.s.quests, id, def, count)) {
      sfx(g, "task");
      toast(g, def.board ? `${def.title}: done! Collect at the notice board.` : `${def.title}: done! Return to ${VILLAGERS[def.giver]?.name ?? "the quest giver"}.`, "guild_badge");
    } else {
      const k = gp.find((x) => x.have < x.need);
      if (k) toast(g, `${def.title}: ${k.have}/${k.need}`);
    }
  }
}

// ── Swinging ────────────────────────────────────────────────────────────────

/**
 * The combo chain: slash, backslash, then a thrust that reaches further and
 * hits harder. A press during a swing queues the next step; pause and it resets.
 */
export const COMBO = [
  { t: 0.24, from: -1.35, to: 1.35, mult: 1, reach: 1, cone: 0.3, lunge: 110 },
  { t: 0.24, from: 1.35, to: -1.35, mult: 1.1, reach: 1, cone: 0.3, lunge: 110 },
  { t: 0.3, thrust: true, mult: 1.6, reach: 1.35, cone: 0.8, lunge: 220 },
];
const SPIN = { t: 0.42, from: 0, to: Math.PI * 2, mult: 1, reach: 1.25, lunge: 0 };
const COMBO_WINDOW = 0.32;

/** Swing `id` (the equipped weapon); `spin` after a full charge. */
export function startSwing(g, id, spin = false) {
  const p = g.player;
  if (p.useT > 0 || p.mounted) return;
  if (p.biking) return toast(g, "Hop off your bike first (B).");
  // Continue the chain if the last swing just ended; otherwise start over.
  p.combo = !spin && g.time - (p.swingEnd ?? -9) < COMBO_WINDOW ? ((p.combo ?? -1) + 1) % COMBO.length : 0;
  const move = spin ? SPIN : COMBO[p.combo];
  p.move = move;
  p.useT = p.useMax = move.t;
  p.useItem = id;
  p.spin = spin;
  p.queued = false;
  g.swingId++;
  // Step into the swing.
  const [fx, fy] = DIRV[p.dir];
  p.kx = fx * move.lunge;
  p.ky = fy * move.lunge;
  sfx(g, spin ? "spin" : move.thrust ? "thrust" : "swing");
  cutWeeds(g, spin);
}
const DIRV = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

/** Swing bookkeeping each frame: chain a queued hit when one ends. */
function updateSwing(g) {
  const p = g.player;
  if (!p.move) return;
  if (p.useT > 0) return;
  p.move = null;
  p.swingEnd = g.time;
  if (p.queued && p.useItem === weaponOf(g)) startSwing(g, p.useItem);
}

/** A swing clears weeds in the way (a Zelda staple), sometimes with fiber. */
function cutWeeds(g, spin) {
  const p = g.player;
  const lv = g.lv;
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor((p.y - 4) / TILE);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!spin && (dx !== (p.dir === "left" ? -1 : p.dir === "right" ? 1 : 0) || dy !== (p.dir === "up" ? -1 : p.dir === "down" ? 1 : 0))) continue;
    const o = lv.at(tx + dx, ty + dy);
    if (!o || o.gone || o.kind !== "weed") continue;
    o.gone = true;
    lv.index(o, null);
    burst(FXK.LEAF, o.x, o.y - 6, 6, 50, 0.7, "#7cc05a");
    if (Math.random() < 0.3) dropItem(g, "fiber", 1, o.x, o.y);
  }
}

function swingHits(g) {
  const p = g.player;
  if (!p.useItem || ITEMS[p.useItem]?.kind !== "weapon" || p.useT <= 0) return;
  // Hits land through the first two thirds of the swing.
  if (p.useT < p.useMax * 0.3) return;
  const w = ITEMS[p.useItem];
  const mv = p.move ?? COMBO[0];
  const reach = w.reach * mv.reach;
  const st = playerStats(g);
  const duel = has(g.s.professions, "duelist") ? 1.15 : 1;
  for (const e of g.enemies) {
    if (!e.alive || e.hitBy === g.swingId) continue;
    const ey = e.y - (e.def.boss ? 40 : 8);
    if (!inArc(p.x, p.y - 10, p.dir, e.x, ey, reach + (e.def.boss ? 30 : e.hw), p.spin, mv.cone)) continue;
    e.hitBy = g.swingId;
    const r = swingDamage(w, st.atk, Math.random(), Math.random(), p.spin, st.crit);
    hurtEnemy(g, e, Math.round(r.dmg * duel * mv.mult), r.crit, p.x, p.y, p.spin ? 340 : mv.thrust ? 360 : 260);
    spark(g, (p.x + e.x) / 2, (p.y - 12 + ey) / 2, r.crit || mv.thrust);
  }
}

/** A white impact star where a hit lands (and a ring when something falls). */
function spark(g, x, y, big = false, ring = false) {
  if (g.sparks.length > 16) g.sparks.shift();
  g.sparks.push({ x, y, t: 0, big, ring, rot: Math.random() * 3 });
}

function hurtEnemy(g, e, dmg, crit, fx, fy, power) {
  const r = applyDamage(e.hp, dmg);
  e.hp = r.hp;
  e.flash = 0.14;
  e.squash = 0.16;
  e.hurtShow = 3;
  if (!e.def.boss) {
    const [kx, ky] = knockback(e.x, e.y, fx, fy, power);
    e.kx = kx;
    e.ky = ky;
    if (e.state === "air" || e.state === "charge") (e.state = "idle"), (e.t = 0.5);
  }
  num(g, e.x, e.y - (e.def.boss ? 120 : 30), dmg, crit ? "#f6c63c" : "#fff");
  sfx(g, e.def.ai === "hop" ? "squish" : "hit");
  burst(FXK.SPARK, e.x, e.y - 14, crit ? 8 : 4, 70, 0.35, crit ? "#fff2a0" : "#ffffff");
  g.hitStop = Math.max(g.hitStop, r.dead || crit ? 0.085 : 0.045);
  g.shake = Math.min(1, g.shake + (r.dead ? 0.35 : 0.18));
  if (r.dead) kill(g, e);
}

function kill(g, e) {
  e.alive = false;
  e.dying = 0.4;
  spark(g, e.x, e.y - (e.def.boss ? 60 : 12), true, true);
  const def = e.def;
  sfx(g, def.boss ? "roar" : "defeat");
  burst(FXK.DUST, e.x, e.y - 8, def.boss ? 30 : 10, def.boss ? 160 : 70, 0.7, def.ai === "hop" ? def.color : "rgba(120,90,140,0.7)");
  const rand = Math.random;
  for (const [id, n] of rollDrops(def, rand)) dropItem(g, id, n, e.x, e.y);
  const gold = rollGold(def, rand);
  if (gold) dropGold(g, gold, e.x, e.y);
  award(g, "combat", XP.kill(def.xp));
  if (!g.s.stats.kills?.[e.type]) diary(g, `Fought off my first ${def.name}.`, "fight");
  g.s.stats.kills = { ...g.s.stats.kills, [e.type]: (g.s.stats.kills?.[e.type] ?? 0) + 1 };
  petXp(g, def.xp * (e.lastBy === "pet" ? 1 : 0.5));
  if (def.boss) {
    g.s.flags.gloomroot = true;
    g.boss = null;
    questEvent(g, { boss: e.type });
    cleanseShrine(g);
    g.shake = 1;
    toast(g, "The Gloomroot sighs, and the gloom lifts from the Wildwood.", "moonstone");
    diary(g, `Defeated the Gloomroot at the Moon Shrine with ${g.pet.name}. The Wildwood is humming again.`, "fight");
    for (const o of g.enemies) if (o.alive && o !== e) (o.alive = false), (o.dying = 0.4);
  } else questEvent(g, { kill: e.type });
}

export function cleanseShrine(g) {
  for (const o of g.levels.wildwood.objects) if (o.kind === "shrine") {
    o.cleansed = !!g.s.flags.gloomroot;
    resolveObject(o, g.s.clock.season);
  }
}

function petXp(g, n) {
  const r = petGainXp(g.s.pet, n);
  g.s.pet = r.pet;
  if (!r.levelUp) return;
  sfx(g, "levelUp");
  burst(FXK.HEART, g.pet.x, g.pet.y - 24, 6, 50, 1.2);
  toast(g, `${g.pet.name} grew to level ${r.levelUp}!`, "pet_treat");
  diary(g, `${g.pet.name} grew to level ${r.levelUp}.`, "pet");
}

// ── Loot ────────────────────────────────────────────────────────────────────

export function dropItem(g, id, n, x, y) {
  g.drops.push({ id, n, gold: 0, x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 10, h: 4, vh: 90 + Math.random() * 40, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 30, t: 0, lv: g.lv.id });
}

function dropGold(g, n, x, y) {
  g.drops.push({ id: "gold", n: 0, gold: n, x, y, h: 4, vh: 110, vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 30, t: 0, lv: g.lv.id });
}

function updateDrops(g, dt) {
  const p = g.player;
  const reach = petHasPerk(g.s.pet.lvl, "Fetch") ? MAGNET_FETCH : MAGNET;
  for (let i = g.drops.length - 1; i >= 0; i--) {
    const d = g.drops[i];
    if (d.lv !== g.lv.id) {
      g.drops.splice(i, 1);
      continue;
    }
    d.t += dt;
    if (d.h > 0 || d.vh > 0) {
      d.vh -= 420 * dt;
      d.h = Math.max(0, d.h + d.vh * dt);
      if (d.h === 0) d.vh = d.vh < -60 ? -d.vh * 0.35 : 0;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
    }
    if (d.t < 0.35) continue;
    const dx = p.x - d.x;
    const dy = p.y - 6 - d.y;
    const dd = Math.hypot(dx, dy);
    if (dd < reach) {
      const sp = Math.min(dd, 360 * dt);
      d.x += (dx / (dd || 1)) * sp;
      d.y += (dy / (dd || 1)) * sp;
    }
    if (dd < 16) {
      if (d.gold) {
        g.s.gold += d.gold;
        sfx(g, "coin");
        toast(g, `+${d.gold}g`);
      } else {
        const left = addItem(g.s.inv, d.id, d.n);
        if (left === d.n) {
          if (!g.fullWarned) toast(g, "Your bag is full!");
          g.fullWarned = true;
          continue;
        }
        sfx(g, "pickup");
        toast(g, `+${d.n - left} ${ITEMS[d.id].name}`, d.id);
      }
      g.drops.splice(i, 1);
    } else if (d.t > 90) g.drops.splice(i, 1);
  }
}

// ── Damage numbers & shake ──────────────────────────────────────────────────

function num(g, x, y, n, color) {
  if (g.nums.length > 24) g.nums.shift();
  g.nums.push({ x, y, s: String(n), color, t: 0 });
}

// ── Taking hits ─────────────────────────────────────────────────────────────

function hurtPlayer(g, dmg, fx, fy) {
  const p = g.player;
  if (p.iT > 0 || g.mode !== "play") return;
  dmg = reduce(dmg, playerStats(g).def);
  g.s.hp = Math.max(0, g.s.hp - dmg);
  p.iT = IFRAMES;
  const [kx, ky] = knockback(p.x, p.y, fx, fy, 300);
  p.kx = kx;
  p.ky = ky;
  p.useT = 0;
  p.charge = 0;
  g.shake = Math.min(1, g.shake + 0.45);
  g.hitStop = Math.max(g.hitStop, 0.06);
  g.hurtFlash = 0.35;
  num(g, p.x, p.y - 50, dmg, "#f0706a");
  sfx(g, "hurt");
  if (g.s.hp <= 0) faint(g);
}

function hurtPet(g, dmg, fx, fy) {
  const a = g.pet;
  const s = g.s.pet;
  if (a.iT > 0 || s.hp <= 0) return;
  const n = has(g.s.professions, "beastfriend") ? Math.ceil(dmg / 2) : dmg;
  g.s.pet = { ...s, hp: Math.max(0, s.hp - n) };
  a.iT = 1;
  const [kx, ky] = knockback(a.x, a.y, fx, fy, 220);
  a.kx = kx;
  a.ky = ky;
  num(g, a.x, a.y - 30, n, "#f6a0b0");
  if (g.s.pet.hp <= 0) {
    toast(g, `${a.name} is hurt and can't fight! Hold food and press E by them.`, "pet_treat");
    sfx(g, "miss");
  }
}

/** Out cold in the Wildwood: Hazel carries you home. Keeps the day going. */
export function faint(g) {
  g.mode = "fade";
  toast(g, "Everything goes dark...");
  fadeOut(g, () => {
    const lost = faintPenalty(g.s.gold);
    diary(g, "Fainted in the Wildwood. Hazel carried us home.", "fight");
    g.s.gold -= lost;
    g.s.hp = Math.ceil(playerMaxHp(g) / 2);
    g.s.pet = { ...g.s.pet, hp: Math.max(g.s.pet.hp, Math.ceil(petMaxHp(g.s.pet.lvl) / 4)) };
    setEnergy(g, Math.min(g.s.energy, 120));
    g.s.clock = { ...g.s.clock, min: Math.min(g.s.clock.min + 120, 24 * 60) };
    g.lv = g.levels.house;
    const p = g.player;
    p.x = 4 * TILE + TILE / 2;
    p.y = 5 * TILE + 10;
    p.dir = "down";
    p.kx = p.ky = 0;
    p.biking = p.mounted = false;
    teleportPet(g.pet, p, g.lv);
    snapCamera(g.cam, g.lv, p.x, p.y - 20, g.view);
    g.enemies.length = 0;
    g.shots.length = 0;
    g.boss = null;
    g.combatLv = null;
    g.mode = "play";
    fadeIn(g, 1.5);
    g.ui.dialogue(g.villagers.find((v) => v.id === "hazel"), [`You're awake. Good. I found you and ${g.pet.name} at the edge of the Wildwood and carried you both home.`, lost ? `You dropped ${lost}g on the way; the slimes will be rich. Rest, eat something, and go back stronger.` : "Rest, eat something, and go back stronger."]);
  }, 1.2);
}

// ── Populations ─────────────────────────────────────────────────────────────

function spawnTable(g, zone) {
  const z = ZONE_SPAWNS[zone];
  return isNight(g) ? z.night : z.day;
}

function pick(table) {
  let sum = 0;
  for (const [, w] of table) sum += w;
  let r = Math.random() * sum;
  for (const [id, w] of table) if ((r -= w) < 0) return id;
  return table[0][0];
}

function zoneCap(g, zone) {
  return Math.round(ZONE_SPAWNS[zone].n * (g.s.flags.gloomroot ? CLEANSED_SPAWN_MULT : 1));
}

/** Put one creature somewhere in `zone`, at least `minTiles` from you. */
function spawnOne(g, zone, minTiles) {
  const tiles = g.lv.spawns[zone];
  const p = g.player;
  for (let k = 0; k < 12; k++) {
    const [tx, ty] = tiles[Math.floor(Math.random() * tiles.length)];
    const x = tx * TILE + TILE / 2;
    const y = ty * TILE + TILE / 2 + 6;
    if ((x - p.x) ** 2 + (y - p.y) ** 2 < (minTiles * TILE) ** 2) continue;
    if (!boxFree(g.lv, x, y, 8, 5)) continue;
    const e = createEnemy(pick(spawnTable(g, zone)), x, y);
    e.zone = zone;
    g.enemies.push(e);
    return e;
  }
  return null;
}

function populate(g) {
  g.enemies.length = 0;
  g.shots.length = 0;
  g.boss = null;
  for (const zone in ZONE_SPAWNS) for (let i = 0; i < zoneCap(g, zone); i++) spawnOne(g, zone, 8);
  cleanseShrine(g);
  warmCreatures(g);
}

/** Decode every creature frame up front so nothing pops in mid-fight. */
function warmCreatures(g) {
  const warm = {};
  const add = (r) => (warm[r.key] = r.spr);
  for (const type of ["slime", "slime_violet", "shroom", "wisp", "gloomroot"]) for (let f = 0; f < 3; f++) add(enemySpr(type, "side", f % 2, false)), add(enemySpr(type, "side", f, false));
  for (const f of [0, 1]) add(enemySpr("gloomroot", "side", f, true));
  for (const d of ["side", "down", "up"]) for (let f = 0; f < 3; f++) add(enemySpr("boar", d, f));
  for (const k of ["gloom", "root"]) add(projSpr(k));
  warmSvgSprites(warm, DEFS, g.cam.z * (g.view.k || 1));
}

function refill(g, dt) {
  g.spawnT -= dt;
  if (g.spawnT > 0) return;
  g.spawnT = RESPAWN_SECONDS;
  for (const zone in ZONE_SPAWNS) {
    let n = 0;
    for (const e of g.enemies) if (e.alive && e.zone === zone) n++;
    if (n < zoneCap(g, zone)) spawnOne(g, zone, 11);
  }
  for (let i = g.enemies.length - 1; i >= 0; i--) if (!g.enemies[i].alive && g.enemies[i].dying <= 0) g.enemies.splice(i, 1);
}

/** The Gloomroot wakes when you step into the shrine clearing on Hazel's last errand. */
function checkBoss(g) {
  if (g.boss || g.s.flags.gloomroot) return;
  const p = g.player;
  const r = PLACES.shrine;
  const tx = p.x / TILE;
  const ty = p.y / TILE;
  if (tx < r.x0 || tx > r.x1 || ty < r.y0 || ty > r.y1) {
    g.shrineWarned = false;
    return;
  }
  if (!g.s.quests.active.wild5) {
    if (!g.shrineWarned) toast(g, "A heavy gloom hangs over the shrine. Something sleeps here... Hazel might know more.");
    g.shrineWarned = true;
    return;
  }
  const e = createEnemy("gloomroot", BOSS_HOME.tx * TILE, BOSS_HOME.ty * TILE + 20);
  e.zone = "shrine";
  g.enemies.push(e);
  g.boss = e;
}

const HOOKS = {
  g: null,
  shoot(e, kind, x, y, vx, vy) {
    const g = HOOKS.g;
    if (kind === "spore") g.shots.push({ kind, x, y, vx: 0, vy: 0, t: 0, life: 1.1, r: 30, dmg: e.def.dmg, hit: 0 });
    else {
      g.shots.push({ kind, x, y, vx, vy, t: 0, life: 3, r: 12, dmg: e.def.dmg, hit: 0 });
      sfx(g, "shoot");
    }
  },
  roots(e, n) {
    const g = HOOKS.g;
    sfx(g, "rumble");
    const p = g.player;
    for (let i = 0; i < n; i++) {
      const tgt = i === 1 && CT.alive ? CT : p;
      const off = i < 2 ? 0 : 38;
      const a = Math.random() * Math.PI * 2;
      g.shots.push({ kind: "root", x: tgt.x + Math.cos(a) * off, y: tgt.y + Math.sin(a) * off * 0.6, vx: 0, vy: 0, t: 0, life: 1.45, warn: e.enraged ? 0.7 : 0.9, r: 22, dmg: e.def.dmg, hit: 0 });
    }
  },
  summon(e) {
    const g = HOOKS.g;
    let adds = 0;
    for (const o of g.enemies) if (o.alive && o.summoned) adds++;
    for (let i = 0; i < 2 && adds < 4; i++, adds++) {
      const x = e.x + (i ? 70 : -70);
      const y = e.y + 50;
      if (!boxFree(g.lv, x, y, 8, 5)) continue;
      const s = createEnemy(e.enraged ? "slime_violet" : "slime", x, y);
      s.summoned = true;
      s.zone = "shrine";
      g.enemies.push(s);
      burst(FXK.DUST, x, y, 8, 60, 0.6, "rgba(120,90,140,0.7)");
    }
  },
  roar(e) {
    const g = HOOKS.g;
    sfx(g, "roar");
    g.shake = 0.8;
    toast(g, "The Gloomroot stirs!");
  },
};

// ── Frame update ────────────────────────────────────────────────────────────

export function updateCombat(g, dt, t) {
  const p = g.player;
  HOOKS.g = g;
  if (g.lv.id !== g.combatLv) {
    g.combatLv = g.lv.id;
    g.fullWarned = false;
    if (inWild(g)) populate(g);
    else (g.enemies.length = 0), (g.shots.length = 0), (g.boss = null);
    g.s.hp = Math.min(g.s.hp, playerMaxHp(g));
  }
  if (p.iT > 0) p.iT -= dt;
  if (g.hurtFlash > 0) g.hurtFlash -= dt;
  if (g.pet.iT > 0) g.pet.iT -= dt;
  if (p.kx || p.ky) {
    const k = Math.exp(-dt * 12);
    moveBox(g.lv, p, p.kx * dt, p.ky * dt, 8, 5);
    p.kx *= k;
    p.ky *= k;
    if (Math.abs(p.kx) + Math.abs(p.ky) < 10) p.kx = p.ky = 0;
  }
  const a = g.pet;
  if (a.kx || a.ky) {
    moveBox(g.lv, a, a.kx * dt, a.ky * dt, 6, 4);
    a.kx *= Math.exp(-dt * 12);
    a.ky *= Math.exp(-dt * 12);
    if (Math.abs(a.kx) + Math.abs(a.ky) < 10) a.kx = a.ky = 0;
  }

  // Charge a spin: hold Q (or Space with an empty hand), release when it sparkles.
  const w = weaponOf(g);
  const held = g.input.down("attack") || (g.input.down("use") && !g.s.inv[g.s.sel]);
  if (w && held && !p.mounted && !p.biking && g.mode === "play") {
    const before = p.charge ?? 0;
    p.charge = before + dt;
    if (before < CHARGE_TIME && p.charge >= CHARGE_TIME) {
      sfx(g, "charged");
      burst(FXK.SPARK, p.x, p.y - 30, 6, 40, 0.4, "#fff2a0");
    }
  } else {
    if (w && (p.charge ?? 0) >= CHARGE_TIME && p.useT <= 0) startSwing(g, w, true);
    p.charge = 0;
  }
  updateSwing(g);
  swingHits(g);
  updateDrops(g, dt);
  for (let i = g.sparks.length - 1; i >= 0; i--) if ((g.sparks[i].t += dt) > 0.22) g.sparks.splice(i, 1);

  // Shake: decaying trauma, smooth sin offsets.
  g.shake = Math.max(0, g.shake - dt * 1.8);
  const sh = g.shake * g.shake * 9;
  g.shakeX = sh * Math.sin(t * 47);
  g.shakeY = sh * Math.sin(t * 61 + 1);
  for (let i = g.nums.length - 1; i >= 0; i--) if ((g.nums[i].t += dt) > 0.9) g.nums.splice(i, 1);

  if (!inWild(g)) {
    g.pet.goal = null;
    return;
  }
  checkBoss(g);
  refill(g, dt);
  PT.x = p.x;
  PT.y = p.y;
  PT.alive = g.mode === "play";
  CT.x = a.x;
  CT.y = a.y;
  CT.alive = petCanFight(g.s.pet);
  for (const e of g.enemies) {
    updateEnemy(e, g.lv, TARGETS, dt, HOOKS);
    if (!e.alive) continue;
    if (e.bonked > 0) {
      e.bonked -= dt;
      if (e.bonked <= 0) burst(FXK.CHIP, e.x, e.y - 20, 5, 60, 0.5, "#c8945a");
    }
    contact(g, e);
  }
  updateShots(g, dt);
  updatePetCombat(g, dt, t);
}

/** Touching a creature hurts; charging boars and landing slimes hurt most. */
function contact(g, e) {
  if (e.def.ai === "shoot" || e.stun > 0) return;
  const p = g.player;
  let dmg = e.def.dmg;
  if (e.def.ai === "hop" && !airborne(e) && e.state !== "land") dmg = Math.ceil(dmg / 2);
  if (e.def.ai === "charge" && e.state !== "charge") dmg = Math.ceil(dmg / 2);
  const rx = e.hw + 8;
  const ry = e.hh + 7;
  if (Math.abs(p.x - e.x) < rx && Math.abs(p.y - e.y) < ry) hurtPlayer(g, dmg, e.x, e.y);
  const a = g.pet;
  if (CT.alive && Math.abs(a.x - e.x) < rx && Math.abs(a.y - e.y) < ry) hurtPet(g, dmg, e.x, e.y);
}

function updateShots(g, dt) {
  const p = g.player;
  const a = g.pet;
  for (let i = g.shots.length - 1; i >= 0; i--) {
    const s = g.shots[i];
    s.t += dt;
    if (s.kind === "gloom") {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const tx = Math.floor(s.x / TILE);
      const ty = Math.floor((s.y + 18) / TILE);
      if (!g.lv.inside(tx, ty) || g.lv.wall[ty * g.lv.w + tx] || (g.lv.at(tx, ty)?.solid && g.lv.at(tx, ty).kind === "tree" && !g.lv.at(tx, ty).gone)) {
        burst(FXK.SPARK, s.x, s.y, 4, 40, 0.3, "#b08ad8");
        g.shots.splice(i, 1);
        continue;
      }
      // Orbs fly at chest height: compare against the body, not the feet.
      if (Math.abs(p.x - s.x) < s.r && Math.abs(p.y - 18 - s.y) < s.r + 6) {
        hurtPlayer(g, s.dmg, s.x - s.vx, s.y - s.vy);
        g.shots.splice(i, 1);
        continue;
      }
      if (CT.alive && Math.abs(a.x - s.x) < s.r && Math.abs(a.y - 12 - s.y) < s.r + 4) {
        hurtPet(g, s.dmg, s.x - s.vx, s.y - s.vy);
        g.shots.splice(i, 1);
        continue;
      }
    } else {
      const live = s.kind === "spore" || s.t >= s.warn;
      if (live && s.kind === "root" && !s.popped) {
        s.popped = true;
        g.shake = Math.min(1, g.shake + 0.2);
        burst(FXK.CHIP, s.x, s.y, 6, 70, 0.5, "#7a5a6a");
      }
      if (live && !(s.hit & 1) && (p.x - s.x) ** 2 + ((p.y - s.y) * 1.4) ** 2 < s.r * s.r) {
        s.hit |= 1;
        hurtPlayer(g, s.dmg, s.x, s.y);
      }
      if (live && CT.alive && !(s.hit & 2) && (a.x - s.x) ** 2 + ((a.y - s.y) * 1.4) ** 2 < s.r * s.r) {
        s.hit |= 2;
        hurtPet(g, s.dmg, s.x, s.y);
      }
    }
    if (s.t >= s.life) g.shots.splice(i, 1);
  }
}

/** Your companion picks the nearest creature near you, runs in and bites. */
function updatePetCombat(g, dt, t) {
  const a = g.pet;
  const s = g.s.pet;
  const p = g.player;
  g.petCd -= dt;
  g.howlCd -= dt;
  a.goal = null;
  if (!petCanFight(s)) return;
  let best = null;
  let bd = (TILE * 6) ** 2;
  for (const e of g.enemies) {
    if (!e.alive) continue;
    const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
    if (d < bd) (bd = d), (best = e);
  }
  if (best) {
    const side = a.x < best.x ? -1 : 1;
    a.goal = a.goalPt ??= { x: 0, y: 0 };
    a.goal.x = best.x + side * (best.hw + 10);
    a.goal.y = best.y + 2;
    if (g.petCd <= 0 && Math.abs(a.x - best.x) < best.hw + 22 && Math.abs(a.y - best.y) < 18) {
      g.petCd = PET_BITE_CD;
      a.lunge = 0.25;
      const bonus = has(g.s.professions, "beastfriend") ? 1.3 : 1;
      best.lastBy = "pet";
      hurtEnemy(g, best, Math.round(petDamage(s.lvl, s.full) * bonus), false, a.x, a.y, 160);
      best.lastBy = best.alive ? null : "pet";
      if (g.s.profile.pet.kind === "anatolian" || g.s.profile.pet.kind === "dog") sfx(g, "woof");
    }
  }
  // Guard Howl: when you're hurt, your companion stuns everything close.
  if (petHasPerk(s.lvl, "Guard Howl") && g.howlCd <= 0 && g.s.hp < playerMaxHp(g) * 0.3) {
    let any = false;
    for (const e of g.enemies) if (e.alive && !e.def.boss && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < (TILE * 5) ** 2) (e.stun = 2.2), (any = true);
    if (any) {
      g.howlCd = 45;
      sfx(g, "woof");
      burst(FXK.SPARK, a.x, a.y - 20, 14, 120, 0.8, "#cfe0ff");
      toast(g, `${a.name} howls! The creatures freeze.`);
    }
  }
  // Sniff: a bark when treasure is close.
  g.sniffT -= dt;
  if (petHasPerk(s.lvl, "Sniff") && g.sniffT <= 0) {
    g.sniffT = 2;
    for (const o of g.lv.objects) {
      if (o.kind !== "chest" || o.open || g.sniffed.has(o.id)) continue;
      if ((o.x - p.x) ** 2 + (o.y - p.y) ** 2 > (TILE * 7) ** 2) continue;
      g.sniffed.add(o.id);
      a.alert = 1.6;
      sfx(g, "woof");
      toast(g, `${a.name} sniffs the air... treasure nearby!`, "star_shard");
      break;
    }
  }
  if (a.alert > 0) a.alert -= dt;
  if (a.lunge > 0) a.lunge -= dt;
}

// ── Drawing (world space) ───────────────────────────────────────────────────

const OPT = { alpha: 1, flip: false, cap: 256 };
// Colour and font strings in 20 alpha / 5 size steps, built once.
const steps = (f) => Array.from({ length: 21 }, (_, i) => f(i / 20));
const ROOT_FILL = steps((a) => `rgba(120,40,90,${(0.15 + a * 0.35).toFixed(2)})`);
const SPORE_FILL = steps((a) => `rgba(210,220,110,${(0.45 * a).toFixed(2)})`);
const LANE = ["rgba(232,86,106,0.22)", "rgba(232,86,106,0.34)"];
const NUM_FONT = [16, 18, 20, 24, 28].map((n) => `700 ${n}px Fredoka, Nunito, system-ui, sans-serif`);

/** Ground telegraphs under everything else: root warnings and spore clouds. */
export function drawCombatGround(ctx, g, ox, oy, z, t) {
  // A Thornback about to charge paints its lane: step out of it.
  for (const e of g.enemies) {
    if (!e.alive || e.state !== "wind" || e.def.ai !== "charge") continue;
    const len = TILE * 7.2 * 0.9 * z;
    const w = 26 * z;
    const x = ox + e.x * z;
    const y = oy + e.y * z;
    const ux = Math.sign(e.vx);
    const uy = Math.sign(e.vy);
    ctx.fillStyle = LANE[Math.floor(t * 12) % 2];
    if (ux) ctx.fillRect(ux > 0 ? x : x - len, y - w / 2, len, w);
    else ctx.fillRect(x - w / 2, uy > 0 ? y : y - len, w, len);
  }
  for (const s of g.shots) {
    if (s.kind === "root" && s.t < s.warn) {
      const k = s.t / s.warn;
      ctx.fillStyle = ROOT_FILL[Math.round(k * 20)];
      ctx.beginPath();
      ctx.ellipse(ox + s.x * z, oy + s.y * z, s.r * z, s.r * 0.6 * z, 0, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = "rgba(200,90,160,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(ox + s.x * z, oy + s.y * z, s.r * z * (1 - k * 0.3), s.r * 0.6 * z * (1 - k * 0.3), 0, 0, 6.283);
      ctx.stroke();
    }
  }
}

/** Projectiles, drops, the sword arc and damage numbers, over the sprites. */
export function drawCombatFx(ctx, g, ox, oy, z, t) {
  for (const s of g.shots) {
    const x = ox + s.x * z;
    const y = oy + s.y * z;
    if (s.kind === "spore") {
      const k = s.t / s.life;
      ctx.fillStyle = SPORE_FILL[Math.round(Math.max(0, 1 - k) * 20)];
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26 + t;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * s.r * 0.55 * z * (0.6 + k), y - 8 * z + Math.sin(a) * s.r * 0.35 * z, (8 + k * 8) * z, 0, 6.283);
        ctx.fill();
      }
      continue;
    }
    if (s.kind === "root" && s.t < s.warn) continue;
    const r = projSpr(s.kind);
    OPT.alpha = s.kind === "root" ? Math.min(1, (s.life - s.t) * 4) : 1;
    OPT.flip = false;
    drawSvgSprite(ctx, r.key, r.spr, DEFS, Math.round(x), Math.round(y), z * (s.kind === "root" ? 1.3 : 1.2), t, OPT);
  }
  for (const d of g.drops) {
    if (d.lv !== g.lv.id) continue;
    const x = ox + d.x * z;
    const y = oy + d.y * z;
    ctx.fillStyle = "rgba(58,37,48,0.2)";
    ctx.beginPath();
    ctx.ellipse(x, y, 7 * z, 2.5 * z, 0, 0, 6.283);
    ctx.fill();
    const bob = d.h + Math.sin(t * 3 + d.x) * 1.2;
    if (d.gold) {
      ctx.fillStyle = "#f6c63c";
      ctx.strokeStyle = "#8a5a2a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y - (6 + bob) * z, 4.5 * z, 0, 6.283);
      ctx.fill();
      ctx.stroke();
      continue;
    }
    iconAt(ctx, d.id, x, y - (10 + bob) * z, z * 0.6, t);
  }
  ctx.globalAlpha = 1;
}

/**
 * Swing, impact stars and damage numbers: drawn after the day/night grade so
 * they stay bright and readable in the dim Wildwood and at night.
 */
export function drawCombatOverlay(ctx, g, ox, oy, z, t) {
  drawSwing(ctx, g, ox, oy, z, t);
  drawSparks(ctx, g, ox, oy, z);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  for (const n of g.nums) {
    const k = n.t / 0.9;
    const x = ox + n.x * z;
    // Hop up, overshoot, then drift: a pop, not a slide.
    const y = oy + (n.y - Math.sin(Math.min(1, k * 2.2) * Math.PI) * 16 - k * 14) * z;
    ctx.globalAlpha = Math.min(1, (1 - k) * 2.5);
    ctx.font = NUM_FONT[k < 0.12 ? 4 : k < 0.25 ? 3 : 2];
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#3a2530";
    ctx.strokeText(n.s, x, y);
    ctx.fillStyle = n.color;
    ctx.fillText(n.s, x, y);
  }
  ctx.globalAlpha = 1;
}

function iconAt(ctx, id, x, y, z, t) {
  OPT.alpha = 1;
  OPT.flip = false;
  drawSvgSprite(ctx, iconKey(id), iconSpr(id), DEFS, Math.round(x), Math.round(y), z, t, OPT);
}

const easeOut = (k) => 1 - (1 - k) ** 3;

/**
 * The swing: a filled smear sweeping behind the blade (white core, tinted
 * edge), then the sword itself, drawn big and rotated to where it is in the
 * arc. The thrust stabs straight out instead of sweeping.
 */
function drawSwing(ctx, g, ox, oy, z, t) {
  const p = g.player;
  const mv = p.move;
  if (!mv || !p.useItem || p.useT <= 0) return;
  const w = ITEMS[p.useItem];
  const k = easeOut(Math.min(1, 1 - p.useT / p.useMax));
  const fade = 1 - Math.max(0, (1 - p.useT / p.useMax - 0.55) / 0.45);
  const reach = w.reach * mv.reach;
  const cx = ox + p.x * z;
  const cy = oy + (p.y - 16) * z;
  const base = p.dir === "right" ? 0 : p.dir === "down" ? Math.PI / 2 : p.dir === "left" ? Math.PI : -Math.PI / 2;
  const tint = SWORD_TINT[p.useItem] ?? "#fff2a0";
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.72); // the arc lies on the ground plane
  if (mv.thrust) {
    const len = reach * z * (0.45 + 0.55 * k);
    ctx.rotate(base);
    ctx.globalAlpha = 0.7 * fade;
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.moveTo(8 * z, -7 * z);
    ctx.lineTo(len, 0);
    ctx.lineTo(8 * z, 7 * z);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fffaf0";
    ctx.beginPath();
    ctx.moveTo(8 * z, -3 * z);
    ctx.lineTo(len - 6 * z, 0);
    ctx.lineTo(8 * z, 3 * z);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    blade(ctx, p.useItem, len - 14 * z, 0, 0, z, t);
    ctx.restore();
    return;
  }
  const a0 = base + mv.from;
  const a1 = base + mv.from + (mv.to - mv.from) * k;
  // The smear trails the blade by up to ~110°.
  const trail = Math.sign(mv.to - mv.from) * Math.min(Math.abs(a1 - a0), 1.9);
  const r0 = 12 * z;
  const r1 = reach * 1.15 * z; // drawn a touch past the hitbox so it reads
  ctx.globalAlpha = 0.75 * fade;
  ctx.fillStyle = tint;
  sector(ctx, r0, r1 + 4 * z, a1 - trail, a1);
  ctx.strokeStyle = "#3a2530";
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.45 * fade;
  ctx.stroke();
  ctx.globalAlpha = 0.95 * fade;
  ctx.fillStyle = "#fffaf0";
  sector(ctx, r1 * 0.5, r1 - 2 * z, a1 - trail * 0.6, a1);
  ctx.globalAlpha = 1;
  blade(ctx, p.useItem, Math.cos(a1) * r1 * 0.62, Math.sin(a1) * r1 * 0.62, a1, z, t);
  ctx.restore();
}

const SWORD_TINT = { rusty_sword: "#f0c080", bronze_sword: "#f6b060", steel_sword: "#cfe8ff", ironwood_blade: "#9fe0c8", moon_blade: "#b8d8ff" };

function sector(ctx, r0, r1, a0, a1) {
  const ccw = a1 < a0;
  ctx.beginPath();
  ctx.arc(0, 0, r1, a0, a1, ccw);
  ctx.arc(0, 0, r0, a1, a0, !ccw);
  ctx.closePath();
  ctx.fill();
}

/** The weapon's icon, big, pointing along `ang` (icons point up-right, so turn by 45°). */
function blade(ctx, id, x, y, ang, z, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 1 / 0.72);
  ctx.rotate(ang + Math.PI / 4);
  OPT.alpha = 1;
  OPT.flip = false;
  drawSvgSprite(ctx, iconKey(id), iconSpr(id), DEFS, 0, 0, z * 1.5, t, OPT);
  ctx.restore();
}

/** Impact stars and fall rings, over everything in the world. */
function drawSparks(ctx, g, ox, oy, z) {
  for (const s of g.sparks) {
    const k = s.t / 0.22;
    const x = ox + s.x * z;
    const y = oy + s.y * z;
    ctx.globalAlpha = 1 - k;
    if (s.ring) {
      ctx.strokeStyle = "#fffaf0";
      ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.beginPath();
      ctx.ellipse(x, y, (14 + k * 34) * z, (8 + k * 20) * z, 0, 0, 6.283);
      ctx.stroke();
    }
    const r = (s.big ? 22 : 15) * z * (0.6 + k * 0.6);
    ctx.fillStyle = "#fffaf0";
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = s.rot + (i * Math.PI) / 4;
      const rr = i % 2 ? r * 0.3 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
