import { test, expect } from "@playwright/test";

const boot = async (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => window.__game);
  return errors;
};

test("the forest arch leads into the Wildwood and back", async ({ page }) => {
  const errors = await boot(page);
  const inside = await page.evaluate(() => {
    const G = window.__game;
    G.newGame(undefined, { intro: false });
    G.teleport(52, 1, "world", "up");
    dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW" }));
    G.step(4);
    dispatchEvent(new KeyboardEvent("keyup", { code: "KeyW" }));
    G.step(90);
    return { level: G.g.lv.id, creatures: G.g.enemies.length };
  });
  expect(inside.level).toBe("wildwood");
  expect(inside.creatures).toBeGreaterThan(10);

  const back = await page.evaluate(() => {
    const G = window.__game;
    G.teleport(35, 59, "wildwood", "down");
    dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS" }));
    G.step(4);
    dispatchEvent(new KeyboardEvent("keyup", { code: "KeyS" }));
    G.step(90);
    return G.g.lv.id;
  });
  expect(back).toBe("world");
  expect(errors).toEqual([]);
});

test("a sword swing hurts a slime, and a kill drops loot and counts for Hazel's quest", async ({ page }) => {
  const errors = await boot(page);
  const r = await page.evaluate(() => {
    const G = window.__game;
    const g = G.g;
    G.newGame(undefined, { intro: false });
    g.s.quests.active.wild1 = { p: [0] };
    G.give("rusty_sword");
    G.equip("rusty_sword");
    G.teleport(35, 54, "wildwood", "up");
    G.step(2);
    G.clearEnemies();
    // Keep the companion out of it: the kill must be the sword's.
    g.s.pet.full = 0;
    const e = G.spawn("slime", 35, 53);
    e.hp = 1;
    G.attack();
    G.step(30);
    return { alive: e.alive, kills: g.s.stats.kills.slime, quest: g.s.quests.active.wild1.p[0], drops: g.drops.length + (g.s.gold > 500 ? 1 : 0), xp: g.s.skills.combat };
  });
  expect(r).toMatchObject({ alive: false, kills: 1, quest: 1 });
  expect(r.xp).toBeGreaterThan(0);
  expect(r.drops).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("fainting in the Wildwood wakes you at home with half health", async ({ page }) => {
  const errors = await boot(page);
  const r = await page.evaluate(() => {
    const G = window.__game;
    const g = G.g;
    G.newGame(undefined, { intro: false });
    g.s.gold = 1000;
    G.teleport(35, 54, "wildwood", "up");
    G.step(2);
    G.clearEnemies();
    g.s.hp = 1;
    const e = G.spawn("boar", 35, 54);
    e.state = "charge";
    e.t = 1;
    G.step(200);
    return { level: g.lv.id, hp: g.s.hp, gold: g.s.gold };
  });
  expect(r).toEqual({ level: "house", hp: 15, gold: 900 });
  await expect(page.locator(".dialogue")).toContainText("Hazel");
  expect(errors).toEqual([]);
});

test("a stocked Farm Stand sells overnight", async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate(() => {
    const G = window.__game;
    const g = G.g;
    G.newGame(undefined, { intro: false });
    const st = { uid: g.s.uid++, type: "farm_stand", tx: 4, ty: 40, stock: [{ id: "turnip", n: 10, q: 0 }, null, null, null, null, null] };
    g.s.structures.push(st);
    G.sleep();
  });
  await page.getByRole("button", { name: /good morning/i }).click();
  const r = await page.evaluate(() => ({ sales: window.__game.state.stats.standSales, left: window.__game.state.structures.find((s) => s.type === "farm_stand").stock[0]?.n }));
  expect(r.sales).toBeGreaterThan(0);
  expect(r.left).toBeLessThan(10);
  expect(errors).toEqual([]);
});

test("gear goes on from the gear screen and blunts a boar's charge", async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate(() => {
    const G = window.__game;
    G.newGame(undefined, { intro: false });
    G.give("padded_vest");
    G.give("leather_cap");
    G.g.ui.character();
  });
  for (const name of ["Padded Vest", "Leather Cap"]) await page.locator(".shopitem", { hasText: name }).getByRole("button", { name: "Equip" }).click();
  await expect(page.locator(".gslot", { hasText: "Padded Vest" })).toBeVisible();
  await page.keyboard.press("Escape");
  const took = await page.evaluate(() => {
    const G = window.__game;
    const g = G.g;
    G.teleport(35, 54, "wildwood", "up");
    G.step(2);
    G.clearEnemies();
    g.s.pet.full = 0;
    const hp = g.s.hp;
    const b = G.spawn("boar", 35, 54);
    b.state = "charge";
    b.t = 1;
    b.vx = b.vy = 0;
    G.step(3);
    return { took: hp - g.s.hp, equip: g.s.equip };
  });
  expect(took.equip).toMatchObject({ body: "padded_vest", head: "leather_cap" });
  expect(took.took).toBe(9); // a 12-damage charge through 3 defence
  expect(errors).toEqual([]);
});

test("fetch: throw the ball and your companion brings it back", async ({ page }) => {
  const errors = await boot(page);
  const r = await page.evaluate(() => {
    const G = window.__game;
    const g = G.g;
    G.newGame(undefined, { intro: false });
    G.teleport(20, 40, "world", "right");
    G.step(10);
    G.selectItem("squeaky_ball");
    G.use();
    const thrown = !g.s.inv.some((x) => x?.id === "squeaky_ball");
    G.step(600);
    return { thrown, back: g.s.inv.some((x) => x?.id === "squeaky_ball"), fetches: g.s.stats.fetches };
  });
  expect(r).toEqual({ thrown: true, back: true, fetches: 1 });
  expect(errors).toEqual([]);
});

test("a race counts down, runs the gates in order and pays out a medal", async ({ page }) => {
  const errors = await boot(page);
  const r = await page.evaluate(async () => {
    const { RACES } = await import("/src/game/data/races.js");
    const G = window.__game;
    const g = G.g;
    G.newGame(undefined, { intro: false });
    const race = RACES.hollow;
    G.teleport(race.flag.tx, race.flag.ty + 1, "world", "right");
    g.race = { id: "hollow", gate: 0, t: 0, count: 3 };
    G.step(190);
    // Skipping ahead to the last gate first doesn't count.
    G.teleport(...race.gates.at(-1), "world", "right");
    G.step(5);
    const skipped = g.race.gate;
    for (const [x, y] of [...race.gates, [race.flag.tx, race.flag.ty + 1]]) {
      G.teleport(x, y, "world", "right");
      G.step(5);
    }
    return { skipped, gold: g.s.gold, medal: g.s.stats.races.hollow.medal };
  });
  expect(r).toEqual({ skipped: 0, gold: 500 + 850, medal: 0 });
  expect(errors).toEqual([]);
});

test("the hearth cooks a dish, and eating it gives today's buff", async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate(() => {
    const G = window.__game;
    G.newGame(undefined, { intro: false });
    G.give("apple", 2);
    G.give("honey", 1);
    G.g.ui.cook();
  });
  await page.locator(".shopitem", { hasText: "Honey-glazed Apple" }).getByRole("button", { name: "Cook" }).click();
  await page.keyboard.press("Escape");
  const r = await page.evaluate(async () => {
    const { playerStats } = await import("/src/game/combat.js");
    const G = window.__game;
    G.selectItem("honey_apple");
    G.use();
    return { buff: G.g.s.buff?.id, spd: playerStats(G.g).spd };
  });
  expect(r.buff).toBe("swift");
  expect(r.spd).toBeCloseTo(1.15);
  expect(errors).toEqual([]);
});
