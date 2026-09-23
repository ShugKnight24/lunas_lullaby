/**
 * Coop care on plain structure state. A coop stores `hay` (feed on hand),
 * `eggs` (uncollected, counted by quality `[normal, silver, gold]`) and its
 * `hens` (`{ name, love, petted }`, petted = day index of the last pat).
 * Each morning every hen that finds hay eats one and lays an egg whose
 * quality follows her affection; petting and feeding raise it, neglect lowers it.
 */

import { rollQuality, eggOdds } from "./quality.js";

export const COOP_HENS = 2;
export const COOP_HAY_CAP = 40;
export const COOP_EGG_CAP = 8;
/** Items the coop accepts as feed, one hay each. */
export const FEEDS = ["hay", "fiber"];

export const HEN_LOVE_MAX = 1000;
export const HEN_LOVE = { pet: 30, fed: 5, unpetted: -10, hungry: -40 };
const HEN_NAMES = ["Clover", "Pip", "Maple", "Dumpling", "Nutmeg", "Biscotti", "Juniper", "Poppy"];

const clampLove = (n) => Math.max(0, Math.min(HEN_LOVE_MAX, n));
export const eggCount = (st) => st.eggs[0] + st.eggs[1] + st.eggs[2];
export const henHearts = (hen) => Math.floor((hen.love / HEN_LOVE_MAX) * 5);

/** Fresh coop fields; hens are named from the coop's uid so names stay stable. */
export const newCoop = (uid) => ({
  hay: 0,
  eggs: [0, 0, 0],
  hens: Array.from({ length: COOP_HENS }, (_, i) => ({ name: HEN_NAMES[(uid * COOP_HENS + i) % HEN_NAMES.length], love: 0, petted: -1 })),
});

/** Pat a hen once a day: `{ hen, gained }`. */
export function petHen(hen, day) {
  if (hen.petted === day) return { hen, gained: 0 };
  const love = clampLove(hen.love + HEN_LOVE.pet);
  return { hen: { ...hen, love, petted: day }, gained: love - hen.love };
}

/**
 * Morning after `day`: fed hens lay (quality from `roll(i)`), everyone's
 * affection moves. Returns `{ st, laid }`.
 */
export function coopMorning(st, day, roll) {
  let hay = st.hay;
  const eggs = [...st.eggs];
  let laid = 0;
  const hens = st.hens.map((hen, i) => {
    let love = hen.love + (hen.petted === day ? 0 : HEN_LOVE.unpetted);
    if (hay > 0) {
      hay--;
      love += HEN_LOVE.fed;
      if (eggCount({ eggs }) < COOP_EGG_CAP) {
        eggs[rollQuality(eggOdds(hen.love, HEN_LOVE_MAX), roll(i))]++;
        laid++;
      }
    } else love += HEN_LOVE.hungry;
    return { ...hen, love: clampLove(love) };
  });
  return { st: { ...st, hay, eggs, hens }, laid };
}

/** Put up to `n` feed in the coop; returns the coop and how much it took. */
export function stockHay(st, n) {
  const used = Math.max(0, Math.min(n, COOP_HAY_CAP - st.hay));
  return { st: { ...st, hay: st.hay + used }, used };
}
