/** Pick a dialogue line for the current situation. */

export function lineMatches(l, ctx) {
  if (l.season !== undefined && l.season !== ctx.season) return false;
  if (l.weather !== undefined && l.weather !== ctx.weather) return false;
  if (l.min !== undefined && ctx.hearts < l.min) return false;
  if (l.max !== undefined && ctx.hearts > l.max) return false;
  return true;
}

/**
 * First meeting gets the `max: 0` intro; otherwise lines rotate by day.
 */
export function pickLine(lines, ctx) {
  const ok = lines.filter((l) => lineMatches(l, ctx));
  if (!ctx.met) {
    const intro = ok.find((l) => l.max === 0);
    if (intro) return intro.t;
  }
  const rest = ok.filter((l) => l.max !== 0);
  // Situational lines count twice so they come up more often.
  const pool = rest.concat(rest.filter((l) => l.season !== undefined || l.weather !== undefined || l.min !== undefined));
  return pool.length ? pool[(ctx.day * 7 + 3) % pool.length].t : "...";
}

export const fillLine = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
