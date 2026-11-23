const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ITEM_TYPES, TYPE_RULES, typesFor, findType, guessType, addToDate, toIsoDate, describeShelfLife, estimateExpiry,
} = require('./load.js');

test('every type has a unique id within its category and a shelf life or none', () => {
  for (const [category, types] of Object.entries(ITEM_TYPES)) {
    const ids = types.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate id in ${category}`);
    for (const t of types) {
      const has = t.none === true || t.months > 0 || t.days > 0;
      assert.ok(has, `${category}/${t.id} has no shelf life and is not marked none`);
      assert.ok(Array.isArray(t.units) && t.units.length > 0, `${category}/${t.id} has no units`);
    }
  }
});

test('every name rule points at a type that exists in its category', () => {
  for (const [category, rules] of Object.entries(TYPE_RULES)) {
    for (const [re, id] of rules) {
      assert.ok(findType(category, id), `${category} rule ${re} points at missing type ${id}`);
    }
  }
});

test('typesFor and findType', () => {
  assert.equal(typesFor('Food'), ITEM_TYPES.Food);
  assert.deepEqual([...typesFor('Nope')], []);
  assert.equal(findType('Food', 'canned-meat').name, 'Canned meat and fish');
  assert.equal(findType('Food', 'missing'), null);
  assert.equal(findType('Water', 'canned-meat'), null);
});

test('guessType picks the first rule that matches the name', () => {
  const food = (name, unit) => guessType({ name, unit, category: 'Food' });
  assert.equal(food('Canned peaches'), 'canned-fruit');
  assert.equal(food('Chicken noodle soup'), 'canned-soup');
  assert.equal(food('Tuna'), 'canned-meat');
  assert.equal(food('Mountain House beef stroganoff'), 'freeze-dried');
  assert.equal(food('Can opener'), 'food-gear'); // before anything canned
  assert.equal(food('Propane canister'), 'stove-fuel');
  assert.equal(food('Dried black beans'), 'beans-dry');
  assert.equal(food('Green beans'), 'canned-veg');
  assert.equal(food('Vegetable oil') === 'canned-veg', false);
});

test('guessType also looks at the unit, and returns null with nothing to go on', () => {
  assert.equal(guessType({ name: 'Mystery', unit: '#10 cans', category: 'Food' }), 'freeze-dried');
  assert.equal(guessType({ name: '', unit: '', category: 'Food' }), null);
  assert.equal(guessType({ name: 'Tuna', category: 'Unknown' }), null);
});

test('addToDate adds months and clamps to the end of the month', () => {
  assert.equal(toIsoDate(addToDate(new Date(2025, 0, 31), { months: 1 })), '2025-02-28');
  assert.equal(toIsoDate(addToDate(new Date(2024, 0, 31), { months: 1 })), '2024-02-29');
  assert.equal(toIsoDate(addToDate(new Date(2025, 2, 31), { months: 1 })), '2025-04-30');
  assert.equal(toIsoDate(addToDate(new Date(2025, 10, 15), { months: 3 })), '2026-02-15');
  assert.equal(toIsoDate(addToDate(new Date(2024, 1, 29), { months: 12 })), '2025-02-28');
});

test('addToDate adds days across month and year ends', () => {
  assert.equal(toIsoDate(addToDate(new Date(2025, 11, 28), { days: 7 })), '2026-01-04');
  assert.equal(toIsoDate(addToDate(new Date(2024, 1, 28), { days: 1 })), '2024-02-29');
});

test('addToDate drops the time of day and does not change its input', () => {
  const base = new Date(2025, 5, 10, 23, 59);
  const out = addToDate(base, { days: 1 });
  assert.equal(out.getHours(), 0);
  assert.equal(base.getDate(), 10);
});

test('toIsoDate pads months and days', () => {
  assert.equal(toIsoDate(new Date(2026, 0, 5)), '2026-01-05');
});

test('describeShelfLife', () => {
  assert.equal(describeShelfLife({ days: 7 }), '1 week');
  assert.equal(describeShelfLife({ days: 35 }), '5 weeks');
  assert.equal(describeShelfLife({ days: 60 }), '60 days');
  assert.equal(describeShelfLife({ months: 1 }), '1 month');
  assert.equal(describeShelfLife({ months: 6 }), '6 months');
  assert.equal(describeShelfLife({ months: 18 }), '18 months');
  assert.equal(describeShelfLife({ months: 12 }), '1 year');
  assert.equal(describeShelfLife({ months: 36 }), '3 years');
  assert.equal(describeShelfLife({ months: 30 }), '2.5 years');
  assert.equal(describeShelfLife({ months: 300 }), '25 years');
});

test('estimateExpiry dates an item from the day it was added', () => {
  const from = new Date(2026, 10, 23);
  assert.deepEqual({ ...estimateExpiry({ category: 'Food', type: 'canned-meat' }, from) },
    { date: '2029-11-23', label: 'Canned meat and fish', life: '3 years' });
  assert.deepEqual({ ...estimateExpiry({ category: 'Food', type: 'bread' }, from) },
    { date: '2026-11-30', label: 'Bread and tortillas', life: '1 week' });
});

test('estimateExpiry for types that do not expire, and unknown types', () => {
  assert.deepEqual({ ...estimateExpiry({ category: 'Food', type: 'staples-none' }) },
    { none: true, label: 'Salt, sugar, honey, and vinegar' });
  assert.equal(estimateExpiry({ category: 'Food', type: 'nope' }), null);
});
