/**
 * Quest state. `qs = { active: { id: { p: [counts] } }, done: { id: day }, board: { day, took: [ids] } }`.
 * Board jobs have generated ids "b<day>.<i>" and are rebuilt from the day,
 * so the save only stores their ids and progress.
 */

import { SeededRNG } from "../../engine/seeded-rng.js";
import { DAYS_PER_SEASON } from "../config.js";

export const newQuests = () => ({ active: {}, done: {}, board: { day: -1, took: [] } });

/** Quest definition by id (story quests from `defs`, board jobs generated). */
export function questDef(id, defs, pool, items) {
  if (defs[id]) return defs[id];
  const m = /^b(\d+)\.(\d+)$/.exec(id);
  if (!m) return null;
  return boardJob(+m[1], +m[2], pool, items);
}

/** The board's job `i` on absolute `day`: a template that suits the season, counts rolled from the day. */
export function boardJob(day, i, pool, items) {
  const rng = new SeededRNG(day * 97 + i * 13 + 5);
  const season = Math.floor(day / DAYS_PER_SEASON) % 4;
  const fits = pool.filter((t) => t.season === undefined || t.season === season);
  const t = fits[(day * 7 + i * 5 + rng.nextInt(0, fits.length - 1)) % fits.length];
  const n = rng.nextInt(t.n[0], t.n[1]);
  const goal = t.kill ? { kill: t.kill, n } : { bring: t.bring, n };
  return {
    title: t.title,
    giver: "board",
    board: true,
    desc: t.kill ? `Defeat ${n} ${t.kill === "boar" ? "Thornbacks" : t.kill === "shroom" ? "Shroomlings" : t.kill === "wisp" ? "Gloom Wisps" : "slimes"} in the Wildwood${t.night ? " (they're out after dark)" : ""}.` : `Bring ${n} × ${items[t.bring]?.name ?? t.bring} to the notice board.`,
    goals: [goal],
    reward: { gold: t.pay * n, guild: 1 },
  };
}

/** Today's board ids (fresh each day; jobs already taken stay on it). */
export const boardIds = (day, size) => Array.from({ length: size }, (_, i) => `b${day}.${i}`);

export function status(qs, id, def, ctx = {}) {
  if (qs.done[id] !== undefined) return "done";
  if (qs.active[id]) return "active";
  if (!def) return "locked";
  const r = def.req ?? {};
  if (r.quest && qs.done[r.quest] === undefined) return "locked";
  if (r.hearts && (ctx.hearts?.(r.hearts[0]) ?? 0) < r.hearts[1]) return "locked";
  return "available";
}

export function accept(qs, id, def) {
  if (qs.active[id] || qs.done[id] !== undefined) return qs;
  return { ...qs, active: { ...qs.active, [id]: { p: def.goals.map(() => 0) } } };
}

/** Does a kill of `monster` count for goal `what`? ("slime" counts every slime kind.) */
export const killMatches = (what, monster) => monster === what || monster.startsWith(`${what}_`);

/**
 * A game event: `{ kill: id }`, `{ boss: id }` or `{ visit: place }`.
 * Returns `{ qs, changed: [quest ids] }`.
 */
export function advance(qs, ev, defOf) {
  const changed = [];
  const active = { ...qs.active };
  for (const id in active) {
    const def = defOf(id);
    if (!def) continue;
    let p = null;
    def.goals.forEach((g, i) => {
      const cur = (p ?? active[id].p)[i];
      let hit = false;
      if (g.kill && ev.kill && killMatches(g.kill, ev.kill) && cur < g.n) hit = true;
      if (g.boss && ev.boss === g.boss && cur < 1) hit = true;
      if (g.visit && ev.visit === g.visit && cur < 1) hit = true;
      if (g.act && ev.act === g.act && cur < g.n) hit = true;
      if (!hit) return;
      p ??= [...active[id].p];
      p[i]++;
    });
    if (p) {
      active[id] = { ...active[id], p };
      changed.push(id);
    }
  }
  return { qs: changed.length ? { ...qs, active } : qs, changed };
}

/** Goals left: `[{ goal, have, need }]`; `count(item)` is how many are in the bag. */
export function goalProgress(qs, id, def, count) {
  const a = qs.active[id];
  return def.goals.map((g, i) => {
    const need = g.n ?? 1;
    const have = g.bring ? Math.min(need, count(g.bring)) : Math.min(need, a?.p[i] ?? 0);
    return { goal: g, have, need };
  });
}

export const isReady = (qs, id, def, count) => !!qs.active[id] && goalProgress(qs, id, def, count).every((g) => g.have >= g.need);

/** Finish a quest: `{ qs, take: [[item, n]] }` (what to take from the bag). */
export function complete(qs, id, def, day) {
  const active = { ...qs.active };
  delete active[id];
  const take = def.goals.filter((g) => g.bring).map((g) => [g.bring, g.n]);
  return { qs: { ...qs, active, done: { ...qs.done, [id]: day } }, take };
}

/** A new day puts fresh jobs on the board; jobs already taken stay active until done. */
export function rollBoard(qs, day) {
  if (qs.board.day === day) return qs;
  return { ...qs, board: { day, took: [] } };
}
