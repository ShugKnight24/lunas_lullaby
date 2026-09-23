import { describe, it, expect } from "vitest";
import { ITEMS } from "../../src/game/data/items.js";
import { CROPS } from "../../src/game/data/crops.js";
import { FORAGE, RARE_FORAGE } from "../../src/game/data/forage.js";
import { shipItem, settle } from "../../src/game/rules/shipping.js";
import { addItem, removeItem, countItem } from "../../src/game/rules/inventory.js";
import { endDay } from "../../src/game/rules/day.js";
import { newClock } from "../../src/game/rules/clock.js";
import { MAX_STACK } from "../../src/game/config.js";

describe("shipping", () => {
  it("merges stacks and totals sell prices", () => {
    let bin = shipItem([], "turnip", 3);
    bin = shipItem(bin, "turnip", 2);
    bin = shipItem(bin, "wood", 10);
    expect(bin).toEqual([{ id: "turnip", n: 5 }, { id: "wood", n: 10 }]);
    const r = settle(bin, ITEMS);
    expect(r.total).toBe(5 * ITEMS.turnip.sell + 10 * ITEMS.wood.sell);
    expect(r.lines[0]).toMatchObject({ id: "turnip", n: 5, sum: 5 * ITEMS.turnip.sell });
  });
});

describe("inventory", () => {
  it("stacks, overflows and removes", () => {
    const inv = new Array(3).fill(null);
    expect(addItem(inv, "wood", MAX_STACK + 5)).toBe(0);
    expect(inv[0].n).toBe(MAX_STACK);
    expect(inv[1].n).toBe(5);
    expect(addItem(inv, "hoe")).toBe(0);
    expect(addItem(inv, "axe")).toBe(1);
    expect(removeItem(inv, "wood", 200)).toBe(false);
    expect(removeItem(inv, "wood", 7)).toBe(true);
    expect(countItem(inv, "wood")).toBe(MAX_STACK - 2);
  });
});

describe("end of day", () => {
  const base = () => ({
    seed: 1,
    gold: 100,
    clock: newClock(),
    weather: "sun",
    bin: [{ id: "turnip", n: 2 }],
    soil: {
      10: { watered: true, crop: { id: "turnip", days: 0, dead: false } },
      11: { watered: false, crop: { id: "turnip", days: 0, dead: false } },
      12: { watered: false, crop: null },
    },
    structures: [{ kind: "sprinkler", tx: 2, ty: 0 }],
    forage: {},
    energy: 3,
  });
  const opts = { crops: CROPS, items: ITEMS, w: 10, spots: [{ id: 1 }, { id: 2, rare: true }], forage: FORAGE, rareForage: RARE_FORAGE };

  it("ships, grows watered crops, restores energy and empties the bin", () => {
    const { state, report } = endDay(base(), opts);
    expect(report.total).toBe(2 * ITEMS.turnip.sell);
    expect(state.gold).toBe(100 + report.total);
    expect(state.bin).toEqual([]);
    expect(state.soil[10].crop.days).toBe(1);
    expect(state.soil[11].crop.days).toBe(0);
    expect(state.energy).toBe(270);
    expect(state.clock.day).toBe(2);
    expect(state.forage[1].item).toBeTruthy();
  });

  it("sprinklers water their four neighbours each morning", () => {
    const { state } = endDay(base(), opts);
    // sprinkler at (2,0) in a 10-wide map covers index 1, 3, 12 (and -8, off-map)
    expect(state.soil[12].watered).toBe(true);
    expect(state.soil[11].watered).toBe(false);
  });

  it("passing out costs gold and half energy", () => {
    const s = { ...base(), gold: 1000, bin: [] };
    const { state, report } = endDay(s, { ...opts, passedOut: true });
    expect(report.penalty).toBe(100);
    expect(state.gold).toBe(900);
    expect(state.energy).toBe(135);
  });

  it("withers spring crops when summer arrives", () => {
    const s = { ...base(), clock: { ...newClock(), day: 28 } };
    const { state, report } = endDay(s, opts);
    expect(report.seasonChanged).toBe(true);
    expect(report.withered).toBe(2);
    expect(state.soil[10].crop.dead).toBe(true);
  });
});
