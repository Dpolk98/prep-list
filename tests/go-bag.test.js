const test = require('node:test');
const assert = require('node:assert/strict');
const { HAZARDS, GO_BAG, GO_BAG_HAZARDS, GO_BAG_LIMIT_L, goBagSections, goBagTotals, normalizeGoBag } = require('./load');

const allGear = () => [...GO_BAG.flatMap((s) => s.gear), ...Object.values(GO_BAG_HAZARDS).flat()];

test('the core list plus every Local Hazard fits well inside 30 L', () => {
  const t = goBagTotals(goBagSections(HAZARDS, [], []));
  assert.equal(GO_BAG_LIMIT_L, 30);
  // Room left for gaps between things and for personal items.
  assert.ok(t.liters <= GO_BAG_LIMIT_L - 3, `full list is ${t.liters} L`);
});

test('every hazard key is a real hazard, and every gear has a use, size, and weight', () => {
  const ids = new Set(HAZARDS.map((h) => h.id));
  for (const id of Object.keys(GO_BAG_HAZARDS)) assert.ok(ids.has(id), id);
  for (const g of allGear()) {
    assert.ok(['both', 'home', 'out'].includes(g.use), g.name);
    assert.equal(typeof g.liters, 'number', g.name);
    assert.ok(g.lb > 0, g.name);
    assert.ok(g.note, g.name);
  }
});

test('the list covers both jobs', () => {
  const uses = new Set(allGear().map((g) => g.use));
  assert.ok(uses.has('home') && uses.has('out') && uses.has('both'));
});

test('Local Hazards come first, then the core sections', () => {
  const winter = HAZARDS.find((h) => h.id === 'winter');
  const sections = goBagSections([winter], [], []);
  assert.match(sections[0].label, /Local Hazards$/);
  assert.deepEqual(sections.slice(1).map((s) => s.id), GO_BAG.map((s) => s.id));
});

test('with no hazards chosen, only the core sections show', () => {
  assert.deepEqual(goBagSections([], [], []).map((s) => s.id), GO_BAG.map((s) => s.id));
});

test('a name shared by two hazards is listed once', () => {
  const names = goBagSections(HAZARDS, [], []).flatMap((s) => s.entries.map((e) => e.gear.name));
  assert.equal(new Set(names).size, names.length);
});

test('only the first section with something to pack starts open', () => {
  const sections = goBagSections([], [], []);
  assert.deepEqual(sections.map((s) => s.open), sections.map((_, i) => i === 0));
  const packed = sections[0].entries.map((e) => e.gear.name);
  const next = goBagSections([], packed, []);
  assert.equal(next[0].open, false);
  assert.equal(next[0].packedCount, next[0].entries.length);
  assert.equal(next[1].open, true);
});

test('packed totals count only packed gear, and outside gear takes no space', () => {
  const water = GO_BAG.find((s) => s.id === 'water').gear;
  const t = goBagTotals(goBagSections([], [water[0].name], []));
  assert.equal(t.packedCount, 1);
  assert.equal(t.packedLiters, water[0].liters);
  assert.equal(t.packedLb, water[0].lb);
  const tornado = HAZARDS.find((h) => h.id === 'tornado');
  const helmet = GO_BAG_HAZARDS.tornado.find((g) => g.outside);
  const withHelmet = goBagTotals(goBagSections([tornado], [helmet.name], []));
  assert.equal(withHelmet.packedLiters, 0);
  assert.equal(withHelmet.packedLb, helmet.lb);
});

test('the bag is separate from the inventory', () => {
  for (const g of allGear()) assert.equal(g.cat, undefined, g.name);
  const items = [{ name: 'Whistle', category: 'Other', type: 'hand-tools', quantity: 1 }];
  const entry = goBagSections([], [], items).flatMap((s) => s.entries).find((e) => e.gear.name === 'Whistle');
  assert.equal(entry.packed, false);
  assert.equal('have' in entry, false);
});

test('saved data keeps only names still on the list, once each', () => {
  assert.equal(JSON.stringify(normalizeGoBag(undefined)), '{"packed":[],"asked":false}');
  assert.equal(JSON.stringify(normalizeGoBag({ packed: ['Whistle', 'Whistle', 'Gone', 3] })), '{"packed":["Whistle"],"asked":false}');
  assert.equal(normalizeGoBag({ asked: true }).asked, true);
  assert.equal(normalizeGoBag({ asked: 'yes' }).asked, false);
});
