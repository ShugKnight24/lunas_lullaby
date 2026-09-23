/**
 * DOM overlay panels: dialogue box, shop, build menu + build bar, journal
 * (friends / bag / farm), pause, confirm, name prompt and the end-of-day
 * summary. While any panel is open the game loop idles (`ui.isOpen()`);
 * panel keys are captured before the game's input sees them.
 */

import { ITEMS } from "../data/items.js";
import { CROPS, SHOP_SEEDS } from "../data/crops.js";
import { STRUCTURES, BUILD_ORDER } from "../data/structures.js";
import { VILLAGERS, VILLAGER_IDS } from "../data/villagers.js";
import { HIDDEN } from "../world/map.js";
import { totalDays } from "../rules/crops.js";
import { hearts } from "../rules/relationships.js";
import { addItem, countItem } from "../rules/inventory.js";
import { seasonName, weekday } from "../rules/clock.js";
import { affordable } from "../rules/structures.js";
import { iconSvg } from "../art/icons.js";
import { portraitSvg } from "../art/person.js";
import { toSvg } from "../art/cozy-kit.js";
import { resolveObject } from "../art/index.js";
import { enterBuild, exitBuild, wallet } from "../build.js";
import { writeSave } from "../game.js";
import { toast } from "./hud.js";

/** Tiny element builder: h("div.card", { onclick }, child, "text"). */
export function h(sel, attrs = {}, ...kids) {
  const [tag, ...cls] = sel.split(".");
  const el = document.createElement(tag || "div");
  if (cls.length) el.className = cls.join(" ");
  for (const k in attrs) {
    const v = attrs[k];
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v;
    else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}

const heartRow = (n) => h("div.hearts", {}, Array.from({ length: 10 }, (_, i) => h(`span.heart${i < n ? ".on" : ""}`, { html: "&#9829;" })));

export function createUI(root) {
  const ui = { g: null, pointerOnUi: false, stack: [], typing: null, buildBarEl: null };
  let top = null; // { el, onKey, modal }

  function open(el, { onKey = null, closable = true, cls = "" } = {}) {
    close();
    const wrap = h(`div.overlay${cls ? "." + cls : ""}`, {}, el);
    root.append(wrap);
    top = { el: wrap, onKey, closable };
    requestAnimationFrame(() => wrap.classList.add("in"));
    return wrap;
  }

  function close() {
    if (!top) return;
    const el = top.el;
    top = null;
    clearInterval(ui.typing);
    el.remove();
  }

  addEventListener(
    "keydown",
    (e) => {
      if (!top || /^(INPUT|TEXTAREA)$/.test(e.target?.tagName) && e.code !== "Escape" && e.code !== "Enter") return;
      if (top.onKey && top.onKey(e) === true) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.code === "Escape" && top.closable) close();
      if (["Escape", "KeyE", "Space", "KeyJ", "KeyR", "KeyI", "Tab", "Enter"].includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );

  ui.isOpen = () => !!top;
  ui.close = close;

  // ── Dialogue ──
  ui.dialogue = (v, lines, onDone, event = false) => {
    const g = ui.g;
    let i = 0;
    const txt = h("p.say");
    const more = h("div.more", {}, "▼");
    const box = h(`div.dialogue${event ? ".event" : ""}`, {}, h("div.portrait", { html: portraitSvg(v.def.look) }), h("div.body", {}, h("div.name", {}, v.def.name, h("span.role", {}, v.def.role), heartRow(hearts(g.s.rel[v.id]))), txt, more));
    let full = "";
    let shown = 0;
    const show = () => {
      full = lines[i];
      shown = 0;
      txt.textContent = "";
      clearInterval(ui.typing);
      ui.typing = setInterval(() => {
        shown = Math.min(full.length, shown + 2);
        txt.textContent = full.slice(0, shown);
        if (shown >= full.length) clearInterval(ui.typing);
      }, 16);
    };
    const next = () => {
      if (shown < full.length) {
        shown = full.length;
        txt.textContent = full;
        clearInterval(ui.typing);
        return;
      }
      i++;
      if (i >= lines.length) {
        close();
        onDone?.();
      } else show();
    };
    box.addEventListener("click", next);
    open(box, { cls: "bottom", closable: false, onKey: (e) => (["KeyE", "Space", "Enter", "Escape"].includes(e.code) ? (next(), true) : false) });
    show();
  };

  // ── Confirm / name prompt ──
  ui.confirm = (text, yes, no, onYes) => {
    const box = h("div.panel.small", {}, h("p.big", {}, text), h("div.row", {}, h("button.btn.primary", { onclick: () => (close(), onYes()) }, yes), h("button.btn", { onclick: close }, no)));
    open(box, { onKey: (e) => (e.code === "Enter" || e.code === "KeyE" ? (close(), onYes(), true) : false) });
  };

  ui.askName = (text, placeholder, cb) => {
    const input = h("input.text", { maxlength: 14, placeholder, value: "" });
    const ok = () => {
      const v = input.value.trim() || placeholder;
      close();
      cb(v);
    };
    const box = h("div.panel.small", {}, h("p.big", {}, text), input, h("div.row", {}, h("button.btn.primary", { onclick: ok }, "That's the one!")));
    open(box, { onKey: (e) => (e.code === "Enter" ? (ok(), true) : false) });
    setTimeout(() => input.focus(), 50);
  };

  // ── Shop ──
  ui.shop = () => {
    const g = ui.g;
    const stock = [...SHOP_SEEDS[g.s.clock.season], "bread"];
    const gold = h("div.gold");
    const list = h("div.shoplist");
    const render = () => {
      gold.textContent = `${g.s.gold.toLocaleString()}g`;
      list.replaceChildren(
        ...stock.map((id) => {
          const it = ITEMS[id];
          const crop = it.crop && CROPS[it.crop];
          const buy = (n) => {
            if (g.s.gold < it.price * n) return toast(g, "Not enough gold.");
            if (addItem(g.s.inv, id, n) > 0) return toast(g, "Your bag is full!");
            g.s.gold -= it.price * n;
            toast(g, `Bought ${n} × ${it.name}`, id);
            render();
          };
          return h(
            "div.shopitem",
            {},
            h("div.ico", { html: iconSvg(id) }),
            h("div.info", {}, h("b", {}, it.name), h("small", {}, crop ? `${totalDays(crop)} days · ${crop.seasons.join(" & ")}${crop.regrow ? ` · regrows every ${crop.regrow}` : ""} · sells ${ITEMS[crop.produce].sell}g` : `Restores ${it.energy} energy`)),
            h("span.price", {}, `${it.price}g`),
            h("button.btn", { onclick: () => buy(1), disabled: g.s.gold < it.price }, "Buy"),
            h("button.btn", { onclick: () => buy(5), disabled: g.s.gold < it.price * 5 }, "×5"),
          );
        }),
      );
    };
    render();
    const box = h("div.panel.wide", {}, h("header", {}, h("h2", {}, "Mira's Bakery & Seeds"), gold), g.s.clock.season === 3 ? h("p.note", {}, "Nothing grows in winter — come back in spring for seeds!") : null, list, h("div.row", {}, h("button.btn", { onclick: close }, "Close")));
    open(box);
  };

  // ── Build ──
  ui.buildMenu = () => {
    const g = ui.g;
    const w = wallet(g);
    const cards = BUILD_ORDER.map((type) => {
      const d = STRUCTURES[type];
      const o = { kind: "structure", type, mask: 3 };
      resolveObject(o, g.s.clock.season);
      const cost = Object.entries(d.cost).map(([k, v]) => h(`span.cost${(w[k] ?? 0) >= v ? "" : ".short"}`, {}, `${v} ${k === "gold" ? "g" : k}`));
      const can = affordable(d.cost, w);
      return h(
        `div.buildcard${can ? "" : ".dim"}`,
        { onclick: () => (close(), enterBuild(g, type)) },
        h("div.prev", { html: toSvg(o.spr, "prev") }),
        h("b", {}, d.name),
        h("small", {}, d.desc),
        h("div.costs", {}, cost),
      );
    });
    const box = h(
      "div.panel.wide",
      {},
      h("header", {}, h("h2", {}, "Theo's Build Board"), h("div.gold", {}, `${g.s.gold.toLocaleString()}g · ${w.wood} wood · ${w.stone} stone`)),
      h("div.buildgrid", {}, cards),
      h("p.note", {}, "Chop trees and break rocks with the axe for wood and stone. In build mode: WASD pans, click places, right-click or Esc exits."),
      h("div.row", {}, h("button.btn", { onclick: () => (close(), enterBuild(g, "fence"), (g.build.mode = "move"), ui.buildBar(true)) }, "Move buildings"), h("button.btn", { onclick: () => (close(), enterBuild(g, "fence"), (g.build.mode = "remove"), ui.buildBar(true)) }, "Remove buildings"), h("button.btn", { onclick: close }, "Close")),
    );
    open(box);
  };

  ui.buildBar = (on) => {
    ui.buildBarEl?.remove();
    ui.buildBarEl = null;
    if (!on) return;
    const g = ui.g;
    const b = g.build;
    const bar = h("div.buildbar");
    const draw = () => {
      const w = wallet(g);
      const d = STRUCTURES[b.type];
      const btn = (mode, label) => h(`button.btn${b.mode === mode ? ".primary" : ""}`, { onclick: () => ((b.mode = mode), draw()) }, label);
      bar.replaceChildren(
        h("b", {}, b.mode === "place" ? `Placing: ${d.name}` : b.mode === "move" ? "Move: click a building" : "Remove: click a building (half refund)"),
        h("span.mats", {}, `${g.s.gold.toLocaleString()}g · ${w.wood} wood · ${w.stone} stone`),
        btn("place", "Place"),
        btn("move", "Move"),
        btn("remove", "Remove"),
        h("button.btn", { onclick: () => exitBuild(g) }, "Done"),
      );
    };
    draw();
    bar.addEventListener("pointerenter", () => (ui.pointerOnUi = true));
    bar.addEventListener("pointerleave", () => (ui.pointerOnUi = false));
    bar.refresh = draw;
    ui.buildBarEl = bar;
    root.append(bar);
    const tick = setInterval(() => (bar.isConnected ? draw() : clearInterval(tick)), 500);
  };

  // ── Journal ──
  ui.journal = (tab = "friends") => {
    const g = ui.g;
    const body = h("div.jbody");
    const tabs = h("div.tabs");
    let pick = -1;
    const show = (t) => {
      tab = t;
      tabs.replaceChildren(...[["friends", "Friends"], ["items", "Bag"], ["farm", "Farm"]].map(([id, label]) => h(`button.tab${id === t ? ".on" : ""}`, { onclick: () => show(id) }, label)));
      if (t === "friends") {
        body.replaceChildren(
          ...VILLAGER_IDS.map((id) => {
            const v = VILLAGERS[id];
            const r = g.s.rel[id];
            const d = g.s.clock;
            const idx = ((d.year - 1) * 4 + d.season) * 28 + d.day - 1;
            return h(
              "div.friend",
              {},
              h("div.portrait", { html: portraitSvg(v.look) }),
              h("div.info", {}, h("b", {}, v.name, h("span.role", {}, v.role)), heartRow(hearts(r)), h("small", {}, r.met ? `${r.talked === idx ? "✓ Chatted today" : "○ Not chatted today"} · ${r.gifted === idx ? "✓ Gift given" : "○ No gift yet"}` : "You haven't met yet."), h("div.likes", {}, "Loves: ", v.loves.map((it) => h("span.mini", { html: iconSvg(it), title: ITEMS[it].name })))),
            );
          }),
        );
      } else if (t === "items") {
        const grid = h("div.bag");
        const draw = () =>
          grid.replaceChildren(
            ...g.s.inv.map((s, i) =>
              h(
                `div.slot${i < 9 ? ".hot" : ""}${i === g.s.sel ? ".sel" : ""}${i === pick ? ".pick" : ""}`,
                {
                  title: s ? ITEMS[s.id].name : "",
                  onclick: () => {
                    if (pick < 0) pick = i;
                    else {
                      const a = g.s.inv[pick];
                      g.s.inv[pick] = g.s.inv[i];
                      g.s.inv[i] = a;
                      pick = -1;
                    }
                    draw();
                  },
                },
                s ? h("div.ico", { html: iconSvg(s.id) }) : null,
                s && s.n > 1 ? h("span.n", {}, s.n) : null,
              ),
            ),
          );
        draw();
        body.replaceChildren(grid, h("p.note", {}, "Click two slots to swap them. The top row is your hotbar (keys 1–9)."));
      } else {
        const found = HIDDEN.filter((x) => g.s.flags.found[x.id]).length;
        const c = g.s.clock;
        body.replaceChildren(
          h(
            "div.farmstats",
            {},
            h("div.stat", {}, h("small", {}, "Farm"), h("b", {}, g.s.profile.farm)),
            h("div.stat", {}, h("small", {}, "Date"), h("b", {}, `${weekday(c)} ${c.day} ${seasonName(c.season)}, Year ${c.year}`)),
            h("div.stat", {}, h("small", {}, "Gold earned"), h("b", {}, `${g.s.stats.earned.toLocaleString()}g`)),
            h("div.stat", {}, h("small", {}, g.s.profile.pet.name), h("b", {}, `Happiness ${g.s.pet.happy}%`)),
            h("div.stat", {}, h("small", {}, "Horse"), h("b", {}, g.s.horse.name || "Not named yet")),
            h("div.stat", {}, h("small", {}, "Secret places"), h("b", {}, `${found} / ${HIDDEN.length} found`)),
            h("div.stat", {}, h("small", {}, "Crops growing"), h("b", {}, Object.values(g.s.soil).filter((t) => t.crop && !t.crop.dead).length)),
            h("div.stat", {}, h("small", {}, "Wood · Stone"), h("b", {}, `${countItem(g.s.inv, "wood")} · ${countItem(g.s.inv, "stone")}`)),
          ),
        );
      }
    };
    show(tab);
    const box = h("div.panel.wide.journal", {}, h("header", {}, h("h2", {}, `${g.s.profile.name}'s Journal`), tabs), body, h("div.row", {}, h("button.btn", { onclick: close }, "Close")));
    open(box, { onKey: (e) => (e.code === "KeyJ" || e.code === "KeyR" || e.code === "KeyI" ? (close(), true) : false) });
  };

  // ── Pause ──
  ui.pause = () => {
    const g = ui.g;
    const keys = [
      ["WASD / Arrows", "Walk (ride with F)"],
      ["Space / Click", "Use tool or seeds"],
      ["E / Right-click", "Talk, gift, pet, ship, harvest"],
      ["F", "Mount / dismount the horse"],
      ["1–9 / Wheel", "Choose hotbar slot"],
      ["J · R · I", "Journal · Friends · Bag"],
      ["+ / −", "Zoom"],
      ["Esc", "Pause"],
    ];
    const box = h(
      "div.panel",
      {},
      h("h2", {}, "Paused"),
      h("div.controls", {}, keys.map(([k, d]) => h("div.ctl", {}, h("kbd", {}, k), h("span", {}, d)))),
      h("div.row", {}, h("button.btn.primary", { onclick: close }, "Resume"), h("button.btn", { onclick: () => (writeSave(g), toast(g, "Game saved."), close()) }, "Save"), h("button.btn", { onclick: () => (writeSave(g), close(), ui.onQuit?.()) }, "Save & Quit")),
    );
    open(box);
  };

  // ── Day summary ──
  ui.summary = (report, s, onContinue) => {
    const c = s.clock;
    const lines = report.lines.length
      ? report.lines.map((l) => h("div.line", {}, h("span.mini", { html: iconSvg(l.id) }), h("span", {}, `${ITEMS[l.id].name} × ${l.n}`), h("b", {}, `${l.sum}g`)))
      : [h("p.note", {}, "Nothing shipped today.")];
    const wx = { sun: "Sunny", rain: "Rainy — crops water themselves", snow: "Snowy" }[s.weather];
    const box = h(
      "div.panel.summary",
      {},
      h("h2", {}, report.passedOut ? "You passed out..." : "Sweet dreams"),
      report.passedOut ? h("p.note", {}, `Someone carried you home. The clinic fee was ${report.penalty}g.`) : null,
      h("div.shipped", {}, lines),
      h("div.total", {}, h("span", {}, "Earned"), h("b", {}, `+${report.total}g`)),
      report.seasonChanged ? h("p.season", {}, `${seasonName(c.season)} has arrived!${report.withered ? ` ${report.withered} out-of-season crop${report.withered > 1 ? "s" : ""} withered.` : ""}`) : null,
      h("p.note", {}, `${weekday(c)} ${c.day}, ${seasonName(c.season)} · ${wx}`),
      h("div.row", {}, h("button.btn.primary", { onclick: () => (close(), onContinue()) }, "Good morning!")),
    );
    open(box, { closable: false, onKey: (e) => (e.code === "Enter" || e.code === "Space" || e.code === "KeyE" ? (close(), onContinue(), true) : false) });
  };

  return ui;
}
