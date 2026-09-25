/**
 * Time trials. Start at the race flag (E), run the gates in order and come
 * back to the flag. Any way you like: on foot, sprinting, by bike or on
 * your horse. `par` is seconds for gold, silver and bronze; `pay` the gold
 * each medal pays the first time you earn it.
 */

export const RACES = {
  hollow: {
    name: "Hollow Loop",
    level: "world",
    flag: { tx: 10, ty: 32 },
    gates: [[30, 33], [53, 37], [51, 51], [59, 58], [51, 44], [40, 34]],
    par: [22, 28, 36],
    pay: [500, 250, 100],
  },
};

export const MEDALS = ["gold", "silver", "bronze"];
/** Gate radius in tiles. */
export const GATE_R = 1.7;

/** Medal index for a time (0 gold, 1 silver, 2 bronze, -1 none). */
export const medalFor = (race, secs) => race.par.findIndex((p) => secs <= p);
