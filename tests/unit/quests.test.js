import { describe, it, expect } from "vitest";
import { newQuests, accept, advance, status, isReady, complete, boardJob, questDef, goalProgress } from "../../src/game/rules/quests.js";
import { QUESTS, BOARD_POOL } from "../../src/game/data/quests.js";
import { VILLAGERS } from "../../src/game/data/villagers.js";
import { ITEMS } from "../../src/game/data/items.js";
import { MONSTERS } from "../../src/game/data/monsters.js";
import { PLACES } from "../../src/game/world/wildwood.js";

const defOf = (id) => questDef(id, QUESTS, BOARD_POOL, ITEMS);
const none = () => 0;

describe("quests", () => {
  it("unlock in order", () => {
    const qs = newQuests();
    expect(status(qs, "wild1", QUESTS.wild1)).toBe("available");
    expect(status(qs, "wild2", QUESTS.wild2)).toBe("locked");
    const done = complete(accept(qs, "wild1", QUESTS.wild1), "wild1", QUESTS.wild1, 3).qs;
    expect(status(done, "wild2", QUESTS.wild2)).toBe("available");
    expect(status(done, "wild1", QUESTS.wild1)).toBe("done");
  });

  it("count kills, including every kind of slime", () => {
    let qs = accept(newQuests(), "wild1", QUESTS.wild1);
    for (const kill of ["slime", "boar", "slime_violet", "slime"]) qs = advance(qs, { kill }, defOf).qs;
    expect(qs.active.wild1.p).toEqual([3]);
    expect(isReady(qs, "wild1", QUESTS.wild1, none)).toBe(true);
    expect(advance(qs, { kill: "slime" }, defOf).changed).toEqual([]);
  });

  it("check deliveries against the bag and take them on turn-in", () => {
    const qs = accept(newQuests(), "mira_salve", QUESTS.mira_salve);
    expect(isReady(qs, "mira_salve", QUESTS.mira_salve, (id) => (id === "silverleaf" ? 2 : 0))).toBe(false);
    expect(isReady(qs, "mira_salve", QUESTS.mira_salve, (id) => (id === "silverleaf" ? 3 : 0))).toBe(true);
    expect(complete(qs, "mira_salve", QUESTS.mira_salve, 1).take).toEqual([["silverleaf", 3]]);
  });

  it("rebuild the same board job from its id", () => {
    const a = boardJob(40, 1, BOARD_POOL, ITEMS);
    expect(defOf("b40.1")).toEqual(a);
    expect(a.reward.gold).toBeGreaterThan(0);
    const qs = accept(newQuests(), "b40.1", a);
    expect(goalProgress(qs, "b40.1", a, none)[0].need).toBe(a.goals[0].n);
  });

  it("reference real villagers, creatures, items and places", () => {
    for (const [id, q] of Object.entries(QUESTS)) {
      expect(VILLAGERS[q.giver], id).toBeTruthy();
      for (const g of q.goals) {
        if (g.kill || g.boss) expect(Object.keys(MONSTERS).some((m) => m === (g.kill ?? g.boss) || m.startsWith(`${g.kill}_`)), id).toBe(true);
        if (g.bring) expect(ITEMS[g.bring], id).toBeTruthy();
        if (g.visit) expect(PLACES[g.visit], id).toBeTruthy();
      }
      for (const [it] of [...(q.reward.items ?? []), ...(q.gift ?? [])]) expect(ITEMS[it], `${id} ${it}`).toBeTruthy();
      if (q.req?.quest) expect(QUESTS[q.req.quest], id).toBeTruthy();
    }
    for (const t of BOARD_POOL) if (t.bring) expect(ITEMS[t.bring], t.title).toBeTruthy();
  });
});
