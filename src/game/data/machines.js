/**
 * Artisan machines: crafted as items, placed on the farm, loaded with E.
 * `accepts(id, item)` says what goes in, `product(id)` what comes out after
 * `days` nights; the input's quality carries through.
 */

export const MACHINES = {
  preserves_jar: {
    name: "Preserves Jar",
    days: 3,
    accepts: (id, item) => item.kind === "crop",
    product: (id) => `${id}_jam`,
    hint: "Holds one crop · jam in 3 days",
  },
  mayo_machine: {
    name: "Mayo Machine",
    days: 1,
    accepts: (id) => id === "egg",
    product: () => "mayonnaise",
    hint: "Holds one egg · mayonnaise by morning",
  },
};

export const MACHINE_IDS = Object.keys(MACHINES);
