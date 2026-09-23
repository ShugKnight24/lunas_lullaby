/**
 * Skills: farming, foraging, fishing and ranching, each 0..10 from total XP
 * (`s.skills[id]`). Every level trims the energy its tools cost, and each
 * skill has one signature perk (see PERKS).
 */

export const SKILLS = ["farming", "foraging", "fishing", "ranching"];
export const SKILL_NAMES = { farming: "Farming", foraging: "Foraging", fishing: "Fishing", ranching: "Ranching" };
/** Total XP needed for levels 1..10. */
export const LEVEL_XP = [100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000];
export const MAX_LEVEL = LEVEL_XP.length;

/** Which skill a tool trains and draws its energy discount from. */
export const TOOL_SKILL = { hoe: "farming", can: "farming", scythe: "farming", axe: "foraging", rod: "fishing" };

export const PERKS = {
  farming: "Better odds of silver and gold crops",
  foraging: "Chance to find double when foraging",
  fishing: "A wider green zone when reeling",
  ranching: "Petting builds more affection",
};

export const newSkills = () => Object.fromEntries(SKILLS.map((id) => [id, 0]));

export function skillLevel(xp) {
  let lv = 0;
  while (lv < MAX_LEVEL && xp >= LEVEL_XP[lv]) lv++;
  return lv;
}

/** Progress to the next level as `{ level, into, need }` (need 0 at max). */
export function skillProgress(xp) {
  const level = skillLevel(xp);
  if (level >= MAX_LEVEL) return { level, into: 0, need: 0 };
  const from = level ? LEVEL_XP[level - 1] : 0;
  return { level, into: xp - from, need: LEVEL_XP[level] - from };
}

/** Add XP: `{ skills, levelUp }` where levelUp is the new level or 0. */
export function gainXp(skills, id, n) {
  const before = skillLevel(skills[id]);
  const next = { ...skills, [id]: skills[id] + Math.max(0, Math.round(n)) };
  const after = skillLevel(next[id]);
  return { skills: next, levelUp: after > before ? after : 0 };
}

/** Energy a tool costs at a skill level: 5% off per level, never below 1. */
export const toolEnergy = (base, level) => Math.max(1, Math.round(base * (1 - level * 0.05)));

// ── XP awards ──
export const XP = {
  harvest: (sell) => 2 + Math.round(sell / 8),
  catch: (diff, q) => Math.round((5 + diff * 40) * (1 + q * 0.25)),
  forage: 7,
  tree: 10,
  egg: 5,
  petHen: 5,
};

// ── Signature perks ──
/** Added to crop [silver, gold] odds. */
export const farmingBonus = (level) => [level * 0.015, level * 0.01];
/** Chance a forage pickup doubles. */
export const forageDouble = (level) => level * 0.05;
/** Added to the reel bar's green zone width. */
export const fishingZone = (level) => level * 0.006;
/** Extra affection per pat. */
export const ranchingPet = (level) => level * 3;
