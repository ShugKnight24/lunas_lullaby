/**
 * Combat rules: player health, weapon damage, hits, drops and the
 * companion's level, health and hunger. Pure functions; the runtime in
 * world/enemies.js and combat.js calls them.
 */

/** One heart on the HUD is this much health. */
export const HEART = 10;
export const BASE_HP = 30;
/** Seconds of invulnerability after taking a hit. */
export const IFRAMES = 0.9;
/** Hold the attack this long, then release, for a spin attack. */
export const CHARGE_TIME = 0.65;
export const SPIN_MULT = 2;
export const CRIT_CHANCE = 0.08;
export const CRIT_MULT = 1.5;

/** Max health from the combat skill level and adventurer rank. */
export const maxHp = (combatLevel = 0, guildRank = 0) => BASE_HP + combatLevel * 5 + guildRank * 5;

/** Damage for one swing: weapon damage + attack (rules/equipment.js), ±10%, crits. `r1`, `r2` in [0, 1). */
export function swingDamage(weapon, atk, r1, r2, spin = false, critChance = CRIT_CHANCE) {
  const base = (weapon.dmg + atk) * (spin ? SPIN_MULT : 1);
  const crit = r2 < critChance;
  const n = Math.max(1, Math.round(base * (0.9 + r1 * 0.2) * (crit ? CRIT_MULT : 1)));
  return { dmg: n, crit };
}

/** Apply `dmg` to something with `hp`; returns `{ hp, dead }`. */
export function applyDamage(hp, dmg) {
  const left = Math.max(0, hp - dmg);
  return { hp: left, dead: left === 0 };
}

/** Knockback velocity away from (fx, fy), `power` units per second. */
export function knockback(x, y, fx, fy, power) {
  const dx = x - fx;
  const dy = y - fy;
  const d = Math.hypot(dx, dy) || 1;
  return [(dx / d) * power, (dy / d) * power];
}

/** Is (tx, ty) inside the swing arc from (px, py) facing `dir`? Spin hits all round. */
export function inArc(px, py, dir, tx, ty, reach, spin = false, cone = 0.42) {
  const dx = tx - px;
  const dy = ty - py;
  const d2 = dx * dx + dy * dy;
  if (d2 > reach * reach) return false;
  if (spin || d2 < 64) return true;
  const fx = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const fy = dir === "up" ? -1 : dir === "down" ? 1 : 0;
  // Within the cone either side of facing (0.42 ≈ 65°, 0.8 ≈ a narrow thrust).
  return (dx * fx + dy * fy) / Math.sqrt(d2) > cone;
}

/** Roll drops from a monster's table with `rand()`; returns [[item, n], ...]. */
export function rollDrops(def, rand) {
  const out = [];
  for (const [id, chance, min, max] of def.drops ?? []) {
    if (rand() >= chance) continue;
    out.push([id, min + Math.floor(rand() * (max - min + 1))]);
  }
  return out;
}

export const rollGold = (def, rand) => def.gold[0] + Math.floor(rand() * (def.gold[1] - def.gold[0] + 1));

/** Losing a fight: gold lost and where you wake. */
export const faintPenalty = (gold) => Math.min(500, Math.floor(gold * 0.1));

// ── Companion ───────────────────────────────────────────────────────────────

export const PET_MAX_LEVEL = 10;
/** Total XP for companion levels 2..10. */
export const PET_LEVEL_XP = [40, 110, 220, 380, 600, 900, 1300, 1800, 2500];
/** Hunger lost each night; under PET_HUNGRY the companion won't fight. */
export const PET_HUNGER_PER_DAY = 35;
export const PET_HUNGRY = 20;

export const PET_PERKS = [
  [3, "Sniff", "Barks when treasure is near"],
  [5, "Guard Howl", "Howls to stun creatures when you're hurt"],
  [8, "Fetch", "Brings dropped loot from further away"],
];

export const newPetStats = () => ({ lvl: 1, xp: 0, hp: petMaxHp(1), full: 80 });

export const petMaxHp = (lvl) => 20 + lvl * 6;
export const petDamage = (lvl, full) => Math.round((3 + lvl * 1.5) * (full >= 60 ? 1.2 : 1));
export const petHasPerk = (lvl, name) => PET_PERKS.some(([at, n]) => n === name && lvl >= at);

export function petLevel(xp) {
  let lv = 1;
  while (lv < PET_MAX_LEVEL && xp >= PET_LEVEL_XP[lv - 1]) lv++;
  return lv;
}

/** Add companion XP: `{ pet, levelUp }` (the new level, or 0). A level-up heals fully. */
export function petGainXp(pet, n) {
  const xp = pet.xp + Math.max(0, Math.round(n));
  const lvl = petLevel(xp);
  const up = lvl > pet.lvl;
  return { pet: { ...pet, xp, lvl, hp: up ? petMaxHp(lvl) : pet.hp }, levelUp: up ? lvl : 0 };
}

/**
 * Feed the companion. Treats heal fully and fill them up; other food heals
 * by its energy value. Returns `{ pet, healed }` or `{ error }`.
 */
export function feedPet(pet, food) {
  const max = petMaxHp(pet.lvl);
  if (pet.hp >= max && pet.full >= 100) return { error: "full" };
  const heal = food.petHeal ?? Math.round((food.energy ?? 0) / 3);
  const hp = Math.min(max, pet.hp + heal);
  const full = Math.min(100, pet.full + (food.petFull ?? Math.round((food.energy ?? 0) / 2)));
  return { pet: { ...pet, hp, full }, healed: hp - pet.hp };
}

/** Overnight: a little rest heals, hunger grows. */
export function petNight(pet) {
  const max = petMaxHp(pet.lvl);
  const full = Math.max(0, pet.full - PET_HUNGER_PER_DAY);
  const rest = full > PET_HUNGRY ? 0.4 : 0.15;
  return { ...pet, full, hp: Math.min(max, pet.hp + Math.round(max * rest)) };
}

export const petCanFight = (pet) => pet.hp > 0 && pet.full >= PET_HUNGRY;
