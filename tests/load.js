// Loads the app's plain browser scripts into one sandbox, in the same order
// index.html does, and hands back the names the tests use. The scripts
// declare top-level consts and functions (no modules), so they share one
// global scope just as they do in the page.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const FILES = ['barcode.js', 'tiers.js', 'hazards.js', 'shelf-life.js', 'supply-match.js', 'household.js', 'go-bag.js', 'units.js', 'calories.js'];

function load() {
  const context = vm.createContext({});
  for (const file of FILES) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(code, context, { filename: file });
  }
  return vm.runInContext(`({
    BARCODE, TIERS, HAZARDS, normalizeHousehold, householdNeeds, forHousehold, householdText, supplyNameKey, ownsSupply, addedFrom, supplySections,
    GO_BAG, GO_BAG_HAZARDS, GO_BAG_LIMIT_L, GO_BAG_SIZES_L, goBagSections, goBagTotals, goBagSize, normalizeGoBag,
    ITEM_TYPES, TYPE_RULES, typesFor, findType, guessType, addToDate, toIsoDate, describeShelfLife, estimateExpiry,
    dropAbbreviationDots, unitKey, parseUnitSize, gallonsPerUnit, WEIGHT_IN_LB, VOLUME_IN_CUPS,
    FOOD_CALORIES, MEASURES, calorieProfile, caloriesPerUnit, labelCaloriesPerUnit, estimateCalories, estimateServings,
  })`, context);
}

module.exports = load();
