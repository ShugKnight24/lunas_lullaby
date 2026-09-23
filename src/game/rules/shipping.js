/** Shipping bin: items dropped in are sold at the end of the day. */

import { sellPrice } from "./quality.js";

/** Merge a stack into the bin list `[{ id, n, q? }]` (returns a new list). */
export function shipItem(bin, id, n, q = 0) {
  const out = bin.map((s) => ({ ...s }));
  const s = out.find((b) => b.id === id && (b.q ?? 0) === q);
  if (s) s.n += n;
  else out.push(q ? { id, n, q } : { id, n });
  return out;
}

/**
 * Earnings for a bin: `{ total, lines: [{ id, q, n, each, sum }] }`. `mult(id)`
 * scales an item's price (professions).
 */
export function settle(bin, items, mult = () => 1) {
  const lines = [];
  let total = 0;
  for (const { id, n, q = 0 } of bin) {
    const each = Math.round(sellPrice(items[id]?.sell ?? 0, q) * mult(id));
    lines.push({ id, q, n, each, sum: each * n });
    total += each * n;
  }
  return { total, lines };
}
