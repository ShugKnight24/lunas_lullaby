import { describe, it, expect } from "vitest";
import { addLog, logByDay, dateOf, LOG_CAP, NOTE_MAX } from "../../src/game/rules/log.js";
import { migrateSave, newState } from "../../src/game/state.js";

describe("adventure diary", () => {
  it("adds entries, skipping an exact repeat on the same day", () => {
    let log = addLog([], 3, "Met Hazel.");
    log = addLog(log, 3, "Met Hazel.");
    log = addLog(log, 4, "Met Hazel.");
    expect(log).toEqual([{ d: 3, t: "Met Hazel.", k: "event" }, { d: 4, t: "Met Hazel.", k: "event" }]);
  });

  it("ignores blank notes, trims long ones and keeps only the newest entries", () => {
    expect(addLog([], 0, "   ", "note")).toEqual([]);
    expect(addLog([], 0, "x".repeat(999), "note")[0].t).toHaveLength(NOTE_MAX);
    let log = [];
    for (let i = 0; i < LOG_CAP + 5; i++) log = addLog(log, i, `day ${i}`);
    expect(log).toHaveLength(LOG_CAP);
    expect(log[0].t).toBe("day 5");
  });

  it("groups by day, newest first", () => {
    const log = [{ d: 1, t: "a" }, { d: 2, t: "b" }, { d: 1, t: "c" }];
    expect(logByDay(log).map((x) => [x.d, x.entries.map((e) => e.t)])).toEqual([[2, ["b"]], [1, ["a", "c"]]]);
  });

  it("dates days like the calendar", () => {
    expect(dateOf(0)).toBe("Spring 1, Year 1");
    expect(dateOf(29)).toBe("Summer 2, Year 1");
    expect(dateOf(112)).toBe("Spring 1, Year 2");
  });

  it("older saves start a diary", () => {
    const s = newState();
    delete s.log;
    expect(migrateSave({ ...s, v: 11 }).log).toHaveLength(1);
  });
});
