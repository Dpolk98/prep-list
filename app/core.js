// Prep Tracker — emergency supplies inventory.
// All data is stored in this browser's localStorage; nothing leaves the device.
// Tier definitions (suggested supplies, mindset, savings notes) live in tiers.js.
// Shelf-life estimates live in shelf-life.js.
// Calorie estimates for the Food page live in calories.js.
//
// The app's own code is split across the files in app/, one per page or
// feature, starting with this one (settings, saved data, and helpers). They're
// plain scripts that share one global scope, so index.html loads them in
// order: code that runs as a file loads can only use what earlier files
// define, while functions that run later (on a tap, or from render()) can use
// anything. main.js comes last and draws the first screen. Keep the list in
// index.html and the FILES list in sw.js in step when adding or removing one.

const STORAGE_KEY = 'prep-tracker:v1';
const SOON_DAYS = 60;

// Icons, including one per item type, live in icons.js.

// Features that can be switched off while they're being worked on. When
// grabList is false, the Grab list's page, menu entry, and printed section
// don't show, but its data is still kept and included in backups.
const FEATURES = { grabList: true };

// ---------- Pages ----------
// `cat` ties a page to an inventory category and to its suggested supplies.

const PAGES = [
  { slug: '', name: 'Overview', icon: 'home', blurb: 'Your readiness across every category.' },
  { slug: 'savings', name: 'Savings', icon: 'dollar', blurb: 'Your emergency cash and investments: the most flexible part of being prepared.' },
  { slug: 'water', group: 'preps', name: 'Water', cat: 'Water', icon: 'droplet', blurb: 'Stored water, purification, and sources.' },
  { slug: 'food', group: 'preps', name: 'Food', cat: 'Food', icon: 'utensils', blurb: 'Shelf-stable food, cooking fuel, and long-term staples.' },
  { slug: 'medical', group: 'preps', name: 'Medical and First Aid', cat: 'Medical and First Aid', icon: 'medkit', blurb: 'First aid, medications, and medical skills.' },
  { slug: 'hygiene', group: 'preps', name: 'Toiletries and Hygiene', cat: 'Toiletries and Hygiene', icon: 'soap', blurb: 'Toiletries, cleaning, and sanitation.' },
  { slug: 'power', group: 'preps', name: 'Light and Power', cat: 'Light and Power', icon: 'zap', blurb: 'Lighting, batteries, charging, and generation.' },
  { slug: 'documents', group: 'preps', name: 'Documents', cat: 'Documents', icon: 'file', blurb: 'Important papers, copies, and records.' },
  { slug: 'other', group: 'preps', name: 'Other', cat: 'Other', icon: 'package', blurb: 'Tools, shelter, pets, and anything else.' },
  { slug: 'plans', group: 'resources', name: 'Plans and Skills', cat: 'Plans and Skills', icon: 'clipboard', noInventory: true, blurb: 'Household plans, training, and community.' },
  ...(FEATURES.grabList ? [{ slug: 'grab', group: 'resources', name: 'Grab List', icon: 'backpack', blurb: 'What to take if you ever need to leave in a hurry, in order.' }] : []),
  { slug: 'go-bag', group: 'resources', name: 'Go-Bags', icon: 'rucksack', blurb: 'Bags of 30 liters or less, packed to get you home, get you out, or both.' },
  { slug: 'reference', group: 'resources', name: 'Quick Reference', icon: 'book', blurb: 'Short how-tos for when the power or water is out. Saved on this device, so they work offline.' },
  { slug: 'settings', name: 'Settings', icon: 'sliders', blurb: 'Household size, prep length, the app’s look, and backups.' },
  { slug: 'print', name: 'Print Summary', icon: 'printer', blurb: 'Your supplies on paper, for when a phone is dead or the power is out.' },
];

// Inventory categories, in menu order.
// Pages reached from the overview's Expired / Expiring tiles (not in the menu).
// Each lists items with that status across every category.
const STATUS_PAGES = [
  { slug: 'expired', name: 'Expired', status: 'expired', icon: 'alert', blurb: 'Items past their expiration date. Use, replace, or throw them out.' },
  { slug: 'expiring', name: 'Expiring Soon', status: 'soon', icon: 'clock', blurb: 'Items that expire within the next 60 days. Use these first.' },
];

// The welcome guide: shown to new users, and linked from Settings (not in the menu).
const WELCOME_PAGE = { slug: 'welcome', name: 'Welcome', icon: 'info', blurb: 'A quick look at how Prep Tracker works.' };

// The Year in review: celebrated on the Overview once a year, and opened any
// time from Settings (not in the menu).
const REVIEW_PAGE = { slug: 'review', name: 'Year in Review', icon: 'sparkles', blurb: 'A look back at how your supplies and savings have grown.' };

// Settings is a short list of titles, each opening its own page with a back
// button to the list. `section` matches a data-settings section in index.html;
// `group` splits the list into a few cards.
const SETTINGS_PAGES = [
  { section: 'household', group: 1, name: 'Household', icon: 'users' },
  { section: 'tier', group: 1, name: 'Prep Length', icon: 'calendar' },
  { section: 'hazards', group: 1, name: 'Local Hazards', icon: 'alert' },
  { section: 'savings', group: 1, name: 'Savings Goal', icon: 'dollar' },
  { section: 'theme', group: 2, name: 'Theme', icon: 'palette' },
  { section: 'review', group: 3, name: 'Year in Review', icon: 'sparkles' },
  { section: 'backup', group: 3, name: 'Backup', icon: 'save' },
  { section: 'low-power', group: 3, name: 'Low-Battery Mode', icon: 'battery' },
  { section: 'setup', group: 4, name: 'Setup', icon: 'refresh' },
  { section: 'about', group: 4, name: 'About the App', icon: 'info' },
  { section: 'support', group: 5, name: 'Support the App', icon: 'heart' },
].map((p) => ({ ...p, slug: `settings/${p.section}`, parent: 'settings', blurb: '' }));

const CATEGORIES = PAGES.filter((p) => p.cat && !p.noInventory).map((p) => p.cat);

// Common units offered in each category's Unit list. Water units are ones
// the days-of-water estimate knows how to convert to gallons.
const UNITS = {
  'Water': [['gallons'], ['liters'], ['bottles', 'bottles (16.9 oz / 500 mL)'], ['fl oz'], ['mL']],
  'Food': [['cans'], ['#10 cans'], ['jars'], ['boxes'], ['bags'], ['buckets'], ['lbs'], ['oz'], ['packets'], ['pouches'], ['meals'], ['servings'], ['bottles']],
  'Medical and First Aid': [['boxes'], ['bottles'], ['packs'], ['kits'], ['tablets'], ['doses'], ['rolls'], ['tubes'], ['pairs'], ['pieces']],
  'Toiletries and Hygiene': [['rolls'], ['packs'], ['bottles'], ['boxes'], ['bars'], ['tubes'], ['bags'], ['gallons'], ['pieces']],
  'Light and Power': [['batteries'], ['packs'], ['bulbs'], ['gallons'], ['cans'], ['units'], ['pieces']],
  'Documents': [['copies'], ['sets'], ['folders'], ['drives']],
  'Other': [['pieces'], ['packs'], ['boxes'], ['sets'], ['kits'], ['pairs'], ['rolls'], ['units']],
};
const OTHER_UNIT = '__other__';

function currentPage() {
  const slug = location.hash.replace(/^#\/?/, '');
  return PAGES.find((p) => p.slug === slug) || STATUS_PAGES.find((p) => p.slug === slug)
    || [WELCOME_PAGE, REVIEW_PAGE, ...SETTINGS_PAGES].find((p) => p.slug === slug) || PAGES[0];
}

// ---------- State ----------

// `current` is emergency cash saved so far, and `invested` is money in investments.
// `ageRange` and `incomeBracket` index AGE_RANGES and INCOME_BRACKETS in
// estimates.js and set the investment goal; 0 means not chosen.
// `investLevel` is the percent of the suggested investment goal you aim for (100 = as suggested).
// `weekly` is no longer used: emergency cash is a fixed CASH_PER_WEEK (estimates.js). It stays
// here so older backups still check out.
const DEFAULT_SAVINGS = { current: 0, invested: 0, weekly: 500, beyondYears: 2, ageRange: 0, incomeBracket: 0, investLevel: 100 };

// Fills in any missing fields, so data saved by older versions still loads.
// Categories that were removed or renamed. Saved data and imported backups
// are moved over when they load:
//   Documents & Cash → Documents (cash items go to Other)
//   Tools & Gear     → Other (stoves and cookware go to Food)
// Names that used "&" now spell out "and" (Medical & First Aid → Medical and
// First Aid, and so on); `spellOutAnd` handles those.
const spellOutAnd = (s) => (typeof s === 'string' ? s.replaceAll(' & ', ' and ') : s);
const OLD_TOOLS_TYPES = {
  'hand-tools': 'hand-tools', 'tools-other': 'hand-tools', fire: 'hand-tools',
  shelter: 'shelter', clothing: 'shelter', bags: 'bags', masks: 'masks', extinguisher: 'extinguisher',
};
function migrateItem(item) {
  if (item.category === 'Documents & Cash') {
    return item.type === 'cash'
      ? { ...item, category: 'Other', type: 'other-other' }
      : { ...item, category: 'Documents' };
  }
  if (item.category === 'Tools & Gear') {
    if (item.type === 'cooking') return { ...item, category: 'Food', type: 'food-gear' };
    const type = OLD_TOOLS_TYPES[item.type] || guessType({ name: item.name, category: 'Other' }) || 'other-other';
    return { ...item, category: 'Other', type };
  }
  return { ...item, category: spellOutAnd(item.category) };
}

// ---------- Grab list data ----------
// Two ordered lists of what to take when leaving in a hurry. Each entry is
// { id, name, where, itemId, cat, types, done }: itemId links it to an
// inventory item, whose current location is shown instead of `where`; cat
// (and optionally types) ties it to a kind of inventory item, whose storage
// locations are shown when there's no link or typed location; done is
// ticked off when it's been grabbed.

const GRAB_LISTS = [
  { key: 'five', title: 'If You Have 5 Minutes', short: '5 minutes', hint: 'The essentials, in the order you’d grab them.' },
  { key: 'fifteen', title: 'If You Have 15 Minutes', short: '15 minutes', hint: 'Everything above first, then these.' },
];

// A starting point built on the "5 Ps": people and pets, papers,
// prescriptions, personal needs, and priceless items.
// Each starter entry names the inventory items it goes with.
const STARTER_GRAB = {
  five: [
    { name: 'Everyone in the household, and pets' },
    { name: 'Go-bags', cat: 'Other', types: ['bags'] },
    { name: 'Medications and glasses', cat: 'Medical and First Aid' },
    { name: 'Phone, charger, wallet, and keys' },
    { name: 'Document pouch', cat: 'Documents' },
  ],
  fifteen: [
    { name: 'Water and snacks for the car', cat: 'Water' },
    { name: 'Pet food, leashes, and carriers', cat: 'Other', types: ['pet-food', 'pet-supplies'] },
    { name: 'Change of clothes and sturdy shoes', cat: 'Other', types: ['shelter'] },
    { name: 'Laptop and backup drive', cat: 'Documents', types: ['digital'] },
    { name: 'Photos and keepsakes' },
    { name: 'Sleeping bags or blankets', cat: 'Other', types: ['shelter'] },
  ],
};
const STARTER_BY_NAME = new Map(Object.values(STARTER_GRAB).flat().map((s) => [s.name, s]));

function grabEntry({ id, name, where = '', itemId = null, cat = null, types = null, done = false }) {
  // Starter entries saved before categories existed pick theirs up by name.
  const starter = !cat && STARTER_BY_NAME.get(String(name).trim());
  return {
    id: id || newId(),
    name: String(name).trim(),
    where: String(where || '').trim(),
    itemId: itemId || null,
    cat: CATEGORIES.includes(cat) ? cat : starter?.cat || null,
    types: Array.isArray(types) ? types : starter?.types || null,
    done: Boolean(done),
  };
}

// Linked entries keep a copy of their item's current location, so it's still
// there if the item is deleted later. Refreshed on every save.
function syncGrabCopies() {
  for (const { key } of GRAB_LISTS) {
    for (const entry of state.grab[key]) {
      const item = entry.itemId && state.items.find((i) => i.id === entry.itemId);
      if (item) entry.where = (item.location || '').trim();
    }
  }
}

// Older data and backups have no grab list, so they start with the starter one.
function normalizeGrab(grab) {
  if (!grab || typeof grab !== 'object') {
    return Object.fromEntries(GRAB_LISTS.map(({ key }) => [key, STARTER_GRAB[key].map((s) => grabEntry(s))]));
  }
  const clean = (list) => (Array.isArray(list) ? list : [])
    .filter((e) => e && typeof e.name === 'string' && e.name.trim())
    .map(grabEntry);
  return Object.fromEntries(GRAB_LISTS.map(({ key }) => [key, clean(grab[key])]));
}

function normalize(data = {}) {
  const items = Array.isArray(data.items) ? data.items.map(migrateItem) : [];
  // When you started: saved since this version, or else the earliest date an
  // item was added. Used for the yearly Year in review.
  const earliestAdded = items.map((i) => i.added).filter(Boolean).sort()[0] || null;
  return {
    items,
    startedOn: /^\d{4}-\d{2}-\d{2}$/.test(data.startedOn) ? data.startedOn : earliestAdded,
    // One snapshot per month ({ month: 'YYYY-MM', items, water, food, saved, tier }).
    history: Array.isArray(data.history)
      ? data.history.filter((h) => h && /^\d{4}-\d{2}$/.test(h.month)).sort((a, b) => a.month.localeCompare(b.month)).slice(-HISTORY_MONTHS)
      : [],
    // adults, children, people (their total), meds and pets: see household.js.
    ...normalizeHousehold(data),
    tier: TIERS.some((t) => t.id === data.tier) ? data.tier : null,
    savings: { ...DEFAULT_SAVINGS, ...(data.savings || {}) },
    grab: normalizeGrab(data.grab),
    // Hazard ids from hazards.js, kept in that file's order.
    // Gear ticked off as packed on the Go-Bags page (go-bag.js).
    goBag: normalizeGoBag(data.goBag),
    hazards: Array.isArray(data.hazards) ? HAZARDS.map((h) => h.id).filter((id) => data.hazards.includes(id)) : [],
  };
}

// False when this browser had nothing saved, which is when the welcome
// popup appears.
let hadSavedData = false;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    hadSavedData = Boolean(raw);
    if (raw) return normalize(JSON.parse(raw));
  } catch (err) {
    console.warn('Could not read saved data:', err);
  }
  return normalize();
}

function saveState() {
  syncGrabCopies();
  recordSnapshot();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    noteChange();
    return true;
  } catch (err) {
    alert('Could not save. Your browser storage may be full or disabled.');
    return false;
  }
}

// ---------- Progress history ----------
// Each month keeps one snapshot of your progress, updated whenever you save,
// for the Year in review. Earlier months, from before snapshots were kept,
// are worked out from the dates items were added.

const HISTORY_MONTHS = 60;
const monthKey = (d = new Date()) => toIsoDate(d).slice(0, 7);
const round1 = (n) => Math.round(n * 10) / 10;

function snapshotNow() {
  return {
    month: monthKey(),
    items: state.items.length,
    water: round1(waterDays()),
    food: round1(foodCalories().days),
    saved: Math.round(totalSaved()),
    tier: state.tier,
  };
}

function recordSnapshot() {
  if (!state.startedOn) state.startedOn = toIsoDate(new Date());
  const snap = snapshotNow();
  state.history = state.history.filter((h) => h.month !== snap.month);
  state.history.push(snap);
  state.history.sort((a, b) => a.month.localeCompare(b.month));
  state.history = state.history.slice(-HISTORY_MONTHS);
}

// ---------- Backup reminders ----------
// Kept apart from the inventory (and out of backups): the date of the last
// export, the date of the first change since then, how many item changes
// have been made since then, and a "remind me later" date. Dates are
// YYYY-MM-DD.
//
// Once something has changed since the last backup, the reminder appears
// after 30 days without one, or after 5 item changes, whichever comes first.

const BACKUP_KEY = 'prep-tracker:backup';
const BACKUP_REMIND_DAYS = 30;
const BACKUP_REMIND_CHANGES = 5;
const BACKUP_SNOOZE_DAYS = 7;

function backupInfo() {
  try {
    const info = JSON.parse(localStorage.getItem(BACKUP_KEY));
    if (info && typeof info === 'object') return info;
  } catch { /* fall through */ }
  return { last: null, changedSince: null, itemChanges: 0, snoozeUntil: null };
}

function saveBackupInfo(info) {
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify(info)); } catch { /* not essential */ }
}

// The item list as last saved, to tell item changes apart from settings
// changes. Set once the state has loaded.
let savedItemsJson = null;

// Called on every save. Records the first change after a backup, and counts
// a save as an item change when the item list is different from last time
// (adding, editing, deleting, Use one, Add one, and so on).
function noteChange() {
  const info = backupInfo();
  const itemsJson = JSON.stringify(state.items);
  const itemChanged = savedItemsJson !== null && itemsJson !== savedItemsJson;
  savedItemsJson = itemsJson;
  saveBackupInfo({
    ...info,
    changedSince: info.changedSince || toIsoDate(new Date()),
    itemChanges: (info.itemChanges || 0) + (itemChanged ? 1 : 0),
  });
}

function shouldRemindBackup() {
  const info = backupInfo();
  if (!state.items.length || !info.changedSince) return false;
  if (info.snoozeUntil && daysUntil(info.snoozeUntil) > 0) return false;
  if ((info.itemChanges || 0) >= BACKUP_REMIND_CHANGES) return true;
  // With no backup yet, the 30 days count from the first change.
  return -daysUntil(info.last || info.changedSince) >= BACKUP_REMIND_DAYS;
}

// "5 changes to your items", or plain "changes" when only settings changed.
function changesSinceText(info) {
  const n = info.itemChanges || 0;
  return n ? `${n} change${n === 1 ? '' : 's'} to your items` : 'changes';
}

// "today", "yesterday", or "41 days ago".
function daysAgo(iso) {
  const n = -daysUntil(iso);
  return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`;
}

const state = loadState();
savedItemsJson = JSON.stringify(state.items);

// ---------- Helpers ----------

const $ = (id) => document.getElementById(id);

// Titles of every element (page, section, card and pop-up headings, menu and
// settings entries, tile labels) use title case: each word capitalized, except
// articles, short conjunctions and short prepositions in the middle, like
// "Year in Review". Literal titles are written that way; titleCase() is for
// titles built from data whose wording is also used in sentences or as keys.
// Words that already have a capital, digit or symbol (N95, MREs, IDs) are kept.
const TITLE_SMALL_WORDS = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'as', 'at', 'by', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via', 'vs']);
function titleCase(text) {
  const words = String(text).split(' ');
  const last = words.length - 1;
  return words.map((word, i) => {
    const bare = word.toLowerCase().replace(/[^a-z]/g, '');
    const afterColon = i > 0 && /[:—]$/.test(words[i - 1]);
    if (i > 0 && i < last && !afterColon && TITLE_SMALL_WORDS.has(bare) && word === word.toLowerCase()) return word;
    return word.split('-').map((part) => part.replace(/^([^\p{L}]*)(\p{Ll})/u, (m, pre, c) => pre + c.toUpperCase())).join('-');
  }).join(' ');
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function currentTier() {
  return TIERS.find((t) => t.id === state.tier) || TIERS[0];
}

// A tier or hazard with only the suggestions this household needs: no
// prescription suggestions without special medications, and no pet ones
// without pets (see household.js).
const withHouseholdSupplies = (t) => ({ ...t, supplies: forHousehold(t.supplies, state) });

// The current tier plus every tier below it.
function includedTiers() {
  return TIERS.slice(0, TIERS.indexOf(currentTier()) + 1).map(withHouseholdSupplies);
}

// The hazards chosen in Settings, in hazards.js order.
function chosenHazards() {
  return HAZARDS.filter((h) => state.hazards.includes(h.id)).map(withHouseholdSupplies);
}

// "2 adults and 1 child" for the current household.
const householdNow = () => householdText(state);

// Grab list entries about pets (their types are all pet types) are hidden
// without pets, and the first starter entry drops "and pets". Nothing is
// removed from the saved list, so ticking Pets again brings them back.
function grabNeeded(entry) {
  if (!entry.cat || !entry.types?.length) return true;
  return entry.types.some((t) => householdNeeds(findType(entry.cat, t), state));
}
const GRAB_EVERYONE = 'Everyone in the household, and pets';
const grabName = (entry) => (!state.pets && entry.name === GRAB_EVERYONE ? 'Everyone in the household' : entry.name);
const visibleGrab = (key) => state.grab[key].filter(grabNeeded);
