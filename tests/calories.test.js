const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ITEM_TYPES, FOOD_CALORIES, MEASURES, calorieProfile, caloriesPerUnit, labelCaloriesPerUnit,
  estimateCalories, estimateServings,
} = require('./load.js');

const close = (actual, expected, eps = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);
const food = (fields) => estimateCalories({ category: 'Food', ...fields });

// ----- The tables themselves -----

test('every Food type has calorie figures, and every name list ends with a catch-all', () => {
  for (const t of ITEM_TYPES.Food) {
    const entry = FOOD_CALORIES[t.id];
    assert.ok(entry, `no calorie figures for ${t.id}`);
    if (Array.isArray(entry)) {
      const [last] = entry[entry.length - 1];
      assert.ok(last.test(''), `${t.id}'s last pattern does not match every name`);
    }
  }
  for (const id of Object.keys(FOOD_CALORIES)) {
    assert.ok(ITEM_TYPES.Food.some((t) => t.id === id), `calorie figures for unknown type ${id}`);
  }
  for (const id of Object.keys(MEASURES)) {
    assert.ok(id in FOOD_CALORIES, `MEASURES has unknown type ${id}`);
  }
});

test('every unit a Food type offers gets an estimate', () => {
  for (const t of ITEM_TYPES.Food) {
    const profile = calorieProfile(t.id, '');
    if (!profile || profile.none) continue;
    for (const u of t.units) {
      const unit = Array.isArray(u) ? u[0] : u;
      const perUnit = caloriesPerUnit(profile, t.id, unit);
      assert.ok(perUnit > 0, `${t.id} in ${unit} has no estimate`);
    }
  }
});

// ----- Picking figures by name -----

test('calorieProfile picks figures by the item name, first match wins', () => {
  assert.equal(calorieProfile('canned-meat', 'SPAM Classic').cans, 1000);
  assert.equal(calorieProfile('canned-meat', 'Chunk light tuna').cans, 120);
  assert.equal(calorieProfile('canned-veg', 'Green beans').cans, 80);
  assert.equal(calorieProfile('canned-veg', 'Black beans').cans, 320);
  // "&" reads as "and".
  assert.equal(calorieProfile('canned-veg', 'Pork & Beans').cans, 400);
  assert.equal(calorieProfile('eggs', 'anything').dozen, 720);
  assert.equal(calorieProfile('nope', 'x'), null);
});

// ----- Per-unit figures -----

test('caloriesPerUnit: listed units, each, cases, and servings', () => {
  const tuna = calorieProfile('canned-meat', 'tuna');
  assert.equal(caloriesPerUnit(tuna, 'canned-meat', 'Cans'), 120);
  assert.equal(caloriesPerUnit(tuna, 'canned-meat', '#10 cans'), 1000);
  // "each" and a blank unit are one of the smallest container (a pouch).
  assert.equal(caloriesPerUnit(tuna, 'canned-meat', 'each'), 70);
  assert.equal(caloriesPerUnit(tuna, 'canned-meat', ''), 70);
  // A case is 12 cans.
  assert.equal(caloriesPerUnit(tuna, 'canned-meat', 'case'), 1440);
  assert.equal(caloriesPerUnit(tuna, 'canned-meat', 'case of 12'), 1440);
  assert.equal(caloriesPerUnit(tuna, 'canned-meat', 'dozen'), 1440);
  // A count with no case is that many of the smallest container.
  assert.equal(caloriesPerUnit(tuna, 'canned-meat', '24-pack'), 24 * 70);
  // A serving is the type's serving weight times calories per pound.
  close(caloriesPerUnit(tuna, 'canned-meat', 'servings'), 0.125 * 450);
});

test('caloriesPerUnit: weights, volumes, and sizes written into the unit', () => {
  const rice = calorieProfile('rice-white', 'Long grain white rice');
  assert.equal(caloriesPerUnit(rice, 'rice-white', 'lbs.'), 1600);
  close(caloriesPerUnit(rice, 'rice-white', 'oz'), 100);
  close(caloriesPerUnit(rice, 'rice-white', 'kg'), 2.2046 * 1600);
  close(caloriesPerUnit(rice, 'rice-white', 'cups'), 0.41 * 1600);
  close(caloriesPerUnit(rice, 'rice-white', 'quarts'), 4 * 0.41 * 1600);
  assert.equal(caloriesPerUnit(rice, 'rice-white', '25 lb bags'), 25 * 1600);
  close(caloriesPerUnit(rice, 'rice-white', '4 x 2 lb bags'), 4 * 2 * 1600);
});

test('caloriesPerUnit returns null when the unit cannot be worked out', () => {
  const rice = calorieProfile('rice-white', 'rice');
  assert.equal(caloriesPerUnit(rice, 'rice-white', 'tablets'), null);
  // Bars have no cup measure.
  const mre = calorieProfile('mre', 'MRE');
  assert.equal(caloriesPerUnit(mre, 'mre', 'cups'), null);
});

// ----- Label figures from a scan -----

test('labelCaloriesPerUnit uses the package size for package units', () => {
  const label = { kcal: 200, per: 'g', size: 400 };
  assert.equal(labelCaloriesPerUnit(label, 'cans'), 800);
  assert.equal(labelCaloriesPerUnit(label, 'each'), 800);
  assert.equal(labelCaloriesPerUnit(label, 'case'), 12 * 800);
  assert.equal(labelCaloriesPerUnit(label, '6-pack'), 6 * 800);
});

test('labelCaloriesPerUnit converts weights for solids and volumes for liquids', () => {
  close(labelCaloriesPerUnit({ kcal: 100, per: 'g' }, 'lbs'), 453.592);
  close(labelCaloriesPerUnit({ kcal: 100, per: 'g' }, '2 kg bags'), 2 * 2.2046 * 453.592);
  close(labelCaloriesPerUnit({ kcal: 40, per: 'ml' }, 'cups'), 236.588 * 0.4);
  // On a liquid label a plain "oz" means fluid ounces.
  close(labelCaloriesPerUnit({ kcal: 40, per: 'ml' }, '12 oz cans'), 12 / 8 * 236.588 * 0.4);
  // Solids aren't measured by volume, and liquids aren't weighed.
  assert.equal(labelCaloriesPerUnit({ kcal: 100, per: 'g' }, 'cups'), null);
  assert.equal(labelCaloriesPerUnit({ kcal: 40, per: 'ml' }, 'lbs'), null);
  // Storage containers aren't treated as exact volumes.
  assert.equal(labelCaloriesPerUnit({ kcal: 40, per: 'ml' }, 'buckets'), null);
});

test('labelCaloriesPerUnit returns null without usable figures', () => {
  assert.equal(labelCaloriesPerUnit(null, 'cans'), null);
  assert.equal(labelCaloriesPerUnit({ kcal: 0, per: 'g', size: 400 }, 'cans'), null);
  assert.equal(labelCaloriesPerUnit({ kcal: 'abc', per: 'g', size: 400 }, 'cans'), null);
  // No package size, so a can can't be counted.
  assert.equal(labelCaloriesPerUnit({ kcal: 200, per: 'g' }, 'cans'), null);
});

// ----- Whole-item estimates -----

test('estimateCalories multiplies by quantity', () => {
  assert.deepEqual({ ...food({ type: 'canned-meat', name: 'Tuna', unit: 'cans', quantity: 3 }) }, { calories: 360 });
  assert.deepEqual({ ...food({ type: 'canned-meat', name: 'Spam', unit: 'cans', quantity: '2' }) }, { calories: 2000 });
  assert.deepEqual({ ...food({ type: 'rice-white', name: 'Rice', unit: '25 lb bags', quantity: 2 }) }, { calories: 80000 });
});

test('estimateCalories treats a blank or negative quantity as zero', () => {
  assert.deepEqual({ ...food({ type: 'canned-meat', name: 'Tuna', unit: 'cans', quantity: '' }) }, { calories: 0 });
  assert.deepEqual({ ...food({ type: 'canned-meat', name: 'Tuna', unit: 'cans', quantity: -4 }) }, { calories: 0 });
});

test('estimateCalories prefers label figures when the unit allows', () => {
  const nutrition = { kcal: 200, per: 'g', size: 400 };
  assert.deepEqual({ ...food({ type: 'canned-meat', name: 'Tuna', unit: 'cans', quantity: 2, nutrition }) },
    { calories: 1600, label: true });
  // A unit the label can't measure falls back to the type's figures.
  assert.deepEqual({ ...food({ type: 'rice-white', name: 'Rice', unit: 'cups', quantity: 1, nutrition }) },
    { calories: 0.41 * 1600 });
});

test('estimateCalories for "Other shelf-stable food" borrows from the type the name suggests', () => {
  assert.deepEqual({ ...food({ type: 'food-other', name: 'Tuna', unit: 'cans', quantity: 2 }) }, { calories: 240 });
  assert.deepEqual({ ...food({ type: 'food-other', name: 'Mystery', unit: 'cans', quantity: 1 }) }, { calories: 150 });
});

test('estimateCalories outcomes for non-food, unknown types, and unknown units', () => {
  assert.equal(estimateCalories({ category: 'Water', type: 'bottled', unit: 'bottles', quantity: 1 }), null);
  assert.deepEqual({ ...food({ type: 'stove-fuel', name: 'Propane', unit: 'canisters', quantity: 1 }) }, { none: true });
  assert.deepEqual({ ...food({ type: 'not-a-type', name: 'x', unit: 'cans', quantity: 1 }) }, { unknown: 'type' });
  assert.deepEqual({ ...food({ type: 'rice-white', name: 'Rice', unit: 'tablets', quantity: 1 }) }, { unknown: 'unit' });
});

test('estimateServings rounds down by the type serving size', () => {
  // One 2 lb bag of rice: 3200 calories at 160 a serving.
  assert.equal(estimateServings({ category: 'Food', type: 'rice-white', name: 'Rice', unit: 'bags', quantity: 1 }), 20);
  // Label figures: 907 g at 360 kcal/100 g, servings of 0.1 lb.
  const nutrition = { kcal: 360, per: 'g', size: 907 };
  assert.equal(estimateServings({ category: 'Food', type: 'rice-white', name: 'Rice', unit: 'bags', quantity: 1, nutrition }), 19);
});

test('estimateServings returns null when there is no sensible figure', () => {
  const item = (fields) => ({ category: 'Food', type: 'rice-white', name: 'Rice', unit: 'bags', quantity: 1, ...fields });
  assert.equal(estimateServings(item({ unit: 'servings' })), null); // already counted in servings
  assert.equal(estimateServings(item({ quantity: 0 })), null);
  assert.equal(estimateServings(item({ category: 'Water' })), null);
  assert.equal(estimateServings(item({ type: 'stove-fuel' })), null);
  assert.equal(estimateServings(item({ type: 'mre', name: 'MRE', unit: 'meals' })), null); // no serving size
  assert.equal(estimateServings(item({ unit: 'oz', quantity: 1 })), null); // under one serving
});

test('estimateServings uses the serving on a scanned label when there is one', () => {
  const hash = { category: 'Food', type: 'canned-meat', name: 'Corned Beef Hash', unit: 'cans', quantity: 1 };
  // Without a label serving, the 2 oz canned-meat serving gives 4.
  assert.equal(estimateServings(hash), 4);
  // A 425 g can with a 1 cup (236 g) serving: about 2 servings, as on the label.
  const nutrition = { kcal: 190, per: 'g', size: 425, serving: 236 };
  assert.equal(estimateServings({ ...hash, nutrition }), 2);
  assert.equal(estimateServings({ ...hash, quantity: 3, nutrition }), 5); // 5.4 cans' worth of servings
});

test('estimateServings uses a label serving even without a package size', () => {
  // The calories then come from the type (550 a can of corned beef), and the
  // serving's calories from the label: 236 g at 190 kcal/100 g.
  const item = { category: 'Food', type: 'canned-meat', name: 'Corned Beef Hash', unit: 'cans', quantity: 1,
    nutrition: { kcal: 190, per: 'g', serving: 236 } };
  assert.equal(estimateServings(item), 1);
});

test('estimateServings gives label servings for types with no serving size of their own', () => {
  const mre = { category: 'Food', type: 'mre', name: 'MRE', unit: 'meals', quantity: 2 };
  assert.equal(estimateServings(mre), null);
  // Two 250 g pouches at 500 kcal/100 g with 125 g servings: 2 a pouch.
  assert.equal(estimateServings({ ...mre, unit: 'pouches', nutrition: { kcal: 500, per: 'g', size: 250, serving: 125 } }), 4);
});

test('estimateServings ignores a missing or unusable label serving', () => {
  const rice = { category: 'Food', type: 'rice-white', name: 'Rice', unit: 'bags', quantity: 1 };
  const nutrition = { kcal: 360, per: 'g', size: 907 };
  assert.equal(estimateServings({ ...rice, nutrition }), 19);
  assert.equal(estimateServings({ ...rice, nutrition: { ...nutrition, serving: 0 } }), 19);
  assert.equal(estimateServings({ ...rice, nutrition: { ...nutrition, serving: 'abc' } }), 19);
  // Still not counted when the quantity is already in servings, or not food.
  assert.equal(estimateServings({ ...rice, unit: 'servings', nutrition: { ...nutrition, serving: 45 } }), null);
  assert.equal(estimateServings({ ...rice, type: 'stove-fuel', nutrition: { ...nutrition, serving: 45 } }), null);
});
