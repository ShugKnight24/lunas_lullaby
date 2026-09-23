import { test, expect } from "@playwright/test";

test("sound starts on the first click, plays music and effects without clipping, and remembers volume", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => window.__game);
  expect(await page.evaluate(() => window.__game.g.audio.ctx)).toBeNull();

  // The first click unlocks audio (browser autoplay rules).
  await page.getByRole("button", { name: "New Game" }).click();
  await expect.poll(() => page.evaluate(() => window.__game.g.audio.ctx?.state)).toBe("running");

  // Listen to the master output while the title lullaby and a burst of effects play.
  const peak = await page.evaluate(async () => {
    const a = window.__game.g.audio;
    const an = a.ctx.createAnalyser();
    an.fftSize = 2048;
    a.bus.master.connect(an);
    const buf = new Float32Array(an.fftSize);
    const { SFX } = await import("/src/game/audio/sfx.js");
    for (const name of ["hoe", "water", "chop", "harvest", "levelUp", "catch", "wish", "build"]) SFX[name](a);
    let max = 0;
    const end = performance.now() + 2500;
    while (performance.now() < end) {
      an.getFloatTimeDomainData(buf);
      for (const v of buf) max = Math.max(max, Math.abs(v));
      await new Promise((r) => setTimeout(r, 20));
    }
    return max;
  });
  expect(peak).toBeGreaterThan(0.01); // audible
  expect(peak).toBeLessThan(0.95); // never clipping

  // Settings persist per browser.
  await page.evaluate(() => window.__game.g.audio.set("music", 0.25));
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("luna_audio")).music)).toBe(0.25);
  expect(errors).toEqual([]);
});

test("the minimap shows by default, N hides it, and the choice sticks", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => {
    localStorage.removeItem("luna_minimap");
    window.__game.newGame(undefined, { intro: false });
  });
  // Sample a pixel inside the map area (bottom-left) with the map on, then off.
  const px = () => page.evaluate(() => Array.from(document.getElementById("game").getContext("2d").getImageData(60, 620, 1, 1).data).slice(0, 3).join(","));
  await page.waitForTimeout(500);
  const on = await px();
  await page.keyboard.press("KeyN");
  await page.waitForTimeout(300);
  const off = await px();
  expect(on).not.toBe(off);
  expect(await page.evaluate(() => localStorage.getItem("luna_minimap"))).toBe("off");
});
