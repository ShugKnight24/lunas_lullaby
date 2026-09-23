/**
 * First-day tasks. Each step finishes on its `event` (emitted by actions via
 * progress.js); `key` is the control hint on the task card and `point`, when
 * set, names a world spot the HUD points an arrow at.
 */

export const TUTORIAL = [
  { event: "till", text: "Till a patch of soil in the field", key: "Hoe · Space" },
  { event: "plant", text: "Plant turnip seeds in the tilled soil", key: "Seeds · Space" },
  { event: "water", text: "Water your seeds", key: "Can · Space" },
  { event: "refill", text: "Refill the can at the farm well", key: "Can · Space at the well", point: "well" },
  { event: "forage", text: "Pick up something growing wild", key: "E" },
  { event: "ship", text: "Put it in the shipping bin to sell overnight", key: "Hold it · E at the bin", point: "bin" },
  { event: "talk", text: "Head into town and say hello to someone", key: "E" },
  { event: "sleep", text: "Go home and sleep to end the day", key: "E at your bed", point: "house" },
];

/** Welcome gift when the list is done. */
export const TUTORIAL_REWARD = [["fertilizer", 5], ["turnip_seed", 10]];
