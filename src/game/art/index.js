/**
 * Sprite registry: every sprite is built once per key and cached, and the
 * world resolves an object's key/sprite when it spawns or the season
 * changes, never per frame.
 */

import { DEFS } from "./cozy-kit.js";
import * as P from "./props.js";
import { cropSprite, soilSprite } from "./crops-art.js";
import { iconSprite } from "./icons.js";
import { petSprite, horseSprite, chickenSprite } from "./animals.js";
import { CROPS } from "../data/crops.js";
import { STRUCTURES } from "../data/structures.js";

export { DEFS };

const cache = new Map();

/** Cached sprite for `key`, built by `build()` on first use. */
export function sprite(key, build) {
  let s = cache.get(key);
  if (!s) {
    s = build();
    cache.set(key, s);
  }
  return s;
}

/** Resolve an object's sprite key for the season; sets o.key / o.spr. */
export function resolveObject(o, season) {
  let key = "";
  let build = null;
  const seed = (o.seed ?? o.id ?? 1) % 3;
  switch (o.kind) {
    case "tree":
      if (o.stump) {
        key = "stump";
        build = P.stumpSprite;
      } else if (o.variant === "pine") {
        key = `pine:${season}:${seed}`;
        build = () => P.pineSprite(season, seed + 1);
      } else {
        const cherry = o.variant === "cherry";
        key = `oak:${season}:${seed}:${cherry ? 1 : 0}`;
        build = () => P.oakSprite(season, seed + 1, cherry);
      }
      break;
    case "rock":
      key = `rock:${season === 3 ? 3 : 0}:${o.small ? 0 : 1}`;
      build = () => P.rockSprite(season === 3 ? 3 : 0, !o.small);
      break;
    case "weed":
      key = `weed:${season}`;
      build = () => P.weedSprite(season);
      break;
    case "twig":
      key = "twig";
      build = P.twigSprite;
      break;
    case "bush": {
      const berry = o.berry && season === 1 ? "#f08a5a" : o.berry && season === 2 ? "#4a2a5a" : null;
      key = `bush:${season}:${seed}:${berry ?? ""}`;
      build = () => P.bushSprite(season, seed + 1, berry);
      break;
    }
    case "flowers":
      key = `flowers:${season}:${seed}`;
      build = () => P.flowerPatchSprite(season, seed);
      break;
    case "lily":
      key = `lily:${o.seed % 2}`;
      build = () => P.lilySprite(o.seed);
      break;
    case "building":
      key = `bld:${o.style}:${season === 3 ? 3 : 0}`;
      build = () => P.buildingSprite(o.style, season === 3 ? 3 : 0);
      break;
    case "bin":
      key = "bin";
      build = P.binSprite;
      break;
    case "board":
      key = "board";
      build = P.boardSprite;
      break;
    case "well":
      key = `well:${season === 3 ? 3 : 0}`;
      build = () => P.wellSprite(season === 3 ? 3 : 0);
      break;
    case "lamp":
      key = "lamp";
      build = P.lampSprite;
      break;
    case "bench":
      key = "bench";
      build = P.benchSprite;
      break;
    case "barrel":
      key = "barrel";
      build = P.barrelSprite;
      break;
    case "planter":
      key = `planter:${season}`;
      build = () => P.planterSprite(season);
      break;
    case "fence":
      key = `fence:${o.mask ?? 0}:${season === 3 ? 3 : 0}`;
      build = () => P.fenceSprite(o.mask ?? 0, season === 3 ? 3 : 0);
      break;
    case "structure":
      return resolveStructure(o, season);
    case "furniture":
      return resolveFurniture(o);
    default:
      key = "sparkle";
      build = P.sparkleSprite;
  }
  o.key = key;
  o.spr = sprite(key, build);
}

function resolveStructure(o, season) {
  const s = season === 3 ? 3 : 0;
  const t = o.type;
  let key = t;
  let build;
  const def = STRUCTURES[t];
  if (def?.fence) {
    key = `fence:${def.fence}:${o.color ?? "-"}:${o.mask ?? 0}:${s}`;
    build = () => P.fenceSprite(o.mask ?? 0, s, def.fence, o.color);
  } else if (def?.deco === "planter") {
    key = `planter:${season}`;
    build = () => P.planterSprite(season);
  } else if (def?.deco) {
    key = def.deco;
    build = def.deco === "lamp" ? P.lampSprite : P.benchSprite;
  } else if (t === "path") {
    key = `path:${s}`;
    build = () => P.pathTileSprite(s);
  } else if (t === "scarecrow") build = P.scarecrowSprite;
  else if (t === "sprinkler") build = P.sprinklerSprite;
  else if (t === "coop") {
    key = `bld:coop:${s}`;
    build = () => P.buildingSprite("coop", s);
  } else if (t === "well") {
    key = `well:${s}`;
    build = () => P.wellSprite(s);
  } else if (t === "preserves_jar" || t === "mayo_machine") {
    key = `${t}:${o.busy ? 1 : 0}`;
    build = () => (t === "preserves_jar" ? P.preservesJarSprite : P.mayoMachineSprite)(!!o.busy);
  }
  o.key = key;
  o.spr = sprite(key, build);
}

const FURN = {
  bed: P.bedSprite, table: P.tableSprite, fireplace: P.fireplaceSprite, counter: P.counterSprite,
  shelf: P.shelfSprite, plant: P.plantSprite, workbench: P.workbenchSprite, barrel: P.barrelSprite,
};

function resolveFurniture(o) {
  if (o.name === "rug") {
    const c = o.c ?? "#e8a0b0";
    o.key = `rug:${c}`;
    o.spr = sprite(o.key, () => P.rugSprite(80, 56, c));
    return;
  }
  o.key = `furn:${o.name}`;
  o.spr = sprite(o.key, FURN[o.name]);
}

export const cropKey = (id, stage) => `crop:${id}:${stage}`;
export const cropSpr = (id, stage) => sprite(cropKey(id, stage), () => cropSprite(id, CROPS[id], stage));
export const soilSpr = (wet) => sprite(wet ? "soil:1" : "soil:0", () => soilSprite(wet));
const IK = new Map();
/** Memoised icon cache key (no per-frame string building). */
export function iconKey(id) {
  let k = IK.get(id);
  if (!k) IK.set(id, (k = `icon:${id}`));
  return k;
}
export const iconSpr = (id) => sprite(iconKey(id), () => iconSprite(id));
export const petSpr = (kind, coat, frame) => sprite(`pet:${kind}:${coat}:${frame}`, () => petSprite(kind, coat, frame));
export const horseSpr = (dir, frame) => sprite(`horse:${dir}:${frame}`, () => horseSprite(dir, frame));
export const chickenSpr = (frame) => sprite(`chick:${frame}`, () => chickenSprite(frame));
export const sparkleSpr = () => sprite("sparkle", P.sparkleSprite);
