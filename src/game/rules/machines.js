/**
 * Machine state on a placed structure: `{ input, q, left, out }` — `input`
 * is what's processing (with quality `q`) and `left` the nights to go; `out`
 * is a finished product waiting to be collected. Pure: returns new state.
 */

export const emptyMachine = () => ({ input: null, q: 0, left: 0, out: null });

/** Put one `id` (quality q) in: `{ st }` or `{ error }`. `faster` takes a night off (Tinkerer). */
export function loadMachine(st, def, id, item, q = 0, faster = false) {
  if (st.out) return { error: "Collect what's inside first." };
  if (st.input) return { error: "It's still working." };
  if (!item || !def.accepts(id, item)) return { error: `The ${def.name} can't use that.` };
  return { st: { ...st, input: id, q, left: Math.max(1, def.days - (faster ? 1 : 0)), out: null } };
}

/** One night passes. */
export function machineMorning(st, def) {
  if (!st.input) return st;
  const left = st.left - 1;
  if (left > 0) return { ...st, left };
  return { ...st, input: null, left: 0, out: def.product(st.input) };
}

/** Take the product: `{ st, item, q }` or null when nothing's ready. */
export function collectMachine(st) {
  if (!st.out) return null;
  return { st: { ...st, out: null, q: 0 }, item: st.out, q: st.q };
}
