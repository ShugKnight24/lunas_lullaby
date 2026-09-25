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

// ── Newer neighbours: the Warden, the shopkeeper, and the Sunridge farmers ──
Object.assign(VILLAGERS, {
  hazel: {
    name: "Hazel",
    role: "Warden",
    look: { skin: 2, hair: "ponytail", hairColor: "#c0472f", eyes: "#3f8a5a", top: "#4a8a6a", bottom: "#6b4230", hat: "none" },
    loves: ["amber", "moonstone", "trail_jerky", "wisp_essence"],
    likes: ["boar_tusk", "mushroom", "blackberry", "apple", "bread"],
    dislikes: ["slime_gel", "hay", "turnip"],
    schedule: [[0, "lodge_in"], [480, "lodge_porch"], [600, "wild_arch"], [900, "lodge_in"], [1080, "plaza_board"], [1200, "lodge_door"], [1230, "lodge_in"]],
    routines: {
      rain: [[0, "lodge_in"]],
      // Sundays she walks the Wildwood edge all day.
      Sun: [[0, "lodge_in"], [420, "wild_arch"], [1140, "lodge_door"], [1170, "lodge_in"]],
    },
  },
  pip: {
    name: "Pip",
    role: "Shopkeeper",
    look: { skin: 0, hair: "curly", hairColor: "#e8c170", eyes: "#3f6fb0", top: "#f6c86a", bottom: "#5a6e9a", hat: "none", apron: "#7cbfd8" },
    loves: ["honey", "cheese", "gloom_heart", "star_shard"],
    likes: ["egg", "milk", "wool", "apple", "strawberry", "mayonnaise"],
    dislikes: ["slime_gel", "fiber", "spore_cap"],
    schedule: [[0, "store_in"], [1080, "store_door"], [1110, "plaza_bench"], [1200, "store_door"], [1230, "store_in"]],
    routines: {
      // Saturday market: Pip runs the stall by the plaza.
      Sat: [[0, "store_in"], [480, "store_stall"], [1020, "store_door"], [1050, "store_in"]],
    },
  },
  dale: {
    name: "Dale",
    role: "Rancher",
    look: { skin: 4, hair: "short", hairColor: "#3a2a2a", eyes: "#6a3f2a", top: "#c0472f", bottom: "#5a6e9a", hat: "straw", beard: true },
    loves: ["pumpkin", "cheese", "trail_jerky"],
    likes: ["hay", "apple", "bread", "egg", "wool"],
    dislikes: ["spore_cap", "slime_gel"],
    schedule: [[0, "ranch_yard"], [420, "ranch_pasture"], [720, "ranch_sign"], [840, "ranch_barn"], [1020, "ranch_yard"]],
    routines: { rain: [[0, "ranch_barn"]] },
  },
  willow: {
    name: "Willow",
    role: "Orchard Keeper",
    look: { skin: 1, hair: "long", hairColor: "#6b4230", eyes: "#7a4fa0", top: "#9fd08a", bottom: "#8a5a44", hat: "flower" },
    loves: ["honey", "sunflower", "cranberry", "silverleaf"],
    likes: ["apple", "strawberry", "blackberry", "salmonberry", "egg"],
    dislikes: ["spore_cap", "stone"],
    schedule: [[0, "willow_home"], [480, "orchard_rows"], [720, "orchard_stall"], [960, "orchard_hives"], [1140, "willow_home"]],
    routines: { rain: [[0, "willow_home"], [600, "orchard_stall"], [960, "willow_home"]] },
  },
});

export const VILLAGER_IDS = ["mira", "theo", "juniper", "bram", "hazel", "pip", "dale", "willow"];
