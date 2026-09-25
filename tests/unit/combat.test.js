import { describe, it, expect } from "vitest";
import { maxHp, swingDamage, inArc, rollDrops, petGainXp, feedPet, petNight, petCanFight, newPetStats, petMaxHp, faintPenalty, PET_HUNGRY } from "../../src/game/rules/combat.js";
import { MONSTERS } from "../../src/game/data/monsters.js";
import { ITEMS } from "../../src/game/data/items.js";

describe("player combat", () => {
  it("grows health with combat level and guild rank", () => {
    expect(maxHp(0, 0)).toBe(30);
    expect(maxHp(4, 2)).toBe(60);
  });

  it("swings for weapon damage plus attack, ±10%, crits and spins hit harder", () => {
    const w = { dmg: 10 };
    expect(swingDamage(w, 2, 0.5, 0.9).dmg).toBe(12);
    expect(swingDamage(w, 0, 0.5, 0.3, false, 0.5).crit).toBe(true);
    expect(swingDamage(w, 0, 0, 0.9).dmg).toBe(9);
    expect(swingDamage(w, 0, 0.5, 0.01)).toEqual({ dmg: 15, crit: true });
    expect(swingDamage(w, 0, 0.5, 0.9, true).dmg).toBe(20);
  });

  it("hits in front but not behind; the spin hits all round", () => {
    expect(inArc(0, 0, "right", 30, 5, 40)).toBe(true);
    expect(inArc(0, 0, "right", -30, 0, 40)).toBe(false);
    expect(inArc(0, 0, "right", -30, 0, 40, true)).toBe(true);
    expect(inArc(0, 0, "up", 0, -60, 40)).toBe(false);
  });

  it("rolls drops from the table", () => {
    expect(rollDrops(MONSTERS.slime, () => 0)).toEqual([["slime_gel", 1]]);
    expect(rollDrops(MONSTERS.slime, () => 0.99)).toEqual([]);
  });

  it("every drop and weapon is a real item", () => {
    for (const m of Object.values(MONSTERS)) for (const [id] of m.drops) expect(ITEMS[id], id).toBeTruthy();
    for (const id of ["rusty_sword", "steel_sword", "moon_blade"]) expect(ITEMS[id].kind).toBe("weapon");
  });

  it("fainting costs a tenth of your gold, 500 at most", () => {
    expect(faintPenalty(1000)).toBe(100);
    expect(faintPenalty(99999)).toBe(500);
  });
});

describe("companion", () => {
  it("levels up and heals fully on a level-up", () => {
    const pet = { ...newPetStats(), hp: 1 };
    const r = petGainXp(pet, 45);
    expect(r.levelUp).toBe(2);
    expect(r.pet.hp).toBe(petMaxHp(2));
  });

  it("treats heal fully; food heals by its energy", () => {
    const pet = { ...newPetStats(), hp: 5, full: 10 };
    expect(feedPet(pet, ITEMS.pet_treat).pet).toMatchObject({ hp: petMaxHp(1), full: 70 });
    expect(feedPet(pet, ITEMS.bread).pet.hp).toBe(25);
    expect(feedPet({ ...newPetStats(), full: 100 }, ITEMS.bread).error).toBe("full");
  });

  it("gets hungry overnight and won't fight on an empty belly", () => {
    const night = petNight({ ...newPetStats(), full: 40, hp: 0 });
    expect(night.full).toBe(5);
    expect(night.full < PET_HUNGRY && !petCanFight(night)).toBe(true);
  });
});
