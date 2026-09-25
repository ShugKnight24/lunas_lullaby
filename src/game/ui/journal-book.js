/**
 * The journal as a bound book: chapter tabs down the fore-edge, a left
 * "chapter page" (title, a taped-in doodle, a few hand-written facts) and
 * the Diary, where the game records your adventures day by day and you
 * can add notes of your own. The right-hand pages come from panels.js.
 */

import { VILLAGERS, VILLAGER_IDS } from "../data/villagers.js";
import { WISHES } from "../data/dreams.js";
import { FISH_IDS } from "../data/fish.js";
import { hearts } from "../rules/relationships.js";
import { skillLevel, SKILL_NAMES } from "../rules/skills.js";
import { careerSheet } from "../rules/careers.js";
import { logByDay, dateOf, NOTE_MAX } from "../rules/log.js";
import { dayIndex } from "../rules/clock.js";
import { portraitSvg } from "../art/person.js";
import { petSprite } from "../art/animals.js";
import { iconSvg } from "../art/icons.js";
import { toSvg } from "../art/cozy-kit.js";
import { diary } from "../progress.js";
import { h } from "./panels.js";


const pet = (g, frame = 3) => toSvg(petSprite(g.s.profile.pet.kind, g.s.profile.pet.coat, frame), "doodle");
const me = (g) => portraitSvg({ ...g.s.profile.look, gear: g.s.equip }, "doodle");
const icon = (id) => iconSvg(id);

/** Chapters in book order: tab label and ink, the chapter page's title, facts and doodle. */
export function chaptersFor(g) {
  const s = g.s;
  const met = VILLAGER_IDS.filter((id) => s.rel[id].met);
  const best = [...met].sort((a, b) => s.rel[b].pts - s.rel[a].pts)[0];
  const quests = Object.keys(s.quests.active).length;
  const fish = FISH_IDS.filter((id) => s.fishLog[id]).length;
  const wishes = WISHES.filter((w) => s.dreams[w.id]).length;
  const used = s.inv.filter(Boolean).length;
  const top = careerSheet(s).sort((a, b) => b.rank - a.rank)[0];
  const skills = Object.entries(s.skills).map(([id, xp]) => [id, skillLevel(xp)]).sort((a, b) => b[1] - a[1])[0];
  const today = dayIndex(s.clock);
  return [
    { id: "diary", label: "Diary", color: "#e8566a", title: `${s.profile.name}'s Diary`, facts: [dateOf(today), `${s.log?.length ?? 0} things worth remembering`], doodle: me(g) },
    { id: "quests", label: "Quests", color: "#e89a3a", title: "Errands & Quests", facts: [quests ? `${quests} underway` : "Nothing underway", `${s.guild ?? 0} guild points`], doodle: icon("guild_badge") },
    { id: "friends", label: "Friends", color: "#d8708a", title: "Friends in Town", facts: [`${met.length} of ${VILLAGER_IDS.length} neighbours met`, best ? `Closest: ${VILLAGERS[best].name} (${hearts(s.rel[best])} ♥)` : "Say hello around town"], doodle: best ? portraitSvg(VILLAGERS[best].look, "doodle") : me(g) },
    { id: "items", label: "Bag", color: "#8a6ab0", title: "What I'm Carrying", facts: [`${used} of ${s.inv.length} pockets used`, `${s.gold.toLocaleString()}g in my purse`], doodle: icon(s.inv.find(Boolean)?.id ?? "hay") },
    { id: "craft", label: "Craft", color: "#6a9ac8", title: "Recipes & Patterns", facts: ["Pressed flowers and scribbled plans", "New ones as my skills grow"], doodle: icon("preserves_jar") },
    { id: "pet", label: s.profile.pet.name, color: "#c89a5a", title: `${s.profile.pet.name}, my partner`, facts: [`Level ${s.pet.lvl}`, `${s.pet.hp > 0 ? "Healthy" : "Hurt"} · ${s.pet.full >= 60 ? "well fed" : s.pet.full >= 20 ? "a bit peckish" : "hungry"}`], doodle: pet(g, 0) },
    { id: "skills", label: "Skills", color: "#5aa878", title: "What I've Learned", facts: [`Best at ${SKILL_NAMES[skills[0]].toLowerCase()} (level ${skills[1]})`, "Every level makes work lighter"], doodle: me(g) },
    { id: "careers", label: "Careers", color: "#b8864a", title: "Paths I Could Take", facts: [`Mostly a ${top.title.toLowerCase()}`, "Five roads, five ranks each"], doodle: icon("farm_stand") },
    { id: "fish", label: "Fish", color: "#4a9ab8", title: "Fish I've Caught", facts: [`${fish} of ${FISH_IDS.length} kinds`, "Water, season, hour, weather"], doodle: icon(FISH_IDS.find((id) => s.fishLog[id]) ?? "trout") },
    { id: "wishes", label: "Wishes", color: "#9a7ad8", title: `${s.profile.pet.name}'s Wishes`, facts: [`${wishes} of ${WISHES.length} come true`, "Some nights, a dream"], doodle: pet(g, 3) },
    { id: "farm", label: "Farm", color: "#7aa84a", title: s.profile.farm, facts: [dateOf(today), `${s.stats.earned.toLocaleString()}g earned so far`], doodle: icon("turnip") },
  ];
}

/** The left-hand page: a chapter's title, a taped-in doodle and a couple of hand-written facts. */
export function chapterPage(g, ch) {
  return h(
    "div.chapter",
    {},
    h("h2.hand", {}, ch.title),
    h("figure.taped", { html: ch.doodle }),
    h("ul.facts", {}, ch.facts.map((f) => h("li", {}, f))),
  );
}

const MARK = { quest: "✦", place: "✧", level: "▲", pet: "♥", fight: "⚔", fish: "≈", friend: "♥", wish: "☾", farm: "✿", season: "❀", note: "✎", event: "•" };

/** Diary: today's note box, then every day with entries, newest first. */
export function diaryPage(g, refresh) {
  const input = h("textarea.note", { maxlength: NOTE_MAX, rows: 2, placeholder: "Write something about today…", "aria-label": "Your note for today" });
  const add = () => {
    const t = input.value.trim();
    if (!t) return input.focus();
    diary(g, t, "note");
    refresh();
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) (e.preventDefault(), add());
  });
  const days = logByDay(g.s.log ?? []);
  return h(
    "div.diary",
    {},
    h("div.write", {}, input, h("button.btn", { onclick: add }, "Add to today")),
    days.length ? null : h("p.hand.empty", {}, "Nothing written yet. Go and do something wonderful."),
    days.map(({ d, entries }) =>
      h(
        "article.day",
        {},
        h("h3.hand", {}, dateOf(d)),
        h("ul", {}, entries.map((e) => h(`li.${e.k === "note" ? "mine" : "auto"}`, {}, h("span.mark", { "aria-hidden": "true" }, MARK[e.k] ?? "•"), h("span", {}, e.t)))),
      ),
    ),
  );
}
