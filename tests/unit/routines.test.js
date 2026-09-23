import { describe, it, expect } from "vitest";
import { scheduleFor, waypointAt } from "../../src/game/rules/schedule.js";
import { VILLAGERS, VILLAGER_IDS } from "../../src/game/data/villagers.js";
import { HEART_EVENTS, LINES, GIFT_LINES } from "../../src/game/data/dialogue.js";
import { ITEMS } from "../../src/game/data/items.js";
import { WAYPOINTS, INTERIORS, buildWorld } from "../../src/game/world/map.js";
import { createWorldLevel, createInterior } from "../../src/game/world/level.js";

const sunnyMon = { weather: "sun", weekday: "Mon" };

describe("routines", () => {
  it("rain beats a weekday, which beats the default", () => {
    const def = { schedule: [[0, "a"]], routines: { rain: [[0, "r"]], Sat: [[0, "s"]] } };
    expect(scheduleFor(def, sunnyMon)).toBe(def.schedule);
    expect(scheduleFor(def, { weather: "sun", weekday: "Sat" })).toBe(def.routines.Sat);
    expect(scheduleFor(def, { weather: "rain", weekday: "Sat" })).toBe(def.routines.rain);
    expect(scheduleFor(def, { weather: "snow", weekday: "Tue" })).toBe(def.routines.rain);
    expect(scheduleFor({ schedule: def.schedule }, { weather: "rain", weekday: "Sat" })).toBe(def.schedule);
  });

  it("picks the latest entry that has started", () => {
    const sch = [[0, "home"], [540, "work"], [1020, "home"]];
    expect(waypointAt(sch, 360)).toBe("home");
    expect(waypointAt(sch, 540)).toBe("work");
    expect(waypointAt(sch, 1500)).toBe("home");
  });

  it("Juniper stays out on rainy days, Theo keeps to his shop", () => {
    const rain = { weather: "rain", weekday: "Mon" };
    expect(waypointAt(scheduleFor(VILLAGERS.juniper, rain), 1150)).toBe("pier_end");
    expect(waypointAt(scheduleFor(VILLAGERS.juniper, sunnyMon), 1150)).toBe("cabin_door");
    expect(waypointAt(scheduleFor(VILLAGERS.theo, rain), 800)).toBe("carpenter_in");
  });
});

describe("villager data", () => {
  const levels = { world: createWorldLevel(buildWorld(7)) };
  for (const id in INTERIORS) levels[id] = createInterior(id);

  it("every schedule and routine names a waypoint you can stand on", () => {
    for (const id of VILLAGER_IDS) {
      const v = VILLAGERS[id];
      for (const sch of [v.schedule, ...Object.values(v.routines ?? {})])
        for (const [, name] of sch) {
          const wp = WAYPOINTS[name];
          expect(wp, `${id} → ${name}`).toBeTruthy();
          expect(levels[wp.level].blocked(wp.tx, wp.ty), `${id} → ${name} blocked`).toBe(false);
        }
    }
  });

  it("every villager has lines, gift replies, and valid gift tastes and rewards", () => {
    for (const id of VILLAGER_IDS) {
      expect(LINES[id]?.length, id).toBeGreaterThan(0);
      expect(Object.keys(GIFT_LINES[id])).toEqual(["love", "like", "neutral", "dislike"]);
      const v = VILLAGERS[id];
      for (const it of [...v.loves, ...v.likes, ...v.dislikes]) expect(ITEMS[it], `${id}: ${it}`).toBeTruthy();
      for (const ev of HEART_EVENTS[id] ?? []) if (ev.reward) expect(ITEMS[ev.reward], `${id} reward`).toBeTruthy();
    }
  });
});
