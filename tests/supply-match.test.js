const test = require('node:test');
const assert = require('node:assert/strict');
const { TIERS, HAZARDS, ITEM_TYPES, ownsSupply } = require('./load');

const supply = (name) => [...TIERS, ...HAZARDS].flatMap((t) => t.supplies).find((s) => s.name === name);
const cannedMeat = supply('Canned meat, fish, and beans');

test('an item of a linked type checks off the suggestion', () => {
  const items = [{ name: 'Spam', category: 'Food', type: 'canned-meat', quantity: 3 }];
  assert.equal(ownsSupply(cannedMeat, items), true);
});

test('one item is enough', () => {
  const items = [{ name: 'Tuna', category: 'Food', type: 'canned-meat', quantity: 1 }];
  assert.equal(ownsSupply(cannedMeat, items), true);
});

test('a used-up item (quantity 0) does not count', () => {
  const items = [{ name: 'Spam', category: 'Food', type: 'canned-meat', quantity: 0 }];
  assert.equal(ownsSupply(cannedMeat, items), false);
});

test('an item of an unrelated type does not count', () => {
  const items = [{ name: 'Rice', category: 'Food', type: 'rice-white', quantity: 20 }];
  assert.equal(ownsSupply(cannedMeat, items), false);
});

test('items in another category do not count', () => {
  const items = [{ name: 'Canned meat, fish, and beans', category: 'Other', quantity: 2 }];
  assert.equal(ownsSupply(cannedMeat, items), false);
});

test('a matching name still counts, ignoring commas and "&"', () => {
  const items = [{ name: 'canned meat fish & beans', category: 'Food', type: 'food-other', quantity: 1 }];
  assert.equal(ownsSupply(cannedMeat, items), true);
});

test('an item saved without a type is matched by the type its name suggests', () => {
  const items = [{ name: 'Canned chicken', category: 'Food', unit: 'cans', quantity: 2 }];
  assert.equal(ownsSupply(cannedMeat, items), true);
});

test('a suggestion with no linked types only matches by name', () => {
  const opener = supply('Manual can opener');
  const items = [{ name: 'Camp stove', category: 'Food', type: 'food-gear', quantity: 1 }];
  assert.equal(ownsSupply(opener, items), false);
});

test('every linked type exists in its category', () => {
  for (const s of [...TIERS, ...HAZARDS].flatMap((t) => t.supplies)) {
    for (const id of s.types || []) {
      assert.ok((ITEM_TYPES[s.cat] || []).some((t) => t.id === id), `${s.name}: no ${s.cat} type "${id}"`);
    }
  }
});
