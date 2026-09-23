/**
 * DOM overlay panels: dialogue box, letter, shop, build menu + build bar,
 * journal (friends / bag / craft / fish / skills / wishes / farm), dream
 * scenes, profession choice,
 * pause, confirm, name prompt and the end-of-day summary; plus the always-on HUD strip (Bag / Journal /
 * Menu buttons and the first-day task card). While any panel is open the game loop idles (`ui.isOpen()`);
 * panel keys are captured before the game's input sees them.
 */

import { ITEMS } from "../data/items.js";
import { CROPS, SHOP_SEEDS } from "../data/crops.js";
import { STRUCTURES, BUILD_ORDER } from "../data/structures.js";
import { VILLAGERS, VILLAGER_IDS } from "../data/villagers.js";
import { FISH, FISH_IDS } from "../data/fish.js";
import { HIDDEN } from "../world/map.js";
import { totalDays } from "../rules/crops.js";
import { hearts } from "../rules/relationships.js";
import { addItem, countItem } from "../rules/inventory.js";
import { seasonName, weekday } from "../rules/clock.js";
import { affordable } from "../rules/structures.js";
import { henHearts } from "../rules/animals.js";
import { SKILLS, SKILL_NAMES, PERKS, PROFESSIONS, skillProgress, skillLevel, MAX_LEVEL, XP } from "../rules/skills.js";
import { award } from "../progress.js";
import { sfx } from "../audio/sfx.js";
import { RECIPES } from "../data/recipes.js";
import { craft, missing, unlocked } from "../rules/crafting.js";
import { skipTutorial } from "../rules/tutorial.js";
import { TUTORIAL } from "../data/tutorial.js";
import { WISHES } from "../data/dreams.js";
import { fillLine } from "../rules/dialogue.js";
import { petSprite } from "../art/animals.js";
import { iconSvg } from "../art/icons.js";
import { qualityName } from "../rules/quality.js";
import { portraitSvg } from "../art/person.js";
import { toSvg } from "../art/cozy-kit.js";
import { resolveObject } from "../art/index.js";
import { enterBuild, exitBuild, wallet, costOf, canBuild } from "../build.js";
import { PAINTS } from "../data/structures.js";
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

/** Vague "where to look" line for a fish not caught yet. */
const hint = (f) => {
  const where = { river: "river", pond: "pond", pool: "a hidden pool" }[f.where[0]];
  const when = f.hours[0] >= 1080 ? " at night" : "";
  const wx = f.weather === "rain" ? " in the rain" : "";
  const season = f.seasons.length ? ` in ${f.seasons.join(" or ")}` : "";
  return `Try the ${where}${season}${when}${wx}`.replace("the a ", "a ");
};

const heartRow = (n) => h("div.hearts", {}, Array.from({ length: 10 }, (_, i) => h(`span.heart${i < n ? ".on" : ""}`, { html: "&#9829;" })));

export function createUI(root) {
  const ui = { g: null, stack: [], typing: null, buildBarEl: null };
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

  // ── HUD strip: Bag / Journal / Menu, and the first-day task card ──
  const count = h("span.count");
  const hudBtn = (label, key, onclick, extra) => h("button.hudbtn", { onclick, title: `${label} (${key})` }, h("span", {}, label), extra, h("kbd.key", {}, key));
  const task = h("div.task", { role: "status", "aria-live": "polite" });
  const strip = h(
    "div.hudstrip",
    {},
    h("div.hudbtns", {}, hudBtn("Bag", "I", () => ui.journal("items"), count), hudBtn("Craft", "K", () => ui.journal("craft")), hudBtn("Journal", "J", () => ui.journal("friends")), hudBtn("Menu", "Esc", () => ui.pause())),
    task,
  );
  root.append(strip);
  let hudKey = "";
  /** Refresh the strip when what it shows changes (called every frame). */
  ui.syncHud = (g) => {
    const s = g.s;
    const tut = s.tutorial;
    const showTask = g.mode !== "title" && s.flags.intro && !tut.done;
    const used = s.inv.filter(Boolean).length;
    const key = `${g.mode}|${used}|${showTask}|${tut.step}|${g.tutFlash > 0}`;
    if (key === hudKey) return;
    hudKey = key;
    strip.hidden = g.mode === "title" || g.mode === "build";
    count.textContent = `${used}/${s.inv.length}`;
    task.hidden = !showTask;
    task.classList.toggle("flash", g.tutFlash > 0);
    if (!showTask) return;
    const step = TUTORIAL[tut.step];
    task.replaceChildren(
      h("div.taskhead", {}, h("b", {}, "First day"), h("span", {}, `${tut.step + 1} / ${TUTORIAL.length}`)),
      h("div.taskbar", {}, h("span", { style: `width:${(tut.step / TUTORIAL.length) * 100}%` })),
      h("p", {}, step.text),
      h("small", {}, step.key),
    );
  };
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

  // ── Dream scene: starry overlay, one line at a time ──
  ui.dream = (lines, vars, last, onDone) => {
    let i = 0;
    const text = h("div.dreamline", { role: "status", "aria-live": "polite" });
    const btn = h("button.btn.dreambtn");
    const show = () => {
      const l = lines[i];
      text.replaceChildren(l.who === "pet" ? h("p.pet", {}, h("span.who", {}, vars.pet), fillLine(l.t, vars)) : h("p", {}, fillLine(l.t, vars)));
      text.classList.remove("in");
      void text.offsetWidth;
      text.classList.add("in");
      btn.textContent = i === lines.length - 1 ? last : "…";
    };
    const next = () => {
      if (++i < lines.length) return show();
      ui.dreaming = false;
      close();
      onDone?.();
    };
    btn.onclick = next;
    const box = h("div.dream", { onclick: (e) => e.target === btn || next() }, text, btn);
    ui.dreaming = true;
    const wrap = open(box, { cls: "dreamy", closable: false, onKey: (e) => (["Enter", "Space", "KeyE"].includes(e.code) ? (next(), true) : false) });
    wrap.prepend(h("div.dreammoon", { "aria-hidden": "true" }));
    show();
  };

  // ── Profession choice (level 5) ──
  ui.chooseProfession = (skillName, options, cb) => {
    const pick = (id) => (close(), cb(id));
    const box = h(
      "div.panel.small.profession",
      {},
      h("h2", {}, `${skillName} level 5!`),
      h("p", {}, "Choose a profession. This choice is for keeps."),
      h("div.profopts", {}, options.map((o) => h("button.profopt", { onclick: () => pick(o.id) }, h("b", {}, o.name), h("span", {}, o.desc)))),
    );
    open(box, { closable: false });
  };

  // ── Letter ──
  ui.letter = (paras, onDone) => {
    const done = () => (close(), onDone?.());
    const box = h(
      "div.panel.letter",
      {},
      paras.map((p) => h("p", {}, p)),
      h("div.row", {}, h("button.btn.primary", { onclick: done }, "Fold the letter")),
    );
    open(box, { closable: false, onKey: (e) => (["Enter", "Space", "KeyE", "Escape"].includes(e.code) ? (done(), true) : false) });
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
    const stock = [...SHOP_SEEDS[g.s.clock.season], "fertilizer", "deluxe_fertilizer", "hay", "bread"];
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
            h("div.info", {}, h("b", {}, it.name), h("small", {}, crop ? `${totalDays(crop)} days · ${crop.seasons.join(" & ")}${crop.regrow ? ` · regrows every ${crop.regrow}` : ""} · sells ${ITEMS[crop.produce].sell}g` : it.energy ? `Restores ${it.energy} energy` : it.tip)),
            h("span.price", {}, `${it.price}g`),
            h("button.btn", { onclick: () => buy(1), disabled: g.s.gold < it.price }, "Buy"),
            h("button.btn", { onclick: () => buy(5), disabled: g.s.gold < it.price * 5 }, "×5"),
          );
        }),
      );
    };
    render();
    const box = h("div.panel.wide", {}, h("header", {}, h("h2", {}, "Mira's Bakery & Seeds"), gold), g.s.clock.season === 3 ? h("p.note", {}, "Only Moonbloom braves the frost. Snow won't water it for you!") : null, list, h("div.row", {}, h("button.btn", { onclick: close }, "Close")));
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
      const known = canBuild(g, type);
      const c = costOf(g, type);
      const cost = Object.entries(c).map(([k, v]) => h(`span.cost${(w[k] ?? 0) >= v ? "" : ".short"}`, {}, `${v} ${k === "gold" ? "g" : k}`));
      const can = known && affordable(c, w);
      return h(
        `div.buildcard${can ? "" : ".dim"}${known ? "" : ".locked"}`,
        { onclick: () => (known ? (close(), enterBuild(g, type)) : toast(g, `Learn it at Building level ${d.level}.`)) },
        h("div.prev", { html: toSvg(o.spr, "prev") }),
        h("b", {}, d.name),
        h("small", {}, known ? d.desc : `Building level ${d.level}`),
        known ? h("div.costs", {}, cost) : null,
      );
    });
    const box = h(
      "div.panel.wide",
      {},
      h("header", {}, h("h2", {}, "Theo's Build Board"), h("div.gold", {}, `${g.s.gold.toLocaleString()}g · ${w.wood} wood · ${w.stone} stone · ${w.fiber} fiber`)),
      h("div.buildgrid", {}, cards),
      h("p.note", {}, "Building skill: every structure you put up teaches you more — new fences and decorations unlock, materials stretch further, and from level 6 you build it yourself with no gold fee. In build mode: WASD pans, click places, right-click or Esc exits."),
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
      const paints =
        b.mode === "place" && d.paint
          ? h(
              "div.paints",
              { role: "radiogroup", "aria-label": "Paint colour" },
              PAINTS.map((c) =>
                h(`button.paint${(b.color ?? null) === c ? ".on" : ""}`, { role: "radio", "aria-checked": (b.color ?? null) === c, "aria-label": c ? `Paint ${c}` : "Natural wood", title: c ? "Paint" : "Natural", style: c ? `--c:${c}` : "--c:#c98a4a", onclick: () => ((b.color = c), draw()) }),
              ),
            )
          : null;
      bar.replaceChildren(
        h("b", {}, b.mode === "place" ? `Placing: ${d.name}` : b.mode === "move" ? "Move: click a building" : "Remove: click a building (half refund)"),
        h("span.mats", {}, `${g.s.gold.toLocaleString()}g · ${w.wood} wood · ${w.stone} stone`),
        paints,
        btn("place", "Place"),
        btn("move", "Move"),
        btn("remove", "Remove"),
        h("button.btn", { onclick: () => exitBuild(g) }, "Done"),
      );
    };
    draw();
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
      tabs.replaceChildren(...[["friends", "Friends"], ["items", "Bag"], ["craft", "Craft"], ["fish", "Fish"], ["skills", "Skills"], ["wishes", "Wishes"], ["farm", "Farm"]].map(([id, label]) => h(`button.tab${id === t ? ".on" : ""}`, { onclick: () => show(id) }, label)));
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
                  title: s ? qualityName(ITEMS[s.id].name, s.q) : "",
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
                s?.q ? h(`span.q.q${s.q}`, {}, "★") : null,
                s && s.n > 1 ? h("span.n", {}, s.n) : null,
              ),
            ),
          );
        draw();
        body.replaceChildren(grid, h("p.note", {}, "Click two slots to swap them. The top row is your hotbar (keys 1–9)."));
      } else if (t === "wishes") {
        const pet = g.s.profile.pet;
        const vars = { pet: pet.name, name: g.s.profile.name };
        const done = WISHES.filter((w) => g.s.dreams[w.id]).length;
        body.replaceChildren(
          h("div.wishhead", {}, h("div.wishpet", { html: toSvg(petSprite(pet.kind, pet.coat, 3), "pet") }), h("div", {}, h("b", {}, `${pet.name}'s wish`), h("p", {}, `${pet.name} wants to see you live the life you dreamed of. ${done} of ${WISHES.length} have come true.`))),
          h(
            "div.wishes",
            {},
            WISHES.map((w) =>
              g.s.dreams[w.id]
                ? h("div.wish.done", {}, h("b", {}, `✦ ${w.title}`), h("p", {}, fillLine(w.line, vars)))
                : h("div.wish", {}, h("b", {}, `✧ ${w.title}`), h("small", {}, w.hint)),
            ),
          ),
        );
      } else if (t === "craft") {
        const levels = Object.fromEntries(SKILLS.map((id) => [id, skillLevel(g.s.skills[id])]));
        const draw = () =>
          body.replaceChildren(
            h(
              "div.recipes",
              {},
              RECIPES.map((r) => {
                const [out, n] = r.out;
                const known = unlocked(r, levels);
                const short = missing(r, g.s.inv);
                const make = () => {
                  const res = craft(r, g.s.inv, levels);
                  if (res.error) return toast(g, res.error);
                  sfx(g, "craft");
                  award(g, "building", XP.craft(r.in));
                  toast(g, `Crafted ${n > 1 ? `${n} × ` : ""}${ITEMS[out].name}`, out);
                  draw();
                };
                return h(
                  `div.recipe${known ? "" : ".locked"}`,
                  {},
                  h("div.ico", { html: iconSvg(out) }),
                  h(
                    "div.info",
                    {},
                    h("b", {}, `${ITEMS[out].name}${n > 1 ? ` ×${n}` : ""}`),
                    known
                      ? h("div.needs", {}, Object.entries(r.in).map(([id, k]) => h(`span.need${short.some((m) => m.id === id) ? ".short" : ""}`, { title: ITEMS[id].name }, h("span.mini", { html: iconSvg(id) }), `${countItem(g.s.inv, id)}/${k}`)))
                      : h("small", {}, `Learn at ${SKILL_NAMES[r.skill[0]]} level ${r.skill[1]}`),
                  ),
                  h("button.btn", { onclick: make, disabled: !known || short.length > 0 }, "Craft"),
                );
              }),
            ),
            h("p.note", {}, "New recipes unlock as your skills grow. Machines are placed on the farm from your hotbar."),
          );
        draw();
      } else if (t === "skills") {
        body.replaceChildren(
          h(
            "div.skills",
            {},
            SKILLS.map((id) => {
              const p = skillProgress(g.s.skills[id]);
              const pct = p.need ? Math.round((p.into / p.need) * 100) : 100;
              return h(
                "div.skill",
                {},
                h("div.skillhead", {}, h("b", {}, SKILL_NAMES[id]), h("span.lvl", {}, `Level ${p.level}${p.level >= MAX_LEVEL ? " · max" : ""}`)),
                h("div.xpbar", { role: "progressbar", "aria-valuenow": pct, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": `${SKILL_NAMES[id]} progress` }, h("span", { style: `width:${pct}%` })),
                h("small", {}, p.need ? `${p.into} / ${p.need} XP to level ${p.level + 1}` : "Mastered!"),
                h("small.perk", {}, `Each level: tools cost less energy. ${PERKS[id]}.`),
                g.s.professions[id]
                  ? h("small.prof", {}, `★ ${PROFESSIONS[id].find((p) => p.id === g.s.professions[id]).name}: ${PROFESSIONS[id].find((p) => p.id === g.s.professions[id]).desc}`)
                  : h("small", {}, "Choose a profession at level 5."),
              );
            }),
          ),
        );
      } else if (t === "fish") {
        const log = g.s.fishLog;
        const caught = FISH_IDS.filter((id) => log[id]).length;
        body.replaceChildren(
          h("p.note", {}, `${caught} / ${FISH_IDS.length} kinds caught. Different fish bite by water, season, time of day and weather.`),
          h(
            "div.fishlog",
            {},
            FISH_IDS.map((id) => {
              const e = log[id];
              const f = FISH[id];
              return h(
                `div.fishcard${e ? "" : ".unknown"}`,
                { title: e ? f.name : "Not caught yet" },
                h("div.ico", { html: iconSvg(id) }),
                h("b", {}, e ? f.name : "???"),
                h("small", {}, e ? `×${e.n}${e.best ? ` · best ${["", "silver", "gold"][e.best]}` : ""}` : hint(f)),
              );
            }),
          ),
        );
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
            ...g.s.structures.filter((st) => st.type === "coop").flatMap((st) => st.hens.map((hen) => h("div.stat", {}, h("small", {}, `Hen · ${hen.name}`), h("b", {}, "♥".repeat(henHearts(hen)) + "♡".repeat(5 - henHearts(hen)))))),
            h("div.stat", {}, h("small", {}, "Crops growing"), h("b", {}, Object.values(g.s.soil).filter((t) => t.crop && !t.crop.dead).length)),
            h("div.stat", {}, h("small", {}, "Wood · Stone"), h("b", {}, `${countItem(g.s.inv, "wood")} · ${countItem(g.s.inv, "stone")}`)),
          ),
        );
      }
    };
    show(tab);
    const box = h("div.panel.wide.journal", {}, h("header", {}, h("h2", {}, `${g.s.profile.name}'s Journal`), tabs), body, h("div.row", {}, h("button.btn", { onclick: close }, "Close")));
    open(box, { onKey: (e) => (e.code === "KeyJ" || e.code === "KeyR" || e.code === "KeyI" || e.code === "KeyK" ? (close(), true) : false) });
  };

  /** Volume sliders (saved per browser) and a mute toggle. */
  function volumes(a) {
    const slider = (key, label) => {
      const id = `vol-${key}`;
      return h(
        "div.vol",
        {},
        h("label", { for: id }, label),
        h("input", { id, type: "range", min: 0, max: 100, value: Math.round(a.settings[key] * 100), oninput: (e) => a.set(key, e.target.value / 100) }),
      );
    };
    const mute = h("input", { id: "vol-mute", type: "checkbox", checked: a.settings.muted, onchange: (e) => a.set("muted", e.target.checked) });
    return h("div.volumes", {}, h("h3", {}, "Sound"), slider("master", "Volume"), slider("music", "Music"), slider("sfx", "Sounds"), slider("ambience", "Ambience"), h("div.vol", {}, h("label", { for: "vol-mute" }, "Mute (M)"), mute));
  }

  // ── Pause ──
  ui.pause = () => {
    const g = ui.g;
    const keys = [
      ["WASD / Arrows", "Walk (ride with F)"],
      ["Space / Click", "Use tool or seeds"],
      ["E / Right-click", "Talk, gift, pet, ship, harvest"],
      ["F", "Mount / dismount the horse"],
      ["1–9 / Wheel", "Choose hotbar slot"],
      ["J · R · I · K", "Journal · Friends · Bag · Craft"],
      ["Shift · B", "Sprint · Ride the bike"],
      ["M · N", "Mute · Show/hide the map"],
      ["+ / −", "Zoom"],
      ["Esc", "Pause"],
    ];
    const box = h(
      "div.panel",
      {},
      h("h2", {}, "Paused"),
      h("div.controls", {}, keys.map(([k, d]) => h("div.ctl", {}, h("kbd", {}, k), h("span", {}, d)))),
      volumes(g.audio),
      h("div.row", {}, h("button.btn.primary", { onclick: close }, "Resume"), h("button.btn", { onclick: () => (writeSave(g), toast(g, "Game saved."), close()) }, "Save"), h("button.btn", { onclick: () => (writeSave(g), close(), ui.onQuit?.()) }, "Save & Quit")),
      g.s.tutorial.done ? null : h("div.row", {}, h("button.btn.link", { onclick: () => ((g.s.tutorial = skipTutorial(g.s.tutorial, TUTORIAL)), close()) }, "Skip the first-day tasks")),
    );
    open(box);
  };

  // ── Day summary ──
  ui.summary = (report, s, onContinue) => {
    const c = s.clock;
    const lines = report.lines.length
      ? report.lines.map((l) => h("div.line", {}, h("span.mini", { html: iconSvg(l.id) }), h("span", {}, `${qualityName(ITEMS[l.id].name, l.q)} × ${l.n}`), h("b", {}, `${l.sum}g`)))
      : [h("p.note", {}, "Nothing shipped today.")];
    const wx = { sun: "Sunny", rain: "Rainy — crops water themselves", snow: "Snowy" }[s.weather];
    const box = h(
      "div.panel.summary",
      {},
      h("h2", {}, report.passedOut ? "You passed out..." : "Sweet dreams"),
      report.passedOut ? h("p.note", {}, `Someone carried you home. The clinic fee was ${report.penalty}g.`) : null,
      h("div.shipped", {}, lines),
      h("div.total", {}, h("span", {}, "Earned"), h("b", {}, `+${report.total}g`)),
      report.eggs ? h("p.note", {}, `Your hens laid ${report.eggs} egg${report.eggs > 1 ? "s" : ""}.`) : null,
      ...(report.wishes ?? []).map((id) => {
        const w = WISHES.find((x) => x.id === id);
        return h("div.wishcard", {}, h("b", {}, `✦ ${s.profile.pet.name}'s wish came true: ${w.title}`), h("p", {}, fillLine(w.line, { pet: s.profile.pet.name, name: s.profile.name })));
      }),
      report.petDream ? h("p.note.petdream", {}, fillLine(report.petDream, { pet: s.profile.pet.name })) : null,
      report.seasonChanged ? h("p.season", {}, `${seasonName(c.season)} has arrived!${report.withered ? ` ${report.withered} out-of-season crop${report.withered > 1 ? "s" : ""} withered.` : ""}`) : null,
      h("p.note", {}, `${weekday(c)} ${c.day}, ${seasonName(c.season)} · ${wx}`),
      h("div.row", {}, h("button.btn.primary", { onclick: () => (close(), onContinue()) }, "Good morning!")),
    );
    open(box, { closable: false, onKey: (e) => (e.code === "Enter" || e.code === "Space" || e.code === "KeyE" ? (close(), onContinue(), true) : false) });
    if (report.wishes?.length) setTimeout(() => sfx(ui.g, "wish"), 400);
  };

  return ui;
}
