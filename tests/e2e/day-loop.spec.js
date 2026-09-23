import { test, expect } from "@playwright/test";

/** A field tile on the farm with open ground to its right. */
const FIELD = { tx: 20, ty: 24 };

test("till, plant, water, sleep: the crop grows one day", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => window.__game);

  const soil = await page.evaluate(async ({ tx, ty }) => {
    const G = window.__game;
    const beat = () => new Promise((r) => setTimeout(r, 300));
    G.newGame();
    G.teleport(tx, ty, "world", "right");
    for (const id of ["hoe", "turnip_seed", "can"]) {
      if (G.selectItem(id) < 0) throw new Error(`missing ${id}`);
      G.use();
      await beat();
    }
    return Object.values(G.state.soil);
  }, FIELD);
  expect(soil).toEqual([{ watered: true, crop: { id: "turnip", days: 0, dead: false } }]);

  await page.evaluate(() => window.__game.sleep());
  await page.getByRole("button", { name: /good morning/i }).click();

  await expect.poll(() => page.evaluate(() => window.__game.state.clock.day)).toBe(2);
  const after = await page.evaluate(() => Object.values(window.__game.state.soil)[0]);
  expect(after).toMatchObject({ watered: false, crop: { id: "turnip", days: 1 } });
  expect(errors).toEqual([]);
});

test("a stocked coop lays eggs overnight and E collects them", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__game);

  const coop = await page.evaluate(() => {
    const G = window.__game;
    G.newGame();
    G.state.gold = 5000;
    G.give("wood", 60);
    G.give("stone", 30);
    G.give("hay", 10);
    G.give("fiber", 5);
    // First open 4×4 patch on the farm (coop footprint plus a row to stand on).
    const q = G.query();
    const free = (x, y) => q.buildable(x, y) && !q.blocked(x, y) && !q.tilled(x, y);
    for (let ty = 5; ty < 60; ty++)
      for (let tx = 3; tx < 30; tx++) {
        let ok = true;
        for (let y = 0; y < 4 && ok; y++) for (let x = 0; x < 4 && ok; x++) ok = free(tx + x, ty + y);
        if (ok && G.place("coop", tx, ty)) return { tx, ty };
      }
    return null;
  });
  expect(coop).not.toBeNull();

  const stocked = await page.evaluate(({ tx, ty }) => {
    const G = window.__game;
    G.teleport(tx + 1, ty + 3, "world", "up");
    for (const id of ["hay", "fiber"]) (G.selectItem(id), G.interact());
    return G.state.structures[0].hay;
  }, coop);
  expect(stocked).toBe(15);

  await page.evaluate(() => window.__game.sleep());
  await expect(page.locator(".summary")).toContainText("Your hens laid 2 eggs.");
  await page.getByRole("button", { name: /good morning/i }).click();

  const got = await page.evaluate(({ tx, ty }) => {
    const G = window.__game;
    G.teleport(tx + 1, ty + 3, "world", "up");
    G.interact();
    return { eggs: G.state.inv.find((x) => x?.id === "egg")?.n, coop: G.state.structures[0] };
  }, coop);
  expect(got).toMatchObject({ eggs: 2, coop: { hay: 13, eggs: [0, 0, 0] } });

  // Pat the first hen: once a day.
  const pats = await page.evaluate(() => {
    const G = window.__game;
    const c = G.g.chickens[0];
    Object.assign(G.g.pet, { x: 0, y: 0 }); // teleport parks the dog beside the hen
    const pat = () => {
      Object.assign(G.g.player, { x: c.x, y: c.y + 20, dir: "up" });
      G.interact();
      return G.state.structures[0].hens[0].love;
    };
    return [pat(), pat()];
  });
  expect(pats).toEqual([30, 30]);
});

test("fishing off the pier lands a gold fish and logs it", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__game);
  const fish = await page.evaluate(() => {
    const G = window.__game;
    G.newGame();
    G.setTime(600);
    G.teleport(87, 44, "world", "right");
    G.selectItem("rod");
    G.use();
    const f = G.g.fishing;
    f.wait = 0;
    return f.fish;
  });
  expect(["sunfish", "carp"]).toContain(fish);

  await page.waitForFunction(() => window.__game.g.fishing.phase === "bite");
  await page.keyboard.press("Space");
  await page.waitForFunction(() => window.__game.g.fishing.phase === "reel");
  await page.evaluate(() => {
    const f = window.__game.g.fishing;
    f.pos = f.zone + f.zoneW / 2;
    f.vel = 0;
  });
  await page.keyboard.press("Space");
  await page.waitForFunction(() => !window.__game.g.fishing.on);

  const got = await page.evaluate((id) => ({ slot: window.__game.state.inv.find((s) => s?.id === id), log: window.__game.state.fishLog }), fish);
  expect(got.slot).toEqual({ id: fish, n: 1, q: 2 });
  expect(got.log).toEqual({ [fish]: { n: 1, best: 2 } });
});
