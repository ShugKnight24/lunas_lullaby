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
};

export const GIFT_LINES = {
  mira: { love: "For me? Oh, this is perfect! I could hug you!", like: "How thoughtful, thank you!", neutral: "Oh, thank you.", dislike: "Oh... um. Thanks, I suppose?" },
  theo: { love: "Now that's quality. You've got a good eye.", like: "Appreciate it, friend.", neutral: "Huh. Thanks.", dislike: "...What am I meant to do with this?" },
  juniper: { love: "...! This is my favourite. How did you know?", like: "Nice. Thank you.", neutral: "Thanks.", dislike: "Hm. Not really my thing." },
};

/** Two-heart event (stub): plays once on the next chat after reaching 2 hearts. */
export const HEART_EVENTS = {
  mira: {
    hearts: 2,
    lines: [
      "Mira dusts flour off her hands and smiles shyly.",
      "\"Can I tell you a secret? The Lullaby Loaf... it's my grandmother's recipe. I only bake it for friends.\"",
      "\"There. Still warm. Eat it on a night you can't sleep.\"",
    ],
    reward: "lullaby_loaf",
  },
};
