/**
 * Title screen and character creator (DOM) with a live SVG preview built by
 * the same sprite code the game rasterises.
 */

import { h } from "./panels.js";
import { personSvg, SKINS, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, HATS, OUTFIT_COLORS } from "../art/person.js";
import { petSprite, PET_KINDS, PET_COATS } from "../art/animals.js";
import { toSvg } from "../art/cozy-kit.js";
import { logoSvg } from "../art/brand.js";
import { DEFAULT_PROFILE, save } from "../state.js";
import { seasonName } from "../rules/clock.js";

const PET_NAMES = { anatolian: "Luna", dog: "Biscuit", cat: "Mochi", bird: "Pip", sawpup: "Sawyer" };
const KIND_LABEL = { anatolian: "Anatolian", dog: "Pup", cat: "Cat", bird: "Bird", sawpup: "Chainsaw Pup" };
const LABEL = { short: "Short", bob: "Bob", long: "Long", ponytail: "Ponytail", buns: "Buns", curly: "Curly", none: "None", straw: "Straw hat", beanie: "Beanie", cap: "Cap", flower: "Flower crown" };

export function showTitle(root, { onNew, onContinue }) {
  const data = save.load();
  const hasSave = !!data;
  const el = h(
    "div.title",
    {},
    h("div.logo", {}, h("h1", { html: logoSvg("horizontal", { tag: false }) }), h("p", {}, "a cozy little farming life")),
    h(
      "div.menu",
      {},
      hasSave
        ? h("button.btn.primary.big.continue", { onclick: () => (el.remove(), onContinue()) }, "Continue", h("small", {}, `${data.profile.name} · ${seasonName(data.clock.season)} ${data.clock.day}, Year ${data.clock.year}`))
        : null,
      h("button.btn.big" + (hasSave ? "" : ".primary"), { onclick: () => (el.remove(), showCreator(root, onNew)) }, "New Game"),
      h("p.dedication", {}, "for Luna ♡"),
    ),
    h("p.foot", {}, "WASD to walk · Space to use tools · E to interact"),
  );
  root.append(el);
  return el;
}

export function showCreator(root, onDone) {
  const p = structuredClone(DEFAULT_PROFILE);
  let dir = 0;
  const DIRS = [["down", false], ["side", false], ["up", false], ["side", true]];
  const preview = h("div.preview");
  const petPrev = h("div.petprev");
  const draw = () => {
    const [d, flip] = DIRS[dir];
    preview.innerHTML = personSvg(p.look, d, 0, flip ? "flip" : "");
    petPrev.innerHTML = toSvg(petSprite(p.pet.kind, p.pet.coat, 0), "pet");
  };

  const swatches = (list, get, set) => {
    const row = h("div.swatches");
    const paint = () =>
      row.replaceChildren(...list.map((c, i) => h(`button.sw${get() === (typeof get() === "number" ? i : c) ? ".on" : ""}`, { style: `--c:${c}`, "aria-label": c, onclick: () => (set(typeof get() === "number" ? i : c), paint(), draw()) })));
    paint();
    return row;
  };
  const chips = (list, get, set, label = (x) => LABEL[x] ?? x) => {
    const row = h("div.chips");
    const paint = () => row.replaceChildren(...list.map((v) => h(`button.chip${get() === v ? ".on" : ""}`, { onclick: () => (set(v), paint(), draw()) }, label(v))));
    paint();
    return row;
  };
  const field = (label, ...kids) => h("div.field", {}, h("span", {}, label), ...kids);
  const name = h("input.text", { value: p.name, maxlength: 14, oninput: (e) => (p.name = e.target.value) });
  const farm = h("input.text", { value: p.farm, maxlength: 22, oninput: (e) => (p.farm = e.target.value) });
  const petName = h("input.text", { value: p.pet.name, maxlength: 14, oninput: (e) => (p.pet.name = e.target.value) });

  const coats = h("div");
  const paintCoats = () => coats.replaceChildren(swatches(PET_COATS[p.pet.kind], () => p.pet.coat, (c) => (p.pet.coat = c)));
  paintCoats();
  const petKinds = h("div.chips");
  const paintKinds = () =>
    petKinds.replaceChildren(
      ...PET_KINDS.map((k) =>
        h(`button.petcard${p.pet.kind === k ? ".on" : ""}`, {
          html: toSvg(petSprite(k, PET_COATS[k][0], 0), "pet") + `<span>${KIND_LABEL[k]}</span>`,
          onclick: () => {
            const renamed = p.pet.name === PET_NAMES[p.pet.kind];
            p.pet.kind = k;
            p.pet.coat = PET_COATS[k][0];
            if (renamed) petName.value = p.pet.name = PET_NAMES[k];
            paintKinds();
            paintCoats();
            draw();
          },
        }),
      ),
    );
  paintKinds();

  const begin = () => {
    p.name = p.name.trim() || DEFAULT_PROFILE.name;
    p.farm = p.farm.trim() || "Moonpetal Farm";
    p.pet.name = p.pet.name.trim() || PET_NAMES[p.pet.kind];
    el.remove();
    onDone(p);
  };

  const el = h(
    "div.creator",
    {},
    h(
      "div.stage",
      {},
      h("h2", {}, "Who are you?"),
      h("div.stagebox", {}, preview, petPrev),
      h("div.row", {}, h("button.btn", { onclick: () => ((dir = (dir + 3) % 4), draw()), "aria-label": "Turn left" }, "◀"), h("button.btn", { onclick: () => ((dir = (dir + 1) % 4), draw()), "aria-label": "Turn right" }, "▶")),
    ),
    h(
      "div.form",
      {},
      h("div.cols", {}, field("Your name", name), field("Farm name", farm)),
      h("div.cols", {}, field("Skin", swatches(SKINS, () => p.look.skin, (i) => (p.look.skin = i))), field("Eyes", swatches(EYE_COLORS, () => p.look.eyes, (c) => (p.look.eyes = c)))),
      field("Hair", chips(HAIR_STYLES, () => p.look.hair, (v) => (p.look.hair = v))),
      field("Hair colour", swatches(HAIR_COLORS, () => p.look.hairColor, (c) => (p.look.hairColor = c))),
      h("div.cols", {}, field("Top", swatches(OUTFIT_COLORS, () => p.look.top, (c) => (p.look.top = c))), field("Bottoms", swatches(OUTFIT_COLORS, () => p.look.bottom, (c) => (p.look.bottom = c)))),
      field("Hat", chips(HATS, () => p.look.hat, (v) => (p.look.hat = v))),
      h("h3", {}, "Your companion"),
      petKinds,
      h("div.cols", {}, field("Coat", coats), field("Their name", petName)),
      h("div.row.end", {}, h("button.btn.primary.big", { onclick: begin }, "Begin your new life ✿")),
    ),
  );
  root.append(el);
  draw();
  return el;
}
