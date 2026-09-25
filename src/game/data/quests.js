/**
 * Quests. Each has a giver (a villager id, or "board" for the town notice
 * board), goals and a reward. Goals:
 *   { kill: monsterId, n }   defeat creatures (any id starting with it counts: "slime" also counts dusk slimes)
 *   { boss: monsterId }      defeat a boss
 *   { visit: placeId }       walk into a named place (see world/wildwood.js PLACES)
 *   { bring: itemId, n }     have them in your bag when you turn in (they're taken)
 *   { act: "harvest"|"build"|"fish"|"craft"|"cook", n }   do something n times
 * `req` gates when it's offered: { quest } finished first, { hearts: [villager, n] }.
 * `guild` is adventurer guild points (career rank), `xp` skill XP.
 */

export const QUESTS = {
  // ── Hazel, the Warden: the Wildwood story ──
  wild1: {
    title: "Into the Wildwood",
    giver: "hazel",
    desc: "Hazel says slimes have been creeping out of the Wildwood, north past the forest clearing. Take the old sword and thin them out.",
    offer: ["You're the new farmer? Good timing. Something's wrong in the Wildwood, north past the clearing.", "Slimes, mostly. They used to stay deep in the trees. Take this old sword and thin them out for me, would you? Your {pet} looks like they'd like to help."],
    gift: [["rusty_sword", 1]],
    goals: [{ kill: "slime", n: 3 }],
    reward: { gold: 150, items: [["healing_salve", 2], ["leather_cap", 1]], guild: 1, xp: { combat: 40 } },
    thanks: "Three slimes, and you're still standing. The wood hasn't had a friend like you in years.",
  },
  wild2: {
    title: "Thorns and Tusks",
    giver: "hazel",
    req: { quest: "wild1" },
    desc: "Thornback boars are charging travellers in the Bramble Thicket. Dodge the charge; they're dizzy after they hit a tree.",
    offer: ["The Thornbacks are the real trouble. They lower their heads, then charge in a straight line.", "Step aside and let them slam into a tree. They're dizzy for a moment afterwards. That's your chance."],
    goals: [{ kill: "boar", n: 3 }],
    reward: { gold: 220, items: [["pet_treat", 3]], guild: 2, xp: { combat: 60 } },
    thanks: "The thicket's quieter already. Here, treats for your partner. They earned them.",
  },
  wild3: {
    title: "Amber for the Lanterns",
    giver: "hazel",
    req: { quest: "wild2" },
    desc: "Hazel wants amber from the orange crystal stones in the Wildwood to relight the old path lanterns. Break the stones with your axe.",
    offer: ["The old path lanterns ran on amber. If we relight them the gloom won't creep so close to town.", "Amber grows in orange crystal stones in the wood. Break them with your axe. Five should do."],
    goals: [{ bring: "amber", n: 5 }],
    reward: { gold: 300, items: [["steel_sword", 1]], guild: 2, xp: { combat: 40, foraging: 40 } },
    thanks: "They're lit! Theo forged this from the old lantern frames. It's yours.",
  },
  wild4: {
    title: "Lights in the Hollow",
    giver: "hazel",
    req: { quest: "wild3" },
    desc: "Gloom wisps drift through Wisp Hollow in the north-east of the Wildwood, mostly after dark. They keep their distance and throw gloom, so close in fast.",
    offer: ["Now the wisps. They float in the Hollow, north-east, and they're worst after dark.", "They keep away and throw gloom at you. Close the distance quickly. And keep something to eat in your bag."],
    goals: [{ kill: "wisp", n: 4 }],
    reward: { gold: 350, items: [["moonstone", 2], ["warden_hood", 1]], guild: 3, xp: { combat: 80 } },
    thanks: "The Hollow's glowing a softer colour now. I think we're close to the heart of this.",
  },
  wild5: {
    title: "Heart of the Gloom",
    giver: "hazel",
    req: { quest: "wild4" },
    desc: "At the Moon Shrine, far north in the Wildwood, a gloom-sick tree spirit has taken root. Hit its glowing heart, dodge the root spikes, and bring the Wildwood back.",
    offer: ["Bram told me the old story last night. The Moon Shrine, far north. A tree spirit sang the wood to sleep there once.", "Something's gone wrong with it. The gloom is coming from its heart. Watch the ground: when it glows, roots are coming. Please be careful. Both of you."],
    goals: [{ boss: "gloomroot" }],
    reward: { gold: 1000, items: [["moon_blade", 1]], guild: 5, xp: { combat: 250 } },
    thanks: "You did it. The whole wood is humming. Bram's crying, don't tell him I said so. This blade was the shrine's; it chose you.",
  },

  // ── Getting started: each teaches a skill ──
  mira_first: {
    title: "Seeds of Something",
    giver: "mira",
    desc: "Mira wants to see your first real harvest. Grow and pick five crops (Farming).",
    offer: ["Your field's looking lovely. Rowan always said a farm isn't a farm until it's fed someone.", "Harvest five crops for me? Then come tell me all about it."],
    goals: [{ act: "harvest", n: 5 }],
    reward: { gold: 150, items: [["strawberry_seed", 5]], xp: { farming: 60 }, hearts: 40 },
    thanks: "Five! You're a natural. These strawberry seeds were Rowan's favourite.",
  },
  theo_build: {
    title: "A Proper Fence",
    giver: "theo",
    desc: "Theo will show you the ropes. Build six things from his board by the carpenter shop (Building).",
    offer: ["Ever built anything? No shame if not. Everybody starts somewhere.", "My board by the shop takes orders. Put down six things on your farm: fences, a path, whatever you like. Wood's on me."],
    gift: [["wood", 12]],
    goals: [{ act: "build", n: 6 }],
    reward: { gold: 120, items: [["wood", 20], ["stone", 10]], xp: { building: 80 }, hearts: 40 },
    thanks: "Straight and sturdy. Here's more lumber. Come back when you want to try something bigger.",
  },
  juniper_fish: {
    title: "Three Quiet Casts",
    giver: "juniper",
    desc: "Juniper will teach you patience. Catch three fish anywhere (Fishing).",
    offer: ["...You want to learn? Fine. Catch three fish.", "Stop the marker in the green. Don't rush. The fish can tell."],
    goals: [{ act: "fish", n: 3 }],
    reward: { gold: 100, items: [["bait", 15]], xp: { fishing: 60 }, hearts: 40 },
    thanks: "Not bad. Not bad at all. Take some bait.",
  },

  // ── Townsfolk ──
  mira_salve: {
    title: "Silverleaf Tea",
    giver: "mira",
    req: { quest: "wild1" },
    desc: "Mira wants to try a silverleaf tea for Bram's cough. Silverleaf grows in the Wildwood.",
    offer: ["Grandpa's cough is back. Old recipe says silverleaf tea helps, but it only grows in the Wildwood.", "Could you bring me three? I'll bake you something lovely."],
    goals: [{ bring: "silverleaf", n: 3 }],
    reward: { gold: 120, items: [["lullaby_loaf", 2]], hearts: 60 },
    thanks: "It smells like mint and moonlight. Thank you, truly.",
  },
  theo_ironwood: {
    title: "Ironwood Beams",
    giver: "theo",
    req: { quest: "wild2" },
    desc: "Theo needs ironwood for the new lodge beams. Ironwood trees grow dark and tall in the Bramble Thicket; chop them.",
    offer: ["Hazel's lodge needs proper beams. Ironwood. Dark trees, deep in the thicket.", "Bring me four and I'll pay what they're worth."],
    goals: [{ bring: "ironwood", n: 4 }],
    reward: { gold: 480, hearts: 60, xp: { building: 60 } },
    thanks: "Look at that grain. These'll outlast both of us.",
  },
  dale_ewe: {
    title: "The Lost Ewe",
    giver: "dale",
    desc: "One of Dale's sheep, Buttons, wandered into the Wildwood. Find her in the Mossy Glade.",
    offer: ["Buttons got through the fence again. Tracks lead north, all the way into the Wildwood.", "She likes the Mossy Glade. Would you look? I can't leave the herd."],
    goals: [{ visit: "glade" }],
    reward: { gold: 150, items: [["cheese", 2], ["milk", 3]], hearts: 80 },
    thanks: "Buttons! You daft thing. Thank you, neighbour. Cheese is from our own kitchen.",
  },
  willow_blight: {
    title: "Bramble Blight",
    giver: "willow",
    req: { quest: "wild1" },
    desc: "Shroomling spores are drifting onto Willow's orchard. Clear some of them out of the Wildwood.",
    offer: ["See those grey spots on the leaves? Spores. Shroomlings from the Wildwood.", "Clear out five of them and my trees might just recover."],
    goals: [{ kill: "shroom", n: 5 }],
    reward: { gold: 200, items: [["honey", 3], ["apple", 5]], hearts: 80 },
    thanks: "The bees are back on the blossoms. That's the best thank-you I know.",
  },
  bram_moonstone: {
    title: "A Stone That Remembers",
    giver: "bram",
    req: { quest: "wild3" },
    desc: "Bram would love to hold a moonstone again. They glow pale blue in the Wildwood's stones.",
    offer: ["When I was a boy we found moonstones by the shrine. They hum, you know, if you listen.", "Bring me one? Just to hold again."],
    goals: [{ bring: "moonstone", n: 1 }],
    reward: { gold: 250, hearts: 100 },
    thanks: "...there it is. The lullaby. I'd forgotten the second verse.",
  },
};

/** Daily notice-board jobs: templates the board fills in each morning. */
export const BOARD_POOL = [
  { kill: "slime", n: [4, 8], title: "Slime Patrol", pay: 14 },
  { kill: "boar", n: [2, 4], title: "Tusk Trouble", pay: 38 },
  { kill: "shroom", n: [3, 6], title: "Spore Sweep", pay: 22 },
  { kill: "wisp", n: [2, 4], title: "Wisp Watch", pay: 40, night: true },
  { bring: "slime_gel", n: [3, 6], title: "Gel for the Clinic", pay: 16 },
  { bring: "amber", n: [2, 3], title: "Lantern Amber", pay: 70 },
  { bring: "silverleaf", n: [2, 4], title: "Herbalist's Order", pay: 35 },
  { bring: "iron_ore", n: [2, 4], title: "Smithy Order", pay: 45 },
  { bring: "egg", n: [2, 4], title: "Eggs for the Bakery", pay: 60 },
  { bring: "tomato", n: [3, 6], title: "Summer Salad", pay: 70, season: 1 },
  { bring: "turnip", n: [4, 8], title: "Turnip Stew", pay: 45, season: 0 },
  { bring: "pumpkin", n: [1, 3], title: "Pumpkin Pies", pay: 330, season: 2 },
  { bring: "trout", n: [1, 2], title: "Fresh Catch", pay: 120 },
];

export const BOARD_SIZE = 3;
