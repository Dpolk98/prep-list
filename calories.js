// Rough calorie estimates for Food items, shown on the Food page.
//
// Each Food type lists calories per unit for the units it offers, plus `lb`
// (calories per pound). Other units go through units.js: weights use `lb`,
// and kitchen measures (cups, quarts, liters) and servings use MEASURES below
// to turn a volume or a serving into pounds first. The figures lean low
// on purpose, so the estimate errs toward less food rather than more:
//   - calories near the low end of what's typical for the type, and
//   - the smaller common package size for each container (a 2 lb bag of
//     rice, a 15 oz can, a 25 lb bucket, and so on).
// Values come from typical nutrition labels and USDA FoodData Central.
//
// Calories can vary a lot within a type (Spam versus tuna, beans versus green
// beans), so most types also check the item's name: the first pattern that
// matches wins, and the last one (ANY_NAME) catches everything else with the
// type's cautious default. A few types stay the same whatever the name, since
// their calories barely vary (wheat berries, eggs).
//
// { none: true } marks things that aren't counted as food for the household:
// fuel, gear, seeds, coffee, spices, and infant formula.

const NOT_FOOD = { none: true };
const ANY_NAME = /(?:)/;

// Shared by more than one type.
const CANNED_VEG = { lb: 90, cans: 80, jars: 80, '#10 cans': 550 };
const CANNED_FRUIT = { lb: 230, cans: 160, jars: 200, bottles: 150, '#10 cans': 1300 };
const CANNED_PASTA = { lb: 450, cans: 350, jars: 350, '#10 cans': 2500 }; // ravioli, SpaghettiOs
const CANNED_PASTA_NAMES = /ravioli|spaghettio|beefaroni|chef boyardee|lasagna|macaroni|mac and cheese/;
const FREEZE_DRIED_MEAL = { lb: 1600, pouches: 400, '#10 cans': 1800, buckets: 6000, servings: 150, meals: 300 };
const READY_RICE = /ready|microwav|cooked|instant rice|heat and serve/;
const SUGAR_FREE = /sugar[- ]free|unsweetened|diet|zero|crystal light|\blite\b/;

const FOOD_CALORIES = {
  // ----- Canned and jarred (a regular can is about 15 oz, a #10 can about 6.5 lb) -----
  'canned-meat': [
    [/spam|luncheon meat/, { lb: 1300, cans: 1000, pouches: 180, jars: 1000, '#10 cans': 5000 }], // 12 oz can
    [/corned beef/, { lb: 900, cans: 550, pouches: 150, jars: 550, '#10 cans': 3500 }],
    [/vienna|sausage|hot dog|frank|deviled ham|potted meat/, { lb: 900, cans: 150, pouches: 150, jars: 300, '#10 cans': 3500 }],
    [/salmon|mackerel|sardine|herring|kipper|anchov/, { lb: 600, cans: 180, pouches: 90, jars: 250, '#10 cans': 2000 }],
    [/chicken|turkey/, { lb: 450, cans: 150, pouches: 70, jars: 250, '#10 cans': 1200 }],
    [ANY_NAME, { lb: 450, cans: 120, pouches: 70, jars: 200, '#10 cans': 1000 }], // a 5 oz can of tuna in water
  ],
  'canned-veg': [
    [/\b(green|wax|string|snap|french[- ]cut)\s+beans?\b/, CANNED_VEG],
    [/baked beans|pork and beans|beans and franks/, { lb: 450, cans: 400, jars: 400, '#10 cans': 2800 }],
    [/\bbeans?\b|chickpea|garbanzo|lentil|refried/, { lb: 350, cans: 320, jars: 320, '#10 cans': 2200 }],
    [CANNED_PASTA_NAMES, CANNED_PASTA],
    [/sweet potato|\byams?\b/, { lb: 350, cans: 300, jars: 300, '#10 cans': 2000 }],
    [/corn|\bpeas\b|potato|hominy/, { lb: 250, cans: 150, jars: 150, '#10 cans': 1000 }],
    [ANY_NAME, CANNED_VEG],
  ],
  'canned-soup': [
    [/broth|stock|consomm/, { lb: 20, cans: 15, jars: 15, '#10 cans': 100 }],
    [/chili|stew|hash/, { lb: 350, cans: 300, jars: 300, '#10 cans': 2000 }],
    [CANNED_PASTA_NAMES, CANNED_PASTA],
    [/chunky|hearty|ready to serve|progresso/, { lb: 250, cans: 250, jars: 250, '#10 cans': 1500 }], // 18.6 oz cans
    [ANY_NAME, { lb: 150, cans: 150, jars: 150, '#10 cans': 950 }], // condensed chicken noodle is about 150 a can
  ],
  'canned-fruit': [
    [/\b(in|packed in)\b.*\b(juice|water)\b/, CANNED_FRUIT], // fruit packed in juice is still fruit
    [/juice/, { lb: 100, cans: 80, bottles: 150, jars: 150, '#10 cans': 250 }],
    [/pie filling/, { lb: 400, cans: 550, jars: 550, '#10 cans': 3500 }],
    [/cranberry sauce/, { lb: 600, cans: 500, jars: 500, '#10 cans': 3500 }],
    [/coconut (milk|cream)/, { lb: 500, cans: 300, jars: 300, bottles: 300, '#10 cans': 2500 }], // 13.5 oz can, light
    [/tomato|salsa|marinara/, { lb: 100, cans: 80, jars: 120, bottles: 100, '#10 cans': 550 }],
    [/syrup/, { lb: 300, cans: 250, jars: 300, bottles: 200, '#10 cans': 1800 }], // fruit in heavy syrup
    [ANY_NAME, CANNED_FRUIT],
  ],
  'jarred': [
    [/mayo/, { lb: 3000, jars: 2000, bottles: 2000 }], // 12 oz jar
    [/jam|jelly|preserves|marmalade/, { lb: 1100, jars: 900, bottles: 900 }], // 12 oz jar
    [/bbq|barbecue|ketchup|teriyaki|hoisin/, { lb: 400, jars: 350, bottles: 350 }],
    [/pasta sauce|spaghetti sauce|tomato sauce|marinara|alfredo|pesto|gravy|curry/, { lb: 200, jars: 250, bottles: 250 }], // 24 oz jar
    [ANY_NAME, { lb: 50, jars: 50, bottles: 50 }], // pickles, salsa, and condiments
  ],

  // ----- Dry staples (bags: 2 lb for rice and flour, 1 lb for beans; buckets: 25 lb) -----
  'rice-white': [
    [READY_RICE, { lb: 550, bags: 400, pouches: 400, boxes: 1300, cups: 200 }], // 8.8 oz pouch, already cooked
    [ANY_NAME, { lb: 1600, bags: 3200, buckets: 40000, '#10 cans': 8800, boxes: 1300 }],
  ],
  'rice-brown': [
    [READY_RICE, { lb: 550, bags: 400, pouches: 400, boxes: 1300, cups: 200 }],
    [ANY_NAME, { lb: 1600, bags: 3200, boxes: 1300 }],
  ],
  'beans-dry': [
    [/soy/, { lb: 1900, bags: 1900, buckets: 47000, '#10 cans': 9500 }],
    [ANY_NAME, { lb: 1500, bags: 1500, buckets: 37500, '#10 cans': 7500 }],
  ],
  'pasta': [
    [/ramen|instant noodle|cup noodle|cup of noodle|maruchan|top ramen/, { lb: 1900, packs: 350, packets: 350, cups: 280, boxes: 350, bags: 350 }],
    [/mac(aroni)? and cheese|kraft dinner/, { lb: 1600, boxes: 700, bags: 700 }], // 7.25 oz box
    [ANY_NAME, { lb: 1600, boxes: 1200, bags: 1200 }], // 12 oz boxes and bags
  ],
  'oats': [
    [/instant|packet/, { lb: 1650, packets: 100, boxes: 1000, canisters: 1800, bags: 1600, '#10 cans': 4000 }], // boxes of 10 packets
    [ANY_NAME, { lb: 1650, canisters: 1800, bags: 1600, '#10 cans': 4000 }], // 18 oz canisters
  ],
  'cereal': [
    [/granola|muesli/, { lb: 1900, boxes: 1300, bags: 1300, cupLb: 0.25 }], // 11 oz
    [ANY_NAME, { lb: 1550, boxes: 950, bags: 1100 }],
  ],
  'flour': [
    [/cake|brownie|cookie/, { lb: 1800, bags: 3600, boxes: 1600, buckets: 45000 }], // 15 oz box
    [/pancake|waffle|bisquick|biscuit mix/, { lb: 1600, bags: 3200, boxes: 1600, buckets: 40000 }], // 1 lb box
    [ANY_NAME, { lb: 1600, bags: 3200, boxes: 900, buckets: 40000 }], // boxes: an 8.5 oz muffin mix
  ],
  'powdered': [
    [/egg/, { lb: 2500, boxes: 1200, pouches: 1200, '#10 cans': 5000 }], // #10 can: about 2 lb
    [/whole milk|full cream|nido/, { lb: 2200, boxes: 1300, pouches: 1100, '#10 cans': 6500 }],
    [ANY_NAME, { lb: 1600, boxes: 950, pouches: 800, '#10 cans': 4800 }], // nonfat dry milk
  ],
  'oil': [
    [/spray|\bpam\b/, NOT_FOOD], // cooking spray
    [ANY_NAME, { lb: 3900, bottles: 3800, cans: 3800, jugs: 15000, gallons: 30000 }], // 16 oz bottles, 64 oz jugs
  ],
  'spices': NOT_FOOD,
  'staples-none': [
    [SUGAR_FREE, NOT_FOOD],
    [/sugar|honey|syrup|molasses|agave/, { lb: 1350, bags: 2700, jars: 1000, bottles: 1000, containers: 1000 }],
    [ANY_NAME, NOT_FOOD], // salt, vinegar, and baking soda
  ],

  // ----- Long-term storage -----
  'bulk-lt': [
    // Oats and pasta are bulky, so a bucket or bag holds fewer pounds.
    [/oat|pasta|macaroni|noodle/, { lb: 1600, buckets: 19000, 'mylar bags': 4000, '#10 cans': 4000, cupLb: 0.2 }],
    [ANY_NAME, { lb: 1500, buckets: 37500, 'mylar bags': 6000, '#10 cans': 7500 }], // 1-gallon mylar bags
  ],
  'wheat': { lb: 1500, buckets: 37500, bags: 7500, '#10 cans': 7500 },
  'freeze-dried': [
    // Full meals first, so "chicken and rice" isn't mistaken for plain chicken.
    [/\bwith\b|rice|pasta|noodle|stroganoff|lasagna|chili|stew|curry|skillet|breakfast|meal|entr|teriyaki|alfredo/, FREEZE_DRIED_MEAL],
    [/fruit|berr|banana|apple|peach|mango|pineapple|vegetable|veggie|broccoli|green bean|carrot|spinach|\bpeas\b/,
      { lb: 1500, pouches: 100, '#10 cans': 400, buckets: 2000, servings: 30, meals: 100, cupLb: 0.05 }],
    [/chicken|beef|turkey|pork|sausage|meat/, { lb: 1800, pouches: 250, '#10 cans': 1200, buckets: 6000, servings: 60, meals: 250 }],
    [ANY_NAME, FREEZE_DRIED_MEAL],
  ],
  'mre': [
    [/entr[eé]e/, { meals: 250, cases: 3000 }], // the main course only
    [/military|genuine|government|sure-?pak|xmre|1300/, { meals: 1100, cases: 13200 }],
    [ANY_NAME, { meals: 800, cases: 9600 }], // civilian MREs; cases of 12
  ],
  'garden-seeds': NOT_FOOD,

  // ----- Snacks -----
  'nut-butter': [
    [/powder|pb2/, { lb: 1800, jars: 700, cupLb: 0.2, servingLb: 0.026 }], // 6.5 oz jar
    [/nutella|hazelnut/, { lb: 2400, jars: 1900 }], // 13 oz jar
    [/almond|cashew|sunflower|tahini|sesame/, { lb: 2600, jars: 1800 }], // 12 oz jar
    [ANY_NAME, { lb: 2400, jars: 2400 }], // 16 oz jar of peanut butter
  ],
  'nuts': [
    [/trail mix/, { lb: 2000, bags: 950, cans: 950, jars: 950 }],
    [/sunflower|pumpkin|seeds/, { lb: 1400, bags: 500, cans: 700, jars: 700, cupLb: 0.1 }], // often still in the shell
    [/peanut|almond|cashew|walnut|pecan|pistachio|macadamia|hazelnut|mixed nuts/, { lb: 2400, bags: 1200, cans: 1200, jars: 1200 }],
    [ANY_NAME, { lb: 2100, bags: 1000, cans: 1000, jars: 1000 }], // 8 oz containers
  ],
  'bars': [
    // Emergency ration bars come as 400-calorie tablets in 2,400 or 3,600 calorie packs.
    [/emergency|ration|datrex|mainstay|survival|\bsos\b|lifeboat/, { lb: 2000, bars: 400, packs: 2400, boxes: 2400 }],
    [/protein|clif|kind|larabar|rxbar|quest|power|energy/, { lb: 1800, bars: 180, boxes: 1000 }], // boxes of 6
    [ANY_NAME, { lb: 1700, bars: 100, boxes: 600 }], // granola bars, boxes of 6
  ],
  'snacks': [
    [/popcorn/, { lb: 1700, bags: 300, boxes: 900, jars: 2500, cupLb: 0.02 }], // microwave bags, or a jar of kernels; cups are popped
    [/chip|crisp|dorito|frito|pringles|cheeto/, { lb: 2300, bags: 800, boxes: 800, cans: 700 }],
    [/cracker|saltine|ritz|triscuit|wheat thins|graham|goldfish/, { lb: 1900, boxes: 1000, bags: 800, sleeves: 450 }],
    [ANY_NAME, { lb: 1700, boxes: 900, bags: 600, sleeves: 450 }], // pretzels and mixed snacks
  ],
  'dried-fruit': [
    [/raisin|date|cranberr|craisin|\bfigs?\b|banana chip/, { lb: 1250, bags: 600, pouches: 600, boxes: 600 }], // 8 oz
    [ANY_NAME, { lb: 1100, bags: 400, pouches: 400 }], // 6 oz
  ],
  'jerky': [
    [/stick|slim jim|pepperoni|summer sausage/, { lb: 1600, sticks: 40, bags: 300 }],
    [ANY_NAME, { lb: 1100, bags: 200 }], // 3 oz bags
  ],

  // ----- Drinks -----
  'coffee-ground': NOT_FOOD,
  'coffee-instant': [
    [SUGAR_FREE, NOT_FOOD],
    [/cappuccino|latte|mocha|chai|creamer/, { lb: 1800, packets: 60, boxes: 480, jars: 1200 }],
    [ANY_NAME, NOT_FOOD], // instant coffee and tea have almost none
  ],
  'drink-mix': [
    [SUGAR_FREE, NOT_FOOD],
    [/cocoa|hot chocolate/, { lb: 1700, canisters: 1500, packets: 80, boxes: 640 }],
    [/gatorade|powerade|sports drink|\btang\b|lemonade|country time|iced tea|instant breakfast|carnation/,
      { lb: 1700, canisters: 1500, packets: 50, boxes: 400 }],
    [ANY_NAME, NOT_FOOD], // many drink mixes have few or no calories
  ],
  'baby': NOT_FOOD, // meant for an infant, not the household's meals

  // ----- Fresh -----
  'bread': [
    [/flour tortilla/, { lb: 1300, packs: 900, loaves: 900 }], // 8 tortillas
    [/tortilla/, { lb: 1000, packs: 600, loaves: 600 }], // 12 corn tortillas
    [/bagel/, { lb: 1200, packs: 1300, loaves: 1300 }], // 6 bagels
    [/\bbuns?\b|rolls?\b/, { lb: 1200, packs: 800, loaves: 800 }], // 8 buns
    [ANY_NAME, { lb: 1100, loaves: 1100, packs: 900 }], // 1 lb loaves
  ],
  'eggs': { lb: 600, dozen: 720, eggs: 60 },
  'dairy': [
    [/condensed/, { lb: 1450, cans: 1200, cupLb: 0.68, servingLb: 0.08 }], // 14 oz can, sweetened
    [/evaporated/, { lb: 600, cans: 450, servingLb: 0.07 }], // 12 oz can
    [/cheese/, { lb: 1100, blocks: 550, cupLb: 0.25, servingLb: 0.0625 }], // 8 oz blocks, shredded cup, 1 oz serving
    [/\bbutter\b/, { lb: 3200, sticks: 800, boxes: 3200, cupLb: 0.5, servingLb: 0.03 }], // 4 oz sticks, boxes of 4, 1 tbsp serving
    [/yogurt/, { lb: 250, cartons: 400, cups: 80 }],
    [/almond|oat milk|soy|rice milk|coconut/, { lb: 70, gallons: 480, 'half-gallons': 240, cartons: 120 }],
    [/whole/, { lb: 270, gallons: 2300, 'half-gallons': 1150, cartons: 230 }],
    [/2%|reduced[- ]fat/, { lb: 220, gallons: 1900, 'half-gallons': 950, cartons: 190 }],
    [ANY_NAME, { lb: 150, gallons: 1300, 'half-gallons': 650, cartons: 120 }], // skim milk
  ],
  'produce': [
    [/sweet potato|\byams?\b/, { lb: 380, bags: 1100 }], // 3 lb bags
    [/potato/, { lb: 330, bags: 1600 }], // 5 lb bags
    [/squash|pumpkin|\bapples?\b|beets?/, { lb: 200, bags: 600 }], // 3 lb bags
    [ANY_NAME, { lb: 170, bags: 340 }], // onions and carrots, 2 lb bags
  ],

  // ----- Cooking and fuel -----
  'stove-fuel': NOT_FOOD,
  'food-gear': NOT_FOOD,

  // ----- Other -----
  // Uses the figures for whatever type the name suggests (Spam → canned
  // meat), and otherwise this cautious default. See estimateCalories.
  'food-other': { lb: 500, cans: 150, boxes: 500, bags: 500, jars: 200, pouches: 150, servings: 100 },
};

// Pounds per cup and per label serving, for each type, so kitchen measures
// and servings can be estimated. Cups are for the food as stored (dry rice,
// not cooked), and servings follow typical labels: 1/4 cup of dry rice, 2 oz
// of pasta, 1/2 cup of canned vegetables, 2 tbsp of peanut butter. A profile
// can set its own `cupLb` or `servingLb` when it differs from its type.
// Types left out (bars, MREs, bread) aren't measured by the cup.
const MEASURES = {
  'canned-meat': { cup: 0.5, serving: 0.125 },
  'canned-veg': { cup: 0.5, serving: 0.28 },
  'canned-soup': { cup: 0.5, serving: 0.55 },
  'canned-fruit': { cup: 0.5, serving: 0.28 },
  'jarred': { cup: 0.55, serving: 0.03 },
  'rice-white': { cup: 0.41, serving: 0.1 },
  'rice-brown': { cup: 0.41, serving: 0.1 },
  'beans-dry': { cup: 0.42, serving: 0.077 },
  'pasta': { cup: 0.23, serving: 0.125 },
  'oats': { cup: 0.18, serving: 0.088 },
  'cereal': { cup: 0.07, serving: 0.066 },
  'flour': { cup: 0.27, serving: 0.066 },
  'powdered': { cup: 0.15, serving: 0.05 },
  'oil': { cup: 0.48, serving: 0.03 },
  'staples-none': { cup: 0.44, serving: 0.009 },
  'bulk-lt': { cup: 0.4, serving: 0.1 },
  'wheat': { cup: 0.42, serving: 0.1 },
  'freeze-dried': { cup: 0.1 },
  'nut-butter': { cup: 0.57, serving: 0.07 },
  'nuts': { cup: 0.31, serving: 0.0625 },
  'snacks': { cup: 0.06, serving: 0.0625 },
  'dried-fruit': { cup: 0.29, serving: 0.088 },
  'jerky': { cup: 0.1, serving: 0.0625 },
  'coffee-instant': { cup: 0.25, serving: 0.04 },
  'drink-mix': { cup: 0.25, serving: 0.06 },
  'bread': { serving: 0.066 },
  'eggs': { cup: 0.53, serving: 0.11 },
  'dairy': { cup: 0.54, serving: 0.54 },
  'produce': { cup: 0.33, serving: 0.33 },
  'food-other': { cup: 0.3, serving: 0.1 },
};

// Keys in a profile that aren't units.
const NOT_UNITS = new Set(['lb', 'cupLb', 'servingLb', 'none']);

function profileUnits(profile) {
  return Object.entries(profile).filter(([u]) => !NOT_UNITS.has(u));
}

// The smallest container the item comes in (a can rather than a #10 can),
// used for "each", a blank unit, and counts like "24-pack".
function smallestContainer(profile) {
  const values = profileUnits(profile)
    .filter(([u]) => !['serving', 'case'].includes(unitKey(u)))
    .map(([, cal]) => cal);
  return values.length ? Math.min(...values) : null;
}

// What a case holds: cans, jars, or bottles when the item comes in them.
function caseItem(profile) {
  const units = profileUnits(profile);
  for (const kind of ['can', 'jar', 'bottle']) {
    const hit = units.find(([u]) => unitKey(u) === kind);
    if (hit) return hit[1];
  }
  return smallestContainer(profile);
}

// Calories in a weight or volume, or null if it can't be measured.
function caloriesInMeasure(profile, type, amount, measure) {
  if (!profile.lb) return null;
  if (WEIGHT_IN_LB.has(measure)) return amount * WEIGHT_IN_LB.get(measure) * profile.lb;
  const cupLb = profile.cupLb ?? MEASURES[type]?.cup;
  if (cupLb && VOLUME_IN_CUPS.has(measure)) return amount * VOLUME_IN_CUPS.get(measure) * cupLb * profile.lb;
  return null;
}

function caloriesPerUnit(profile, type, unit) {
  const key = unitKey(unit);
  // 1. A unit the type lists, like "cans" or "#10 cans".
  const listed = profileUnits(profile).find(([u]) => unitKey(u) === key);
  if (listed) return listed[1];
  // 2. "Each", or no unit at all: one of the smallest container.
  if (EACH_WORDS.has(key)) return smallestContainer(profile);
  // 3. A case or dozen: 12 cans (or jars or bottles), else 12 of the smallest container.
  if (key === 'case' || key === 'dozen') {
    const one = caseItem(profile);
    return one === null ? null : 12 * one;
  }
  // 4. Servings, by the type's typical label serving.
  if (key === 'serving') {
    const servingLb = profile.servingLb ?? MEASURES[type]?.serving;
    return servingLb && profile.lb ? servingLb * profile.lb : null;
  }
  // 5. A weight or kitchen measure: lb, oz, cups, quarts, liters, and so on.
  const measured = caloriesInMeasure(profile, type, 1, key);
  if (measured !== null) return measured;
  // 6. A size or count written into the unit: "25 lb bags", "24-pack".
  const sized = parseUnitSize(unit);
  if (!sized) return null;
  const each = sized.measure
    ? caloriesInMeasure(profile, type, sized.amount, sized.measure)
    : /case/.test(unitKey(unit)) ? caseItem(profile) : smallestContainer(profile);
  return each === null ? null : each * (sized.count || 1);
}

// ----- Label figures, from a scanned barcode -----
// A scanned item can carry its label's figures from Open Food Facts:
// nutrition = { kcal, per, size }: calories per 100 g (or 100 mL), and the
// package's net weight in g (or volume in mL) when it's known. These are
// exact, so they're used instead of the type's cautious figures whenever the
// unit allows: one package (cans, jars, boxes, each…), a weight or volume,
// a case of 12, or a count written into the unit ("6-pack").

const PACKAGE_UNITS = new Set(['can', 'jar', 'box', 'bag', 'pouch', 'bottle', 'packet', 'package',
  'carton', 'tub', 'canister', 'bar', 'sleeve', 'meal']);
const G_PER_LB = 453.592;
const ML_PER_CUP = 236.588;

function labelCaloriesPerUnit(nutrition, unit) {
  const per100 = Number(nutrition?.kcal);
  if (!(per100 > 0)) return null;
  const pkg = Number(nutrition.size) > 0 ? (nutrition.size * per100) / 100 : null;
  const inAmount = (amount, measure) => {
    if (nutrition.per !== 'ml' && WEIGHT_IN_LB.has(measure)) return (amount * WEIGHT_IN_LB.get(measure) * G_PER_LB * per100) / 100;
    const volumeKey = measure === 'oz' || measure === 'ounce' ? 'fl oz' : measure;
    if (nutrition.per === 'ml' && VOLUME_IN_CUPS.has(volumeKey) && !['#10 can', 'bucket', 'mylar bag'].includes(volumeKey)) {
      return (amount * VOLUME_IN_CUPS.get(volumeKey) * ML_PER_CUP * per100) / 100;
    }
    return null;
  };
  const key = unitKey(unit);
  if (EACH_WORDS.has(key) || PACKAGE_UNITS.has(key)) return pkg;
  if (key === 'case' || key === 'dozen') return pkg === null ? null : 12 * pkg;
  const measured = inAmount(1, key);
  if (measured !== null) return measured;
  const sized = parseUnitSize(unit);
  if (!sized) return null;
  if (sized.measure) {
    const each = inAmount(sized.amount, sized.measure);
    return each === null ? null : each * (sized.count || 1);
  }
  return pkg === null ? null : pkg * sized.count;
}

// The figures for a type, picked by the item's name when the type has name
// patterns. Names are compared in lowercase, with "&" read as "and".
function calorieProfile(type, name) {
  const entry = FOOD_CALORIES[type];
  if (!Array.isArray(entry)) return entry || null;
  const text = String(name || '').toLowerCase().replace(/\s*&\s*/g, ' and ');
  return entry.find(([re]) => re.test(text))[1];
}

// Estimated calories for an item. Returns one of:
//   { calories, label? }       for the item's whole quantity (label: true
//                              when it came from a scanned label)
//   { none: true }             not counted as food (fuel, coffee, and so on)
//   { unknown: 'type' | 'unit' } a Food item the estimate can't work out
//   null                       not a Food item
function estimateCalories({ category, type, name, unit, quantity, nutrition }) {
  if (category !== 'Food') return null;
  const qty = Math.max(0, Number(quantity) || 0);

  // A scanned label's own figures, when the unit allows.
  if (nutrition) {
    const perUnit = labelCaloriesPerUnit(nutrition, unit);
    if (perUnit !== null) return { calories: qty * perUnit, label: true };
  }

  // "Other shelf-stable food": borrow the figures of the type the name
  // suggests, when that type is food and knows this unit.
  if (type === 'food-other') {
    const guess = guessType({ name, category });
    const borrowed = guess && guess !== 'food-other' ? calorieProfile(guess, name) : null;
    const perUnit = borrowed && !borrowed.none ? caloriesPerUnit(borrowed, guess, unit) : null;
    if (perUnit !== null) return { calories: qty * perUnit };
  }

  const profile = calorieProfile(type, name);
  if (!profile) return { unknown: 'type' };
  if (profile.none) return { none: true };
  const perUnit = caloriesPerUnit(profile, type, unit);
  if (perUnit === null) return { unknown: 'unit' };
  return { calories: qty * perUnit };
}
