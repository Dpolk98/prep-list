const test = require('node:test');
const assert = require('node:assert/strict');
const { TIERS, HAZARDS, supplySections } = require('./load');

const upTo = (id) => TIERS.slice(0, TIERS.findIndex((t) => t.id === id) + 1);
const labels = (sections) => sections.map((s) => s.label);
const hazard = HAZARDS.find((h) => h.supplies.some((s) => s.cat === 'Food')) || HAZARDS[0];
const cat = hazard.supplies[0].cat;

test('at the 1 week tier sections are plain headings', () => {
  const sections = supplySections(upTo('week'), [hazard], cat, []);
  assert.ok(sections.length > 0);
  for (const s of sections) {
    assert.equal(s.collapsible, false);
    assert.equal(s.open, true);
  }
});

test('above 1 week every section is collapsible', () => {
  const sections = supplySections(upTo('month'), [hazard], cat, []);
  assert.ok(sections.length > 1);
  assert.ok(sections.every((s) => s.collapsible));
});

test('Local Hazards come first, then your tier, then foundations', () => {
  const sections = supplySections(upTo('year'), [hazard], cat, []);
  const l = labels(sections);
  assert.match(l[0], /Local Hazards$/);
  const own = l.findIndex((x) => x.endsWith('your tier'));
  const foundation = l.findIndex((x) => x.endsWith('foundation'));
  if (own !== -1) assert.ok(own > 0);
  if (own !== -1 && foundation !== -1) assert.ok(own < foundation);
});

test('only the first section with something to buy starts open', () => {
  const sections = supplySections(upTo('year'), [hazard], cat, []);
  assert.deepEqual(sections.map((s) => s.open), sections.map((_, i) => i === 0));
});

test('a section with everything owned stays closed and the next one opens', () => {
  const first = supplySections(upTo('year'), [hazard], cat, [])[0];
  const items = first.entries.map(({ supply }) => ({ name: supply.name, category: supply.cat, quantity: 1 }));
  const sections = supplySections(upTo('year'), [hazard], cat, items);
  assert.equal(sections[0].toBuy, 0);
  assert.equal(sections[0].open, false);
  const next = sections.find((s) => s.toBuy > 0);
  if (next) assert.equal(next.open, true);
  assert.equal(sections.filter((s) => s.open).length, next ? 1 : 0);
});

test('a name is listed only once', () => {
  const names = supplySections(upTo('beyond'), HAZARDS, cat, [])
    .flatMap((s) => s.entries.map((e) => e.supply.name));
  assert.equal(new Set(names).size, names.length);
});

test('with no inventory (Plans and Skills) nothing counts as owned', () => {
  const sections = supplySections(upTo('month'), [], 'Plans and Skills', null);
  assert.ok(sections.length > 0);
  for (const s of sections) assert.equal(s.toBuy, s.entries.length);
});
