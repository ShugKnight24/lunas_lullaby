import { describe, it, expect } from "vitest";
import { WISHES, PROLOGUE, FINALE, PET_DREAMS } from "../../src/game/data/dreams.js";
import { newWishes, allWishes, petDream, wishContext } from "../../src/game/rules/dreams.js";
import { newState, DEFAULT_PROFILE, migrateSave } from "../../src/game/state.js";
import { PET_KINDS, petSprite, PET_COATS } from "../../src/game/art/animals.js";
import { readFileSync } from "node:fs";

const V1 = JSON.parse(readFileSync(new URL("../fixtures/save-v1.json", import.meta.url), "utf8"));

describe("companion", () => {
  it("Luna is the default companion", () => {
    expect(DEFAULT_PROFILE.pet).toMatchObject({ kind: "anatolian", name: "Luna" });
  });

  it("every companion kind draws all four frames", () => {
    expect(PET_KINDS).toEqual(["anatolian", "dog", "cat", "bird", "sawpup"]);
    for (const k of PET_KINDS) for (let f = 0; f < 4; f++) expect(petSprite(k, PET_COATS[k][0], f).layers.length).toBeGreaterThan(0);
  });

  it("an old Pochita companion becomes Sawyer (a custom name is kept)", () => {
    const withPet = (pet) => migrateSave({ ...structuredClone(V1), v: 7, profile: { ...V1.profile, pet } }).profile.pet;
    expect(withPet({ kind: "pochita", coat: "#f08a3a", name: "Pochita" })).toEqual({ kind: "sawpup", coat: "#f08a3a", name: "Sawyer" });
    expect(withPet({ kind: "pochita", coat: "#f08a3a", name: "Chompy" }).name).toBe("Chompy");
  });

  it("the story names the companion, never a fixed one", () => {
    for (const l of [...PROLOGUE, ...FINALE]) expect(l.t).not.toMatch(/Luna|Pochita/);
    expect(PROLOGUE.some((l) => l.who === "pet")).toBe(true);
  });
});

describe("wishes", () => {
  it("a fresh farm has none yet", () => {
    expect(newWishes(newState(), WISHES)).toEqual([]);
  });

  it("come true from the save's own progress, once", () => {
    const s = newState();
    s.stats.harvested.turnip = 3;
    s.rel.mira.pts = 350;
    s.fishLog = { moonfish: { n: 1, best: 0 } };
    expect(newWishes(s, WISHES)).toEqual(["first_harvest", "friend", "moonfish"]);
    s.dreams = { first_harvest: true, friend: true, moonfish: true };
    expect(newWishes(s, WISHES)).toEqual([]);
  });

  it("'Home' needs everyone at 4 hearts", () => {
    const s = newState();
    for (const id in s.rel) s.rel[id].pts = 400;
    expect(wishContext(s).minHearts).toBe(4);
    expect(newWishes(s, WISHES)).toContain("home");
    s.rel.bram.pts = 399;
    expect(newWishes(s, WISHES)).not.toContain("home");
  });

  it("the finale waits for every wish", () => {
    const all = Object.fromEntries(WISHES.map((w) => [w.id, true]));
    expect(allWishes(all, WISHES)).toBe(true);
    delete all.home;
    expect(allWishes(all, WISHES)).toBe(false);
  });

  it("nightly dreams only for a happy companion, some nights", () => {
    const nights = Array.from({ length: 40 }, (_, d) => petDream(d, 80, PET_DREAMS));
    expect(nights.filter(Boolean).length).toBeGreaterThan(5);
    expect(nights.filter(Boolean).length).toBeLessThan(35);
    expect(Array.from({ length: 40 }, (_, d) => petDream(d, 20, PET_DREAMS)).every((x) => x === null)).toBe(true);
  });

  it("old saves gain an empty wish list and harvest counts", () => {
    const s = migrateSave(structuredClone(V1));
    expect(s.dreams).toEqual({});
    expect(s.stats.harvested).toEqual({});
    expect(s.flags.finale).toBe(false);
    expect(s.profile.pet.name).toBe("Biscuit"); // an existing companion keeps their name
  });
});
