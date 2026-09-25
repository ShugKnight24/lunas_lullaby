/**
 * The adventure diary: dated entries the game writes as things happen
 * (quests, discoveries, level-ups, friends, catches) plus notes you write
 * yourself. `log` is `[{ d: dayIndex, t: text, k: kind }]`, oldest first.
 */

import { SEASONS, DAYS_PER_SEASON } from "../config.js";

export const LOG_CAP = 400;
export const NOTE_MAX = 280;

/** Add an entry (skipping an exact repeat on the same day); keeps the newest LOG_CAP. */
export function addLog(log, d, t, k = "event") {
  const text = String(t).trim().slice(0, k === "note" ? NOTE_MAX : 200);
  if (!text) return log;
  if (log.some((e) => e.d === d && e.t === text)) return log;
  const next = [...log, { d, t: text, k }];
  return next.length > LOG_CAP ? next.slice(next.length - LOG_CAP) : next;
}

/** Entries grouped by day, newest day first: `[{ d, entries }]`. */
export function logByDay(log) {
  const days = new Map();
  for (const e of log) {
    if (!days.has(e.d)) days.set(e.d, []);
    days.get(e.d).push(e);
  }
  return [...days].map(([d, entries]) => ({ d, entries })).sort((a, b) => b.d - a.d);
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

/** "Spring 3, Year 1" for an absolute day index. */
export function dateOf(d) {
  const season = Math.floor(d / DAYS_PER_SEASON) % SEASONS.length;
  const year = Math.floor(d / (DAYS_PER_SEASON * SEASONS.length)) + 1;
  return `${cap(SEASONS[season])} ${(d % DAYS_PER_SEASON) + 1}, Year ${year}`;
}
