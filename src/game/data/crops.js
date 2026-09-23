/**
 * Crop table. `stages` are days per growth stage; the crop is ripe once it
 * has grown for their sum. `regrow` crops return to the last stage for that
 * many days after a harvest instead of disappearing.
 */

export const CROPS = {
  turnip: { name: "Turnip", seasons: ["spring"], stages: [1, 1, 1, 1], seed: "turnip_seed", produce: "turnip", yield: 1, color: "#f2eef6", accent: "#7cc06a" },
  strawberry: { name: "Strawberry", seasons: ["spring"], stages: [1, 1, 2, 2, 2], regrow: 3, seed: "strawberry_seed", produce: "strawberry", yield: 1, color: "#e8475a", accent: "#7cc06a" },
  tomato: { name: "Tomato", seasons: ["summer"], stages: [2, 2, 2, 2, 3], regrow: 4, seed: "tomato_seed", produce: "tomato", yield: 1, color: "#e5533d", accent: "#5aa25a" },
  sunflower: { name: "Sunflower", seasons: ["summer", "fall"], stages: [1, 2, 3, 2], seed: "sunflower_seed", produce: "sunflower", yield: 1, color: "#f6c63c", accent: "#6aa24a" },
  pumpkin: { name: "Pumpkin", seasons: ["fall"], stages: [1, 2, 3, 4, 3], seed: "pumpkin_seed", produce: "pumpkin", yield: 1, color: "#f08a2c", accent: "#5f9a4a" },
  moonbloom: { name: "Moonbloom", seasons: ["winter"], stages: [2, 2, 3, 3], seed: "moonbloom_seed", produce: "moonbloom", yield: 1, color: "#e4dcff", accent: "#5f86a8" },
  cranberry: { name: "Cranberry", seasons: ["fall"], stages: [1, 1, 2, 1, 2], regrow: 5, seed: "cranberry_seed", produce: "cranberry", yield: 2, color: "#b8263e", accent: "#6a8a4a" },
};

/** Seeds the general store stocks per season index. */
export const SHOP_SEEDS = [
  ["turnip_seed", "strawberry_seed"],
  ["tomato_seed", "sunflower_seed"],
  ["pumpkin_seed", "cranberry_seed", "sunflower_seed"],
  ["moonbloom_seed"],
];
