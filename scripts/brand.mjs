// Exports the brand set from src/game/art/brand.js:
//   public/brand/*.svg          logo lockups (horizontal, stacked, badge, wordmark, mark)
//   public/favicon.svg|ico      favicon (ico holds 16/32/48 PNGs)
//   public/icons/*.png          apple-touch-icon and PWA icons, plus site.webmanifest
//   branding/sheet.html         contact sheet of everything on light and dark
// Usage: node scripts/brand.mjs   (CHROME_PATH overrides the browser, as in shot.mjs)
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { logoSvg, iconSvg, BRAND } from "../src/game/art/brand.js";

const LOGOS = ["horizontal", "stacked", "badge", "wordmark", "mark"];
const PNGS = [
  ["apple-touch-icon.png", "app", 180],
  ["icon-192.png", "app", 192],
  ["icon-512.png", "app", 512],
  ["icon-maskable-512.png", "maskable", 512],
];
for (const d of ["public/brand", "public/icons", "branding"]) mkdirSync(d, { recursive: true });

const logos = Object.fromEntries(LOGOS.map((v) => [v, logoSvg(v)]));
for (const [v, s] of Object.entries(logos)) writeFileSync(`public/brand/logo-${v}.svg`, s);
const icons = { favicon: iconSvg("favicon"), app: iconSvg("app"), maskable: iconSvg("maskable") };
writeFileSync("public/favicon.svg", icons.favicon);
writeFileSync("public/brand/icon-app.svg", icons.app);

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage();
async function png(svg, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
for (const [file, kind, size] of PNGS) writeFileSync(`public/icons/${file}`, await png(icons[kind], size));

// ICO with embedded PNGs (supported by every current browser).
const imgs = await Promise.all([16, 32, 48].map(async (s) => [s, await png(icons.favicon, s)]));
const head = Buffer.alloc(6 + 16 * imgs.length);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(imgs.length, 4);
let off = head.length;
imgs.forEach(([s, b], i) => {
  const e = 6 + i * 16;
  head.writeUInt8(s, e);
  head.writeUInt8(s, e + 1);
  head.writeUInt16LE(1, e + 4);
  head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(b.length, e + 8);
  head.writeUInt32LE(off, e + 12);
  off += b.length;
});
writeFileSync("public/favicon.ico", Buffer.concat([head, ...imgs.map(([, b]) => b)]));

writeFileSync(
  "public/site.webmanifest",
  JSON.stringify(
    {
      name: "Luna's Lullaby",
      short_name: "Luna's Lullaby",
      description: "A cozy little farming life.",
      start_url: "/",
      display: "fullscreen",
      background_color: BRAND.night,
      theme_color: BRAND.night,
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      ],
    },
    null,
    2,
  ) + "\n",
);

// Contact sheet.
const cell = (label, svg, cls = "") => `<figure class="${cls}">${svg}<figcaption>${label}</figcaption></figure>`;
const sizes = [16, 32, 48, 180].map((s) => `<img src="data:image/svg+xml,${encodeURIComponent(icons.favicon)}" width="${s}" height="${s}" alt="">`).join("");
const sheet = `<!doctype html><meta charset="utf-8"><title>Luna's Lullaby brand sheet</title>
<style>
body{margin:0;font:600 14px system-ui;color:#3a2530;background:#fbead0}
section{padding:32px;display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:28px}
section.dark{background:${BRAND.night};color:#fff6e6}
h2{grid-column:1/-1;margin:0;font-size:18px}
figure{margin:0;display:grid;gap:8px;place-items:center;padding:18px;border-radius:18px;background:rgba(255,255,255,.35)}
.dark figure{background:rgba(255,255,255,.05)}
figure svg{width:100%;max-height:300px}
.wide{grid-column:1/-1}.wide svg{max-width:900px}
.row{display:flex;gap:18px;align-items:end}
</style>
${["light", "dark"]
  .map(
    (t) => `<section class="${t}"><h2>Logos on ${t}</h2>${cell("horizontal", logos.horizontal, "wide")}${cell("stacked", logos.stacked)}${cell("badge", logos.badge)}${cell("mark", logos.mark)}${cell("wordmark", logos.wordmark, "wide")}
<h2>Icons</h2>${cell("favicon 16 · 32 · 48 · 180", `<div class="row">${sizes}</div>`)}${cell("app tile", icons.app)}${cell("maskable", icons.maskable)}</section>`,
  )
  .join("")}`;
writeFileSync("branding/sheet.html", sheet);
await page.setViewportSize({ width: 1400, height: 900 });
await page.setContent(sheet);
await page.screenshot({ path: "branding/sheet.png", fullPage: true });
await browser.close();
console.log("brand set written: public/brand, public/icons, public/favicon.*, public/site.webmanifest, branding/sheet.{html,png}");
