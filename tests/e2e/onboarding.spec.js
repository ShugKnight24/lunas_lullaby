import { test, expect } from "@playwright/test";

test("a new game plays the intro, then the task card follows the first day", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => window.__game.newGame());

  // Rowan's letter, then Mira's welcome (six lines, E to advance past typing and each line).
  await expect(page.locator(".letter")).toContainText("Dear Luna");
  await page.getByRole("button", { name: "Fold the letter" }).click();
  await expect(page.locator(".dialogue")).toContainText("Mira");
  for (let i = 0; i < 12 && (await page.locator(".dialogue").count()); i++) await page.keyboard.press("KeyE");
  await expect(page.locator(".dialogue")).toHaveCount(0);
  expect(await page.evaluate(() => window.__game.state.flags.intro)).toBe(true);

  const task = page.locator(".task");
  await expect(task).toContainText("1 / 8");
  await expect(task).toContainText("Till a patch of soil");

  // Doing the steps out of order does nothing; in order, the card advances.
  await page.evaluate(() => {
    const G = window.__game;
    G.teleport(20, 24, "world", "right");
    G.selectItem("can");
    G.use();
  });
  await expect(task).toContainText("1 / 8");
  await page.evaluate(() => {
    const G = window.__game;
    G.selectItem("hoe");
    G.use();
  });
  await expect(task).toContainText("2 / 8");
  await expect(task).toContainText("Plant turnip seeds");

  // The Bag button opens the bag tab.
  await page.getByRole("button", { name: /Bag/ }).click();
  await expect(page.locator(".bag")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the farm well refills the watering can", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__game);
  const water = await page.evaluate(() => {
    const G = window.__game;
    G.newGame(undefined, { intro: false });
    G.state.water = 0;
    G.teleport(10, 18, "world", "up"); // just below the 2×2 well at (10,16)
    G.selectItem("can");
    G.use();
    return G.state.water;
  });
  expect(water).toBeGreaterThan(0);
});
