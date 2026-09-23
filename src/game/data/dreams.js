/**
 * Your companion's story. The prologue plays before Rowan's letter; the
 * wishes are milestones your companion wants to see you reach (checked each
 * night), and the finale plays once every wish has come true. `{pet}` and
 * `{name}` are filled in; lines with `who: "pet"` are spoken by the companion.
 *
 * Luna's Lullaby is dedicated to Luna. She wanted to see the dream come true.
 */

export const PROLOGUE = [
  { t: "Somewhere between sleeping and waking, the stars are very close." },
  { t: "{pet} is here, curled up against you, warm as ever." },
  { who: "pet", t: "You always talked about it, you know. A little farm. Early mornings. Something growing." },
  { who: "pet", t: "I want to see it. I want to see you do it." },
  { who: "pet", t: "So go on. I'll be right beside you. Every step." },
  { t: "A lullaby hums somewhere far away... and morning comes." },
];

/**
 * `check(s, ctx)` gets the save state and `ctx` helpers: `fishKinds`,
 * `maxHearts`, `minHearts`, `maxSkill`.
 */
export const WISHES = [
  { id: "first_harvest", title: "Something growing", hint: "Harvest your first crop", line: "{pet} sniffed your very first harvest and sneezed. It grew. You grew it.", check: (s) => Object.keys(s.stats.harvested).length > 0 },
  { id: "friend", title: "A friend in town", hint: "Reach 3 hearts with anyone", line: "{pet} has noticed the way people in town wave at you now.", check: (s, c) => c.maxHearts >= 3 },
  { id: "good_season", title: "A good season", hint: "Earn 5,000g in total", line: "{pet} dreamed of a shipping bin so full the lid wouldn't close.", check: (s) => s.stats.earned >= 5000 },
  { id: "skilled", title: "Getting good at this", hint: "Reach level 5 in any skill", line: "{pet} watched you work today and thought: look how far you've come.", check: (s, c) => c.maxSkill >= 5 },
  { id: "fish_kinds", title: "By the water", hint: "Catch 8 kinds of fish", line: "{pet} sat with you at the water's edge all afternoon, perfectly content.", check: (s, c) => c.fishKinds >= 8 },
  { id: "moonbloom", title: "A flower for the moon", hint: "Harvest a Moonbloom", line: "{pet} stayed up with you under the winter moon to watch the Moonbloom open.", check: (s) => (s.stats.harvested.moonbloom ?? 0) > 0 },
  { id: "moonfish", title: "The glow in the pool", hint: "Catch the Moonfish", line: "{pet} saw the glow in the Moonlit Pool before you did. Of course.", check: (s) => !!s.fishLog.moonfish },
  { id: "home", title: "Home", hint: "Reach 4 hearts with everyone in town", line: "{pet} lies in the doorway at dusk, listening to the Hollow. It sounds like home now.", check: (s, c) => c.minHearts >= 4 },
];

export const FINALE = [
  { t: "The stars are close again." },
  { who: "pet", t: "Look at it, {name}. Look at everything you made." },
  { who: "pet", t: "This is what I wanted to see. You, happy. Home." },
  { who: "pet", t: "I'm not going anywhere. I'm in every sunrise over this field." },
  { t: "The whole Hollow is humming the lullaby now. You know all the words." },
];

/** Now and then, the day summary says what your companion dreamed of. */
export const PET_DREAMS = [
  "{pet} dreamed of chasing petals across the field.",
  "{pet} dreamed you were both napping in a patch of sun.",
  "{pet} dreamed of the moon, very close, humming softly.",
  "{pet} dreamed of tomorrow's adventures.",
  "{pet} dreamed of home, and woke up right there beside you.",
  "{pet} dreamed of the smell of rain on the soil.",
];
