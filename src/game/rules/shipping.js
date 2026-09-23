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

/** Earnings for a bin: `{ total, lines: [{ id, q, n, each, sum }] }`. */
export function settle(bin, items) {
  const lines = [];
  let total = 0;
  for (const { id, n, q = 0 } of bin) {
    const each = sellPrice(items[id]?.sell ?? 0, q);
    lines.push({ id, q, n, each, sum: each * n });
    total += each * n;
  }
  return { total, lines };
}
