/**
 * DOM panels for the RPG side of the game: every shop (with selling at
 * Pip's), the notice board, the Farm Stand, and the journal's Quests,
 * Careers and Companion pages. Installed onto the UI by panels.js.
 */

import { ITEMS } from "../data/items.js";
import { CROPS, SHOP_SEEDS } from "../data/crops.js";
import { QUESTS } from "../data/quests.js";
import { VILLAGERS } from "../data/villagers.js";
import { totalDays } from "../rules/crops.js";
import { addItem, countItem } from "../rules/inventory.js";
import { sellPrice, qualityName } from "../rules/quality.js";
import { sellMult, has } from "../rules/skills.js";
import { goalProgress, isReady } from "../rules/quests.js";
import { careerSheet, careerMult, careerRank, STAND_CAP, STAND_MARKUP } from "../rules/careers.js";
import { petMaxHp, PET_LEVEL_XP, PET_MAX_LEVEL, PET_PERKS, PET_HUNGRY } from "../rules/combat.js";
import { iconSvg } from "../art/icons.js";
import { petSprite } from "../art/animals.js";
import { toSvg } from "../art/cozy-kit.js";
import { defOf, playerMaxHp, playerStats, wear, takeOff, playerLook } from "../combat.js";
import { SLOTS, SLOT_NAMES, ATTRS, ATTR_INFO, pointsFree, spendPoint, compare, canWear } from "../rules/equipment.js";
import { skillProgress } from "../rules/skills.js";
import { portraitSvg } from "../art/person.js";
import { boardJobs, takeJob, collectJob, rewardLine } from "../quests.js";
import { refreshStand } from "../actions.js";
import { sfx } from "../audio/sfx.js";
import { COOKING, BUFFS } from "../data/cooking.js";
import { cook, shortOf, have } from "../rules/cooking.js";
import { questEvent, buffNow } from "../combat.js";
import { award, diary } from "../progress.js";
import { toast } from "./hud.js";

/** Who sells what; `stock(g)` can hide items until a career rank, `sell` adds Pip's buy tab. */
export const SHOPS = {
  mira: { title: "Mira's Bakery & Seeds", stock: (g) => [...SHOP_SEEDS[g.s.clock.season], "fertilizer", "deluxe_fertilizer", "hay", "bread"], note: (g) => (g.s.clock.season === 3 ? "Only Moonbloom braves the frost. Snow won't water it for you!" : null) },
  pip: { title: "Pip's General Store", stock: () => ["pet_treat", "squeaky_ball", "healing_salve", "trail_jerky", "bait", "hay", "farm_stand"], sell: true, note: () => "Pip buys almost anything, paid on the spot. A Farm Stand of your own sells overnight at a markup." },
  hazel: { title: "Warden's Lodge", stock: (g) => ["healing_salve", "trail_jerky", "pet_treat", "rusty_sword", "leather_cap", "padded_vest", "sturdy_boots", ...(careerRank(g.s, "adventurer") >= 2 ? ["steel_sword"] : [])], note: (g) => (careerRank(g.s, "adventurer") < 2 ? "Reach Silver Warden (8 guild points) and Hazel will sell you steel. Craft better gear from Wildwood loot (Craft tab)." : "Craft better gear from Wildwood loot (Craft tab).") },
  dale: { title: "Hawthorn Ranch", stock: () => ["milk", "cheese", "wool", "hay"], note: () => "Honest prices, honest goods. — Dale" },
  willow: { title: "Willow's Orchard Stall", stock: () => ["apple", "honey"], note: () => "Pick-your-own is free; the honey is not. — W." },
};

/** Price Pip pays right now: the shipping price with your professions and ranks. */
export const pipPrice = (g, id, q) => Math.round(sellPrice(ITEMS[id].sell ?? 0, q) * sellMult(g.s.professions, id, ITEMS[id]) * careerMult(g.s, id, ITEMS[id]));
const sellable = (id) => {
  const it = ITEMS[id];
  return it.sell > 0 && it.kind !== "tool" && it.kind !== "weapon";
};

const pct = (x) => `${x > 0 ? "+" : ""}${x}%`;
const plus = (x) => `${x > 0 ? "+" : ""}${x}`;

export function installRpgPanels(ui, { h, open, close }) {
  // ── The hearth: cooking ──
  ui.cook = () => {
    const g = ui.g;
    const list = h("div.shoplist");
    const label = (key) => (key.startsWith("kind:") ? `Any ${key.slice(5)}` : ITEMS[key].name);
    const render = () =>
      list.replaceChildren(
        ...COOKING.map((r) => {
          const it = ITEMS[r.out];
          const b = BUFFS[it.buff];
          const short = shortOf(r, g.s.inv, ITEMS);
          const make = () => {
            const res = cook(r, g.s.inv, ITEMS);
            if (res.error) return toast(g, res.error);
            sfx(g, "craft");
            award(g, "farming", 12);
            questEvent(g, { act: "cook" });
            if (!g.s.stats.cooked?.[r.out]) diary(g, `Cooked ${it.name} for the first time.`, "farm");
            g.s.stats.cooked = { ...g.s.stats.cooked, [r.out]: (g.s.stats.cooked?.[r.out] ?? 0) + 1 };
            toast(g, `Cooked ${it.name}!`, r.out);
            render();
          };
          return h(
            "div.shopitem",
            {},
            h("div.ico", { html: iconSvg(r.out) }),
            h(
              "div.info",
              {},
              h("b", {}, it.name),
              h("small", {}, `${b.name}: ${b.desc.toLowerCase()} · +${it.energy} energy, +${it.hp} health`),
              h("div.needs", {}, Object.entries(r.in).map(([key, n]) => h(`span.need${short.some((m) => m.key === key) ? ".short" : ""}`, {}, `${label(key)} ${Math.min(have(g.s.inv, ITEMS, key), n)}/${n}`))),
            ),
            h("button.btn.primary", { onclick: make, disabled: short.length > 0 }, "Cook"),
          );
        }),
      );
    render();
    const active = buffNow(g);
    open(
      h(
        "div.panel.wide",
        {},
        h("header", {}, h("h2", {}, "The Hearth"), h("div.gold", {}, active ? `Today: ${active.name}` : "No dish eaten today")),
        h("p.note", {}, "A dish lasts all day. Eating another replaces it. Milk and cheese come from Dale's ranch, honey and apples from Willow."),
        list,
        h("div.row", {}, h("button.btn", { onclick: close }, "Close")),
      ),
    );
  };

  // ── Gear & stats (C) ──
  ui.character = () => {
    const g = ui.g;
    const body = h("div.gear");
    const draw = () => {
      const s = g.s;
      const st = playerStats(g);
      const w = ITEMS[s.equip.weapon];
      const free = pointsFree(s);
      const xp = skillProgress(s.skills.combat);
      const doll = h(
        "div.doll",
        {},
        h("div.me", { html: portraitSvg(playerLook(s)) }),
        SLOTS.map((slot) => {
          const id = s.equip[slot];
          return h(
            `button.gslot${id ? "" : ".empty"}`,
            { onclick: () => id && takeOff(g, slot) && draw(), "aria-label": id ? `Take off ${ITEMS[id].name}` : `${SLOT_NAMES[slot]}: empty`, title: id ? `${ITEMS[id].name} · click to take off` : "Empty" },
            id ? h("span.ico", { html: iconSvg(id) }) : null,
            h("small", {}, id ? ITEMS[id].name : SLOT_NAMES[slot]),
          );
        }),
      );
      const stat = (label, v) => h("div.statrow", {}, h("span", {}, label), h("b", {}, v));
      const sheet = h(
        "div.sheet",
        {},
        h("div.skillhead", {}, h("b", {}, `Combat level ${xp.level}`), h("span.lvl", {}, xp.need ? `${xp.into} / ${xp.need} XP` : "Max")),
        h("div.xpbar", { role: "progressbar", "aria-valuenow": xp.need ? Math.round((xp.into / xp.need) * 100) : 100, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": "Combat level progress" }, h("span", { style: `width:${xp.need ? Math.round((xp.into / xp.need) * 100) : 100}%` })),
        stat("Health", `${s.hp} / ${st.maxHp}`),
        stat("Attack", w ? `${w.dmg} + ${st.atk}` : `— (no weapon)`),
        stat("Defence", st.def),
        stat("Speed", pct(Math.round((st.spd - 1) * 100))),
        stat("Critical", `${Math.round(st.crit * 100)}%`),
        h("div.pointshead", {}, h("b", {}, "Stat points"), h(`span.points${free ? ".has" : ""}`, {}, free ? `${free} to spend` : "Level up Combat for more")),
        ATTRS.map((a) =>
          h(
            "div.attr",
            {},
            h("div", {}, h("b", {}, `${ATTR_INFO[a].name} ${s.attrs[a]}`), h("small", {}, ATTR_INFO[a].desc)),
            h("button.btn", { onclick: () => spend(a), disabled: !free, "aria-label": `Add a point to ${ATTR_INFO[a].name}` }, "+"),
          ),
        ),
      );
      const spend = (a) => {
        const r = spendPoint(g.s, a);
        if (r.error) return toast(g, r.error);
        g.s.attrs = r.attrs;
        sfx(g, "levelUp");
        draw();
      };
      const rows = [];
      s.inv.forEach((x, i) => {
        const it = x && ITEMS[x.id];
        if (!it?.slot) return;
        const d = compare(s, ITEMS, x.id, careerRank(s, "adventurer"));
        const deltas = [["dmg", "dmg", plus], ["maxHp", "health", plus], ["atk", "atk", plus], ["def", "def", plus], ["spd", "speed", pct], ["crit", "crit", pct]]
          .filter(([k]) => d[k])
          .map(([k, label, f]) => h(`span.delta${d[k] > 0 ? ".up" : ".down"}`, {}, `${f(d[k])} ${label}`));
        const ok = canWear(s, it);
        rows.push(
          h(
            "div.shopitem",
            {},
            h("div.ico", { html: iconSvg(x.id) }),
            h("div.info", {}, h("b", {}, it.name), h("small", {}, `${SLOT_NAMES[it.slot]}${it.lvl ? ` · Combat ${it.lvl}` : ""} · ${it.tip ?? ""}`), h("div.deltas", {}, deltas.length ? deltas : h("span.delta", {}, "no change"))),
            h("button.btn.primary", { onclick: () => wear(g, i) && draw(), disabled: !ok }, ok ? "Equip" : `Lv ${it.lvl}`),
          ),
        );
      });
      body.replaceChildren(h("div.gearcols", {}, doll, sheet), h("h3", {}, "Gear in your bag"), rows.length ? h("div.shoplist", {}, rows) : h("p.note", {}, "No spare gear. Hazel sells the basics; craft more from Wildwood loot in the Craft tab (K), and look in rare chests."));
    };
    draw();
    open(h("div.panel.wide.journal", {}, h("header", {}, h("h2", {}, `${g.s.profile.name}'s Gear`)), body, h("div.row", {}, h("button.btn", { onclick: close }, "Close"))), { onKey: (e) => (e.code === "KeyC" ? (close(), true) : false) });
  };

  // ── Shops ──
  ui.shop = (id = "mira") => {
    const g = ui.g;
    const shop = SHOPS[id];
    const gold = h("div.gold");
    const list = h("div.shoplist");
    let mode = "buy";
    const tabs = shop.sell ? h("div.tabs") : null;
    const render = () => {
      gold.textContent = `${g.s.gold.toLocaleString()}g`;
      tabs?.replaceChildren(...[["buy", "Buy"], ["sell", "Sell"]].map(([m, label]) => h(`button.tab${m === mode ? ".on" : ""}`, { onclick: () => ((mode = m), render()) }, label)));
      if (mode === "sell") return list.replaceChildren(...sellRows());
      list.replaceChildren(
        ...shop.stock(g).map((sid) => {
          const it = ITEMS[sid];
          const crop = it.crop && CROPS[it.crop];
          const buy = (n) => {
            if (g.s.gold < it.price * n) return toast(g, "Not enough gold.");
            if (addItem(g.s.inv, sid, n) > 0) return toast(g, "Your bag is full!");
            g.s.gold -= it.price * n;
            sfx(g, "coin");
            toast(g, `Bought ${n} × ${it.name}`, sid);
            render();
          };
          const info = crop
            ? `${totalDays(crop)} days · ${crop.seasons.join(" & ")}${crop.regrow ? ` · regrows every ${crop.regrow}` : ""} · sells ${ITEMS[crop.produce].sell}g`
            : it.kind === "weapon"
              ? `${it.dmg} damage · ${it.tip}`
              : it.energy || it.hp
                ? [it.energy ? `+${it.energy} energy` : "", it.hp ? `+${it.hp} health` : ""].filter(Boolean).join(" · ")
                : (it.tip ?? `Sells for ${it.sell}g`);
          const one = it.kind === "weapon" || it.kind === "stand";
          return h(
            "div.shopitem",
            {},
            h("div.ico", { html: iconSvg(sid) }),
            h("div.info", {}, h("b", {}, it.name), h("small", {}, info)),
            h("span.price", {}, `${it.price}g`),
            h("button.btn", { onclick: () => buy(1), disabled: g.s.gold < it.price }, "Buy"),
            one ? h("span") : h("button.btn", { onclick: () => buy(5), disabled: g.s.gold < it.price * 5 }, "×5"),
          );
        }),
      );
    };
    const sellRows = () => {
      const rows = [];
      g.s.inv.forEach((s, i) => {
        if (!s || !sellable(s.id)) return;
        const each = pipPrice(g, s.id, s.q ?? 0);
        const sell = (n) => {
          const cur = g.s.inv[i];
          if (!cur) return;
          const k = Math.min(n, cur.n);
          cur.n -= k;
          if (!cur.n) g.s.inv[i] = null;
          g.s.gold += each * k;
          g.s.stats.earned += each * k;
          sfx(g, "coin");
          toast(g, `Sold ${k} × ${qualityName(ITEMS[s.id].name, s.q)} for ${each * k}g`, s.id);
          render();
        };
        rows.push(
          h(
            "div.shopitem",
            {},
            h("div.ico", { html: iconSvg(s.id) }),
            h("div.info", {}, h("b", {}, `${qualityName(ITEMS[s.id].name, s.q)} ×${s.n}`), h("small", {}, `${each}g each`)),
            h("span.price", {}, `${each * s.n}g`),
            h("button.btn", { onclick: () => sell(1) }, "Sell 1"),
            h("button.btn", { onclick: () => sell(s.n) }, "All"),
          ),
        );
      });
      return rows.length ? rows : [h("p.note", {}, "Nothing in your bag Pip can buy.")];
    };
    render();
    const note = shop.note(g);
    const box = h("div.panel.wide", {}, h("header", {}, h("h2", {}, shop.title), gold), tabs, note ? h("p.note", {}, note) : null, list, h("div.row", {}, h("button.btn", { onclick: close }, "Close")));
    open(box);
  };

  // ── Notice board ──
  ui.questBoard = () => {
    const g = ui.g;
    const list = h("div.shoplist");
    const render = () =>
      list.replaceChildren(
        ...boardJobs(g).map(({ id, def, st }) => {
          const gp = goalProgress(g.s.quests, id, def, (i) => countItem(g.s.inv, i))[0];
          const btn =
            st === "available"
              ? h("button.btn.primary", { onclick: () => (takeJob(g, id), render()) }, "Take")
              : st === "ready"
                ? h("button.btn.primary", { onclick: () => (collectJob(g, id), render()) }, "Collect")
                : h("button.btn", { disabled: true }, st === "done" ? "Done ✓" : `${gp.have}/${gp.need}`);
          return h("div.shopitem", {}, h("div.ico", { html: iconSvg(def.goals[0].bring ?? "guild_badge") }), h("div.info", {}, h("b", {}, def.title), h("small", {}, def.desc)), h("span.price", {}, `${def.reward.gold}g`), btn);
        }),
      );
    render();
    const box = h(
      "div.panel.wide",
      {},
      h("header", {}, h("h2", {}, "Notice Board"), h("div.gold", {}, `Guild points: ${g.s.guild ?? 0}`)),
      h("p.note", {}, "Fresh jobs every morning. Hunting jobs count creatures you defeat after taking them; delivery jobs take the items when you collect."),
      list,
      h("div.row", {}, h("button.btn", { onclick: close }, "Close")),
    );
    open(box);
  };

  // ── Farm Stand ──
  ui.stand = (st, o) => {
    const g = ui.g;
    const rank = careerRank(g.s, "merchant");
    const shelf = h("div.bag.stand");
    const bag = h("div.shoplist");
    const render = () => {
      shelf.replaceChildren(
        ...st.stock.map((x, i) =>
          h(
            `div.slot${x ? "" : ".empty"}`,
            {
              title: x ? `Take back ${ITEMS[x.id].name}` : "Empty",
              onclick: () => {
                if (!x) return;
                const left = addItem(g.s.inv, x.id, x.n, x.q ?? 0);
                if (left === x.n) return toast(g, "Your bag is full!");
                st.stock[i] = left ? { ...x, n: left } : null;
                refreshStand(g, o, st);
                render();
              },
            },
            x ? h("div.ico", { html: iconSvg(x.id) }) : null,
            x?.q ? h(`span.q.q${x.q}`, {}, "★") : null,
            x && x.n > 1 ? h("span.n", {}, x.n) : null,
          ),
        ),
      );
      const rows = [];
      g.s.inv.forEach((s, i) => {
        if (!s || !sellable(s.id)) return;
        const stock = (n) => {
          const cur = g.s.inv[i];
          if (!cur) return;
          let slot = st.stock.findIndex((x) => x && x.id === cur.id && (x.q ?? 0) === (cur.q ?? 0));
          if (slot < 0) slot = st.stock.findIndex((x) => !x);
          if (slot < 0) return toast(g, "The stand's shelves are full.");
          const k = Math.min(n, cur.n);
          st.stock[slot] = st.stock[slot] ? { ...st.stock[slot], n: st.stock[slot].n + k } : { id: cur.id, n: k, q: cur.q ?? 0 };
          cur.n -= k;
          if (!cur.n) g.s.inv[i] = null;
          refreshStand(g, o, st);
          render();
        };
        const each = Math.round(pipPrice(g, s.id, s.q ?? 0) / sellMult(g.s.professions, s.id, ITEMS[s.id]) * STAND_MARKUP[rank]);
        rows.push(h("div.shopitem", {}, h("div.ico", { html: iconSvg(s.id) }), h("div.info", {}, h("b", {}, `${qualityName(ITEMS[s.id].name, s.q)} ×${s.n}`), h("small", {}, `~${each}g each at the stand`)), h("button.btn", { onclick: () => stock(1) }, "Stock 1"), h("button.btn", { onclick: () => stock(s.n) }, "All")));
      });
      bag.replaceChildren(...(rows.length ? rows : [h("p.note", {}, "Nothing in your bag to sell.")]));
    };
    render();
    const box = h(
      "div.panel.wide",
      {},
      h("header", {}, h("h2", {}, "Your Farm Stand"), h("div.gold", {}, `${careerSheet(g.s).find((c) => c.id === "merchant").title}`)),
      h("p.note", {}, `Villagers buy up to ${STAND_CAP[rank]} items a night (fewer in the rain), paying ${Math.round((STAND_MARKUP[rank] - 1) * 100)}% over the shipping price. Click a shelf slot to take goods back.`),
      shelf,
      bag,
      h("div.row", {}, h("button.btn", { onclick: close }, "Close")),
    );
    open(box);
  };
}

// ── Journal pages ───────────────────────────────────────────────────────────

export function questsPage(g, h) {
  const count = (i) => countItem(g.s.inv, i);
  const act = Object.keys(g.s.quests.active);
  const done = Object.keys(g.s.quests.done).filter((id) => QUESTS[id]);
  const card = (id, finished) => {
    const def = defOf(id);
    const who = def.board ? "Notice board" : VILLAGERS[def.giver]?.name;
    const ready = !finished && isReady(g.s.quests, id, def, count);
    return h(
      `div.quest${finished ? ".done" : ready ? ".ready" : ""}`,
      {},
      h("div.qhead", {}, h("b", {}, `${finished ? "✓ " : ready ? "★ " : ""}${def.title}`), h("span.role", {}, who)),
      finished ? null : h("p", {}, def.desc),
      finished
        ? null
        : h(
            "div.goals",
            {},
            goalProgress(g.s.quests, id, def, count).map(({ goal, have, need }) =>
              h(`span.goal${have >= need ? ".met" : ""}`, {}, `${goalLabel(goal)} ${have}/${need}`),
            ),
          ),
      finished ? null : h("small", {}, ready ? `Done! Return to ${who}.` : rewardLine(def.reward)),
    );
  };
  return h(
    "div.quests",
    {},
    act.length ? act.map((id) => card(id, false)) : h("p.note", {}, "No quests yet. Hazel at the Warden's Lodge (east of Theo's) needs help, and the notice board in the plaza has daily jobs."),
    done.length ? h("h3", {}, "Completed") : null,
    done.map((id) => card(id, true)),
  );
}

/**
 * The quest shown on the HUD card: a finished one first (go hand it in),
 * else the story quest you're on. `key` changes whenever the card should.
 */
export function trackedQuest(g) {
  // Runs from the per-frame HUD sync: refresh four times a second, not every frame.
  if (g._trackS === g.s && g.time - (g._trackT ?? -1) < 0.25) return g._track;
  g._trackS = g.s;
  g._trackT = g.time;
  g._track = findTracked(g);
  return g._track;
}

function findTracked(g) {
  const count = (i) => countItem(g.s.inv, i);
  let best = null;
  for (const id in g.s.quests.active) {
    const def = defOf(id);
    if (!def) continue;
    const ready = isReady(g.s.quests, id, def, count);
    const rank = (ready ? 2 : 0) + (def.board ? 0 : 1);
    if (!best || rank > best.rank) best = { id, def, ready, rank };
  }
  if (!best) return null;
  const { id, def, ready } = best;
  const who = def.board ? "Notice board" : VILLAGERS[def.giver]?.name ?? "";
  const gp = goalProgress(g.s.quests, id, def, count);
  const goal = ready ? `Done! Return to ${who}.` : gp.map(({ goal, have, need }) => `${goalLabel(goal)} ${have}/${need}`).join(" · ");
  return { key: `${id}|${goal}`, title: def.title, who, goal };
}

const MON = { slime: "Slimes", boar: "Thornbacks", shroom: "Shroomlings", wisp: "Gloom Wisps", gloomroot: "The Gloomroot" };
const PLACE = { glade: "Find the Mossy Glade" };
const ACT = { harvest: "Harvest crops", build: "Build things", fish: "Catch fish", craft: "Craft things", cook: "Cook dishes" };
function goalLabel(goal) {
  if (goal.kill) return `Defeat ${MON[goal.kill]}`;
  if (goal.boss) return `Defeat ${MON[goal.boss]}`;
  if (goal.visit) return PLACE[goal.visit] ?? "Explore";
  if (goal.act) return ACT[goal.act];
  return ITEMS[goal.bring].name;
}

export function careersPage(g, h) {
  return h(
    "div.careers",
    {},
    h("p.note", {}, "Grow along any path you like. Each rank brings a small perk."),
    careerSheet(g.s).map((c) => {
      const pct = c.next ? Math.round(((c.value - c.from) / (c.next - c.from)) * 100) : 100;
      return h(
        "div.skill",
        {},
        h("div.skillhead", {}, h("b", {}, `${c.name} · ${c.title}`), h("span.lvl", {}, `Rank ${c.rank + 1} / 5`)),
        h("div.xpbar", { role: "progressbar", "aria-valuenow": Math.min(100, pct), "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": `${c.name} progress` }, h("span", { style: `width:${Math.min(100, pct)}%` })),
        h("small", {}, c.next ? `${c.value.toLocaleString()} / ${c.next.toLocaleString()} ${c.unit}` : "Top rank!"),
        h("small.perk", {}, c.perk),
      );
    }),
  );
}

export function companionPage(g, h) {
  const pet = g.s.profile.pet;
  const s = g.s.pet;
  const max = petMaxHp(s.lvl);
  const next = s.lvl < PET_MAX_LEVEL ? PET_LEVEL_XP[s.lvl - 1] : null;
  const bar = (label, v, m, cls = "") => h("div.skill", {}, h("div.skillhead", {}, h("b", {}, label), h("span.lvl", {}, `${v} / ${m}`)), h(`div.xpbar${cls}`, { role: "progressbar", "aria-valuenow": Math.round((v / m) * 100), "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": label }, h("span", { style: `width:${Math.round((v / m) * 100)}%` })));
  return h(
    "div",
    {},
    h("div.wishhead", {}, h("div.wishpet", { html: toSvg(petSprite(pet.kind, pet.coat, 3), "pet") }), h("div", {}, h("b", {}, `${pet.name} · Level ${s.lvl}`), h("p", {}, `${pet.name} fights beside you in the Wildwood and grows stronger with every creature you face together. ${s.full < PET_HUNGRY ? `${pet.name} is too hungry to fight! ` : ""}Hold food or a Companion Treat and press E by them to feed them.`))),
    h("div.skills", {}, bar("Health", s.hp, max, ".hp"), bar("Fullness", s.full, 100, ".full"), next ? bar("Experience", s.xp, next) : h("small", {}, "Max level!"), h("div.skill", {}, h("b", {}, "Your health"), h("small", {}, `${g.s.hp} / ${playerMaxHp(g)}. Sleep or eat to recover.`))),
    h("h3", {}, "Talents"),
    h("div.wishes", {}, PET_PERKS.map(([at, name, desc]) => h(`div.wish${s.lvl >= at ? ".done" : ""}`, {}, h("b", {}, `${s.lvl >= at ? "✦" : "✧"} ${name}`), h("small", {}, s.lvl >= at ? desc : `Level ${at}: ${desc}`)))),
    has(g.s.professions, "beastfriend") ? h("p.note", {}, "Beastfriend: bites harder and shrugs off half the damage.") : null,
  );
}
