/**
 * Companion wishes: which milestones a save has newly reached. `s.dreams`
 * maps wish id → true once it has come true.
 */

import { hearts } from "./relationships.js";
import { skillLevel } from "./skills.js";

export function wishContext(s) {
  const hs = Object.values(s.rel).map(hearts);
  return {
    fishKinds: Object.keys(s.fishLog).length,
    maxHearts: Math.max(0, ...hs),
    minHearts: hs.length ? Math.min(...hs) : 0,
    maxSkill: Math.max(0, ...Object.values(s.skills).map(skillLevel)),
  };
}

/** Ids of wishes reached now that weren't before, in list order. */
export function newWishes(s, wishes) {
  const c = wishContext(s);
  return wishes.filter((w) => !s.dreams[w.id] && w.check(s, c)).map((w) => w.id);
}

export const allWishes = (dreams, wishes) => wishes.every((w) => dreams[w.id]);

/** Deterministic pick of tonight's dream line (or null most nights / when unhappy). */
export function petDream(day, happy, lines) {
  if (happy < 50) return null;
  const n = Math.imul(day + 1, 2654435761) >>> 0;
  if (n % 5 > 1) return null;
  return lines[(n >>> 8) % lines.length];
}
