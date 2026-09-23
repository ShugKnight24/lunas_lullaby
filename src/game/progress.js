/**
 * Player progress side effects: the new-game intro, skill XP with level-up
 * toasts, and tutorial steps with their completion reward. Actions call
 * `award` and `progress`; the pure rules live in rules/skills.js and
 * rules/tutorial.js.
 */

import { ITEMS } from "./data/items.js";
import { TUTORIAL, TUTORIAL_REWARD } from "./data/tutorial.js";
import { INTRO } from "./data/dialogue.js";
import { fillLine } from "./rules/dialogue.js";
import { gainXp, skillLevel, SKILL_NAMES, PROFESSIONS, pendingProfessions } from "./rules/skills.js";
import { tutorialEvent } from "./rules/tutorial.js";
import { addItem } from "./rules/inventory.js";
import { burst, FXK } from "./world/weather.js";
import { toast } from "./ui/hud.js";

export const level = (g, id) => skillLevel(g.s.skills[id]);

// ── Intro ──
/** Queue the intro if this save hasn't seen it (it starts once play settles). */
export function queueIntro(g) {
  g.introT = g.s.flags.intro ? 0 : 1;
}

export function updateIntro(g, dt) {
  if (!(g.introT > 0) || g.s.flags.intro || g.mode !== "play" || g.ui.isOpen()) return;
  g.introT -= dt;
  if (g.introT <= 0) playIntro(g);
}

/** Rowan's letter, then Mira walks up to say hello and heads back to town. */
function playIntro(g) {
  const s = g.s;
  const vars = { name: s.profile.name, farm: s.profile.farm, pet: s.profile.pet.name };
  g.ui.letter(INTRO.letter.map((l) => fillLine(l, vars)), () => {
    const v = g.villagers.find((x) => x.id === "mira");
    Object.assign(v, { level: g.lv.id, x: g.player.x + 44, y: g.player.y + 4, dir: "left", path: null, hop: null, pause: 999 });
    g.player.dir = "right";
    s.rel.mira.met = true;
    g.ui.dialogue(v, INTRO.mira.map((l) => fillLine(l, vars)), () => {
      v.pause = 1.2;
      s.flags.intro = true;
      g.tutFlash = 1.2;
    });
  });
}

/** Offer a profession choice for any skill that reached level 5 without one. */
export function updateProfessions(g) {
  if (g.mode !== "play" || g.ui.isOpen()) return;
  const id = pendingProfessions(g.s.skills, g.s.professions)[0];
  if (!id) return;
  g.ui.chooseProfession(SKILL_NAMES[id], PROFESSIONS[id], (choice) => {
    g.s.professions = { ...g.s.professions, [id]: choice };
    const p = PROFESSIONS[id].find((x) => x.id === choice);
    toast(g, `You're now a ${p.name}! ${p.desc}`);
  });
}

export function award(g, id, xp) {
  const r = gainXp(g.s.skills, id, xp);
  g.s.skills = r.skills;
  if (!r.levelUp) return;
  toast(g, `${SKILL_NAMES[id]} reached level ${r.levelUp}!`);
  burst(FXK.SPARK, g.player.x, g.player.y - 50, 14, 90, 1, "#fff2a0");
  g.levelUp = { id, level: r.levelUp, t: 3 };
}

/** Report a tutorial event; completes the current step if it matches. */
export function progress(g, event) {
  const r = tutorialEvent(g.s.tutorial, TUTORIAL, event);
  if (r.tut === g.s.tutorial) return;
  g.s.tutorial = r.tut;
  g.tutFlash = 1.2;
  if (!r.finished) return;
  for (const [id, n] of TUTORIAL_REWARD) addItem(g.s.inv, id, n);
  toast(g, `All set! Mira left you a gift: ${TUTORIAL_REWARD.map(([id, n]) => `${n} ${ITEMS[id].name}`).join(" & ")}.`, TUTORIAL_REWARD[0][0]);
}
