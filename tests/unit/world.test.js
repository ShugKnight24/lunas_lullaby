import { describe, it, expect } from "vitest";
import { buildWorld, WAYPOINTS, ALL_SPOTS, QUEST_BOARD, PLAYER_START } from "../../src/game/world/map.js";
import { buildWildwood, WILD_GATE, WILD_SPAWN, PLACES, WORLD_FROM_WILD } from "../../src/game/world/wildwood.js";
import { buildSunridge, SUN_GATE, SUN_SPAWN, WORLD_FROM_SUN } from "../../src/game/world/sunridge.js";
import { createWorldLevel, createOutdoorLevel } from "../../src/game/world/level.js";
import { findPath } from "../../src/game/world/path.js";
import { BUILDINGS } from "../../src/game/art/props.js";
import { RACES } from "../../src/game/data/races.js";

const world = createWorldLevel(buildWorld(7));
const wild = createOutdoorLevel("wildwood", buildWildwood(11));
const sun = createOutdoorLevel("sunridge", buildSunridge(23));
const reach = (lv, [sx, sy], [gx, gy]) => findPath(lv, sx, sy, gx, gy, 20000) !== null;
const start = [PLAYER_START.tx, PLAYER_START.ty];

describe("world generation", () => {
  it("keeps every generated object id where older saves expect it", () => {
    // Older saves key chopped trees and broken rocks by list position. New
    // content is appended, so the first objects never move.
    // v0.1 generated 649 objects (checked against master when the town grew).
    const a = buildWorld(7).objects;
    expect(a[0]).toMatchObject({ kind: "building", id: "house" });
    expect(a[648]).toMatchObject({ kind: "fence", tx: 34, ty: 69 });
    expect(a.slice(649).every((o) => ["building", "stall", "questboard", "arch", "raceflag"].includes(o.kind))).toBe(true);
  });

  it("walks from the farmhouse to every town door, the board and both gates", () => {
    for (const b of ALL_SPOTS.filter((s) => s.interior)) {
      const st = BUILDINGS[b.style];
      expect(reach(world, start, [b.tx + (st.w >> 1), b.ty + st.d]), b.id).toBe(true);
    }
    expect(reach(world, start, [QUEST_BOARD.tx, QUEST_BOARD.ty + 1])).toBe(true);
    for (const [x, y] of [...WILD_GATE.world, ...SUN_GATE.world]) expect(reach(world, start, [x, y]), `${x},${y}`).toBe(true);
    expect(world.blocked(WORLD_FROM_WILD.tx, WORLD_FROM_WILD.ty)).toBe(false);
    expect(world.blocked(WORLD_FROM_SUN.tx, WORLD_FROM_SUN.ty)).toBe(false);
  });

  it("reaches every Wildwood place and chest from the gate", () => {
    const from = [WILD_SPAWN.tx, WILD_SPAWN.ty];
    for (const [id, r] of Object.entries(PLACES)) expect(reach(wild, from, [Math.round((r.x0 + r.x1) / 2), Math.round((r.y0 + r.y1) / 2)]) || id === "thicket", id).toBe(true);
    for (const o of wild.objects.filter((o) => o.kind === "chest")) {
      const open = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => !wild.blocked(o.tx + dx, o.ty + dy) && reach(wild, from, [o.tx + dx, o.ty + dy]));
      expect(open, `chest ${o.chest}`).toBe(true);
    }
    for (const [x, y] of WILD_GATE.wild) expect(reach(wild, from, [x, y])).toBe(true);
  });

  it("reaches both Sunridge farms from the gate", () => {
    const from = [SUN_SPAWN.tx, SUN_SPAWN.ty];
    for (const wp of Object.values(WAYPOINTS).filter((w) => w.level === "sunridge")) expect(reach(sun, from, [wp.tx, wp.ty]), `${wp.tx},${wp.ty}`).toBe(true);
    for (const [x, y] of SUN_GATE.sun) expect(reach(sun, from, [x, y])).toBe(true);
  });

  it("runs every race gate from its flag", () => {
    for (const [id, race] of Object.entries(RACES)) {
      const lv = { world, sunridge: sun, wildwood: wild }[race.level];
      const from = [race.flag.tx, race.flag.ty + 1];
      for (const [x, y] of race.gates) expect(reach(lv, from, [x, y]), `${id} ${x},${y}`).toBe(true);
    }
  });

  it("spawns creatures only on open ground", () => {
    const data = buildWildwood(11);
    for (const zone of Object.keys(data.spawns)) {
      expect(data.spawns[zone].length, zone).toBeGreaterThan(20);
      for (const [x, y] of data.spawns[zone]) expect(wild.blocked(x, y), `${zone} ${x},${y}`).toBe(false);
    }
  });
});
