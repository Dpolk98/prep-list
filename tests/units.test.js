const test = require('node:test');
const assert = require('node:assert/strict');
const { dropAbbreviationDots, unitKey, parseUnitSize, gallonsPerUnit } = require('./load.js');

const close = (actual, expected, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

test('dropAbbreviationDots drops dots after letters but keeps decimal points', () => {
  assert.equal(dropAbbreviationDots('Lbs.'), 'lbs');
  assert.equal(dropAbbreviationDots('fl. oz.'), 'fl oz');
  assert.equal(dropAbbreviationDots('2.5 gal.'), '2.5 gal');
  assert.equal(dropAbbreviationDots(null), '');
  assert.equal(dropAbbreviationDots(undefined), '');
});

test('unitKey folds case, plurals, dots, and spacing into one key', () => {
  for (const u of ['Boxes', 'box', 'Box', 'boxes.']) assert.equal(unitKey(u), 'box');
  assert.equal(unitKey('cans'), 'can');
  assert.equal(unitKey('Pouches'), 'pouch');
  assert.equal(unitKey('dishes'), 'dish');
  assert.equal(unitKey('batteries'), 'battery');
  assert.equal(unitKey('Qt.'), 'qt');
  assert.equal(unitKey('  fl   oz  '), 'fl oz');
  assert.equal(unitKey('#10 cans'), '#10 can');
  assert.equal(unitKey('mylar bags'), 'mylar bag');
});

test('unitKey handles the irregular plurals it knows', () => {
  assert.equal(unitKey('loaves'), 'loaf');
  assert.equal(unitKey('Half Gallons'), 'half-gallon');
  assert.equal(unitKey('half gallon'), 'half-gallon');
  assert.equal(unitKey('half-gallons'), 'half-gallon');
});

test('parseUnitSize reads a size written into a unit', () => {
  assert.deepEqual({ ...parseUnitSize('5-gallon jugs') }, { amount: 5, measure: 'gallon', count: null });
  assert.deepEqual({ ...parseUnitSize('25 lb bags') }, { amount: 25, measure: 'lb', count: null });
  assert.deepEqual({ ...parseUnitSize('16.9 oz bottles') }, { amount: 16.9, measure: 'oz', count: null });
  assert.deepEqual({ ...parseUnitSize('2 L bottles') }, { amount: 2, measure: 'l', count: null });
  assert.deepEqual({ ...parseUnitSize('12 fl. oz. cans') }, { amount: 12, measure: 'fl oz', count: null });
});

test('parseUnitSize reads a count written into a unit', () => {
  assert.deepEqual({ ...parseUnitSize('24-pack') }, { amount: null, measure: null, count: 24 });
  assert.deepEqual({ ...parseUnitSize('12 ct') }, { amount: null, measure: null, count: 12 });
  assert.deepEqual({ ...parseUnitSize('case of 12') }, { amount: null, measure: null, count: 12 });
  assert.deepEqual({ ...parseUnitSize('boxes of 6') }, { amount: null, measure: null, count: 6 });
});

test('parseUnitSize reads a count and a size together', () => {
  assert.deepEqual({ ...parseUnitSize('24 x 16.9 oz') }, { amount: 16.9, measure: 'oz', count: 24 });
  assert.deepEqual({ ...parseUnitSize('6-pack of 12 oz cans') }, { amount: 12, measure: 'oz', count: 6 });
});

test('parseUnitSize returns null when the unit holds no size or count', () => {
  assert.equal(parseUnitSize('cans'), null);
  assert.equal(parseUnitSize(''), null);
  assert.equal(parseUnitSize('jug'), null);
});

test('gallonsPerUnit uses the assumed container sizes', () => {
  close(gallonsPerUnit('bottles'), 0.132);
  close(gallonsPerUnit('Cases'), 24 * 0.132);
  close(gallonsPerUnit('jugs'), 1);
  close(gallonsPerUnit('boxes'), 0.132);
});

test('gallonsPerUnit converts kitchen measures', () => {
  close(gallonsPerUnit('gallons'), 1);
  close(gallonsPerUnit('gal.'), 1);
  close(gallonsPerUnit('quarts'), 0.25);
  close(gallonsPerUnit('half-gallons'), 0.5);
  close(gallonsPerUnit('cups'), 1 / 16);
  close(gallonsPerUnit('liters'), 4.227 / 16);
});

test('gallonsPerUnit reads sizes and counts from the unit', () => {
  close(gallonsPerUnit('5-gallon jugs'), 5);
  close(gallonsPerUnit('2 L bottles'), (2 * 4.227) / 16);
  // On water a plain "oz" means fluid ounces.
  close(gallonsPerUnit('16.9 oz bottles'), (16.9 / 8) / 16);
  close(gallonsPerUnit('24 x 16.9 oz'), (24 * 16.9 / 8) / 16);
  // A bare count is that many standard bottles.
  close(gallonsPerUnit('24-pack'), 24 * 0.132);
});

test('gallonsPerUnit returns null for units it cannot convert', () => {
  assert.equal(gallonsPerUnit('tablets'), null);
  assert.equal(gallonsPerUnit('5 lb bags'), null); // a weight is not a volume
  assert.equal(gallonsPerUnit(''), null);
});
