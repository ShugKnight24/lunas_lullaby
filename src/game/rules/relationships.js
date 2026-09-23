/**
 * Friendship: 0..1000 points, 100 per heart. Talking once a day and one gift
 * a day raise it; gifts follow the villager's loved/liked/disliked lists.
 * A relationship is `{ pts, talked, gifted, events }` where talked/gifted
 * hold the day index of the last chat/gift.
 */

export const MAX_PTS = 1000;
export const PTS_PER_HEART = 100;
export const TALK_PTS = 25;
export const GIFT_PTS = { love: 80, like: 45, neutral: 20, dislike: -30 };

export const newRel = () => ({ pts: 0, talked: -1, gifted: -1, events: {} });
export const hearts = (rel) => Math.floor(rel.pts / PTS_PER_HEART);
const clampPts = (p) => Math.max(0, Math.min(MAX_PTS, p));

/** Daily chat: `{ rel, gained }` (gained 0 if already talked today). */
export function talk(rel, day) {
  if (rel.talked === day) return { rel, gained: 0 };
  return { rel: { ...rel, talked: day, pts: clampPts(rel.pts + TALK_PTS) }, gained: TALK_PTS };
}

export function giftTaste(id, v) {
  if (v.loves.includes(id)) return "love";
  if (v.likes.includes(id)) return "like";
  if (v.dislikes.includes(id)) return "dislike";
  return "neutral";
}

/** One gift per day: `{ rel, taste, delta }` or `{ rel, refused: true }`. */
export function gift(rel, id, v, day) {
  if (rel.gifted === day) return { rel, refused: true };
  const taste = giftTaste(id, v);
  const delta = GIFT_PTS[taste];
  return { rel: { ...rel, gifted: day, pts: clampPts(rel.pts + delta) }, taste, delta };
}

/** Heart event ready to play (reached its hearts and not yet seen). */
export const eventReady = (rel, ev) => !!ev && hearts(rel) >= ev.hearts && !rel.events[ev.hearts];
