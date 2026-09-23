/**
 * Calendar and clock. A clock is `{ min, day, season, year }` with `min` in
 * minutes since midnight of the current day (it runs past 1440 until 2:00).
 */

import { TICK_MIN, DAY_START, DAY_END, DAYS_PER_SEASON, SEASONS } from "../config.js";

export const newClock = () => ({ min: DAY_START, day: 1, season: 0, year: 1 });

/** Advance one tick; `passOut` is true once the clock reaches 2:00. */
export function tick(c) {
  const min = Math.min(DAY_END, c.min + TICK_MIN);
  return { clock: { ...c, min }, passOut: min >= DAY_END };
}

/** Morning of the next day; rolls season (and year) after the last day. */
export function nextDay(c) {
  let { day, season, year } = c;
  day++;
  if (day > DAYS_PER_SEASON) {
    day = 1;
    season++;
    if (season >= SEASONS.length) {
      season = 0;
      year++;
    }
  }
  return { clock: { min: DAY_START, day, season, year }, seasonChanged: season !== c.season };
}

/** Absolute day index from 0, for seeding and "once per day" bookkeeping. */
export const dayIndex = (c) => ((c.year - 1) * SEASONS.length + c.season) * DAYS_PER_SEASON + c.day - 1;

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const weekday = (c) => WEEK[(c.day - 1) % 7];

export function timeLabel(min) {
  const h24 = Math.floor(min / 60) % 24;
  const m = Math.floor(min % 60);
  const h = h24 % 12 || 12;
  return `${h}:${m < 10 ? "0" : ""}${m} ${h24 < 12 ? "am" : "pm"}`;
}

export const seasonName = (s) => SEASONS[s][0].toUpperCase() + SEASONS[s].slice(1);
