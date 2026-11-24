// Go-Bag: one bag of 30 liters or less that works both as a "get home" bag
// (you're away from home and need to make it back, maybe on foot, over a day
// or two) and a "get out" bag (you need to leave home quickly and get by for
// about 72 hours, the Red Cross's evacuation guideline).
//
// gear: { name, use, liters, lb, note, outside?, container? }
//   use:       'home' (get home), 'out' (get out), or 'both'
//   liters:    rough space it takes up in the bag
//   lb:        rough weight, in pounds
//   outside:   clipped to the outside, so it doesn't count toward the liters
//   container: the bag itself
// The bag is tracked on its own, separately from the inventory on the Preps
// pages: packing something here never adds to or counts against them.
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
      { name: 'Backpack, 30 L or smaller', use: 'both', liters: 0, lb: 2, container: true, note: 'A hip belt and chest strap move weight off your shoulders. Check that it fits your torso length' },
    ],
  },
  {
    id: 'water',
    name: 'Water',
    icon: 'droplet',
    gear: [
      { name: 'Two 1-liter water bottles, filled', use: 'both', liters: 2.3, lb: 4.7, note: 'About 4.4 lb of water. Three days’ worth (about 3 gallons) weighs about 25 lb, too much for a 30 L bag' },
    ],
  },
  {
    id: 'food',
    name: 'Food',
    icon: 'utensils',
    gear: [
      { name: 'Ready-to-eat food for 3 days', use: 'both', liters: 1.6, lb: 3.3, note: 'Calorie-dense and no cooking needed, like ration bars, nuts, and jerky. Getting home may take only a day’s worth' },
    ],
  },
  {
    id: 'clothing',
    name: 'Clothing and shelter',
    icon: 'tent',
    gear: [
      { name: 'Comfortable walking shoes', use: 'home', liters: 3.5, lb: 2, note: 'If you wear dress shoes or heels to work, a long walk home in them is hard. Or keep a pair at work or in the car' },
      { name: 'Warm layer', use: 'both', liters: 3, lb: 0.8, note: 'A fleece or packable insulated jacket' },
      { name: 'Rain jacket or poncho', use: 'both', liters: 1, lb: 0.6, note: 'Staying dry is a big part of staying warm' },
      { name: 'Two pairs of wool or synthetic socks', use: 'both', liters: 0.5, lb: 0.3, note: 'Dry socks help prevent blisters on a long walk' },
      { name: 'Work gloves', use: 'both', liters: 0.4, lb: 0.3, note: 'For debris, broken glass, and rough work' },
    ],
  },
  {
    id: 'medical',
    name: 'First aid and medications',
    icon: 'medkit',
    gear: [
      { name: 'Compact first aid kit', use: 'both', liters: 1, lb: 0.8, note: 'Add blister care, like moleskin or blister bandages' },
      { name: 'A week of medications', use: 'both', liters: 0.2, lb: 0.2, note: 'Prescriptions and pain reliever, plus spare glasses or contacts' },
      { name: 'Two N95 masks', use: 'both', liters: 0.2, lb: 0.05, note: 'For dust and smoke' },
    ],
  },
  {
    id: 'light',
    name: 'Light and communication',
    icon: 'flashlight',
    gear: [
      { name: 'Headlamp and spare batteries', use: 'both', liters: 0.3, lb: 0.3, note: 'Keeps your hands free while you walk' },
      { name: 'Compact emergency radio', use: 'out', liters: 0.6, lb: 0.7, note: 'Hand-crank or battery, with NOAA weather bands' },
      { name: 'Whistle', use: 'both', liters: 0.02, lb: 0.02, note: 'Three blasts is a widely recognized call for help' },
    ],
  },
  {
    id: 'navigation',
    name: 'Navigation, documents, and cash',
    icon: 'map',
    gear: [
      { name: 'Paper map with routes marked', use: 'both', liters: 0.1, lb: 0.1, note: 'Mark two routes home from work and two ways out of town. Phones and GPS can fail' },
      { name: 'Copies of IDs and insurance', use: 'out', liters: 0.2, lb: 0.2, note: 'In a zip bag or waterproof pouch' },
      { name: 'Printed contact list', use: 'both', liters: 0.01, lb: 0.01, note: 'Your phone may be dead' },
      { name: 'Cash in small bills', use: 'both', liters: 0.05, lb: 0.05, note: 'Card readers and ATMs often stop working in outages' },
    ],
  },
  {
    id: 'tools',
    name: 'Tools',
    icon: 'wrench',
    gear: [
      { name: 'Multi-tool or knife', use: 'both', liters: 0.15, lb: 0.4, note: 'Check local laws if you carry it to work' },
    ],
  },
  {
    id: 'hygiene',
    name: 'Hygiene',
    icon: 'soap',
    gear: [
      { name: 'Hand sanitizer and wet wipes', use: 'both', liters: 0.4, lb: 0.4, note: 'Travel sizes' },
      { name: 'Menstrual products', use: 'both', liters: 0.2, lb: 0.2, note: 'As needed' },
    ],
  },
];

// What each Local Hazard (hazards.js) adds to the bag. A name shared by two
// chosen hazards is listed once.
const GO_BAG_HAZARDS = {
  winter: [
    { name: 'Warm hat and insulated gloves', use: 'both', liters: 0.8, lb: 0.4, note: 'Cold hands make zippers, phones, and first aid hard to manage' },
    { name: 'Thermal base layer', use: 'both', liters: 1, lb: 0.6, note: 'Wool or synthetic. Cotton stays cold once it’s wet' },
    { name: 'Hand warmers', use: 'both', liters: 0.3, lb: 0.4, note: 'Air-activated packs that last for hours' },
  ],
  heat: [
    { name: 'An extra liter of water', use: 'both', liters: 1.1, lb: 2.3, note: 'You need more water in high heat. Drink before you feel thirsty' },
    { name: 'Electrolyte packets', use: 'both', liters: 0.1, lb: 0.1, note: 'Replace the salts lost in sweat' },
    { name: 'Sunscreen', use: 'both', liters: 0.1, lb: 0.2, note: 'Travel size' },
    { name: 'Wide-brim sun hat', use: 'both', liters: 0.6, lb: 0.2, note: 'Packable, for walking in full sun' },
    { name: 'Cooling towel', use: 'both', liters: 0.2, lb: 0.1, note: 'Soak, wring out, and drape over the neck' },
  ],
  hurricane: [
    { name: 'Dry bags or a pack liner', use: 'both', liters: 0.3, lb: 0.2, note: 'Keeps clothes, documents, and electronics dry in heavy rain' },
    { name: 'Insect repellent', use: 'out', liters: 0.1, lb: 0.2, note: 'Standing water after a storm can bring more mosquitoes' },
  ],
  tornado: [
    { name: 'Bike or sports helmet', use: 'both', liters: 0, lb: 0.7, outside: true, note: 'Clip it to the outside of the bag. Helps protect against head injuries from debris' },
  ],
  flood: [
    { name: 'Dry bags or a pack liner', use: 'both', liters: 0.3, lb: 0.2, note: 'Keeps clothes, documents, and electronics dry in heavy rain' },
    { name: 'Waterproof phone pouch', use: 'both', liters: 0.05, lb: 0.05, note: 'Lets you use your phone in rain or around water' },
    { name: 'Waterproof gloves', use: 'out', liters: 0.3, lb: 0.2, note: 'Floodwater can carry sewage and sharp debris' },
  ],
  wildfire: [
    { name: 'Extra N95 masks', use: 'both', liters: 0.3, lb: 0.1, note: 'Cloth and surgical masks don’t filter smoke' },
    { name: 'Sealed goggles', use: 'both', liters: 0.4, lb: 0.2, note: 'Keep smoke and ash out of your eyes' },
    { name: 'Eye drops', use: 'both', liters: 0.05, lb: 0.05, note: 'For eyes irritated by smoke' },
  ],
  earthquake: [
    { name: 'Extra N95 masks', use: 'both', liters: 0.3, lb: 0.1, note: 'Dust from damaged buildings can be harmful to breathe' },
    { name: 'Glow sticks', use: 'both', liters: 0.1, lb: 0.1, note: 'Safe light where there may be a gas leak, since they make no spark' },
  ],
};

// Space a piece of gear takes up inside the bag.
const gearLiters = (g) => (g.outside || g.container ? 0 : g.liters || 0);

// The Go-Bag list, split into sections: your Local Hazards first (like the
// What to buy lists), then the core sections. A name is only listed once.
//
// `hazards` are the chosen hazards (hazards.js), and `packed` is the names
// of gear ticked off as packed.
//
// Every section collapses. Only the first section that still has something
// to pack starts open, so the list reads like a to-do list.
function goBagSections(hazards, packed) {
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
    const entries = list.map((g) => ({ gear: g, packed: isPacked.has(g.name) }));
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
