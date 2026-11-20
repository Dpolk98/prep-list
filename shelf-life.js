// Item types and shelf lives.
//
// Every inventory item has a type within its category (e.g. Food → "Canned
// meat & fish"). The type sets the estimated expiration date when no printed
// date is entered.
//
// Shelf lives are conservative, unopened, room-temperature figures drawn from
// common food-safety and manufacturer guidance (USDA FoodKeeper, CDC, FEMA).
// They are estimates only: a printed date on the package always wins.
//
//   months / days: shelf life
//   none: true     the item normally doesn't expire (no date is set)
//   group:         optional heading in the dropdown

const ITEM_TYPES = {
  Food: [
    { id: 'canned-meat', group: 'Canned & jarred', name: 'Canned meat & fish', months: 36 },
    { id: 'canned-veg', group: 'Canned & jarred', name: 'Canned vegetables & beans', months: 36 },
    { id: 'canned-soup', group: 'Canned & jarred', name: 'Canned soups, stews & chili', months: 36 },
    { id: 'canned-fruit', group: 'Canned & jarred', name: 'Canned fruit, tomatoes & juice', months: 18 },
    { id: 'jarred', group: 'Canned & jarred', name: 'Jarred sauces & pickles', months: 18 },

    { id: 'rice-white', group: 'Dry staples', name: 'White rice (bagged)', months: 24 },
    { id: 'rice-brown', group: 'Dry staples', name: 'Brown rice', months: 6 },
    { id: 'beans-dry', group: 'Dry staples', name: 'Dried beans & lentils', months: 24 },
    { id: 'pasta', group: 'Dry staples', name: 'Pasta & noodles', months: 24 },
    { id: 'oats', group: 'Dry staples', name: 'Oats', months: 12 },
    { id: 'cereal', group: 'Dry staples', name: 'Cereal & granola', months: 6 },
    { id: 'flour', group: 'Dry staples', name: 'Flour & baking mixes', months: 12 },
    { id: 'powdered', group: 'Dry staples', name: 'Powdered milk & eggs', months: 24 },
    { id: 'oil', group: 'Dry staples', name: 'Cooking oil & shortening', months: 12 },
    { id: 'spices', group: 'Dry staples', name: 'Spices & bouillon', months: 24 },
    { id: 'staples-none', group: 'Dry staples', name: 'Salt, sugar, honey & vinegar', none: true },

    { id: 'bulk-lt', group: 'Long-term storage', name: 'Grains & beans sealed in mylar or buckets', months: 300 },
    { id: 'wheat', group: 'Long-term storage', name: 'Whole wheat berries', months: 120 },
    { id: 'freeze-dried', group: 'Long-term storage', name: 'Freeze-dried meals', months: 300 },
    { id: 'mre', group: 'Long-term storage', name: 'MREs', months: 60 },
    { id: 'garden-seeds', group: 'Long-term storage', name: 'Garden seeds', months: 36 },

    { id: 'nut-butter', group: 'Snacks', name: 'Peanut & nut butters', months: 9 },
    { id: 'nuts', group: 'Snacks', name: 'Nuts & trail mix', months: 6 },
    { id: 'bars', group: 'Snacks', name: 'Granola & protein bars', months: 12 },
    { id: 'snacks', group: 'Snacks', name: 'Crackers, chips & pretzels', months: 8 },
    { id: 'dried-fruit', group: 'Snacks', name: 'Dried fruit', months: 12 },
    { id: 'jerky', group: 'Snacks', name: 'Jerky & dried meat', months: 12 },

    { id: 'coffee-ground', group: 'Drinks', name: 'Ground coffee', months: 5 },
    { id: 'coffee-instant', group: 'Drinks', name: 'Instant coffee & tea', months: 24 },
    { id: 'drink-mix', group: 'Drinks', name: 'Drink mixes & cocoa', months: 24 },
    { id: 'baby', group: 'Drinks', name: 'Infant formula & baby food', months: 12 },

    { id: 'bread', group: 'Fresh', name: 'Bread & tortillas', days: 7 },
    { id: 'eggs', group: 'Fresh', name: 'Fresh eggs (refrigerated)', days: 35 },
    { id: 'dairy', group: 'Fresh', name: 'Milk & dairy (refrigerated)', days: 7 },
    { id: 'produce', group: 'Fresh', name: 'Potatoes, onions & root vegetables', days: 60 },

    { id: 'food-gear', group: 'Other', name: 'Cooking & food-production equipment', none: true },
    { id: 'food-other', group: 'Other', name: 'Other shelf-stable food', months: 12 },
  ],
  Water: [
    { id: 'bottled', name: 'Commercially bottled water', months: 24 },
    { id: 'jugs', name: 'Store-bought gallon jugs', months: 12 },
    { id: 'water-box', name: 'Canned or boxed emergency water', months: 60 },
    { id: 'home-filled', name: 'Home-filled containers', months: 6 },
    { id: 'tablets', name: 'Purification tablets & drops', months: 48 },
    { id: 'bleach', name: 'Bleach for purifying', months: 12 },
    { id: 'filter', name: 'Filters & purifiers', none: true },
    { id: 'containers', name: 'Pumps, barrels, tanks & rain catchment', none: true },
  ],
  'Medical & First Aid': [
    { id: 'otc', name: 'Over-the-counter medicine', months: 24 },
    { id: 'rx', name: 'Prescription medicine', months: 12 },
    { id: 'ointment', name: 'Ointments & creams', months: 24 },
    { id: 'antiseptic', name: 'Antiseptics & alcohol wipes', months: 24 },
    { id: 'bandages', name: 'Bandages, gauze & dressings', months: 60 },
    { id: 'electrolytes', name: 'Electrolytes & oral rehydration', months: 24 },
    { id: 'vitamins', name: 'Vitamins & supplements', months: 24 },
    { id: 'sunscreen', name: 'Sunscreen & insect repellent', months: 36 },
    { id: 'ki', name: 'Potassium iodide', months: 84 },
    { id: 'med-gear', name: 'Kits, tools & equipment', none: true },
    { id: 'med-other', name: 'Other medical', none: true },
  ],
  'Toiletries & Hygiene': [
    { id: 'toilet-paper', name: 'Toilet paper & paper towels', none: true },
    { id: 'wipes', name: 'Wet wipes', months: 24 },
    { id: 'sanitizer', name: 'Hand sanitizer', months: 36 },
    { id: 'soap', name: 'Soap & body wash', months: 36 },
    { id: 'oral', name: 'Toothpaste & mouthwash', months: 24 },
    { id: 'hair', name: 'Shampoo & conditioner', months: 36 },
    { id: 'deodorant', name: 'Deodorant', months: 36 },
    { id: 'menstrual', name: 'Menstrual products', months: 60 },
    { id: 'diapers', name: 'Diapers', none: true },
    { id: 'cleaning', name: 'Cleaning supplies & disinfectant', months: 24 },
    { id: 'sanitation', name: 'Sanitation (bags, bucket, litter)', none: true },
    { id: 'hyg-other', name: 'Other hygiene', none: true },
  ],
  'Light & Power': [
    { id: 'alkaline', name: 'Alkaline batteries', months: 120 },
    { id: 'lithium', name: 'Lithium batteries', months: 180 },
    { id: 'rechargeable', name: 'Rechargeables & power banks', none: true },
    { id: 'lights', name: 'Flashlights, headlamps & lanterns', none: true },
    { id: 'radio', name: 'Radios', none: true },
    { id: 'solar', name: 'Solar, generators & power systems', none: true },
    { id: 'gasoline', name: 'Gasoline', months: 6 },
    { id: 'gas-stab', name: 'Gasoline with stabilizer', months: 24 },
    { id: 'diesel', name: 'Diesel', months: 12 },
    { id: 'kerosene', name: 'Kerosene', months: 60 },
    { id: 'propane', name: 'Propane & butane', none: true },
    { id: 'candles', name: 'Candles, matches & lighters', none: true },
    { id: 'glow', name: 'Glow sticks', months: 24 },
    { id: 'power-other', name: 'Other light & power', none: true },
  ],
  'Tools & Gear': [
    { id: 'hand-tools', name: 'Hand tools & multitools', none: true },
    { id: 'shelter', name: 'Tents, tarps & sleeping gear', none: true },
    { id: 'clothing', name: 'Clothing, gloves & blankets', none: true },
    { id: 'cooking', name: 'Stoves & cookware', none: true },
    { id: 'fire', name: 'Fire starting', none: true },
    { id: 'masks', name: 'Masks & respirators', months: 60 },
    { id: 'extinguisher', name: 'Fire extinguishers', months: 144 },
    { id: 'bags', name: 'Bags & go-bags', none: true },
    { id: 'tools-other', name: 'Other tools & gear', none: true },
  ],
  'Documents & Cash': [
    { id: 'ids', name: 'IDs & document copies', none: true },
    { id: 'cash', name: 'Cash', none: true },
    { id: 'maps', name: 'Maps & reference books', none: true },
    { id: 'digital', name: 'Digital backups', none: true },
  ],
  Other: [
    { id: 'pet-food', name: 'Pet food (dry)', months: 12 },
    { id: 'pet-supplies', name: 'Pet supplies', none: true },
    { id: 'baby-supplies', name: 'Baby supplies', none: true },
    { id: 'entertainment', name: 'Books & games', none: true },
    { id: 'other-other', name: 'Other', none: true },
  ],
};

// Suggests a type from the item's name and unit. Checked in order within the
// item's category; the FIRST match wins, so specific patterns come first
// ("canned peaches" before "canned", "can opener" before anything canned).
const TYPE_RULES = {
  Food: [
    [/opener|plates?\b|cups?\b|utensil|napkin|\bfoil\b|stove|cast[- ]iron|\bpot\b|\bpan\b|canner|dehydrator|grain mill|\bcoop\b|chickens\b|root cellar|fishing|hunting|seed-saving/, 'food-gear'],
    [/freeze[- ]?dried|mountain house|#10 can/, 'freeze-dried'],
    [/\bmres?\b|meals? ready/, 'mre'],
    [/mylar|bucket|long[- ]term|sealed/, 'bulk-lt'],
    [/wheat berr|hard red|hard white/, 'wheat'],
    [/heirloom|garden seed|seed packet|vegetable seed|\bseeds\b(?!.*(sunflower|pumpkin|chia))/, 'garden-seeds'],
    [/powdered (milk|egg)|dry milk|milk powder|egg powder/, 'powdered'],
    [/dried fruit|raisin|prune/, 'dried-fruit'],
    [/jerky/, 'jerky'],
    [/soup|stew|chili/, 'canned-soup'],
    [/tomato|fruit|peach|pear|pineapple|applesauce|cranberr|juice/, 'canned-fruit'],
    [/pickle|salsa|pasta sauce|jarred|sauerkraut/, 'jarred'],
    [/tuna|sardine|salmon|spam|vienna|(canned|\bcans?\b).*(meat|chicken|beef|ham|fish|turkey)|(meat|chicken|beef|ham|fish|turkey).*\bcans?\b/, 'canned-meat'],
    [/\bcans?\b|canned/, 'canned-veg'],
    [/brown rice/, 'rice-brown'],
    [/rice/, 'rice-white'],
    [/bean|lentil|split pea|chickpea/, 'beans-dry'],
    [/pasta|spaghetti|macaroni|noodle|ramen/, 'pasta'],
    [/\bbars?\b/, 'bars'],
    [/\boats?\b|oatmeal/, 'oats'],
    [/cereal|granola/, 'cereal'],
    [/flour|cornmeal|pancake|baking mix|biscuit mix/, 'flour'],
    [/peanut butter|nut butter|almond butter/, 'nut-butter'],
    [/\bnuts?\b|almond|cashew|pecan|walnut|peanuts|trail mix|sunflower|pumpkin seed/, 'nuts'],
    [/cracker|pretzel|chips|popcorn/, 'snacks'],
    [/instant coffee|\btea\b/, 'coffee-instant'],
    [/coffee/, 'coffee-ground'],
    [/drink mix|gatorade|kool|lemonade|cocoa|hot chocolate/, 'drink-mix'],
    [/formula|baby food/, 'baby'],
    [/\boil\b|shortening|\blard\b/, 'oil'],
    [/spice|bouillon|seasoning|pepper/, 'spices'],
    [/\bsalt\b|sugar|honey|vinegar|baking soda|cornstarch|corn starch/, 'staples-none'],
    [/bread|tortilla/, 'bread'],
    [/\beggs?\b/, 'eggs'],
    [/\bmilk\b|cheese|yogurt|\bbutter\b/, 'dairy'],
    [/potato|onion|carrot|squash|\bapples?\b/, 'produce'],
  ],
  Water: [
    [/tablet|aquatab|purification|chlorine dioxide|iodine|drops/, 'tablets'],
    [/bleach/, 'bleach'],
    [/filter|straw|purifier|sawyer|berkey|\buv\b|distiller|test strip/, 'filter'],
    [/barrel|drum|tank|cistern|rain|pump|\bwell\b|spring box/, 'containers'],
    [/boxed|\bbox\b|canned water|carton|pouch/, 'water-box'],
    [/container|refill|home|tap/, 'home-filled'],
    [/bottle|case|purified|spring|distilled/, 'bottled'],
    [/jug|gallon/, 'jugs'],
  ],
  'Medical & First Aid': [
    [/prescription|\brx\b/, 'rx'],
    [/potassium iodide/, 'ki'],
    [/electrolyte|rehydration|pedialyte/, 'electrolytes'],
    [/vitamin|supplement/, 'vitamins'],
    [/sunscreen|repellent|deet/, 'sunscreen'],
    [/peroxide|alcohol|antiseptic|iodine|betadine|wipes|chlorhexidine/, 'antiseptic'],
    [/ointment|neosporin|antibiotic|hydrocortisone|burn|cream|\bgel\b/, 'ointment'],
    [/bandage|band-aid|gauze|dressing|steri|tape|moleskin|wound/, 'bandages'],
    [/herb|garden/, 'med-other'],
    [/\bkit\b|thermometer|tourniquet|splint|scissors|tweezer|stethoscope|chest seal|blood pressure|glasses|contacts?\b|book|reference|advanced|equipment|supplies/, 'med-gear'],
    [/medicine|medication|\bpills?\b|tablet|ibuprofen|advil|motrin|acetaminophen|tylenol|aspirin|naproxen|aleve|antihistamine|benadryl|claritin|zyrtec|allergy|imodium|loperamide|pepto|antacid|tums|antidiarrheal|cough|pain|fever/, 'otc'],
  ],
  'Toiletries & Hygiene': [
    [/toilet paper|paper towel|tissue/, 'toilet-paper'],
    [/wipes/, 'wipes'],
    [/sanitizer/, 'sanitizer'],
    [/toothpaste|mouthwash|floss|toothbrush/, 'oral'],
    [/shampoo|conditioner/, 'hair'],
    [/deodorant/, 'deodorant'],
    [/tampon|\bpads?\b|menstrual|period/, 'menstrual'],
    [/diaper/, 'diapers'],
    [/wringer|washing machine|washboard|drying line|clothesline/, 'hyg-other'],
    [/disinfect|bleach|cleaner|lysol|laundry|detergent/, 'cleaning'],
    [/bucket|toilet|litter|sawdust|garbage|trash|\bbags?\b/, 'sanitation'],
    [/soap|body wash/, 'soap'],
  ],
  'Light & Power': [
    [/lithium/, 'lithium'],
    [/power bank|rechargeable|battery bank|power station|deep[- ]cycle/, 'rechargeable'],
    [/batter|\baa\b|\baaa\b|\b9v\b|\b[cd] cell/, 'alkaline'],
    [/stabiliz/, 'gas-stab'],
    [/gas(oline)?\b|petrol/, 'gasoline'],
    [/diesel/, 'diesel'],
    [/kerosene/, 'kerosene'],
    [/propane|butane/, 'propane'],
    [/candle|match|lighter/, 'candles'],
    [/glow ?stick|light ?stick/, 'glow'],
    [/radio/, 'radio'],
    [/solar|generator|panel|inverter|charger|power source|component|\bwind\b|hydro/, 'solar'],
    [/flashlight|headlamp|lantern|light/, 'lights'],
  ],
  'Tools & Gear': [
    [/extinguisher/, 'extinguisher'],
    [/mask|respirator|n95/, 'masks'],
    [/tent|tarp|sleeping|bivy|hammock|shelter/, 'shelter'],
    [/blanket|clothing|jacket|boots|gloves|socks|poncho|rain gear/, 'clothing'],
    [/stove|cookware|\bpot\b|\bpan\b|grill|cast[- ]iron/, 'cooking'],
    [/fire ?starter|ferro|flint|tinder/, 'fire'],
    [/go-?bag|backpack|\bbag\b|\bpack\b/, 'bags'],
    [/tool|knife|axe|saw|hammer|wrench|shovel|tape|rope|cord|whistle|repair|workshop/, 'hand-tools'],
    [/sewing|fabric|\bfan\b|spare|parts/, 'tools-other'],
  ],
  'Documents & Cash': [
    [/cash|bills|money|coins/, 'cash'],
    [/usb|drive|digital|backup|scan/, 'digital'],
    [/map|book|guide|reference/, 'maps'],
    [/\bids?\b|passport|license|insurance|deed|title|birth|record|cop(y|ies)|document|contact|pouch/, 'ids'],
  ],
  Other: [
    [/pet food|dog food|cat food|kibble/, 'pet-food'],
    [/pet|leash|\bcat\b|\bdog\b/, 'pet-supplies'],
    [/baby|formula|diaper/, 'baby-supplies'],
    [/book|game|cards|puzzle/, 'entertainment'],
    [/./, 'other-other'],
  ],
};

function typesFor(category) {
  return ITEM_TYPES[category] || [];
}

function findType(category, id) {
  return typesFor(category).find((t) => t.id === id) || null;
}

// Best-guess type id for a name, or null if nothing matches.
function guessType({ name, unit, category }) {
  const text = `${name || ''} ${unit || ''}`.toLowerCase().trim();
  if (!text) return null;
  const hit = (TYPE_RULES[category] || []).find(([re]) => re.test(text));
  return hit ? hit[1] : null;
}

function addToDate(base, { months = 0, days = 0 }) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (months) {
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    // Clamp to the last day of the month (e.g. Jan 31 + 1 month = Feb 28).
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
  }
  if (days) d.setDate(d.getDate() + days);
  return d;
}

function toIsoDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function describeShelfLife({ months, days }) {
  if (days) return days % 7 === 0 ? `${days / 7} week${days === 7 ? '' : 's'}` : `${days} days`;
  if (months >= 24 && months % 12 === 0) return `${months / 12} years`;
  if (months >= 24) return `${(months / 12).toFixed(1)} years`;
  if (months === 12) return '1 year';
  return `${months} month${months === 1 ? '' : 's'}`;
}

// Estimated expiration for an item of a given type. Returns one of:
//   { date: 'YYYY-MM-DD', label, life }  an estimated expiration
//   { none: true, label }                this type normally doesn't expire
//   null                                 unknown type
// `from` is the date the item was added (defaults to today).
function estimateExpiry({ category, type }, from = new Date()) {
  const t = findType(category, type);
  if (!t) return null;
  if (t.none) return { none: true, label: t.name };
  return { date: toIsoDate(addToDate(from, t)), label: t.name, life: describeShelfLife(t) };
}
