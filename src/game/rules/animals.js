/**
 * Coop care on plain structure state. A coop stores `hay` (feed on hand) and
 * `eggs` (laid, waiting to be collected). Each morning every hen that finds
 * hay eats one and lays an egg.
 */

export const COOP_HENS = 2;
export const COOP_HAY_CAP = 40;
export const COOP_EGG_CAP = 8;
/** Items the coop accepts as feed, one hay each. */
export const FEEDS = ["hay", "fiber"];

export function coopMorning(st) {
  const fed = Math.min(COOP_HENS, st.hay);
  const eggs = Math.min(COOP_EGG_CAP, st.eggs + fed);
  return { st: { ...st, hay: st.hay - fed, eggs }, laid: eggs - st.eggs };
}

/** Put up to `n` feed in the coop; returns the coop and how much it took. */
export function stockHay(st, n) {
  const used = Math.max(0, Math.min(n, COOP_HAY_CAP - st.hay));
  return { st: { ...st, hay: st.hay + used }, used };
}
