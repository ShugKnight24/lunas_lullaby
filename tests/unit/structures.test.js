import { describe, it, expect } from "vitest";
import { STRUCTURES } from "../../src/game/data/structures.js";
import { canPlace, footprint, sprinklerTiles, affordable, refund } from "../../src/game/rules/structures.js";
import { sprinklerCoverage } from "../../src/game/rules/day.js";

// 10×10 farm, x >= 8 is outside the farm, (3,3) holds a rock, (5,5) is tilled.
const q = {
  buildable: (x, y) => x >= 0 && y >= 0 && x < 8 && y < 10,
  blocked: (x, y) => x === 3 && y === 3,
  tilled: (x, y) => x === 5 && y === 5,
};

describe("structure placement", () => {
  it("footprints cover w×h tiles from the top-left", () => {
    expect(footprint(STRUCTURES.coop, 1, 2)).toHaveLength(12);
    expect(footprint(STRUCTURES.well, 1, 2)).toContainEqual([2, 3]);
  });

  it("rejects blocked, out-of-farm and tilled tiles", () => {
    expect(canPlace(STRUCTURES.fence, 0, 0, q)).toBe(true);
    expect(canPlace(STRUCTURES.fence, 3, 3, q)).toBe(false);
    expect(canPlace(STRUCTURES.coop, 2, 2, q)).toBe(false);
    expect(canPlace(STRUCTURES.coop, 5, 0, q)).toBe(false);
    expect(canPlace(STRUCTURES.fence, 5, 5, q)).toBe(false);
    expect(canPlace(STRUCTURES.sprinkler, 5, 5, q)).toBe(true);
  });

  it("checks cost and refunds half the materials", () => {
    expect(affordable(STRUCTURES.coop.cost, { gold: 400, wood: 40, stone: 20 })).toBe(true);
    expect(affordable(STRUCTURES.coop.cost, { gold: 399, wood: 40, stone: 20 })).toBe(false);
    expect(refund(STRUCTURES.coop.cost)).toEqual({ wood: 20, stone: 10 });
  });
});

describe("sprinklers", () => {
  it("cover the four orthogonal neighbours", () => {
    expect(sprinklerTiles(4, 4)).toEqual([[4, 3], [5, 4], [4, 5], [3, 4]]);
    const wet = sprinklerCoverage([{ uid: 1, type: "sprinkler", tx: 4, ty: 4 }, { uid: 2, type: "fence", tx: 0, ty: 0 }], 10);
    expect([...wet].sort((a, b) => a - b)).toEqual([34, 43, 45, 54]);
  });
});

describe("farm bounds", () => {
  it("run from the house to the southern tree line, west of the fence, around the hidden pool", async () => {
    const { inFarm, buildWorld } = await import("../../src/game/world/map.js");
    expect(inFarm(20, 20)).toBe(true);
    expect(inFarm(20, 66)).toBe(true); // the south strip
    expect(inFarm(34, 40)).toBe(false); // the east fence line
    expect(inFarm(8, 66)).toBe(false); // the Moonlit Pool stays secret
    const fence = buildWorld(7).objects.filter((o) => o.kind === "fence" && o.tx === 34 && o.fixed).map((o) => o.ty);
    for (let y = 36; y <= 69; y++) expect(fence, `fence at row ${y}`).toContain(y);
  });
});
