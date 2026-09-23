/**
 * Fish table. `where`: "river" | "pond" | "pool" (the hidden Moonlit Pool);
 * `seasons` as in crops (empty = all year); `hours` [from, to] in clock
 * minutes (to may run past midnight, up to 26:00); `weather` "rain" | "sun"
 * or null for any; `weight` is relative rarity; `diff` 0..1 drives the reel bar.
 */

export const FISH = {
  sunfish: { name: "Sunfish", sell: 30, where: ["river", "pond"], seasons: ["spring", "summer"], hours: [360, 1140], weather: "sun", weight: 10, diff: 0.1, color: "#f6c85a", fin: "#f08a4a" },
  carp: { name: "Pond Carp", sell: 45, where: ["pond", "pool"], seasons: [], hours: [360, 1560], weather: null, weight: 10, diff: 0.15, color: "#a8b48a", fin: "#7a8a5a" },
  bream: { name: "Bream", sell: 45, where: ["river"], seasons: [], hours: [1080, 1560], weather: null, weight: 8, diff: 0.25, color: "#a8a09a", fin: "#6a625e" },
  bass: { name: "River Bass", sell: 50, where: ["river"], seasons: ["spring", "fall"], hours: [360, 1440], weather: null, weight: 8, diff: 0.3, color: "#7ca060", fin: "#4a6a3a" },
  perch: { name: "Frost Perch", sell: 55, where: ["river", "pond"], seasons: ["winter"], hours: [360, 1140], weather: null, weight: 9, diff: 0.3, color: "#c8d890", fin: "#6a8a4a" },
  salmon: { name: "Salmon", sell: 75, where: ["river"], seasons: ["fall"], hours: [360, 1140], weather: null, weight: 7, diff: 0.45, color: "#e89a8a", fin: "#b8584a" },
  eel: { name: "Eel", sell: 85, where: ["river", "pond"], seasons: ["spring", "fall"], hours: [960, 1560], weather: "rain", weight: 5, diff: 0.55, color: "#6a6a4a", fin: "#4a4a2a" },
  trout: { name: "Rainbow Trout", sell: 90, where: ["river"], seasons: ["summer"], hours: [360, 1140], weather: "sun", weight: 6, diff: 0.45, color: "#9ac8e0", fin: "#f08aa0" },
  pike: { name: "Pike", sell: 100, where: ["river", "pond"], seasons: ["summer", "winter"], hours: [360, 1560], weather: null, weight: 4, diff: 0.6, color: "#8aa05a", fin: "#c8b04a" },
  catfish: { name: "Catfish", sell: 200, where: ["river"], seasons: ["spring", "fall"], hours: [360, 1440], weather: "rain", weight: 2, diff: 0.7, color: "#8a7a6a", fin: "#5a4a3a" },
  lanternfish: { name: "Lanternfish", sell: 160, where: ["pond"], seasons: [], hours: [1200, 1560], weather: null, weight: 2, diff: 0.65, color: "#3a4a7a", fin: "#fff2a8" },
  moonfish: { name: "Moonfish", sell: 600, where: ["pool"], seasons: [], hours: [1260, 1560], weather: null, weight: 1, diff: 0.85, color: "#e8e0ff", fin: "#b8a8e8" },
};

export const FISH_IDS = Object.keys(FISH);
