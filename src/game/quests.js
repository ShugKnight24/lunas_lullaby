/**
 * Quests at runtime: villagers offer them in conversation, you accept,
 * progress comes from game events (combat.js questEvent), and you turn them
 * in with the giver, or at the notice board for board jobs.
 */

import { QUESTS, BOARD_SIZE } from "./data/quests.js";
import { ITEMS } from "./data/items.js";
import { VILLAGERS } from "./data/villagers.js";
import { status, accept, complete, isReady, boardIds } from "./rules/quests.js";
import { hearts, MAX_PTS } from "./rules/relationships.js";
import { countItem, addItem } from "./rules/inventory.js";
import { fillLine } from "./rules/dialogue.js";
import { dayIndex } from "./rules/clock.js";
import { defOf, autoWear } from "./combat.js";
import { award, diary } from "./progress.js";
import { burst, FXK } from "./world/weather.js";
import { sfx } from "./audio/sfx.js";
import { toast } from "./ui/hud.js";

const count = (g) => (id) => countItem(g.s.inv, id);
const vars = (g) => ({ name: g.s.profile.name, farm: g.s.profile.farm, pet: g.s.profile.pet.name });
const day = (g) => dayIndex(g.s.clock);
const ctx = (g) => ({ hearts: (id) => hearts(g.s.rel[id]) });

/** Story quests this villager gives, in table order. */
const questsOf = (id) => Object.keys(QUESTS).filter((q) => QUESTS[q].giver === id);

/**
 * Talking to a villager: turn in a finished quest, or offer the next one.
 * Returns true if it took over the conversation.
 */
export function questChat(g, v) {
  const rel = g.s.rel[v.id];
  if (!rel.met) return false;
  for (const id of questsOf(v.id)) {
    const def = QUESTS[id];
    if (g.s.quests.active[id] && isReady(g.s.quests, id, def, count(g))) {
      turnIn(g, id, def, v);
      return true;
    }
  }
  for (const id of questsOf(v.id)) {
    const def = QUESTS[id];
    if (status(g.s.quests, id, def, ctx(g)) !== "available") continue;
    if (g.declined?.[id] === day(g)) continue;
    const lines = def.offer.map((l) => fillLine(l, vars(g)));
    g.ui.dialogue(v, lines, () =>
      g.ui.confirm(`${def.title}: ${def.desc}`, "I'll do it", "Not now", () => take(g, id, def)),
    );
    (g.declined ??= {})[id] = day(g);
    return true;
  }
  return false;
}

/** Accept a quest (story or board job). */
export function take(g, id, def) {
  g.s.quests = accept(g.s.quests, id, def);
  for (const [item, n] of def.gift ?? []) {
    addItem(g.s.inv, item, n);
    toast(g, `Received ${ITEMS[item].name}!`, item);
    autoWear(g, item);
  }
  sfx(g, "task");
  toast(g, `New quest: ${def.title}`, "guild_badge");
  diary(g, def.board ? `Took a job from the notice board: ${def.title}.` : `${VILLAGERS[def.giver]?.name ?? "Someone"} asked for my help: ${def.title}.`, "quest");
}

function turnIn(g, id, def, v) {
  const r = complete(g.s.quests, id, def, day(g));
  for (const [item, n] of r.take) takeItems(g, item, n);
  g.s.quests = r.qs;
  pay(g, def.reward, def.giver);
  diary(g, `Finished "${def.title}".`, "quest");
  sfx(g, "quest");
  burst(FXK.SPARK, g.player.x, g.player.y - 50, 16, 110, 1, "#fff2a0");
  const lines = [fillLine(def.thanks, vars(g)), rewardLine(def.reward)];
  if (v) g.ui.dialogue(v, lines);
  else toast(g, `${def.title} complete! ${rewardLine(def.reward)}`, "guild_badge");
}

function takeItems(g, id, n) {
  // Take the lowest quality first.
  for (let q = 0; q <= 2 && n > 0; q++) {
    for (let i = 0; i < g.s.inv.length && n > 0; i++) {
      const s = g.s.inv[i];
      if (!s || s.id !== id || (s.q ?? 0) !== q) continue;
      const k = Math.min(n, s.n);
      s.n -= k;
      n -= k;
      if (!s.n) g.s.inv[i] = null;
    }
  }
}

function pay(g, rw, giver) {
  if (rw.gold) g.s.gold += rw.gold;
  for (const [item, n] of rw.items ?? []) {
    if (addItem(g.s.inv, item, n) > 0) toast(g, "Your bag is full! Some rewards were lost.");
    else autoWear(g, item);
  }
  if (rw.guild) g.s.guild = (g.s.guild ?? 0) + rw.guild;
  for (const [skill, xp] of Object.entries(rw.xp ?? {})) award(g, skill, xp);
  if (rw.hearts && g.s.rel[giver]) g.s.rel[giver] = { ...g.s.rel[giver], pts: Math.min(MAX_PTS, g.s.rel[giver].pts + rw.hearts) };
}

export function rewardLine(rw) {
  const parts = [];
  if (rw.gold) parts.push(`${rw.gold}g`);
  for (const [item, n] of rw.items ?? []) parts.push(`${n > 1 ? `${n} × ` : ""}${ITEMS[item].name}`);
  if (rw.guild) parts.push(`${rw.guild} guild point${rw.guild > 1 ? "s" : ""}`);
  return `Reward: ${parts.join(", ")}.`;
}

// ── Notice board ────────────────────────────────────────────────────────────

/** Jobs on the board today plus older board jobs you're still working on. */
export function boardJobs(g) {
  const today = boardIds(day(g), BOARD_SIZE);
  const older = Object.keys(g.s.quests.active).filter((id) => defOf(id)?.board && !today.includes(id));
  return [...older, ...today].map((id) => {
    const def = defOf(id);
    const st = status(g.s.quests, id, def);
    const ready = st === "active" && isReady(g.s.quests, id, def, count(g));
    return { id, def, st: ready ? "ready" : st };
  });
}

export function takeJob(g, id) {
  take(g, id, defOf(id));
}

export function collectJob(g, id) {
  turnIn(g, id, defOf(id), null);
}
