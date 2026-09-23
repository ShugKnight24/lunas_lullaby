/**
 * Villager routines. A villager has a default `schedule` and optional
 * `routines` keyed by "rain" (rain or snow) or a weekday ("Mon".."Sun").
 * Weather wins over the weekday. A schedule is `[[fromMinute, waypoint], …]`;
 * the latest entry whose minute has passed is where they're headed.
 */

export function scheduleFor(def, { weather, weekday }) {
  const r = def.routines ?? {};
  if ((weather === "rain" || weather === "snow") && r.rain) return r.rain;
  return r[weekday] ?? def.schedule;
}

export function waypointAt(schedule, min) {
  let wp = schedule[0][1];
  for (const [from, name] of schedule) if (min >= from) wp = name;
  return wp;
}
