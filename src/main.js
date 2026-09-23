/**
 * Boot: canvas loop, input bindings, DOM UI, title → creator → game.
 * `window.__game` exposes the runtime and a few helpers for debugging and
 * headless tests.
 */

import { startLoop } from "./engine/loop.js";
import { createInput } from "./engine/input.js";
import { createGame, update, render, newGame, continueGame, loadState, sleep, resolveSeason, writeSave, syncSoil, retarget } from "./game/game.js";
import { createUI } from "./game/ui/panels.js";
import { showTitle } from "./game/ui/creator.js";
import { useTool, interact, toggleMount } from "./game/actions.js";
import { enterBuild, placeStructure, placementQuery } from "./game/build.js";
import { addItem } from "./game/rules/inventory.js";
import { rollWeather } from "./game/rules/weather.js";
import { newState } from "./game/state.js";
import { TILE } from "./game/config.js";

const canvas = document.getElementById("game");
const root = document.getElementById("ui");

const bindings = {
  up: ["KeyW", "ArrowUp"],
  down: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  use: ["Space", "KeyC"],
  interact: ["KeyE", "Enter"],
  mount: ["KeyF"],
  pause: ["Escape"],
  journal: ["KeyJ"],
  friends: ["KeyR"],
  inventory: ["KeyI", "Tab"],
  zoomIn: ["Equal", "NumpadAdd"],
  zoomOut: ["Minus", "NumpadSubtract"],
};
for (let i = 1; i <= 9; i++) bindings[`slot${i}`] = [`Digit${i}`];

const input = createInput(canvas, bindings);
const ui = createUI(root);
const g = createGame(input, ui);
g.renderMs = 0;
ui.g = g;

function title() {
  g.mode = "title";
  loadState(g, newState());
  g.mode = "title";
  showTitle(root, {
    onNew: (profile) => newGame(g, profile),
    onContinue: () => continueGame(g) || title(),
  });
}
ui.onQuit = title;

startLoop(canvas, {
  update(dt, t) {
    update(g, dt, t);
    input.endFrame();
  },
  render(ctx, view, t) {
    const t0 = performance.now();
    render(ctx, view, g, t);
    g.renderMs = g.renderMs * 0.95 + (performance.now() - t0) * 0.05;
  },
});

title();

// ── Debug / test hooks ──────────────────────────────────────────────────────
const at = (tx, ty) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 + 6 });
window.__game = {
  g,
  get state() {
    return g.s;
  },
  newGame: (profile) => (document.querySelector(".title, .creator")?.remove(), newGame(g, profile ?? newState().profile)),
  continueGame: () => (document.querySelector(".title")?.remove(), continueGame(g)),
  teleport(tx, ty, level = "world", dir = "down") {
    g.lv = g.levels[level];
    Object.assign(g.player, at(tx, ty), { dir });
    if (g.player.mounted) Object.assign(g.horse, at(tx, ty));
    g.pet.x = g.player.x - 26;
    g.pet.y = g.player.y;
    g.cam.x = g.player.x;
    g.cam.y = g.player.y - 20;
  },
  face: (dir) => (g.player.dir = dir),
  select: (i) => (g.s.sel = i),
  /** Select the first bag slot holding `id`; returns the slot, or -1 (selection unchanged). */
  selectItem(id) {
    const i = g.s.inv.findIndex((x) => x?.id === id);
    if (i >= 0) g.s.sel = i;
    return i;
  },
  give: (id, n = 1, q = 0) => addItem(g.s.inv, id, n, q),
  use: () => ((g.player.useT = 0), retarget(g), useTool(g)),
  interact: () => (retarget(g), interact(g)),
  mount: () => toggleMount(g),
  setTime: (min) => ((g.s.clock = { ...g.s.clock, min }), (g.tickAcc = 0)),
  sync: (idx) => syncSoil(g, idx),
  setSeason(s) {
    g.s.clock = { ...g.s.clock, season: s };
    resolveSeason(g);
    for (const k in g.s.soil) syncSoil(g, +k);
  },
  setWeather: (w) => (g.s.weather = w),
  sleep: () => sleep(g),
  save: () => writeSave(g),
  openBuild: (type) => enterBuild(g, type),
  place: (type, tx, ty) => placeStructure(g, type, tx, ty),
  query: () => placementQuery(g),
  /** Point the mouse at a world tile (build ghost). */
  hover(tx, ty) {
    input.mouse.x = (tx * TILE + TILE / 2 - g.cam.x) * g.cam.z + g.view.w / 2;
    input.mouse.y = (ty * TILE + TILE / 2 - g.cam.y) * g.cam.z + g.view.h / 2;
  },
  rollWeather,
};
