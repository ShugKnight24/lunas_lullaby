/**
 * Dialogue lines. A line may be gated by `season` (index), `weather`
 * ("sun" | "rain" | "snow") and a heart range `min`/`max`; rules/dialogue.js
 * picks among the lines that pass. `{name}` and `{farm}` are filled in.
 */

export const LINES = {
  mira: [
    { t: "Oh! A new face. Welcome to Lullaby Hollow, {name}. I'm Mira, I keep the ovens warm.", max: 0 },
    { t: "Morning! The bread's still steaming. Seeds are at the counter inside if you need any." },
    { t: "Spring always smells like butter and blossoms to me." , season: 0 },
    { t: "It's far too hot to bake. So of course I'm baking twice as much.", season: 1 },
    { t: "Pumpkin loaf season! Bring me the round ones.", season: 2 },
    { t: "Snow makes the whole town sound like a whisper.", season: 3 },
    { t: "Rainy days are for cinnamon and long naps.", weather: "rain" },
    { t: "You've been working so hard on {farm}. Here, sit a minute.", min: 3 },
    { t: "My grandmother used to hum a lullaby while the dough rose. I still do.", min: 1 },
  ],
  theo: [
    { t: "Name's Theo. Need something built? The board by my shop takes orders.", max: 0 },
    { t: "Wood and stone. Bring me those and a little gold and I'll make it happen." },
    { t: "Fresh sap in the forest. Everything's waking up.", season: 0 },
    { t: "Summer storms keep me busy fixing roofs.", season: 1 },
    { t: "Best time of year to chop. The trees don't mind as much.", season: 2 },
    { t: "Cold hands, warm workshop.", season: 3 },
    { t: "Rain on a tin roof. Best music there is.", weather: "rain" },
    { t: "That fence line of yours is looking straight. I'm impressed.", min: 2 },
  ],
  juniper: [
    { t: "Shh. The fish are listening. ...I'm Juniper. I fish.", max: 0 },
    { t: "The pond's calm today. Try casting where the lilies are." },
    { t: "Spring trout are sleepy. Be patient.", season: 0 },
    { t: "Sunfish everywhere in summer. They're show-offs.", season: 1 },
    { t: "Leaves on the water look like little boats.", season: 2 },
    { t: "Ice fishing? No. I just like the quiet.", season: 3 },
    { t: "Rain is the best time to fish. Don't tell anyone.", weather: "rain" },
    { t: "You know, you're easy to be quiet with, {name}.", min: 2 },
  ],
  bram: [
    { t: "Hm? Ah, the new farmer. I'm Bram, Mira's grandfather. I mostly sit and remember things.", max: 0 },
    { t: "The Hollow has a song, you know. Nobody wrote it. It was just... here first." },
    { t: "Blossoms again. I've counted seventy-one springs and I still stop to look.", season: 0 },
    { t: "Summer evenings, the frogs sing the lullaby's bass line. Listen for it.", season: 1 },
    { t: "Autumn is the lullaby's slow verse. Everything gets ready to sleep.", season: 2 },
    { t: "In winter the moon hangs low over the Hollow. Rowan used to say it's listening.", season: 3 },
    { t: "Rain on the bakery windows. Mira hums along without noticing.", weather: "rain" },
    { t: "You've got Rowan's patience, {name}. The farm can tell.", min: 3 },
  ],
};

export const GIFT_LINES = {
  mira: { love: "For me? Oh, this is perfect! I could hug you!", like: "How thoughtful, thank you!", neutral: "Oh, thank you.", dislike: "Oh... um. Thanks, I suppose?" },
  theo: { love: "Now that's quality. You've got a good eye.", like: "Appreciate it, friend.", neutral: "Huh. Thanks.", dislike: "...What am I meant to do with this?" },
  juniper: { love: "...! This is my favourite. How did you know?", like: "Nice. Thank you.", neutral: "Thanks.", dislike: "Hm. Not really my thing." },
  bram: { love: "Oh my. This takes me back fifty years. Thank you, child.", like: "How kind. I'll tell Mira you spoil me.", neutral: "Well now, thank you.", dislike: "Ah. I'll... find a use for it." },
};

/**
 * Heart events: each plays once, on the next chat after reaching its hearts
 * (the lowest unseen one first). `reward` (× `n`) is given afterwards.
 */
export const HEART_EVENTS = {
  mira: [
    {
      hearts: 2,
      lines: [
        "Mira dusts flour off her hands and smiles shyly.",
        "\"Can I tell you a secret? The Lullaby Loaf... it's my grandmother's recipe. I only bake it for friends.\"",
        "\"There. Still warm. Eat it on a night you can't sleep.\"",
      ],
      reward: "lullaby_loaf",
    },
    {
      hearts: 5,
      lines: [
        "Mira is sitting on the bakery step, watching the sky go pink.",
        "\"When I was little, Grandpa Bram would hum the Hollow's lullaby while the bread proved. I thought the dough was listening.\"",
        "\"Silly, right? ...Still. I hum it too, now. Maybe you'll hear it someday.\"",
      ],
      reward: "lullaby_loaf",
      n: 2,
    },
  ],
  theo: [
    {
      hearts: 2,
      lines: [
        "Theo turns a tiny wooden birdhouse over in his hands.",
        "\"First thing I ever built. Crooked roof, see? Rowan bought it anyway. Paid me in pie.\"",
        "\"Here. For your farm. Every good farm needs a crooked birdhouse... and something for the soil.\"",
      ],
      reward: "deluxe_fertilizer",
      n: 5,
    },
  ],
  juniper: [
    {
      hearts: 2,
      lines: [
        "Juniper glances around, then lowers her voice.",
        "\"There's a pool south of your farm, behind the hedges. The moon sits right in it on clear nights.\"",
        "\"Something big lives there. I've only seen its glow. Take these — you'll need them.\"",
      ],
      reward: "bait",
      n: 10,
    },
  ],
  bram: [
    {
      hearts: 2,
      lines: [
        "Bram pats the bench beside him. \"Sit. Let me tell you how the Hollow got its name.\"",
        "\"Long ago the moon couldn't sleep. The first folk here sang to her, soft and low, every night of the year.\"",
        "\"She slept at last, and in thanks she left the Moonbloom. It only opens in the cold, when she's closest.\"",
        "\"Rowan grew them every winter. Here — for your first frost.\"",
      ],
      reward: "moonbloom_seed",
      n: 5,
    },
  ],
};

/**
 * New-game intro: a letter from Rowan, the farm's previous keeper, then Mira
 * walks over to say hello. `{pet}` is the pet's name.
 */
export const INTRO = {
  letter: [
    "Dear {name},",
    "{farm} is yours now. The soil is kind if you're patient with it, the well water is sweet, and the town will look after you.",
    "On quiet nights the whole Hollow hums a lullaby to the moon. I hope you'll learn it.",
    "With love,\nRowan",
  ],
  mira: [
    "There you are! You must be {name}. Welcome to Lullaby Hollow!",
    "I'm Mira. I run the bakery in town, and I've been keeping an eye on {farm} since Rowan moved to the coast.",
    "It's a little overgrown, but the field is cleared and the old well by it still works. Rowan swore by that water.",
    "Anything you drop in the shipping bin by the house, I'll pay for by morning. That's how Rowan got by.",
    "And this must be {pet}! Hello, sweetheart. A farm always feels more like home with a friend on it.",
    "I jotted down a little to-do list for your first day. Come find me in town once you've settled in!",
  ],
};
