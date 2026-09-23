/**
 * Villagers: generated look, gift tastes and an hour-based schedule of named
 * waypoints (see world/map.js WAYPOINTS). Each entry is [fromMinute, waypoint];
 * the latest entry whose minute has passed is the current goal.
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
  },
  theo: {
    name: "Theo",
    role: "Carpenter",
    look: { skin: 3, hair: "short", hairColor: "#3a2a2a", eyes: "#3f6fb0", top: "#6f9ac8", bottom: "#5a4636", hat: "cap", hatColor: "#d06a48", beard: true },
    loves: ["pumpkin", "mushroom", "chanterelle"],
    likes: ["wood", "tomato", "trout", "bread"],
    dislikes: ["spring_onion", "holly"],
    schedule: [[0, "carpenter_in"], [540, "forest_edge"], [780, "plaza_well"], [1020, "carpenter_door"], [1050, "carpenter_in"]],
  },
  juniper: {
    name: "Juniper",
    role: "Fisher",
    look: { skin: 4, hair: "long", hairColor: "#2e3a5a", eyes: "#3f8a5a", top: "#7cbf9a", bottom: "#4a5a7a", hat: "bucket", hatColor: "#e8c86a" },
    loves: ["trout", "leek", "snow_yam", "moonfish", "catfish"],
    likes: ["sunfish", "carp", "bass", "salmon", "eel", "cranberry", "bread", "lullaby_loaf"],
    dislikes: ["turnip", "wood"],
    schedule: [[0, "cabin_in"], [420, "pier_end"], [720, "bakery_front"], [900, "bridge"], [1140, "cabin_door"], [1170, "cabin_in"]],
  },
};

export const VILLAGER_IDS = ["mira", "theo", "juniper"];
