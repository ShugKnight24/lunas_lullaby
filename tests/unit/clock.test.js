import { describe, it, expect } from "vitest";
import { newClock, tick, nextDay, dayIndex, timeLabel, weekday } from "../../src/game/rules/clock.js";
import { DAY_END, DAYS_PER_SEASON } from "../../src/game/config.js";

describe("clock", () => {
  it("ticks in 10 minute steps from 6:00", () => {
    const c = newClock();
    expect(timeLabel(c.min)).toBe("6:00 am");
    expect(tick(c).clock.min).toBe(370);
    expect(timeLabel(13 * 60 + 40)).toBe("1:40 pm");
    expect(timeLabel(24 * 60 + 30)).toBe("12:30 am");
  });

  it("passes out at 2:00", () => {
    const r = tick({ ...newClock(), min: DAY_END - 10 });
    expect(r.passOut).toBe(true);
    expect(r.clock.min).toBe(DAY_END);
    expect(tick({ ...newClock(), min: DAY_END - 20 }).passOut).toBe(false);
  });

  it("rolls day, season and year", () => {
    let c = newClock();
    let r = nextDay(c);
    expect(r.clock).toMatchObject({ day: 2, season: 0, min: 360 });
    expect(r.seasonChanged).toBe(false);
    r = nextDay({ ...c, day: DAYS_PER_SEASON });
    expect(r.clock).toMatchObject({ day: 1, season: 1, year: 1 });
    expect(r.seasonChanged).toBe(true);
    r = nextDay({ ...c, day: DAYS_PER_SEASON, season: 3 });
    expect(r.clock).toMatchObject({ day: 1, season: 0, year: 2 });
  });

  it("indexes days monotonically", () => {
    expect(dayIndex(newClock())).toBe(0);
    expect(dayIndex({ day: 1, season: 1, year: 1 })).toBe(DAYS_PER_SEASON);
    expect(dayIndex({ day: 1, season: 0, year: 2 })).toBe(DAYS_PER_SEASON * 4);
    expect(weekday({ day: 8 })).toBe("Mon");
  });
});
