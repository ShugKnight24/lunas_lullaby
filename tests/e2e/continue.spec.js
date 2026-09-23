import { test, expect } from "@playwright/test";

test("a fresh visit shows no Continue button", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("luna_save"));
  await page.reload();
  await expect(page.getByRole("button", { name: "New Game" })).toBeVisible();
  await expect(page.locator(".btn.continue")).toHaveCount(0);
});

test("reloading mid-day keeps progress, and Continue resumes it", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => {
    const G = window.__game;
    G.newGame(undefined, { intro: false });
    G.setTime(13 * 60);
    G.state.gold = 4321;
  });

  // No explicit save: leaving the page must write it.
  await page.reload();
  const cont = page.locator(".btn.continue");
  await expect(cont).toContainText("Spring 1, Year 1");
  await cont.click();
  expect(await page.evaluate(() => [window.__game.g.mode, window.__game.state.gold, window.__game.state.clock.min])).toEqual(["play", 4321, 780]);
  // The intro was already done, so it does not replay.
  await page.waitForTimeout(1500);
  await expect(page.locator(".dream")).toHaveCount(0);
});

test("leaving the title screen never overwrites a save with a blank game", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => {
    window.__game.newGame(undefined, { intro: false });
    window.__game.state.gold = 777;
    window.__game.save();
  });
  await page.reload();
  await page.getByRole("button", { name: "New Game" }).click(); // opens the creator; still the title flow
  await page.reload();
  await page.locator(".btn.continue").click();
  expect(await page.evaluate(() => window.__game.state.gold)).toBe(777);
});
