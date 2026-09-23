/**
 * Villagers: generated look, gift tastes and an hour-based schedule of named
 * waypoints (see world/map.js WAYPOINTS). Each entry is [fromMinute, waypoint];
 * the latest entry whose minute has passed is the current goal. `routines`
 * swap in a different schedule on rainy/snowy days ("rain") or a weekday.
 */

export const VILLAGERS = {
  mira: {
    name: "Mira",
    role: "Baker",
    look: { skin: 1, hair: "buns", hairColor: "#b0603a", eyes: "#6a3f2a", top: "#f4a6b8", bottom: "#8a6a9a", hat: "none", apron: "#fff4ea" },
    loves: ["strawberry", "blackberry", "star_shard", "moonbloom"],
    likes: ["turnip", "salmonberry", "pumpkin", "sunflower", "cranberry", "egg"],
    dislikes: ["stone", "fiber", "carp"],
    schedule: [[0, "bakery_counter"], [960, "plaza_bench"], [1110, "bakery_door"], [1140, "bakery_home"]],
    routines: {
      rain: [[0, "bakery_counter"], [1140, "bakery_home"]],
      // Sunday: the bakery's shut; a slow walk by the pond.
      Sun: [[0, "bakery_home"], [600, "plaza_bench"], [780, "pier_end"], [1020, "bakery_door"], [1050, "bakery_home"]],
    },
  },
  theo: {
    name: "Theo",
    role: "Carpenter",
    look: { skin: 3, hair: "short", hairColor: "#3a2a2a", eyes: "#3f6fb0", top: "#6f9ac8", bottom: "#5a4636", hat: "cap", hatColor: "#d06a48", beard: true },
    loves: ["pumpkin", "mushroom", "chanterelle"],
    likes: ["wood", "tomato", "trout", "bread"],
    dislikes: ["spring_onion", "holly"],
    schedule: [[0, "carpenter_in"], [540, "forest_edge"], [780, "plaza_well"], [1020, "carpenter_door"], [1050, "carpenter_in"]],
    routines: {
      rain: [[0, "carpenter_in"]],
      // Saturday market: Theo sells birdhouses in the plaza.
      Sat: [[0, "carpenter_in"], [480, "plaza_market"], [960, "carpenter_door"], [990, "carpenter_in"]],
    },
  },
  juniper: {
    name: "Juniper",
    role: "Fisher",
    look: { skin: 4, hair: "long", hairColor: "#2e3a5a", eyes: "#3f8a5a", top: "#7cbf9a", bottom: "#4a5a7a", hat: "bucket", hatColor: "#e8c86a" },
    loves: ["trout", "leek", "snow_yam", "moonfish", "catfish"],
    likes: ["sunfish", "carp", "bass", "salmon", "eel", "cranberry", "bread", "lullaby_loaf"],
    dislikes: ["turnip", "wood"],
    schedule: [[0, "cabin_in"], [420, "pier_end"], [720, "bakery_front"], [900, "bridge"], [1140, "cabin_door"], [1170, "cabin_in"]],
    routines: {
      // Rain is the best fishing weather; Juniper stays out late.
      rain: [[0, "cabin_in"], [360, "bridge"], [900, "pier_end"], [1260, "cabin_door"], [1290, "cabin_in"]],
      Fri: [[0, "cabin_in"], [480, "meadow_path"], [840, "bakery_front"], [1140, "cabin_door"], [1170, "cabin_in"]],
    },
  },
  bram: {
    name: "Bram",
    role: "Storyteller",
    look: { skin: 2, hair: "short", hairColor: "#dcd6cc", eyes: "#5a4a3a", top: "#8a7aa8", bottom: "#5a4a3a", hat: "none", beard: true },
    loves: ["moonbloom", "star_shard", "lullaby_loaf"],
    likes: ["mushroom", "chanterelle", "carp", "salmon", "egg", "bread"],
    dislikes: ["fiber", "stone", "hay"],
    schedule: [[0, "bakery_nook"], [540, "plaza_bench2"], [780, "forest_edge"], [960, "plaza_bench2"], [1080, "bakery_door"], [1110, "bakery_nook"]],
    routines: {
      rain: [[0, "bakery_nook"]],
    },
  },
};

export const VILLAGER_IDS = ["mira", "theo", "juniper", "bram"];
