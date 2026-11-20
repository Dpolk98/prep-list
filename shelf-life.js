// Typical shelf lives, used to estimate an expiration date when none is entered.
//
// Values are conservative, unopened, room-temperature figures drawn from common
// food-safety and manufacturer guidance (e.g. USDA FoodKeeper, CDC, FEMA). They
// are estimates only: a printed date on the package always wins.
//
// Rules are checked in order and the FIRST match wins, so specific rules must
// come before general ones ("canned peaches" before "canned", "can opener"
// before anything with "can"). Each rule matches against "<name> <unit>".
//
//   match:  RegExp tested against the lowercased name + unit
//   cats:   optional list of categories the rule applies to
//   months / days: shelf life
//   none:   true = this item normally doesn't expire (no date is set)
//   label:  shown to the user as the basis for the estimate

const SHELF_LIFE_RULES = [
  // --- Things that don't expire (checked first to avoid false matches) ---
  { match: /opener|propane|butane|candle|\bmatches\b|lighter|\bsalt\b|sugar|honey|vinegar|baking soda|lamp oil|power bank|battery bank|rechargeable|solar|generator|water filter|filter straw|lifestraw|cartridge/, none: true, label: 'usually doesn’t expire' },

  // --- Water ---
  { match: /tablet|aquatab|purification|chlorine dioxide|iodine/, cats: ['Water', 'Medical & First Aid'], months: 48, label: 'water purification tablets' },
  { match: /bleach/, months: 12, label: 'bleach (loses strength over time)' },
  { match: /bottle|case|purified|spring|distilled|boxed|pouch/, cats: ['Water'], months: 24, label: 'commercially bottled water' },
  { match: /jug|gallon/, cats: ['Water'], months: 12, label: 'store-bought water jugs' },

  // --- Food: long-term storage ---
  { match: /freeze[- ]?dried|mountain house|#10 can/, cats: ['Food'], months: 300, label: 'freeze-dried food' },
  { match: /\bmres?\b|meals? ready/, cats: ['Food'], months: 60, label: 'MREs' },
  { match: /powdered egg|egg powder/, cats: ['Food'], months: 60, label: 'powdered eggs' },
  { match: /wheat berr|hard red|hard white/, cats: ['Food'], months: 120, label: 'whole wheat berries' },

  // --- Food: canned and jarred ---
  { match: /dried fruit|raisin|prune/, cats: ['Food'], months: 12, label: 'dried fruit' },
  { match: /tomato|fruit|peach|pear|pineapple|applesauce|juice|pickle|sauerkraut|cranberr/, cats: ['Food'], months: 18, label: 'high-acid canned or jarred food' },
  { match: /\bcans?\b|canned|soup|spam|tuna|sardine|salmon|chili|stew|vienna/, cats: ['Food'], months: 36, label: 'low-acid canned goods' },

  // --- Food: dry goods ---
  { match: /brown rice/, cats: ['Food'], months: 6, label: 'brown rice' },
  { match: /rice/, cats: ['Food'], months: 24, label: 'white rice (pantry)' },
  { match: /flour|cornmeal|pancake mix|biscuit mix/, cats: ['Food'], months: 12, label: 'flour and baking mixes' },
  { match: /bean|lentil|split pea|chickpea/, cats: ['Food'], months: 24, label: 'dried beans and lentils' },
  { match: /pasta|spaghetti|macaroni|noodle|ramen/, cats: ['Food'], months: 24, label: 'dry pasta' },
  { match: /\boats?\b|oatmeal/, cats: ['Food'], months: 12, label: 'oats' },
  { match: /powdered milk|dry milk|milk powder/, cats: ['Food'], months: 24, label: 'powdered milk' },
  { match: /peanut butter|nut butter/, cats: ['Food'], months: 9, label: 'peanut butter (unopened)' },
  { match: /\bnuts?\b|almond|cashew|pecan|walnut|trail mix/, cats: ['Food'], months: 6, label: 'nuts' },
  { match: /jerky/, cats: ['Food'], months: 12, label: 'jerky' },
  { match: /\bbars?\b|granola/, cats: ['Food'], months: 12, label: 'granola and protein bars' },
  { match: /cracker|pretzel|chips/, cats: ['Food'], months: 8, label: 'crackers and snacks' },
  { match: /cereal/, cats: ['Food'], months: 6, label: 'cereal' },
  { match: /instant coffee/, cats: ['Food'], months: 24, label: 'instant coffee' },
  { match: /coffee/, cats: ['Food'], months: 5, label: 'ground coffee (unopened)' },
  { match: /\btea\b/, cats: ['Food'], months: 24, label: 'tea' },
  { match: /formula/, cats: ['Food'], months: 12, label: 'infant formula (check the printed date)' },
  { match: /pet food|dog food|cat food|kibble/, cats: ['Food', 'Other'], months: 12, label: 'dry pet food' },
  { match: /\boil\b|shortening/, cats: ['Food'], months: 12, label: 'cooking oil' },

  // --- Food: fresh ---
  { match: /bread|tortilla/, cats: ['Food'], days: 7, label: 'fresh bread' },
  { match: /\beggs?\b/, cats: ['Food'], days: 35, label: 'fresh eggs (refrigerated)' },
  { match: /\bmilk\b/, cats: ['Food'], days: 7, label: 'fresh milk (refrigerated)' },
  { match: /potato|onion/, cats: ['Food'], days: 60, label: 'potatoes and onions (cool, dark storage)' },

  // --- Medical & first aid ---
  { match: /prescription|\brx\b/, months: 12, label: 'prescription medication (check the label)' },
  { match: /potassium iodide/, months: 84, label: 'potassium iodide' },
  { match: /electrolyte|rehydration|pedialyte/, months: 24, label: 'electrolyte packets' },
  { match: /ibuprofen|advil|motrin|acetaminophen|tylenol|aspirin|naproxen|aleve|antihistamine|benadryl|diphenhydramine|loratadine|claritin|cetirizine|zyrtec|imodium|loperamide|pepto|antacid|tums|cough|allergy|pain reliever|medicine|medication|\bpills?\b|tablets?/, months: 24, label: 'over-the-counter medicine' },
  { match: /ointment|neosporin|antibiotic|hydrocortisone|burn gel|cream/, months: 24, label: 'ointments and creams' },
  { match: /peroxide/, months: 36, label: 'hydrogen peroxide (unopened)' },
  { match: /rubbing alcohol|isopropyl|alcohol (pads|wipes|prep)/, months: 24, label: 'rubbing alcohol' },
  { match: /sunscreen/, months: 36, label: 'sunscreen' },
  { match: /sanitizer/, months: 36, label: 'hand sanitizer' },
  { match: /vitamin|supplement/, months: 24, label: 'vitamins' },
  { match: /bandage|band-aid|gauze|dressing|steri/, months: 60, label: 'sterile bandages and gauze' },

  // --- Toiletries & hygiene ---
  { match: /toothpaste/, months: 24, label: 'toothpaste' },
  { match: /mouthwash/, months: 24, label: 'mouthwash' },
  { match: /wipes/, months: 24, label: 'wet wipes (dry out over time)' },
  { match: /shampoo|conditioner|body wash/, months: 36, label: 'shampoo and body wash' },
  { match: /soap/, months: 36, label: 'soap' },
  { match: /contact solution|saline/, months: 24, label: 'saline solution' },
  { match: /tampon/, months: 60, label: 'tampons' },

  // --- Light & power ---
  { match: /lithium/, months: 180, label: 'lithium batteries' },
  { match: /batter|\baa\b|\baaa\b|\b9v\b/, months: 120, label: 'alkaline batteries' },
  { match: /stabiliz/, months: 24, label: 'fuel with stabilizer' },
  { match: /gas(oline)?\b|petrol/, months: 6, label: 'gasoline (3–6 months without stabilizer)' },
  { match: /diesel/, months: 12, label: 'diesel' },
  { match: /kerosene/, months: 60, label: 'kerosene (sealed container)' },
  { match: /glow ?stick|light ?stick/, months: 24, label: 'glow sticks' },
];

// Fallbacks by category when no rule matches.
const SHELF_LIFE_FALLBACKS = {
  Food: { months: 12, label: 'shelf-stable food (general)' },
  Water: { months: 6, label: 'home-filled stored water (replace every 6 months)' },
};

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

// Returns one of:
//   { date: 'YYYY-MM-DD', label, life }  an estimated expiration
//   { none: true, label }                the item normally doesn't expire
//   null                                 no estimate available
// `from` is the date the item was added (defaults to today).
function estimateExpiry({ name, unit, category }, from = new Date()) {
  const text = `${name || ''} ${unit || ''}`.toLowerCase().trim();
  if (!text) return null;

  const rule =
    SHELF_LIFE_RULES.find((r) => (!r.cats || r.cats.includes(category)) && r.match.test(text)) ||
    SHELF_LIFE_FALLBACKS[category];
  if (!rule) return null;
  if (rule.none) return { none: true, label: rule.label };

  return {
    date: toIsoDate(addToDate(from, rule)),
    label: rule.label,
    life: describeShelfLife(rule),
  };
}
