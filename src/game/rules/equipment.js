/**
 * Equipment and character stats. What you wear lives in `s.equip` (one
 * item id or null per slot, out of the bag), stat points you've spent in
 * `s.attrs`. Everything else is derived: `statsFor` recomputes health,
 * attack, defence, speed and crit from level, points, rank and gear, so
 * nothing derived is ever saved.
 */

import { skillLevel } from "./skills.js";
import { addItem, takeFromSlot } from "./inventory.js";
import { maxHp } from "./combat.js";

export const SLOTS = ["weapon", "head", "body", "feet", "charm"];
export const SLOT_NAMES = { weapon: "Weapon", head: "Head", body: "Body", feet: "Feet", charm: "Charm" };
export const ATTRS = ["vig", "mig", "grd", "agi"];
export const ATTR_INFO = {
  vig: { name: "Vigor", desc: "+8 max health" },
  mig: { name: "Might", desc: "+1.5 attack" },
  grd: { name: "Guard", desc: "+1 defence" },
  agi: { name: "Agility", desc: "+2% speed, +1% crit" },
};
/** Stat points per Combat level. */
export const POINTS_PER_LEVEL = 2;
export const BASE_CRIT = 0.08;

export const newEquip = () => ({ weapon: null, head: null, body: null, feet: null, charm: null });
export const newAttrs = () => ({ vig: 0, mig: 0, grd: 0, agi: 0 });

export const isGear = (item) => !!item?.slot;
export const pointsTotal = (combatLevel) => combatLevel * POINTS_PER_LEVEL;
export const pointsSpent = (attrs) => ATTRS.reduce((a, k) => a + (attrs[k] ?? 0), 0);
export const pointsFree = (s) => pointsTotal(skillLevel(s.skills.combat ?? 0)) - pointsSpent(s.attrs);

/**
 * Derived stats: `{ maxHp, atk, def, spd, crit, weapon }`. `atk` is added to
 * the weapon's damage; `spd` multiplies move speed. `guildRank` is the
 * Adventurer career rank.
 */
export function statsFor(s, items, guildRank = 0, buff = null) {
  const lvl = skillLevel(s.skills.combat ?? 0);
  const a = s.attrs;
  let hp = maxHp(lvl, guildRank) + a.vig * 8;
  let atk = lvl + a.mig * 1.5;
  let def = a.grd;
  let spd = 1 + a.agi * 0.02;
  let crit = BASE_CRIT + a.agi * 0.01;
  for (const slot of SLOTS) {
    const it = items[s.equip[slot]];
    if (!it) continue;
    hp += it.hp ?? 0;
    atk += it.atk ?? 0;
    def += it.def ?? 0;
    spd += it.spd ?? 0;
    crit += it.crit ?? 0;
  }
  if (buff) {
    hp += buff.hp ?? 0;
    atk += buff.atk ?? 0;
    def += buff.def ?? 0;
    spd += buff.spd ?? 0;
  }
  return { maxHp: hp, atk: Math.round(atk), def, spd: Math.max(0.7, spd), crit: Math.min(0.5, crit), weapon: s.equip.weapon };
}

/** Damage after defence: each point shaves a little, never below 1. */
export const reduce = (dmg, def) => Math.max(1, Math.round(dmg * (20 / (20 + def * 2.2))));

/** Can this save wear it (Combat level)? */
export const canWear = (s, item) => skillLevel(s.skills.combat ?? 0) >= (item.lvl ?? 0);

/**
 * Wear the item in bag slot `i`: it leaves the bag and whatever was worn
 * there goes back into that same slot. Returns `{ equip }` or `{ error }`.
 * Mutates `inv` (the save's own array), like rules/inventory.js.
 */
export function equip(s, inv, i, items) {
  const slot = inv[i];
  const it = slot && items[slot.id];
  if (!isGear(it)) return { error: "You can't wear that." };
  if (!canWear(s, it)) return { error: `Needs Combat level ${it.lvl}.` };
  const prev = s.equip[it.slot];
  takeFromSlot(inv, i);
  if (prev) {
    if (!inv[i]) inv[i] = { id: prev, n: 1 };
    else if (addItem(inv, prev, 1) > 0) {
      addItem(inv, slot.id, 1);
      return { error: "Your bag is full!" };
    }
  }
  return { equip: { ...s.equip, [it.slot]: slot.id } };
}

/** Take off what's in `slot`, back into the bag. */
export function unequip(s, inv, slot) {
  const id = s.equip[slot];
  if (!id) return { equip: s.equip };
  if (addItem(inv, id, 1) > 0) return { error: "Your bag is full!" };
  return { equip: { ...s.equip, [slot]: null } };
}

/** Spend one stat point. */
export function spendPoint(s, attr) {
  if (!ATTRS.includes(attr) || pointsFree(s) <= 0) return { error: "No points to spend." };
  return { attrs: { ...s.attrs, [attr]: s.attrs[attr] + 1 } };
}

/** Change of each stat if `id` replaced what's worn in its slot (for the gear list). */
export function compare(s, items, id, guildRank = 0) {
  const it = items[id];
  const now = statsFor(s, items, guildRank);
  const next = statsFor({ ...s, equip: { ...s.equip, [it.slot]: id } }, items, guildRank);
  const dmg = (w) => items[w]?.dmg ?? 0;
  return {
    dmg: it.slot === "weapon" ? dmg(id) - dmg(s.equip.weapon) : 0,
    maxHp: next.maxHp - now.maxHp,
    atk: next.atk - now.atk,
    def: next.def - now.def,
    spd: Math.round((next.spd - now.spd) * 100),
    crit: Math.round((next.crit - now.crit) * 100),
  };
}
