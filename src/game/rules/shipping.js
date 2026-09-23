/** Shipping bin: items dropped in are sold at the end of the day. */

/** Merge a stack into the bin list `[{ id, n }]` (returns a new list). */
export function shipItem(bin, id, n) {
  const out = bin.map((s) => ({ ...s }));
  const s = out.find((b) => b.id === id);
  if (s) s.n += n;
  else out.push({ id, n });
  return out;
}

/** Earnings for a bin: `{ total, lines: [{ id, n, each, sum }] }`. */
export function settle(bin, items) {
  const lines = [];
  let total = 0;
  for (const { id, n } of bin) {
    const each = items[id]?.sell ?? 0;
    lines.push({ id, n, each, sum: each * n });
    total += each * n;
  }
  return { total, lines };
}
