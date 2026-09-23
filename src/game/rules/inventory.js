/**
 * Inventory as a fixed array of slots, each `null` or `{ id, n }`. These
 * mutate the slot array in place (it is the save's own array) and return
 * how much could not be moved.
 */

import { MAX_STACK } from "../config.js";
import { ITEMS } from "../data/items.js";

const stackable = (id) => ITEMS[id]?.kind !== "tool";

/** Add n of id, filling existing stacks first. Returns the leftover count. */
export function addItem(inv, id, n = 1) {
  if (stackable(id)) {
    for (let i = 0; i < inv.length && n > 0; i++) {
      const s = inv[i];
      if (s && s.id === id && s.n < MAX_STACK) {
        const k = Math.min(n, MAX_STACK - s.n);
        s.n += k;
        n -= k;
      }
    }
  }
  for (let i = 0; i < inv.length && n > 0; i++) {
    if (!inv[i]) {
      const k = stackable(id) ? Math.min(n, MAX_STACK) : 1;
      inv[i] = { id, n: k };
      n -= k;
    }
  }
  return n;
}

export function countItem(inv, id) {
  let n = 0;
  for (const s of inv) if (s && s.id === id) n += s.n;
  return n;
}

/** Remove n of id across stacks; returns false (and changes nothing) if short. */
export function removeItem(inv, id, n = 1) {
  if (countItem(inv, id) < n) return false;
  for (let i = inv.length - 1; i >= 0 && n > 0; i--) {
    const s = inv[i];
    if (s && s.id === id) {
      const k = Math.min(n, s.n);
      s.n -= k;
      n -= k;
      if (!s.n) inv[i] = null;
    }
  }
  return true;
}

/** Take one from a specific slot; returns the id taken or null. */
export function takeFromSlot(inv, i, n = 1) {
  const s = inv[i];
  if (!s || s.n < n) return null;
  s.n -= n;
  if (!s.n) inv[i] = null;
  return s.id;
}
