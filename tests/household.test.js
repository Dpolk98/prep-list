const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeHousehold, householdNeeds, forHousehold, householdText, TIERS, ITEM_TYPES } = require('./load');

const plain = (x) => JSON.parse(JSON.stringify(x));

test('saved data from before the split counts everyone as adults, with medications and pets on', () => {
  assert.deepEqual(plain(normalizeHousehold({ people: 4 })), { adults: 4, children: 0, people: 4, meds: true, pets: true });
  assert.deepEqual(plain(normalizeHousehold({})), { adults: 2, children: 0, people: 2, meds: true, pets: true });
});

test('split data is kept, and people is their total', () => {
  assert.deepEqual(plain(normalizeHousehold({ people: 9, adults: 2, children: 3, meds: false, pets: true })),
    { adults: 2, children: 3, people: 5, meds: false, pets: true });
});

test('counts are whole numbers within range: at least one adult, no fewer than zero children', () => {
  const h = normalizeHousehold({ adults: 0, children: -2 });
  assert.equal(h.adults, 1);
  assert.equal(h.children, 0);
  assert.equal(normalizeHousehold({ adults: 2.6, children: 'x' }).adults, 3);
  assert.equal(normalizeHousehold({ adults: 500, children: 0 }).adults, 99);
});

test('suggestions marked meds or pets only show when the household has them', () => {
  const week = TIERS[0].supplies;
  const names = (h) => forHousehold(week, h).map((s) => s.name);
  assert.ok(names({ meds: true, pets: true }).includes('Extra prescriptions'));
  assert.ok(!names({ meds: false, pets: true }).includes('Extra prescriptions'));
  assert.ok(names({ meds: true, pets: true }).includes('Pet food and supplies'));
  assert.ok(!names({ meds: true, pets: false }).includes('Pet food and supplies'));
  assert.ok(names({ meds: false, pets: false }).includes('First aid kit'));
});

test('every tagged suggestion and item type uses a known need', () => {
  const all = [...TIERS.flatMap((t) => t.supplies), ...Object.values(ITEM_TYPES).flat()];
  for (const s of all.filter((x) => x.needs)) assert.ok(['meds', 'pets'].includes(s.needs), s.name);
  assert.equal(householdNeeds({ name: 'x' }, { meds: false, pets: false }), true);
  assert.equal(householdNeeds(null, { meds: false, pets: false }), true);
});

test('household text names adults and children', () => {
  assert.equal(householdText({ adults: 1, children: 0 }), '1 adult');
  assert.equal(householdText({ adults: 2, children: 1 }), '2 adults and 1 child');
  assert.equal(householdText({ adults: 1, children: 3 }), '1 adult and 3 children');
});
