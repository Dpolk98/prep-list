// Go-Bag: one bag of 30 liters or less that works both as a "get home" bag
// (you're away from home and need to make it back, maybe on foot, over a day
// or two) and a "get out" bag (you need to leave home quickly and get by for
// about 72 hours, the Red Cross's evacuation guideline).
//
// gear: { cat, name, types, use, liters, lb, note, outside?, container? }, in
//   the same shape as tiers.js and hazards.js, plus:
//   use:       'home' (get home), 'out' (get out), or 'both'
//   liters:    rough space it takes up in the bag
//   lb:        rough weight, in pounds
//   outside:   clipped to the outside, so it doesn't count toward the liters
//   container: the bag itself
// `cat` and `types` tie a piece of gear to the inventory, the same way What
// to buy suggestions are (see supply-match.js).
//
// Sizes and weights are typical figures for compact gear, rounded. The core
// list plus every Local Hazard's additions stays well under 30 L, leaving
// room for gaps between things and for personal items.

const GO_BAG_LIMIT_L = 30;

const GO_BAG_USES = {
  both: { label: 'Both', long: 'Useful for getting home and getting out' },
  home: { label: 'Get home', long: 'Mainly for getting home' },
  out: { label: 'Get out', long: 'Mainly for getting out' },
};

const GO_BAG = [
  {
    id: 'bag',
    name: 'The bag',
    icon: 'rucksack',
    gear: [
      { cat: 'Other', name: 'Backpack, 30 L or smaller', types: ['bags'], use: 'both', liters: 0, lb: 2, container: true, note: 'A hip belt and chest strap move weight off your shoulders. Check that it fits your torso length' },
    ],
  },
  {
    id: 'water',
    name: 'Water',
    icon: 'droplet',
    gear: [
      { cat: 'Water', name: 'Two 1-liter water bottles, filled', use: 'both', liters: 2.3, lb: 4.7, note: 'About 4.4 lb of water. Three days’ worth (about 3 gallons) is too heavy to carry, so plan to treat water along the way' },
      { cat: 'Water', name: 'Water filter', types: ['filter'], use: 'both', liters: 0.3, lb: 0.2, note: 'Squeeze or straw type. Most don’t remove viruses, so carry tablets too' },
      { cat: 'Water', name: 'Purification tablets', types: ['tablets'], use: 'both', liters: 0.05, lb: 0.05, note: 'Treat water the filter can’t, and work on their own if it breaks' },
    ],
  },
  {
    id: 'food',
    name: 'Food',
    icon: 'utensils',
    gear: [
      { cat: 'Food', name: 'Ready-to-eat food for 3 days', use: 'both', liters: 1.6, lb: 3.3, note: 'Calorie-dense and no cooking needed, like ration bars, nuts, and jerky. Getting home may take only a day’s worth' },
      { cat: 'Food', name: 'Metal cup or small pot', use: 'out', liters: 0.6, lb: 0.4, note: 'For boiling water to purify it, or heating food' },
    ],
  },
  {
    id: 'clothing',
    name: 'Clothing and shelter',
    icon: 'tent',
    gear: [
      { cat: 'Other', name: 'Comfortable walking shoes', use: 'home', liters: 3.5, lb: 2, note: 'If you wear dress shoes or heels to work, a long walk home in them is hard. Or keep a pair at work or in the car' },
      { cat: 'Other', name: 'Warm layer', use: 'both', liters: 3, lb: 0.8, note: 'A fleece or packable insulated jacket' },
      { cat: 'Other', name: 'Rain jacket or poncho', use: 'both', liters: 1, lb: 0.6, note: 'Staying dry is a big part of staying warm' },
      { cat: 'Other', name: 'Two pairs of wool or synthetic socks', use: 'both', liters: 0.5, lb: 0.3, note: 'Dry socks help prevent blisters on a long walk' },
      { cat: 'Other', name: 'Work gloves', use: 'both', liters: 0.4, lb: 0.3, note: 'For debris, broken glass, and rough work' },
      { cat: 'Other', name: 'Emergency bivy or space blanket', use: 'both', liters: 0.3, lb: 0.3, note: 'Reflects body heat back to you. A bivy is sturdier than a flat blanket' },
      { cat: 'Other', name: 'Lightweight tarp', use: 'out', liters: 1.2, lb: 1, note: 'With cord, it makes a shelter from rain or sun' },
    ],
  },
  {
    id: 'medical',
    name: 'First aid and medications',
    icon: 'medkit',
    gear: [
      { cat: 'Medical and First Aid', name: 'Compact first aid kit', use: 'both', liters: 1, lb: 0.8, note: 'Add blister care, like moleskin or blister bandages' },
      { cat: 'Medical and First Aid', name: 'A week of medications', types: ['rx'], use: 'both', liters: 0.2, lb: 0.2, note: 'Prescriptions and pain reliever, plus spare glasses or contacts' },
      { cat: 'Other', name: 'Two N95 masks', types: ['masks'], use: 'both', liters: 0.2, lb: 0.05, note: 'For dust and smoke' },
    ],
  },
  {
    id: 'light',
    name: 'Light and communication',
    icon: 'flashlight',
    gear: [
      { cat: 'Light and Power', name: 'Headlamp and spare batteries', types: ['lights'], use: 'both', liters: 0.3, lb: 0.3, note: 'Keeps your hands free while you walk' },
      { cat: 'Light and Power', name: 'Power bank and charging cable', use: 'both', liters: 0.3, lb: 0.6, note: 'Keep it charged, and top it up every few months' },
      { cat: 'Light and Power', name: 'Compact emergency radio', types: ['radio'], use: 'out', liters: 0.6, lb: 0.7, note: 'Hand-crank or battery, with NOAA weather bands' },
      { cat: 'Other', name: 'Whistle', use: 'both', liters: 0.02, lb: 0.02, note: 'Three blasts is a widely recognized call for help' },
    ],
  },
  {
    id: 'navigation',
    name: 'Navigation, documents, and cash',
    icon: 'map',
    gear: [
      { cat: 'Documents', name: 'Paper map with routes marked', types: ['maps'], use: 'both', liters: 0.1, lb: 0.1, note: 'Mark two routes home from work and two ways out of town. Phones and GPS can fail' },
      { cat: 'Documents', name: 'Copies of IDs and insurance', types: ['ids'], use: 'out', liters: 0.2, lb: 0.2, note: 'In a zip bag or waterproof pouch' },
      { cat: 'Documents', name: 'Printed contact list', use: 'both', liters: 0.01, lb: 0.01, note: 'Your phone may be dead' },
      { cat: 'Other', name: 'Cash in small bills', use: 'both', liters: 0.05, lb: 0.05, note: 'Card readers and ATMs often stop working in outages' },
    ],
  },
  {
    id: 'tools',
    name: 'Tools',
    icon: 'wrench',
    gear: [
      { cat: 'Other', name: 'Multi-tool or knife', use: 'both', liters: 0.15, lb: 0.4, note: 'Check local laws if you carry it to work' },
      { cat: 'Light and Power', name: 'Lighter and fire starter', types: ['candles'], use: 'out', liters: 0.1, lb: 0.1, note: 'Waterproof matches or a ferro rod as a backup' },
      { cat: 'Other', name: 'Duct tape and paracord', use: 'out', liters: 0.3, lb: 0.4, note: 'Wrap the tape around a card to save space' },
    ],
  },
  {
    id: 'hygiene',
    name: 'Hygiene',
    icon: 'soap',
    gear: [
      { cat: 'Toiletries and Hygiene', name: 'Hand sanitizer and wet wipes', types: ['sanitizer', 'wipes'], use: 'both', liters: 0.4, lb: 0.4, note: 'Travel sizes' },
      { cat: 'Toiletries and Hygiene', name: 'Toilet paper and garbage bags', use: 'both', liters: 0.4, lb: 0.3, note: 'A heavy-duty bag doubles as a poncho or ground cover' },
      { cat: 'Toiletries and Hygiene', name: 'Toothbrush and travel toothpaste', types: ['oral'], use: 'out', liters: 0.1, lb: 0.1, note: 'For a few days away from home' },
      { cat: 'Toiletries and Hygiene', name: 'Menstrual products', types: ['menstrual'], use: 'both', liters: 0.2, lb: 0.2, note: 'As needed' },
    ],
  },
];

// What each Local Hazard (hazards.js) adds to the bag. A name shared by two
// chosen hazards is listed once.
const GO_BAG_HAZARDS = {
  winter: [
    { cat: 'Other', name: 'Warm hat and insulated gloves', use: 'both', liters: 0.8, lb: 0.4, note: 'Cold hands make zippers, phones, and first aid hard to manage' },
    { cat: 'Other', name: 'Thermal base layer', use: 'both', liters: 1, lb: 0.6, note: 'Wool or synthetic. Cotton stays cold once it’s wet' },
    { cat: 'Other', name: 'Hand warmers', use: 'both', liters: 0.3, lb: 0.4, note: 'Air-activated packs that last for hours' },
  ],
  heat: [
    { cat: 'Water', name: 'An extra liter of water', use: 'both', liters: 1.1, lb: 2.3, note: 'You need more water in high heat. Drink before you feel thirsty' },
    { cat: 'Medical and First Aid', name: 'Electrolyte packets', types: ['electrolytes'], use: 'both', liters: 0.1, lb: 0.1, note: 'Replace the salts lost in sweat' },
    { cat: 'Medical and First Aid', name: 'Sunscreen', types: ['sunscreen'], use: 'both', liters: 0.1, lb: 0.2, note: 'Travel size' },
    { cat: 'Other', name: 'Wide-brim sun hat', use: 'both', liters: 0.6, lb: 0.2, note: 'Packable, for walking in full sun' },
    { cat: 'Other', name: 'Cooling towel', use: 'both', liters: 0.2, lb: 0.1, note: 'Soak, wring out, and drape over the neck' },
  ],
  hurricane: [
    { cat: 'Other', name: 'Dry bags or a pack liner', use: 'both', liters: 0.3, lb: 0.2, note: 'Keeps clothes, documents, and electronics dry in heavy rain' },
    { cat: 'Medical and First Aid', name: 'Insect repellent', types: ['sunscreen'], use: 'out', liters: 0.1, lb: 0.2, note: 'Standing water after a storm can bring more mosquitoes' },
  ],
  tornado: [
    { cat: 'Other', name: 'Bike or sports helmet', use: 'both', liters: 0, lb: 0.7, outside: true, note: 'Clip it to the outside of the bag. Helps protect against head injuries from debris' },
  ],
  flood: [
    { cat: 'Other', name: 'Dry bags or a pack liner', use: 'both', liters: 0.3, lb: 0.2, note: 'Keeps clothes, documents, and electronics dry in heavy rain' },
    { cat: 'Other', name: 'Waterproof phone pouch', use: 'both', liters: 0.05, lb: 0.05, note: 'Lets you use your phone in rain or around water' },
    { cat: 'Other', name: 'Waterproof gloves', use: 'out', liters: 0.3, lb: 0.2, note: 'Floodwater can carry sewage and sharp debris' },
  ],
  wildfire: [
    { cat: 'Other', name: 'Extra N95 masks', types: ['masks'], use: 'both', liters: 0.3, lb: 0.1, note: 'Cloth and surgical masks don’t filter smoke' },
    { cat: 'Other', name: 'Sealed goggles', use: 'both', liters: 0.4, lb: 0.2, note: 'Keep smoke and ash out of your eyes' },
    { cat: 'Medical and First Aid', name: 'Eye drops', use: 'both', liters: 0.05, lb: 0.05, note: 'For eyes irritated by smoke' },
  ],
  earthquake: [
    { cat: 'Other', name: 'Extra N95 masks', types: ['masks'], use: 'both', liters: 0.3, lb: 0.1, note: 'Dust from damaged buildings can be harmful to breathe' },
    { cat: 'Light and Power', name: 'Glow sticks', types: ['glow'], use: 'both', liters: 0.1, lb: 0.1, note: 'Safe light where there may be a gas leak, since they make no spark' },
  ],
};

// Space a piece of gear takes up inside the bag.
const gearLiters = (g) => (g.outside || g.container ? 0 : g.liters || 0);

// The Go-Bag list, split into sections: your Local Hazards first (like the
// What to buy lists), then the core sections. A name is only listed once.
//
// `hazards` are the chosen hazards (hazards.js), `packed` is the names of
// gear ticked off as packed, and `items` is the inventory, used to mark gear
// you already own (see ownsSupply in supply-match.js).
//
// Every section collapses. Only the first section that still has something
// to pack starts open, so the list reads like a to-do list.
function goBagSections(hazards, packed, items) {
  const isPacked = new Set(packed);
  const groups = [
    ...hazards
      .filter((h) => GO_BAG_HAZARDS[h.id]?.length)
      .map((h) => ({ id: `hazard-${h.id}`, label: `${h.name} · Local Hazards`, icon: h.icon, gear: GO_BAG_HAZARDS[h.id], hazard: true })),
    ...GO_BAG.map((s) => ({ id: s.id, label: s.name, icon: s.icon, gear: s.gear, hazard: false })),
  ];
  const seen = new Set();
  const sections = [];
  for (const { gear, ...section } of groups) {
    const list = gear.filter((g) => !seen.has(g.name));
    list.forEach((g) => seen.add(g.name));
    if (!list.length) continue;
    const entries = list.map((g) => ({ gear: g, packed: isPacked.has(g.name), have: ownsSupply(g, items) }));
    const done = entries.filter((e) => e.packed);
    sections.push({
      ...section,
      entries,
      packedCount: done.length,
      liters: entries.reduce((n, e) => n + gearLiters(e.gear), 0),
      open: false,
    });
  }
  const first = sections.find((s) => s.packedCount < s.entries.length);
  if (first) first.open = true;
  return sections;
}

// Totals for the whole list and for what's packed so far.
function goBagTotals(sections) {
  const entries = sections.flatMap((s) => s.entries);
  const sum = (list, f) => list.reduce((n, e) => n + f(e.gear), 0);
  const packed = entries.filter((e) => e.packed);
  return {
    count: entries.length,
    packedCount: packed.length,
    liters: sum(entries, gearLiters),
    lb: sum(entries, (g) => g.lb || 0),
    packedLiters: sum(packed, gearLiters),
    packedLb: sum(packed, (g) => g.lb || 0),
  };
}

// Only names that are still on the list are kept, in case gear is renamed.
function normalizeGoBag(data) {
  const names = new Set([...GO_BAG.flatMap((s) => s.gear), ...Object.values(GO_BAG_HAZARDS).flat()].map((g) => g.name));
  const packed = Array.isArray(data?.packed) ? data.packed.filter((n) => names.has(n)) : [];
  return { packed: [...new Set(packed)] };
}
