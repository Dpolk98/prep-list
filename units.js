// Unit handling shared by the days-of-water and calorie estimates.
//
// Units come from each type's list, or are typed in with "Other…", so they
// can be anything: "cups", "Qt.", "5-gallon jugs", "24-pack", "case of 12".
// These helpers turn them into something the estimates can measure.

// "lbs." → "lbs" and "fl. oz." → "fl oz", but "2.5" keeps its decimal point.
function dropAbbreviationDots(unit) {
  return String(unit || '').toLowerCase().replace(/([a-z])\./g, '$1');
}

// "Boxes", "box", "Box", and "boxes." all count as the same unit.
function unitKey(unit) {
  const u = dropAbbreviationDots(unit).trim().replace(/\s+/g, ' ');
  if (u === 'loaves') return 'loaf';
  if (u === 'half gallons' || u === 'half gallon') return 'half-gallon';
  return u.replace(/(x|ch|sh|ss)es$/, '$1').replace(/ies$/, 'y').replace(/s$/, '');
}

// Weights, in pounds.
const WEIGHT_IN_LB = new Map([
  ['lb', 1], ['pound', 1],
  ['oz', 1 / 16], ['ounce', 1 / 16],
  ['kg', 2.2046], ['kilo', 2.2046], ['kilogram', 2.2046],
  ['g', 0.0022046], ['gram', 0.0022046],
]);

// Volumes, in cups. The last few are common storage containers, sized on the
// small side: a #10 can holds about 13 cups, a 5-gallon bucket about 64 once
// you leave room at the top, and a 1-gallon mylar bag about 14.
const VOLUME_IN_CUPS = new Map([
  ['cup', 1], ['c', 1],
  ['tbsp', 1 / 16], ['tablespoon', 1 / 16], ['tsp', 1 / 48], ['teaspoon', 1 / 48],
  ['fl oz', 1 / 8], ['fluid ounce', 1 / 8],
  ['pint', 2], ['pt', 2], ['quart', 4], ['qt', 4],
  ['half-gallon', 8], ['gallon', 16], ['gal', 16],
  ['liter', 4.227], ['litre', 4.227], ['l', 4.227],
  ['ml', 0.004227], ['milliliter', 0.004227], ['millilitre', 0.004227],
  ['#10 can', 13], ['bucket', 64], ['mylar bag', 14],
]);

// Words that mean "one of whatever the item comes in".
const EACH_WORDS = new Set(['', 'each', 'ea', 'item', 'piece', 'pc', 'unit', 'ct', 'count', 'pack', 'package', 'pkg', 'container']);

// A size or count written into a unit: "5-gallon jugs" (5 gallons each),
// "25 lb bags", "16.9 oz bottles", "24-pack", "case of 12", "24 x 16.9 oz".
// Returns { amount, measure, count }, with null for any part that isn't there.
const SIZE_RE = /(\d+(?:\.\d+)?)\s*-?\s*(fl ?oz|fluid ounces?|oz|ounces?|lbs?|pounds?|kgs?|kilos?|kilograms?|g|grams?|gal|gallons?|l|liters?|litres?|ml|milliliters?|millilitres?|qts?|quarts?|pts?|pints?|cups?)\b/;
const COUNT_RES = [
  /(\d+)\s*-?\s*(?:pack|pk|ct|count)\b/,
  /\b(?:pack|case|box|carton|crate|tray|flat)(?:s|es)? of (\d+)/,
  /(\d+)\s*[x×]\s*(?=\d)/,
];

function parseUnitSize(unit) {
  const u = dropAbbreviationDots(unit);
  const size = u.match(SIZE_RE);
  const countMatch = COUNT_RES.map((re) => u.match(re)).find(Boolean);
  const count = countMatch ? Number(countMatch[1]) : null;
  if (!size && !count) return null;
  return {
    amount: size ? Number(size[1]) : null,
    measure: size ? unitKey(size[2]) : null,
    count,
  };
}

// ----- Water -----

// Gallons in one of a unit, or null if the unit can't be converted.
// Bottles, boxes, and cans are assumed to be 500 mL (16.9 oz), cases to hold
// 24 of them, and jugs to hold 1 gallon.
const WATER_GALLONS = new Map([
  ['bottle', 0.132], ['box', 0.132], ['can', 0.132], ['carton', 0.132], ['pouch', 0.132],
  ['case', 24 * 0.132], ['jug', 1],
]);

function gallonsInVolume(amount, measure) {
  // On water, a plain "oz" means fluid ounces.
  const key = measure === 'oz' || measure === 'ounce' ? 'fl oz' : measure;
  return VOLUME_IN_CUPS.has(key) ? (amount * VOLUME_IN_CUPS.get(key)) / 16 : null;
}

function gallonsPerUnit(unit) {
  const key = unitKey(unit);
  if (WATER_GALLONS.has(key)) return WATER_GALLONS.get(key);
  const direct = gallonsInVolume(1, key);
  if (direct !== null) return direct;
  const sized = parseUnitSize(unit);
  if (!sized) return null;
  const each = sized.measure ? gallonsInVolume(sized.amount, sized.measure) : WATER_GALLONS.get('bottle');
  return each === null ? null : each * (sized.count || 1);
}
