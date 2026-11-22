// Icons: Lucide-style 24×24 stroke paths, drawn in the current text colour.
// The first set is used by the menu, pages, and buttons; the second gives
// each inventory group (a Food section, or an item type) a small picture
// shown next to its heading.

const ICONS = {
  home: '<path d="M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  medkit: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 11v6M9 14h6"/>',
  soap: '<path d="M8 11a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z"/><path d="M12 9V5"/><path d="M10 5h5a2 2 0 0 1 2 2"/><path d="M8 15h8"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8M16 17H8M10 9H8"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  dots: '<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>',
  dollar: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>',
  // ----- Item types -----
  meat: '<path d="M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.3 3.43 135 0 0-6.23 6.23"/><path d="m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59"/>',
  carrot: '<path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7z"/><path d="M8.64 14l-2.05-2.04M15.34 15l-2.46-2.46"/><path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9z"/><path d="M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2z"/>',
  soup: '<path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z"/><path d="M8 3c-.5 1 .5 2 0 3M12 3c-.5 1 .5 2 0 3M16 3c-.5 1 .5 2 0 3"/>',
  apple: '<path d="M12 6.53V3a1 1 0 0 1 1-1"/><path d="M18.24 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.47A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.76 10 3 3 0 0 0 3.65.65 5.5 5.5 0 0 1 5.18 0 3 3 0 0 0 3.65-.65"/>',
  jar: '<rect x="7" y="2" width="10" height="3" rx="1"/><path d="M8 5v1a3 3 0 0 0-2 2.8V20a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8.8A3 3 0 0 0 16 6V5"/><path d="M6 12h12"/>',
  can: '<ellipse cx="12" cy="5" rx="7" ry="2.5"/><path d="M5 5v14c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5"/><path d="M5 10c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
  wheat: '<path d="M12 22V8"/><path d="M12 8c0-3 1.8-5 4-6 0 3-1.8 5-4 6z"/><path d="M12 8c0-3-1.8-5-4-6 0 3 1.8 5 4 6z"/><path d="M12 14c0-2.5 2-4.5 5-5 0 2.5-2 4.5-5 5z"/><path d="M12 14c0-2.5-2-4.5-5-5 0 2.5 2 4.5 5 5z"/>',
  bean: '<path d="M10.2 6.6c-.2.9-.6 1.8-1.2 2.4-.6.6-1.5 1-2.4 1.2A6 6 0 0 0 8 22a7.7 7.7 0 0 0 6-2.5A11.8 11.8 0 0 0 19 12a6 6 0 0 0-8.8-5.4z"/><path d="M5.3 18.7c-.8-1.6 1-3.7 2.7-3.7"/>',
  bowl: '<path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z"/><path d="M7 21h10"/><path d="M9 12a3 3 0 0 1 6 0"/>',
  milk: '<path d="M8 2h8"/><path d="M9 2v2.79a4 4 0 0 1-.67 2.22l-.66.98A4 4 0 0 0 7 10.21V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.79a4 4 0 0 0-.67-2.22l-.66-.98A4 4 0 0 1 15 4.79V2"/><path d="M7 15a6.5 6.5 0 0 1 5 0 6.5 6.5 0 0 0 5 0"/>',
  sprout: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  nut: '<path d="M12 4V2"/><path d="M5 10v4a7 7 0 0 0 5.28 6.79c.41.1.8.29 1.1.59L12 22l.62-.62c.3-.3.69-.49 1.1-.59A7 7 0 0 0 19 14v-4"/><path d="M12 4C8 4 4.5 6 4 8c-.24.97-.92 1.95-2 3 1.31-.08 1.97-.29 3-1 .54.92.98 1.36 2 2 1.45-.65 1.95-1.1 2.5-2 .6 1 1.15 1.43 2.5 2 1.31-.62 1.86-1.06 2.5-2 .63.98 1.16 1.42 2.5 2 1.21-.55 1.68-.97 2-2 1.03.92 1.68 1.16 3 1-1.3-1.04-1.76-2.03-2-3-.5-2-4-4-8-4z"/>',
  bar: '<rect x="2" y="8" width="20" height="8" rx="2"/><path d="M6 8v8M18 8v8"/><path d="M10 12h4"/>',
  cookie: '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01"/>',
  coffee: '<path d="M10 2v2M14 2v2M6 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>',
  babyBottle: '<path d="M9 2h6"/><path d="M10 2v3M14 2v3"/><path d="M8 8l2-3h4l2 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z"/><path d="M8 12h3M8 16h3"/>',
  bread: '<path d="M6 21h12V11a3.5 3.5 0 0 0 0-7H6a3.5 3.5 0 0 0 0 7z"/><path d="M10 8l-1 2M14 8l-1 2"/>',
  egg: '<path d="M12 22c6.23-.05 7.87-5.57 7.5-10-.36-4.34-3.95-9.96-7.5-10-3.55.04-7.14 5.66-7.5 10-.37 4.43 1.27 9.95 7.5 10z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  pot: '<path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 16-4"/><path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"/>',
  bottle: '<path d="M10 2h4"/><path d="M10 2v2.5L8.5 7A3 3 0 0 0 8 8.7V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8.7a3 3 0 0 0-.5-1.7L14 4.5V2"/><path d="M8 12h8"/>',
  jug: '<path d="M9 2h4"/><path d="M10 2v3L6 9v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9l-4-4V2"/><path d="M18 11h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1"/>',
  pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><path d="m8.5 8.5 7 7"/>',
  flask: '<path d="M10 2v7.53a2 2 0 0 1-.21.9L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.07-10.13a2 2 0 0 1-.21-.9V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
  barrel: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  tube: '<path d="M7 2h10l-2 14H9z"/><path d="M10 16v4a2 2 0 0 0 4 0v-4"/><path d="M8 6h8"/>',
  bandage: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 6v12M18 6v12"/><path d="M10 10h.01M10 14h.01M14 10h.01M14 14h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  roll: '<circle cx="9" cy="9" r="6"/><circle cx="9" cy="9" r="1.5"/><path d="M15 9v12H7"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15v4M17 17h4M5 3v4M3 5h4"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  battery: '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/><path d="M6 10v4M10 10v4"/>',
  flashlight: '<path d="M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z"/><path d="M6 6h12"/><path d="M12 12v.01"/>',
  radio: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
  fuel: '<path d="M3 22h12"/><path d="M4 9h10"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 5"/>',
  idCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c.5-1.3 1.6-2 3-2s2.5.7 3 2"/><path d="M14 10h4M14 14h4"/>',
  map: '<path d="M14.1 5.55a2 2 0 0 0 1.8 0l3.66-1.83a1 1 0 0 1 1.44.9v12.76a1 1 0 0 1-.55.9l-4.55 2.27a2 2 0 0 1-1.8 0l-4.2-2.1a2 2 0 0 0-1.8 0l-3.66 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.9l4.55-2.27a2 2 0 0 1 1.8 0z"/><path d="M15 5.76v15M9 3.24v15"/>',
  drive: '<path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M6 16h.01M10 16h.01"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  tent: '<path d="M3.5 21 14 3"/><path d="M20.5 21 10 3"/><path d="M15.5 21 12 15l-3.5 6"/><path d="M2 21h20"/>',
  backpack: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  mask: '<path d="M3 8c3 0 5-2 9-2s6 2 9 2v3c0 5-4 8-9 8s-9-3-9-8z"/><path d="M8 11h8M9 14h6"/>',
  extinguisher: '<path d="M8 9a3 3 0 0 1 6 0v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/><path d="M11 6V3h2"/><path d="M13 3l5 2"/><path d="M8 13h6"/>',
  paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10z"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

// The picture for each item type, shown on its group heading on pages that
// group by type. Types not listed use their category's icon.
const TYPE_ICONS = {
  // Food
  'canned-meat': 'meat', 'canned-veg': 'carrot', 'canned-soup': 'soup', 'canned-fruit': 'apple', jarred: 'jar',
  'rice-white': 'wheat', 'rice-brown': 'wheat', 'beans-dry': 'bean', pasta: 'bowl', oats: 'bowl', cereal: 'bowl',
  flour: 'wheat', powdered: 'milk', oil: 'droplet', spices: 'jar', 'staples-none': 'jar',
  'bulk-lt': 'barrel', wheat: 'wheat', 'freeze-dried': 'package', mre: 'package', 'garden-seeds': 'sprout',
  'nut-butter': 'jar', nuts: 'nut', bars: 'bar', snacks: 'cookie', 'dried-fruit': 'apple', jerky: 'meat',
  'coffee-ground': 'coffee', 'coffee-instant': 'coffee', 'drink-mix': 'coffee', baby: 'babyBottle',
  bread: 'bread', eggs: 'egg', dairy: 'milk', produce: 'carrot',
  'stove-fuel': 'flame', 'food-gear': 'pot',
  // Water
  bottled: 'bottle', jugs: 'jug', 'water-box': 'package', 'home-filled': 'jug', tablets: 'pill',
  bleach: 'flask', filter: 'filter', containers: 'barrel',
  // Medical and First Aid
  otc: 'pill', rx: 'pill', ointment: 'tube', antiseptic: 'flask', bandages: 'bandage', electrolytes: 'droplet',
  vitamins: 'pill', sunscreen: 'sun', ki: 'pill',
  // Toiletries and Hygiene
  'toilet-paper': 'roll', wipes: 'package', oral: 'smile', menstrual: 'package', diapers: 'babyBottle',
  cleaning: 'sparkles', sanitation: 'trash',
  // Light and Power
  alkaline: 'battery', lithium: 'battery', rechargeable: 'battery', lights: 'flashlight', radio: 'radio',
  solar: 'sun', gasoline: 'fuel', 'gas-stab': 'fuel', diesel: 'fuel', kerosene: 'fuel', propane: 'flame',
  candles: 'flame', glow: 'sparkles',
  // Documents
  ids: 'idCard', maps: 'map', digital: 'drive',
  // Other
  'hand-tools': 'wrench', shelter: 'tent', bags: 'backpack', masks: 'mask', extinguisher: 'extinguisher',
  'pet-food': 'paw', 'pet-supplies': 'paw', 'baby-supplies': 'babyBottle', entertainment: 'book', 'other-other': 'package',
};

// The picture for each Food section heading (Canned and jarred, Dry staples, …).
const SECTION_ICONS = {
  'Canned and jarred': 'can', 'Dry staples': 'wheat', 'Long-term storage': 'package', Snacks: 'cookie',
  Drinks: 'coffee', Fresh: 'apple', 'Cooking and fuel': 'pot', 'Tools and gear': 'wrench', 'Family and pets': 'paw',
  Other: 'package',
};
