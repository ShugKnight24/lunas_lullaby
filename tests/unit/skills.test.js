import { describe, it, expect } from "vitest";
import { skillLevel, skillProgress, gainXp, newSkills, toolEnergy, LEVEL_XP, MAX_LEVEL, XP, farmingBonus, fishingZone } from "../../src/game/rules/skills.js";
import { cropOdds } from "../../src/game/rules/quality.js";
import { barParams } from "../../src/game/rules/fishing.js";
import { petHen, newCoop, HEN_LOVE } from "../../src/game/rules/animals.js";
import { tutorialEvent, skipTutorial } from "../../src/game/rules/tutorial.js";
import { TUTORIAL } from "../../src/game/data/tutorial.js";

describe("skill levels", () => {
  it("levels up at each XP threshold and caps at 10", () => {
    expect(skillLevel(0)).toBe(0);
    expect(skillLevel(LEVEL_XP[0] - 1)).toBe(0);
    expect(skillLevel(LEVEL_XP[0])).toBe(1);
    expect(skillLevel(1e9)).toBe(MAX_LEVEL);
  });

  it("reports progress within the current level", () => {
    expect(skillProgress(150)).toEqual({ level: 1, into: 50, need: LEVEL_XP[1] - LEVEL_XP[0] });
    expect(skillProgress(1e9)).toMatchObject({ level: MAX_LEVEL, need: 0 });
  });

  it("gaining XP reports a level-up only when one happens", () => {
    let r = gainXp(newSkills(), "fishing", 60);
    expect(r).toMatchObject({ levelUp: 0, skills: { fishing: 60, farming: 0 } });
    r = gainXp(r.skills, "fishing", 60);
    expect(r.levelUp).toBe(1);
  });
});

describe("perks", () => {
  it("tools get cheaper with level but never free", () => {
    expect(toolEnergy(4, 0)).toBe(4);
    expect(toolEnergy(4, 10)).toBe(2);
    expect(toolEnergy(2, 10)).toBe(1);
    expect(toolEnergy(1, 10)).toBe(1);
  });

  it("farming raises crop odds, fishing widens the zone, ranching adds affection", () => {
    expect(cropOdds(0, false, farmingBonus(10))[1]).toBeGreaterThan(cropOdds(0, false)[1]);
    expect(barParams(0.5, fishingZone(10)).zoneW).toBeGreaterThan(barParams(0.5).zoneW);
    expect(petHen(newCoop(1).hens[0], 1, 30).gained).toBe(HEN_LOVE.pet + 30);
  });

  it("rarer work earns more XP", () => {
    expect(XP.harvest(280)).toBeGreaterThan(XP.harvest(40));
    expect(XP.catch(0.85, 0)).toBeGreaterThan(XP.catch(0.1, 0));
    expect(XP.catch(0.5, 2)).toBeGreaterThan(XP.catch(0.5, 0));
  });
});

describe("tutorial", () => {
  const start = { step: 0, done: false };

  it("only the current step's event advances it", () => {
    expect(tutorialEvent(start, TUTORIAL, "ship").tut).toBe(start);
    expect(tutorialEvent(start, TUTORIAL, "till").tut).toEqual({ step: 1, done: false });
  });

  it("finishes on the last step, then ignores events", () => {
    let tut = start;
    let finished = false;
    for (const s of TUTORIAL) ({ tut, finished } = tutorialEvent(tut, TUTORIAL, s.event));
    expect(finished).toBe(true);
    expect(tut.done).toBe(true);
    expect(tutorialEvent(tut, TUTORIAL, "till").tut).toBe(tut);
  });

  it("can be skipped", () => {
    expect(skipTutorial(start, TUTORIAL)).toEqual({ step: TUTORIAL.length, done: true });
  });
});
