// Prep Tracker — emergency supplies inventory.
// All data is stored in this browser's localStorage; nothing leaves the device.
// Tier definitions (suggested supplies, mindset, savings notes) live in tiers.js.
// Shelf-life estimates live in shelf-life.js.
// Calorie estimates for the Food page live in calories.js.

const STORAGE_KEY = 'prep-tracker:v1';
const SOON_DAYS = 60;

// Icons, including one per item type, live in icons.js.

// ---------- Pages ----------
// `cat` ties a page to an inventory category and to its suggested supplies.

const PAGES = [
  { slug: '', name: 'Overview', icon: 'home', blurb: 'Your readiness across every category.' },
  { slug: 'savings', name: 'Savings', icon: 'dollar', blurb: 'Your emergency cash and investments: the most flexible part of being prepared.' },
  { slug: 'water', name: 'Water', cat: 'Water', icon: 'droplet', blurb: 'Stored water, purification, and sources.' },
  { slug: 'food', name: 'Food', cat: 'Food', icon: 'utensils', blurb: 'Shelf-stable food, cooking fuel, and long-term staples.' },
  { slug: 'medical', name: 'Medical and First Aid', cat: 'Medical and First Aid', icon: 'medkit', blurb: 'First aid, medications, and medical skills.' },
  { slug: 'hygiene', name: 'Toiletries and Hygiene', cat: 'Toiletries and Hygiene', icon: 'soap', blurb: 'Toiletries, cleaning, and sanitation.' },
  { slug: 'power', name: 'Light and Power', cat: 'Light and Power', icon: 'zap', blurb: 'Lighting, batteries, charging, and generation.' },
  { slug: 'documents', name: 'Documents', cat: 'Documents', icon: 'file', blurb: 'Important papers, copies, and records.' },
  { slug: 'other', name: 'Other', cat: 'Other', icon: 'package', blurb: 'Tools, shelter, pets, and anything else.' },
  { slug: 'plans', name: 'Plans and Skills', cat: 'Plans and Skills', icon: 'clipboard', noInventory: true, blurb: 'Household plans, training, and community.' },
  { slug: 'settings', name: 'Settings', icon: 'sliders', blurb: 'Household size, how long you’re preparing for, and backups.' },
  { slug: 'print', name: 'Print summary', icon: 'printer', blurb: 'Your supplies on paper, for when a phone is dead or the power is out.' },
];

// Inventory categories, in menu order.
// Pages reached from the overview's Expired / Expiring tiles (not in the menu).
// Each lists items with that status across every category.
const STATUS_PAGES = [
  { slug: 'expired', name: 'Expired', status: 'expired', icon: 'alert', blurb: 'Items past their expiration date. Use, replace, or throw them out.' },
  { slug: 'expiring', name: 'Expiring soon', status: 'soon', icon: 'clock', blurb: 'Items that expire within the next 60 days. Use these first.' },
];

// The welcome guide: shown to new users, and linked from Settings (not in the menu).
const WELCOME_PAGE = { slug: 'welcome', name: 'Welcome', icon: 'info', blurb: 'A quick look at how Prep Tracker works.' };

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
    || (slug === WELCOME_PAGE.slug ? WELCOME_PAGE : PAGES[0]);
}

// ---------- State ----------

// `current` is emergency cash saved so far, and `invested` is money in investments.
const DEFAULT_SAVINGS = { current: 0, invested: 0, weekly: 500, beyondYears: 2 };

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

function normalize(data = {}) {
  return {
    items: Array.isArray(data.items) ? data.items.map(migrateItem) : [],
    people: data.people ?? 2,
    tier: TIERS.some((t) => t.id === data.tier) ? data.tier : null,
    savings: { ...DEFAULT_SAVINGS, ...(data.savings || {}) },
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    noteChange();
  } catch (err) {
    alert('Could not save. Your browser storage may be full or disabled.');
  }
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

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function currentTier() {
  return TIERS.find((t) => t.id === state.tier) || TIERS[0];
}

// The current tier plus every tier below it.
function includedTiers() {
  return TIERS.slice(0, TIERS.indexOf(currentTier()) + 1);
}

// Days from today until an ISO date (YYYY-MM-DD). Negative = in the past.
function daysUntil(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function statusOf(item) {
  const days = daysUntil(item.expires);
  if (days === null) return 'ok';
  if (days < 0) return 'expired';
  if (days <= SOON_DAYS) return 'soon';
  return 'ok';
}

// A number of days as a short, rounded span: days up to 2 months,
// then months up to 2 years, then years ("45 days", "5 months", "3 years").
const DAYS_PER_MONTH = 365.25 / 12;
function formatSpan(days) {
  const count = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (days > 730) return count(Math.round(days / 365.25), 'year');
  if (days > 60) return count(Math.round(days / DAYS_PER_MONTH), 'month');
  return count(days, 'day');
}

// The Expires row of an item: its label and text.
function expiryParts(item) {
  const days = daysUntil(item.expires);
  if (days === null) return { label: 'Expires', text: 'No date' };
  const date = formatLongDate(item.expires);
  if (days < 0) return { label: 'Expired', text: `${formatSpan(-days)} ago (${date})` };
  if (days === 0) return { label: 'Expires', text: `Today (${date})` };
  return { label: 'Expires', text: `In ${formatSpan(days)} (${date})` };
}

// Water types that aren't drinking water themselves, so they never count
// toward days of water (a bottle of bleach isn't a bottle of water).
const NOT_DRINKING_WATER = new Set(['tablets', 'bleach', 'filter']);
// Equipment that may or may not be full: counted when its unit is a volume
// ("55 gallons"), but never listed as "not counted".
const WATER_EQUIPMENT = new Set(['containers']);

// Stored drinking water (non-expired), and the items whose unit couldn't be
// converted to gallons (see gallonsPerUnit in units.js).
function waterSummary() {
  let gallons = 0;
  const uncounted = [];
  for (const i of state.items) {
    if (i.category !== 'Water' || statusOf(i) === 'expired') continue;
    // Older items have no type; go by the name instead.
    const type = i.type || guessType({ name: i.name, unit: i.unit, category: 'Water' });
    if (NOT_DRINKING_WATER.has(type)) continue;
    const per = gallonsPerUnit(i.unit);
    if (per !== null) gallons += Math.max(0, Number(i.quantity) || 0) * per;
    else if (!WATER_EQUIPMENT.has(type)) uncounted.push(i);
  }
  return { days: gallons / Math.max(1, state.people), uncounted };
}

function waterDays() {
  return waterSummary().days;
}

// "Rice and Honey", or "Rice, Honey, Oats, and 2 more", for naming items an
// estimate left out.
function listNames(items) {
  const names = items.slice(0, 3).map((i) => escapeHtml(i.name));
  if (items.length > 3) names.push(`${items.length - 3} more`);
  return new Intl.ListFormat('en-US', { type: 'conjunction' }).format(names);
}

function formatDays(d) {
  return d >= 10 ? String(Math.floor(d)) : d.toFixed(1).replace(/\.0$/, '');
}

function waterHint(tier) {
  return tier.waterGoalDays < 30 || tier.id === 'month'
    ? `Goal: 1 gallon per person per day for ${tier.waterGoalDays} days.`
    : 'Keep 30 days stored. Past that, rely on a water source you can filter and purify.';
}

// ---------- Food calories ----------

const CALORIES_PER_DAY = 2000; // per person, a common planning figure

// The food goal follows the tier, up to a year: past that, the plan shifts
// from storing food to producing it (as water caps at 30 days).
function foodGoalDays(tier) {
  return tier.days ?? 365;
}

// Rounds down to two significant figures (48,250 → 48,000), since the
// estimate isn't precise enough for more and should lean low.
function roughCalories(n) {
  const whole = Math.max(0, Math.floor(n));
  const step = 10 ** Math.max(0, String(whole).length - 2);
  return (Math.floor(whole / step) * step).toLocaleString('en-US');
}

// Total estimated calories in non-expired Food items, and the items the
// estimate couldn't work out (no type, or a unit it can't convert).
function foodCalories() {
  let calories = 0;
  let count = 0;
  const unestimated = [];
  for (const i of state.items) {
    if (i.category !== 'Food') continue;
    count += 1;
    if (statusOf(i) === 'expired') continue;
    const est = estimateCalories(i);
    if (est?.unknown) unestimated.push(i);
    else if (est?.calories) calories += est.calories;
  }
  const days = calories / (CALORIES_PER_DAY * Math.max(1, state.people));
  return { calories, days, count, unestimated };
}

// The Calories row of a Food item, or null for items that aren't counted.
function caloriesFact(item) {
  const est = estimateCalories(item);
  if (!est || est.none) return null;
  if (est.unknown === 'type') return '<span class="est">Not estimated without a type</span>';
  if (est.unknown && !String(item.unit || '').trim()) return '<span class="est">Not estimated without a unit</span>';
  if (est.unknown) return `<span class="est">Not estimated for “${escapeHtml(item.unit)}”</span>`;
  const expired = statusOf(item) === 'expired' ? ' <span class="est">(not counted while expired)</span>' : '';
  return `About ${roughCalories(est.calories)} <span class="est">est.</span>${expired}`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ---------- Supplies and savings math ----------

// Suggested supplies for a category, across the current tier and the ones below it.
function suppliesFor(cat) {
  return includedTiers().flatMap((t) => t.supplies.filter((s) => s.cat === cat));
}

// True if the inventory already has an item with this name in this category.
// Commas are ignored and "&" counts as "and", so "Rice, pasta and oats" (an
// older suggestion name) still matches "Rice, pasta, and oats".
function inInventory(name, cat) {
  const key = (s) => spellOutAnd(s).replace(/,/g, '').trim().toLowerCase();
  const n = key(name);
  return state.items.some((i) => i.category === cat && key(i.name) === n);
}

function tierWeeks(tier) {
  const days = tier.days ?? state.savings.beyondYears * 365;
  return days / 7;
}

// The emergency cash goal is the weekly baseline times the tier's length.
// Investments aim for 1.5 times that, and the Overview shows both together.
const INVEST_MULTIPLIER = 1.5;

function cashGoal(tier) {
  return Math.round(tierWeeks(tier) * (Number(state.savings.weekly) || 0));
}

function investGoal(tier) {
  return Math.round(cashGoal(tier) * INVEST_MULTIPLIER);
}

function savingsGoal(tier) {
  return cashGoal(tier) + investGoal(tier);
}

function totalSaved() {
  return (Number(state.savings.current) || 0) + (Number(state.savings.invested) || 0);
}

function alertsFor(cat) {
  const items = state.items.filter((i) => i.category === cat);
  return {
    expired: items.filter((i) => statusOf(i) === 'expired').length,
    soon: items.filter((i) => statusOf(i) === 'soon').length,
  };
}

// ---------- Navigation ----------

function renderNav(page) {
  $('nav-list').innerHTML = PAGES.map((p) => {
    const a = p.cat ? alertsFor(p.cat) : { expired: 0, soon: 0 };
    const n = a.expired + a.soon;
    const alert = n
      ? `<span class="nav-alert ${a.expired ? 'bad' : 'warn'}" title="${a.expired} expired, ${a.soon} expiring soon">${n}</span>`
      : '';
    return `
      <li class="${['water', 'plans', 'settings'].includes(p.slug) ? 'sep' : ''}">
        <a class="nav-link" href="#/${p.slug}" ${p === page ? 'aria-current="page"' : ''}>
          ${icon(p.icon)}<span>${escapeHtml(p.name)}</span>${alert}
        </a>
      </li>`;
  }).join('');
}

function openDrawer() {
  $('drawer').inert = false;
  $('drawer').classList.add('open');
  $('scrim').hidden = false;
  $('menu-btn').setAttribute('aria-expanded', 'true');
  ($('drawer').querySelector('[aria-current]') || $('menu-close')).focus();
}

function closeDrawer({ restoreFocus = true } = {}) {
  if (!$('drawer').classList.contains('open')) return;
  $('drawer').classList.remove('open');
  $('drawer').inert = true;
  $('scrim').hidden = true;
  $('menu-btn').setAttribute('aria-expanded', 'false');
  if (restoreFocus) $('menu-btn').focus();
}

$('menu-btn').addEventListener('click', openDrawer);
$('menu-close').addEventListener('click', () => closeDrawer());
$('scrim').addEventListener('click', () => closeDrawer());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});

// Set when "Edit" is tapped on the Expired / Expiring pages; the item opens
// in its category page's form once the page changes.
let pendingEditId = null;

window.addEventListener('hashchange', () => {
  closeDrawer({ restoreFocus: false });
  $('search').value = '';
  $('filter-status').value = '';
  $('supplies-details').open = false;
  resetForm();
  render();
  window.scrollTo(0, 0);
  // "Edit" on the Expired / Expiring pages opens the item on its category page.
  const pending = state.items.find((i) => i.id === pendingEditId);
  pendingEditId = null;
  if (pending && currentPage().cat === pending.category) startEdit(pending);
  // A new user who leaves the welcome guide through the menu still needs a tier.
  askForTierIfNeeded();
});

// ---------- Rendering: Overview ----------

function renderOverview(wd) {
  const tier = currentTier();

  $('stat-items').textContent = state.items.length;
  $('stat-soon').textContent = state.items.filter((i) => statusOf(i) === 'soon').length;
  $('stat-expired').textContent = state.items.filter((i) => statusOf(i) === 'expired').length;
  $('stat-water').textContent = formatDays(wd);

  renderBackupReminder();

  $('plan-title').textContent = `${tier.name} plan: ${tier.title}`;
  $('plan-mindset').textContent = tier.mindset;

  // Savings first, then one card per category page.
  const cards = PAGES.filter((p) => p.cat).map((p) => {
    const count = state.items.filter((i) => i.category === p.cat).length;
    const a = alertsFor(p.cat);
    // Inventory pages show how many items you have; Plans and Skills has no
    // inventory, so it shows its description instead.
    const meta = p.noInventory ? escapeHtml(p.blurb) : `${count} item${count === 1 ? '' : 's'}`;
    const badges = [
      a.expired && `<span class="badge expired">${a.expired} expired</span>`,
      a.soon && `<span class="badge soon">${a.soon} expiring</span>`,
    ].filter(Boolean).join('');
    return `
      <a class="cat-card" href="#/${p.slug}">
        <span class="cat-icon">${icon(p.icon)}</span>
        <span class="cat-name">${escapeHtml(p.name)}</span>
        <span class="cat-meta">${meta}</span>
        ${badges ? `<span class="cat-badges">${badges}</span>` : ''}
      </a>`;
  });

  // Emergency cash and investments together.
  const goal = savingsGoal(tier);
  const saved = totalSaved();
  const sp = goal ? Math.min(100, Math.round((saved / goal) * 100)) : 0;
  cards.unshift(`
    <a class="cat-card" href="#/savings">
      <span class="cat-icon">${icon('dollar')}</span>
      <span class="cat-name">Savings</span>
      <span class="cat-meta">${money.format(saved)} of ${money.format(goal)}</span>
      <span class="mini-bar"><span style="width:${sp}%"></span></span>
    </a>`);

  $('cat-grid').innerHTML = cards.join('');
}

// A gentle note on the Overview when changes have gone a while without a backup.
function renderBackupReminder() {
  const show = shouldRemindBackup();
  $('backup-reminder').hidden = !show;
  if (!show) return;
  const info = backupInfo();
  $('backup-reminder-text').textContent = info.last
    ? `Your last backup was ${daysAgo(info.last)}, and you’ve made ${changesSinceText(info)} since then. Your data is saved only on this device, so exporting a backup keeps a copy somewhere safe.`
    : 'You haven’t exported a backup from this device yet. Your data is saved only here, so exporting one keeps a copy somewhere safe.';
}

// ---------- Rendering: category page ----------

// Reference list of suggested supplies. Category pages show it in a
// collapsible section; Plans and Skills (no inventory) shows it in a plain card.
function renderSupplies(page) {
  const tier = currentTier();
  const canAdd = !page.noInventory;
  let total = 0;

  // Current tier first, then the foundations it builds on, nearest first.
  const html = [...includedTiers()].reverse().map((t) => {
    const list = t.supplies.filter((s) => s.cat === page.cat);
    if (!list.length) return '';
    total += list.length;
    const label = t === tier ? `${t.name} · your tier` : `${t.name} · foundation`;
    return `
      <h3>${escapeHtml(label)}</h3>
      <ul class="supplies">
        ${list.map((s) => {
          const have = canAdd && inInventory(s.name, page.cat);
          const action = !canAdd ? ''
            : have ? '<span class="have">In inventory</span>'
            : `<button type="button" class="add-supply" data-add="${escapeHtml(s.name)}" aria-label="Add ${escapeHtml(s.name)} to inventory">Add</button>`;
          return `
            <li>
              <div>
                <span class="supply-name">${escapeHtml(s.name)}</span>
                <span class="supply-note">${escapeHtml(s.note)}</span>
              </div>
              ${action}
            </li>`;
        }).join('')}
      </ul>`;
  }).join('');

  $('plans-card').hidden = !page.noInventory || total === 0;
  $('supplies-card').hidden = Boolean(page.noInventory) || total === 0;
  if (page.noInventory) {
    $('plans-intro').textContent = `Plans and skills worth having at the ${tier.name} tier.`;
    $('plans-list').innerHTML = html;
    $('supplies').innerHTML = '';
    return;
  }
  $('supplies-count').textContent = `${total} idea${total === 1 ? '' : 's'}`;
  $('supplies-intro').textContent =
    `Ideas for your shopping list at the ${tier.name} tier. Tap Add once you have something to log it in your inventory.`;
  $('supplies').innerHTML = html;
  $('plans-list').innerHTML = '';
}

// "Add" on a suggestion fills the add-item form with its name.
$('supplies').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  resetForm();
  $('name').value = btn.dataset.add;
  suggestType();
  updateExpiresHint();
  $('form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('quantity').focus({ preventScroll: true });
  $('quantity').select();
});

// The item whose actions menu is open. Kept across re-renders so "Use one"
// and "Add one" can be tapped repeatedly without reopening the menu.
let openMenuId = null;

// The icon for a type's group heading, or its category's icon when the type has none.
function typeIcon(category, typeId) {
  return TYPE_ICONS[typeId] || PAGES.find((p) => p.cat === category)?.icon || 'package';
}

// One inventory row. Used on category pages and the Expired / Expiring pages.
function itemRow(i) {
  const s = statusOf(i);
  const badge = s === 'ok' ? '' :
    `<span class="badge ${s}">${s === 'expired' ? 'Expired' : 'Expiring soon'}</span>`;
  const type = findType(i.category, i.type);
  const open = i.id === openMenuId;
  // With a type shown, "(est.)" is enough; older items name their basis.
  const basis = type ? '' : ` · ${escapeHtml(i.expiresBasis || 'typical shelf life')}`;
  const exp = expiryParts(i);
  const calories = caloriesFact(i);
  const expiry = i.expiresEstimated
    ? `${exp.text} <span class="est" title="Estimated from the item type's typical shelf life. Edit the item to enter the printed date.">est.${basis}</span>`
    : exp.text;
  // One labelled row per detail; empty ones are left out.
  const facts = [
    ['Quantity', `${i.quantity} ${escapeHtml(i.unit)}`.trim()],
    type && ['Type', escapeHtml(type.name)],
    calories && ['Calories', calories],
    [exp.label, expiry],
    i.location && ['Location', escapeHtml(i.location)],
    i.notes && ['Notes', escapeHtml(i.notes)],
  ].filter(Boolean).map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join('');
  return `
    <li class="item" data-id="${i.id}">
      <div class="item-head">
        <div class="title">${escapeHtml(i.name)}${badge}</div>
        <div class="item-menu">
          <button type="button" class="menu-btn" data-act="menu" aria-expanded="${open}"
            aria-controls="menu-${i.id}" aria-label="Actions for ${escapeHtml(i.name)}">${icon('dots')}</button>
          <div class="menu" id="menu-${i.id}" ${open ? '' : 'hidden'}>
            <button type="button" data-act="dec"><span class="menu-sym" aria-hidden="true">−</span>Use one</button>
            <button type="button" data-act="inc"><span class="menu-sym" aria-hidden="true">+</span>Add one</button>
            <button type="button" data-act="edit">Edit</button>
            <button type="button" data-act="del" class="danger">Delete</button>
          </div>
        </div>
      </div>
      <dl class="facts">${facts}</dl>
    </li>`;
}

const STATUS_ORDER = { expired: 0, soon: 1, ok: 2 };
function byExpiry(a, b) {
return STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)] ||
  (a.expires || '9999').localeCompare(b.expires || '9999') ||
  a.name.localeCompare(b.name);
}

// Expired / Expiring soon: matching items from every category, grouped by category.
function renderStatus(page) {
  const items = state.items.filter((i) => statusOf(i) === page.status).sort(byExpiry);
  $('status-list').innerHTML = PAGES.filter((p) => CATEGORIES.includes(p.cat)).map((p) => {
    const group = items.filter((i) => i.category === p.cat);
    if (!group.length) return '';
    return `
      <section class="card status-group">
        <h2><a href="#/${p.slug}">${icon(p.icon)}<span>${escapeHtml(p.name)}</span></a><span class="count">${group.length}</span></h2>
        <ul class="items">${group.map(itemRow).join('')}</ul>
      </section>`;
  }).join('');
  $('status-empty').hidden = items.length > 0;
  $('status-empty').textContent = page.status === 'expired'
    ? 'Nothing has expired. Nice work.'
    : 'Nothing expires in the next 60 days.';
}

// ---------- Inventory groups ----------
// Once a category holds more than 3 types of item, its inventory is split
// into collapsible groups: one per type, or for Food, one per section of the
// Type list (Canned and jarred, Dry staples, …), since Food has ~40 types.

const GROUP_AFTER_TYPES = 3;
const GROUP_BY_SECTION = new Set(['Food']);
const NO_TYPE = '__none__';

// Which group an item belongs to, and that group's place in the Type list.
function groupOf(item) {
  const types = typesFor(item.category);
  const type = findType(item.category, item.type);
  if (!type) return { key: NO_TYPE, name: 'No type', order: Infinity, icon: typeIcon(item.category) };
  if (GROUP_BY_SECTION.has(item.category) && type.group) {
    return {
      key: `section:${type.group}`, name: type.group, order: types.findIndex((t) => t.group === type.group),
      icon: SECTION_ICONS[type.group] || typeIcon(item.category),
    };
  }
  return { key: type.id, name: type.name, order: types.indexOf(type), icon: typeIcon(item.category, type.id) };
}

// Open/closed groups the user chose, per category, remembered in this browser.
const GROUPS_KEY = 'prep-tracker:open-groups';
let groupChoices = {};
try { groupChoices = JSON.parse(localStorage.getItem(GROUPS_KEY)) || {}; } catch { /* no storage */ }
// Choices saved before names spelled out "and" (e.g. "Canned & jarred").
groupChoices = Object.fromEntries(Object.entries(groupChoices).map(([cat, groups]) => [
  spellOutAnd(cat),
  Object.fromEntries(Object.entries(groups || {}).map(([key, open]) => [spellOutAnd(key), open])),
]));

function setGroupOpen(cat, key, open) {
  (groupChoices[cat] ||= {})[key] = open;
  try { localStorage.setItem(GROUPS_KEY, JSON.stringify(groupChoices)); } catch { /* no storage */ }
}

// Groups the user hasn't opened or closed start open only if they hold
// something expired or expiring soon.
function isGroupOpen(cat, group) {
  const choice = groupChoices[cat]?.[group.key];
  return choice ?? group.urgency < STATUS_ORDER.ok;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function renderInventory(page) {
  const items = state.items.filter((i) => i.category === page.cat);

  const uniq = (key) => [...new Set(state.items.map((i) => i[key]).filter(Boolean))].sort();
  $('location-list').innerHTML = uniq('location').map((l) => `<option value="${escapeHtml(l)}">`).join('');

  const q = $('search').value.trim().toLowerCase();
  const st = $('filter-status').value;
  const filtering = Boolean(q || st);

  const matches = (i) => (!st || statusOf(i) === st) &&
    (!q || [i.name, findType(i.category, i.type)?.name, i.location, i.notes].join(' ').toLowerCase().includes(q));
  const visible = items.filter(matches).sort(byExpiry);

  // Grouping depends on everything in the category, not just what the
  // filters show, so the list doesn't change shape while you search.
  const typeCount = new Set(items.map((i) => i.type || NO_TYPE)).size;
  const groups = new Map();
  if (typeCount > GROUP_AFTER_TYPES) {
    for (const i of items) {
      const g = groupOf(i);
      if (!groups.has(g.key)) groups.set(g.key, { ...g, all: [], shown: [], urgency: STATUS_ORDER.ok });
      const group = groups.get(g.key);
      group.all.push(i);
      group.urgency = Math.min(group.urgency, STATUS_ORDER[statusOf(i)]);
    }
    for (const i of visible) groups.get(groupOf(i).key).shown.push(i);
  }

  if (groups.size < 2) {
    $('group-tools').hidden = true;
    $('items').innerHTML = visible.length ? `<ul class="items">${visible.map(itemRow).join('')}</ul>` : '';
  } else {
    // Groups needing attention first, then in Type-list order.
    const list = [...groups.values()]
      .filter((g) => g.shown.length)
      .sort((a, b) => a.urgency - b.urgency || a.order - b.order || a.name.localeCompare(b.name));

    $('items').innerHTML = list.map((g) => {
      const expired = g.all.filter((i) => statusOf(i) === 'expired').length;
      const soon = g.all.filter((i) => statusOf(i) === 'soon').length;
      const badges = [
        expired && `<span class="badge expired">${expired} expired</span>`,
        soon && `<span class="badge soon">${soon} expiring</span>`,
      ].filter(Boolean).join('');
      const count = filtering && g.shown.length < g.all.length
        ? `${g.shown.length} of ${plural(g.all.length, 'item')}`
        : plural(g.all.length, 'item');
      // While searching or filtering, every group with a match is open.
      const open = filtering || isGroupOpen(page.cat, g);
      return `
        <details class="item-group" data-group="${escapeHtml(g.key)}" ${open ? 'open' : ''}>
          <summary>
            <span class="group-icon">${icon(g.icon)}</span>
            <span class="group-title">
              <span class="group-name">${escapeHtml(g.name)}</span>
              ${badges ? `<span class="group-badges">${badges}</span>` : ''}
            </span>
            <span class="group-count">${count}</span>
          </summary>
          <ul class="items">${g.shown.map(itemRow).join('')}</ul>
        </details>`;
    }).join('');

    const allOpen = list.every((g) => isGroupOpen(page.cat, g));
    $('group-tools').hidden = filtering;
    $('toggle-groups').textContent = allOpen ? 'Collapse all' : 'Expand all';
    $('toggle-groups').dataset.open = String(!allOpen);
  }

  $('empty').hidden = visible.length > 0;
  $('empty').textContent = items.length
    ? 'No items match your filters.'
    : `No ${page.name.toLowerCase()} items yet. Add one below.`;
}

function renderCategory(page, wd) {
  const tier = currentTier();

  // Water gets a headline "days stored" panel.
  $('water-panel').hidden = page.slug !== 'water';
  if (page.slug === 'water') {
    const pct = Math.min(100, Math.round((wd / tier.waterGoalDays) * 100));
    $('water-days').textContent = formatDays(wd);
    $('water-goal').textContent = ` / ${tier.waterGoalDays}`;
    $('water-bar').style.width = `${pct}%`;
    $('water-bar').classList.toggle('complete', pct >= 100);
    $('water-panel-hint').innerHTML =
      `For ${state.people} ${state.people === 1 ? 'person' : 'people'} (change in <a href="#/settings">Settings</a>). ${escapeHtml(waterHint(tier))}`;
    const { uncounted } = waterSummary();
    $('water-uncounted').hidden = uncounted.length === 0;
    if (uncounted.length) {
      const them = uncounted.length === 1 ? 'it' : 'them';
      $('water-uncounted').innerHTML =
        `Not counted yet: ${listNames(uncounted)}. Edit ${them} and choose gallons, liters, or bottles, ` +
        `or put the size in the unit (like “5-gallon jugs”), to include ${them}.`;
    }
  }

  // Food gets a rough calorie estimate.
  $('food-panel').hidden = page.slug !== 'food';
  if (page.slug === 'food') renderFoodPanel(tier);

  renderSupplies(page);

  $('inventory-card').hidden = Boolean(page.noInventory);
  $('form-card').hidden = Boolean(page.noInventory);
  if (!page.noInventory) renderInventory(page);
}

function renderFoodPanel(tier) {
  const { calories, days, count, unestimated } = foodCalories();
  const goal = foodGoalDays(tier);
  // Rounded down, like the calories, so the estimate never reads high.
  const shownDays = Math.floor(days * 10) / 10;
  const people = `${state.people} ${state.people === 1 ? 'person' : 'people'}`;

  $('food-calories').textContent = roughCalories(calories);
  $('food-bar').style.width = `${Math.min(100, Math.round((days / goal) * 100))}%`;
  $('food-bar').classList.toggle('complete', days >= goal);
  $('food-panel-hint').innerHTML = count === 0
    ? 'Add food to your inventory below to see an estimate.'
    : `About ${formatDays(shownDays)} ${shownDays === 1 ? 'day' : 'days'} of food for ${people} ` +
      `(change in <a href="#/settings">Settings</a>). ` +
      `Goal: ${CALORIES_PER_DAY.toLocaleString('en-US')} calories per person per day for ${goal} days.`;

  // Name the items left out, so they can be fixed.
  const note = $('food-unestimated');
  note.hidden = unestimated.length === 0;
  if (unestimated.length) {
    const them = unestimated.length === 1 ? 'it' : 'them';
    const fix = unestimated.some((i) => !findType(i.category, i.type))
      ? 'choose a type and one of the listed units'
      : 'choose one of the listed units, or put the size in the unit (like “5 lb bags”),';
    note.innerHTML = `Not estimated yet: ${listNames(unestimated)}. Edit ${them} and ${fix} to include ${them}.`;
  }
}

// ---------- Rendering: savings ----------

// Fills in one card on the Savings page: the amount, goal, bar, and math line.
function renderFund(prefix, current, goal, math) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  $(`${prefix}-current-display`).textContent = money.format(current);
  $(`${prefix}-goal`).textContent = money.format(goal);
  $(`${prefix}-bar`).style.width = `${pct}%`;
  $(`${prefix}-bar`).classList.toggle('complete', goal > 0 && current >= goal);
  const remaining = Math.max(0, goal - current);
  $(`${prefix}-math`).textContent =
    `${math} ` + (remaining > 0 ? `${money.format(remaining)} to go.` : 'Goal reached.');
}

function renderSavings() {
  const tier = currentTier();
  const cash = Number(state.savings.current) || 0;
  const invested = Number(state.savings.invested) || 0;

  $('savings-note').textContent = tier.savingsNote;

  const weeks = tierWeeks(tier);
  const weeksText = weeks === 1 ? '1 week' : `${weeks.toFixed(1).replace(/\.0$/, '')} weeks`;
  const span = tier.days === null
    ? `${state.savings.beyondYears} year${state.savings.beyondYears === 1 ? '' : 's'} (${weeksText})`
    : weeksText;
  renderFund('savings', cash, cashGoal(tier),
    `${tier.name} tier: ${span} × ${money.format(Number(state.savings.weekly) || 0)}/week.`);
  renderFund('invest', invested, investGoal(tier),
    `1.5 times your ${money.format(cashGoal(tier))} emergency cash goal.`);

  // Don't overwrite a field while the user is typing in it.
  const fields = {
    'savings-current': cash, 'invest-current': invested,
    'savings-weekly': state.savings.weekly, 'beyond-years': state.savings.beyondYears,
  };
  for (const [id, val] of Object.entries(fields)) {
    if (document.activeElement !== $(id)) $(id).value = val;
  }
  $('beyond-years-wrap').hidden = tier.days !== null;
}

// ---------- Rendering: page shell ----------

function render() {
  const page = currentPage();
  const wd = waterDays();

  document.title = page.slug ? `${page.name} · Prep Tracker` : 'Prep Tracker';
  $('page-icon').innerHTML = icon(page.icon);
  $('page-title').textContent = page.name;
  $('page-sub').textContent = page.blurb;

  renderNav(page);

  const view = page.slug === '' ? 'overview'
    : ['savings', 'settings', 'welcome', 'print'].includes(page.slug) ? page.slug
    : page.status ? 'status' : 'category';
  for (const v of ['overview', 'category', 'savings', 'settings', 'status', 'welcome', 'print']) $(`view-${v}`).hidden = v !== view;

  if (view === 'overview') renderOverview(wd);
  if (view === 'category') renderCategory(page, wd);
  if (view === 'savings') renderSavings();
  if (view === 'status') renderStatus(page);
  if (view === 'settings') renderSettings();
  if (view === 'print') renderPrint();
}

// ---------- Rendering: print summary ----------
// A plain document of everything on hand, laid out to print on paper (or
// save as a PDF). On screen it's a preview; the print styles in styles.css
// hide the app around it.

function printDate() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// The Expires cell: the date, marked when it's estimated, expired, or soon.
function printExpiry(item) {
  if (!item.expires) return '<span class="pd-muted">No date</span>';
  const s = statusOf(item);
  const flag = s === 'expired' ? '<strong>Expired</strong> ' : s === 'soon' ? '<strong>Soon</strong> ' : '';
  return `${flag}${formatLongDate(item.expires)}${item.expiresEstimated ? ' <span class="pd-muted">est.</span>' : ''}`;
}

// Relative column widths, so every table on the page lines up.
const PRINT_COL_WIDTHS = { Item: 26, Quantity: 13, Category: 16, Location: 17, Expires: 22, Notes: 20 };

// One table of items. `columns` picks the extra columns: Location, Category, or both.
function printTable(items, columns) {
  const head = ['Item', 'Quantity', ...columns, 'Expires', 'Notes'];
  const total = head.reduce((sum, h) => sum + PRINT_COL_WIDTHS[h], 0);
  const cols = head.map((h) => `<col style="width:${((PRINT_COL_WIDTHS[h] / total) * 100).toFixed(1)}%">`).join('');
  const cell = (label, html) => `<td data-label="${label}">${html}</td>`;
  const rows = items.map((i) => `
    <tr>
      ${cell('Item', escapeHtml(i.name))}
      ${cell('Quantity', escapeHtml(`${i.quantity} ${i.unit || ''}`.trim()))}
      ${columns.map((c) => cell(c, escapeHtml(c === 'Location' ? i.location : i.category))).join('')}
      ${cell('Expires', printExpiry(i))}
      ${cell('Notes', escapeHtml(i.notes))}
    </tr>`).join('');
  return `
    <table class="pd-table">
      <colgroup>${cols}</colgroup>
      <thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

const byName = (a, b) => a.name.localeCompare(b.name);

// Inventory groups for the printout: by category (in menu order), or by
// storage location (A to Z, with items that have none at the end).
function printGroups(groupBy) {
  if (groupBy === 'location') {
    const groups = new Map();
    for (const i of state.items) {
      const label = (i.location || '').trim();
      const key = label.toLowerCase();
      if (!groups.has(key)) groups.set(key, { label: label || 'No location set', items: [] });
      groups.get(key).items.push(i);
    }
    const catOrder = (i) => CATEGORIES.indexOf(i.category);
    return [...groups.entries()]
      .sort(([a], [b]) => (a === '') - (b === '') || a.localeCompare(b))
      .map(([, g]) => ({ ...g, items: g.items.sort((a, b) => catOrder(a) - catOrder(b) || byName(a, b)), columns: ['Category'] }));
  }
  return CATEGORIES
    .map((cat) => ({ label: cat, items: state.items.filter((i) => i.category === cat).sort(byName), columns: ['Location'] }))
    .filter((g) => g.items.length);
}

function renderPrint() {
  const tier = currentTier();
  const groupBy = $('print-group').value;
  const water = waterDays();
  const food = foodCalories();
  const people = `${state.people} ${state.people === 1 ? 'person' : 'people'}`;
  const expired = state.items.filter((i) => statusOf(i) === 'expired');
  const soon = state.items.filter((i) => statusOf(i) === 'soon');

  const glance = [
    ['Items', String(state.items.length)],
    ['Water', water > 0
      ? `About ${formatDays(water)} days for ${people} (goal ${tier.waterGoalDays} days)`
      : 'None counted yet'],
    ['Food', food.calories > 0
      ? `About ${formatDays(food.days)} days for ${people}, a rough estimate (goal ${foodGoalDays(tier)} days)`
      : 'None counted yet'],
    ['Expired', String(expired.length)],
    ['Expiring within 60 days', String(soon.length)],
  ];
  if ($('print-savings').checked) {
    glance.push(
      ['Emergency cash', `${money.format(Number(state.savings.current) || 0)} of ${money.format(cashGoal(tier))}`],
      ['Investments', `${money.format(Number(state.savings.invested) || 0)} of ${money.format(investGoal(tier))}`],
    );
  }

  const attention = [...expired, ...soon].sort(byExpiry);
  const groups = printGroups(groupBy);

  $('print-doc').innerHTML = `
    <header class="pd-head">
      <h2>Prep Tracker summary</h2>
      <p class="pd-meta">Printed ${printDate()} · Household of ${state.people} · ${escapeHtml(tier.name).replaceAll(' ', '&nbsp;')} plan: ${escapeHtml(tier.title)}</p>
    </header>

    <section class="pd-section">
      <h3>At a glance</h3>
      <dl class="pd-glance">
        ${glance.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
      </dl>
    </section>

    ${attention.length ? `
    <section class="pd-section">
      <h3>Use or replace soon</h3>
      ${printTable(attention, ['Category', 'Location'])}
    </section>` : ''}

    <section class="pd-section">
      <h3>Inventory${groupBy === 'location' ? ' by location' : ''}</h3>
      ${groups.length ? groups.map((g) => `
        <div class="pd-group">
          <h4><span>${escapeHtml(g.label)}</span><span class="pd-muted">${plural(g.items.length, 'item')}</span></h4>
          ${printTable(g.items, g.columns)}
        </div>`).join('') : '<p class="pd-muted">No items yet.</p>'}
    </section>

    <p class="pd-foot">A snapshot from ${printDate()}. The up-to-date list is in Prep Tracker on your device.</p>`;
}

$('print-group').addEventListener('change', renderPrint);
$('print-savings').addEventListener('change', renderPrint);
$('print-btn').addEventListener('click', () => window.print());

// ---------- Rendering: settings ----------

// One button per tier, used on the Settings page and the first-use picker.
function tierOptions() {
  return TIERS.map((t) => {
    const goal = t.days === null
      ? `${money.format(savingsGoal(t))} for ${state.savings.beyondYears} yrs`
      : money.format(savingsGoal(t));
    const selected = t.id === state.tier;
    return `
      <button value="${t.id}" data-tier="${t.id}" class="tier-option ${selected ? 'selected' : ''}" aria-pressed="${selected}">
        <strong>${t.name}</strong>
        <span class="tier-title">${t.title}</span>
        <span class="tier-goal">Savings goal ${goal}</span>
      </button>`;
  }).join('');
}

function renderSettings() {
  if (document.activeElement !== $('people')) $('people').value = state.people;
  $('settings-tiers').innerHTML = tierOptions();

  const info = backupInfo();
  $('backup-last').textContent = info.last
    ? `Last backup exported from this device: ${formatLongDate(info.last)} (${daysAgo(info.last)}).${info.changedSince ? ` You’ve made ${changesSinceText(info)} since then.` : ''}`
    : 'No backup exported from this device yet.';
}

$('settings-tiers').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tier]');
  if (!btn || btn.dataset.tier === state.tier) return;
  state.tier = btn.dataset.tier;
  saveState();
  render();
  $('settings-tiers').querySelector(`[data-tier="${state.tier}"]`)?.focus();
});

// ---------- Tier picker ----------

function openTierPicker() {
  const dialog = $('tier-dialog');
  $('tier-options').innerHTML = tierOptions();
  // On first use there is no current tier to keep, so a choice is required.
  $('tier-dialog-actions').hidden = !state.tier;
  dialog.returnValue = '';
  dialog.showModal();
}

$('tier-dialog').addEventListener('cancel', (e) => {
  if (!state.tier) e.preventDefault();
});

$('tier-dialog').addEventListener('close', () => {
  const choice = $('tier-dialog').returnValue;
  if (TIERS.some((t) => t.id === choice)) {
    state.tier = choice;
  } else if (!state.tier) {
    state.tier = TIERS[0].id; // dismissed on first use: start at the first tier
  }
  saveState();
  render();
});


// ---------- Savings inputs ----------

$('savings-current').addEventListener('input', (e) => {
  state.savings.current = Math.max(0, Number(e.target.value) || 0);
  saveState();
  renderSavings();
});

$('invest-current').addEventListener('input', (e) => {
  state.savings.invested = Math.max(0, Number(e.target.value) || 0);
  saveState();
  renderSavings();
});

$('savings-weekly').addEventListener('input', (e) => {
  state.savings.weekly = Math.max(0, Number(e.target.value) || 0);
  saveState();
  renderSavings();
});

$('beyond-years').addEventListener('input', (e) => {
  const years = Math.round(Number(e.target.value));
  if (years >= 1) {
    state.savings.beyondYears = Math.min(50, years);
    saveState();
    renderSavings();
  }
});

// ---------- Form ----------

// The date an item was added, used as the starting point for shelf-life
// estimates. For a new item that's today; when editing, it's the original date.
let editingAddedDate = null;

function formatLongDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseIsoDate(iso) {
  if (!iso) return new Date();
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function currentEstimate() {
  return estimateExpiry(
    { category: $('category').value, type: $('type').value },
    parseIsoDate(editingAddedDate),
  );
}

// ----- Item type -----

// Once the user picks a type themselves, stop auto-selecting it from the name.
let typeTouched = false;

function fillTypeOptions() {
  const types = typesFor($('category').value);
  const groups = [];
  for (const t of types) {
    let g = groups.find((x) => x.name === (t.group || ''));
    if (!g) groups.push((g = { name: t.group || '', types: [] }));
    g.types.push(t);
  }
  const opt = (t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`;
  $('type').innerHTML = '<option value="">Choose a type…</option>' + groups.map((g) => g.name
    ? `<optgroup label="${escapeHtml(g.name)}">${g.types.map(opt).join('')}</optgroup>`
    : g.types.map(opt).join('')).join('');
}

// "Gallon" and "gallons" count as the same unit.
const normUnit = (u) => u.trim().toLowerCase().replace(/s$/, '');

// Units for the chosen type (e.g. canned beans: cans, #10 cans, jars). Without
// a type (older items), falls back to the category's common units.
function unitsFor(category, typeId) {
  const type = findType(category, typeId);
  if (type?.units) return type.units.map((u) => (Array.isArray(u) ? u : [u]));
  return UNITS[category] || UNITS.Other;
}

// Fills the Unit list with the type's units, plus any other units already used
// for this type, then selects the given unit (or "Other…" with the text box
// filled in when it isn't in the list and keepCustom is set).
function setUnit(unit = '', { keepCustom = true } = {}) {
  const cat = $('category').value;
  const typeId = $('type').value;
  const defaults = unitsFor(cat, typeId);
  const norm = normUnit;
  const known = new Set(defaults.map(([v]) => norm(v)));
  const used = [...new Set(state.items
    .filter((i) => i.category === cat && (!typeId || i.type === typeId) && i.unit && !known.has(norm(i.unit)))
    .map((i) => i.unit))].sort();
  const opt = (v, label = v) => `<option value="${escapeHtml(v)}">${escapeHtml(label)}</option>`;
  $('unit-select').innerHTML = '<option value="">Choose a unit…</option>' +
    defaults.map(([v, label]) => opt(v, label)).join('') +
    used.map((v) => opt(v)).join('') +
    `<option value="${OTHER_UNIT}">Other…</option>`;

  const match = [...$('unit-select').options]
    .find((o) => o.value !== OTHER_UNIT && o.value && norm(o.value) === norm(unit));
  const custom = !match && keepCustom && unit.trim();
  $('unit-select').value = match ? match.value : custom ? OTHER_UNIT : '';
  $('unit').value = custom ? unit.trim() : '';
  $('unit').hidden = $('unit-select').value !== OTHER_UNIT;
}

// Quantity and Unit stay locked until a type is chosen, so the unit list
// can match the type. Changing the type swaps in that type's units, keeping
// the current unit if it's still offered, otherwise picking the most common.
let unitsForType = null;
function syncUnitsToType() {
  const typeId = $('type').value;
  const locked = !typeId;
  for (const id of ['quantity', 'unit-select', 'unit']) $(id).disabled = locked;
  $('quantity').closest('label').classList.toggle('locked', locked);
  $('unit-select').closest('label').classList.toggle('locked', locked);
  if (typeId === unitsForType) return;
  unitsForType = typeId;
  const current = unitValue();
  setUnit(current, { keepCustom: false });
  if (!locked && !unitValue() && $('unit-select').value !== OTHER_UNIT) {
    $('unit-select').selectedIndex = 1; // the type's most common unit
  }
}

function unitValue() {
  return $('unit-select').value === OTHER_UNIT ? $('unit').value.trim() : $('unit-select').value;
}

$('unit-select').addEventListener('change', () => {
  const other = $('unit-select').value === OTHER_UNIT;
  $('unit').hidden = !other;
  if (other) $('unit').focus();
});

// Pre-selects the most likely type from the name, until the user picks one.
function suggestType() {
  if (typeTouched) return;
  $('type').value = guessType({ name: $('name').value, category: $('category').value }) || '';
  syncUnitsToType();
}

// Tells the user what expiration date the chosen type implies.
function updateExpiresHint() {
  const hint = $('expires-hint');
  if ($('expires').value) {
    hint.textContent = '';
    return;
  }
  const est = currentEstimate();
  if (!est) {
    hint.textContent = 'Choose a type first. It sets the units to pick from and the estimated expiration date.';
  } else if (est.none) {
    hint.textContent = 'This type usually doesn’t expire, so no date will be set.';
  } else {
    hint.innerHTML =
      `If left blank, we’ll estimate <strong>${formatLongDate(est.date)}</strong> ` +
      `(${escapeHtml(est.label.toLowerCase())}: about ${est.life}).`;
  }
}

function onFormInput(e) {
  if (e.target.id === 'type') {
    typeTouched = Boolean($('type').value);
    syncUnitsToType();
  }
  if (e.target.id === 'name') suggestType();
  updateExpiresHint();
}

for (const id of ['name', 'type', 'expires']) {
  $(id).addEventListener('input', onFormInput);
}

function resetForm() {
  editingAddedDate = null;
  typeTouched = false;
  $('item-form').reset();
  $('item-id').value = '';
  // Left blank so there's nothing to erase before typing the amount.
  $('quantity').value = '';
  // The form only adds items to the category of the page it's on.
  const page = currentPage();
  $('category').value = CATEGORIES.includes(page.cat) ? page.cat : '';
  fillTypeOptions();
  unitsForType = null;
  syncUnitsToType();
  $('form-title').textContent = page.cat ? `Add to ${page.cat}` : 'Add an item';
  $('submit-btn').textContent = 'Add item';
  $('cancel-edit').hidden = true;
  updateExpiresHint();
}

function startEdit(item) {
  $('item-id').value = item.id;
  editingAddedDate = item.added || null;
  for (const key of ['name', 'quantity', 'expires', 'location', 'notes']) {
    $(key).value = item[key] ?? '';
  }
  fillTypeOptions();
  // Items saved before types existed get a suggested type.
  typeTouched = Boolean(findType(item.category, item.type));
  if (typeTouched) $('type').value = item.type;
  else suggestType();
  // Show the item's own unit, even if it isn't one of the type's usual units.
  setUnit(item.unit || '');
  unitsForType = $('type').value;
  syncUnitsToType();
  // An estimated date is shown as blank, so saving re-estimates it (in case
  // the type changed) unless the user types in the real printed date.
  if (item.expiresEstimated) $('expires').value = '';
  updateExpiresHint();
  $('form-title').textContent = 'Edit item';
  $('submit-btn').textContent = 'Save changes';
  $('cancel-edit').hidden = false;
  $('form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('name').focus({ preventScroll: true });
}

$('item-form').addEventListener('submit', (e) => {
  e.preventDefault();
  // Always file the item under this page's category.
  const category = currentPage().cat;
  if (!CATEGORIES.includes(category)) return;
  const data = {
    name: $('name').value.trim(),
    category,
    type: $('type').value,
    quantity: Number($('quantity').value) || 0,
    unit: unitValue(),
    expires: $('expires').value,
    location: $('location').value.trim(),
    notes: $('notes').value.trim(),
  };
  if (!data.name) return;

  // No date entered: estimate one from the type's typical shelf life.
  data.expiresEstimated = false;
  data.expiresBasis = '';
  if (!data.expires) {
    const est = currentEstimate();
    if (est && est.date) {
      data.expires = est.date;
      data.expiresEstimated = true;
      data.expiresBasis = est.label;
    }
  }

  const id = $('item-id').value;
  if (id) {
    Object.assign(state.items.find((i) => i.id === id), data);
  } else {
    state.items.push({ id: newId(), added: toIsoDate(new Date()), ...data });
  }
  // Open the item's group so you can see where it went.
  setGroupOpen(category, groupOf(data).key, true);
  saveState();
  resetForm();
  render();
});

$('cancel-edit').addEventListener('click', resetForm);

// ---------- List actions (event delegation) ----------

function closeItemMenu({ focus = false } = {}) {
  if (!openMenuId) return;
  const row = document.querySelector(`.item[data-id="${openMenuId}"]`);
  openMenuId = null;
  if (!row) return;
  row.querySelector('.menu').hidden = true;
  const btn = row.querySelector('.menu-btn');
  btn.setAttribute('aria-expanded', 'false');
  if (focus) btn.focus();
}

function onItemAction(e) {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.closest('.item').dataset.id;
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  const act = btn.dataset.act;

  if (act === 'menu') {
    const wasOpen = openMenuId === id;
    closeItemMenu();
    if (!wasOpen) {
      openMenuId = id;
      btn.setAttribute('aria-expanded', 'true');
      const menu = btn.nextElementSibling;
      menu.hidden = false;
      menu.querySelector('button').focus();
    }
    return;
  }
  // Everything but Use one / Add one closes the menu.
  if (act !== 'inc' && act !== 'dec') closeItemMenu();

  switch (act) {
    case 'inc': item.quantity = (Number(item.quantity) || 0) + 1; break;
    case 'dec': item.quantity = Math.max(0, (Number(item.quantity) || 0) - 1); break;
    case 'edit': {
      const home = PAGES.find((p) => p.cat === item.category);
      if (currentPage() === home) startEdit(item);
      else if (home) { pendingEditId = item.id; location.hash = `#/${home.slug}`; }
      return;
    }
    case 'del':
      if (!confirm(`Delete "${item.name}"?`)) return;
      state.items = state.items.filter((i) => i.id !== id);
      break;
  }
  saveState();
  render();
  // The list was rebuilt; keep focus on the button that was tapped.
  document.querySelector(`.item[data-id="${id}"] [data-act="${act}"]`)?.focus();
}

$('items').addEventListener('click', onItemAction);
// Tapping anywhere outside an open menu, or pressing Escape, closes it.
document.addEventListener('click', (e) => {
  if (openMenuId && !e.target.closest('.item-menu')) closeItemMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openMenuId) closeItemMenu({ focus: true });
});
$('status-list').addEventListener('click', onItemAction);

// Opening or closing a group is remembered (but not while searching, when
// every matching group is shown open).
$('items').addEventListener('click', (e) => {
  const summary = e.target.closest('.item-group > summary');
  if (!summary || $('search').value.trim() || $('filter-status').value) return;
  const details = summary.parentElement;
  // The click runs before the browser toggles the group, so it's about to flip.
  setGroupOpen(currentPage().cat, details.dataset.group, !details.open);
  renderToggleLabel();
});

function renderToggleLabel() {
  const all = [...document.querySelectorAll('#items .item-group')];
  // Read after the browser has toggled the group.
  requestAnimationFrame(() => {
    const allOpen = all.every((d) => d.open);
    $('toggle-groups').textContent = allOpen ? 'Collapse all' : 'Expand all';
    $('toggle-groups').dataset.open = String(!allOpen);
  });
}

$('toggle-groups').addEventListener('click', () => {
  const open = $('toggle-groups').dataset.open === 'true';
  const cat = currentPage().cat;
  for (const d of document.querySelectorAll('#items .item-group')) setGroupOpen(cat, d.dataset.group, open);
  render();
});

// ---------- Filters and household ----------

for (const id of ['search', 'filter-status']) {
  $(id).addEventListener('input', render);
}

$('people').addEventListener('change', () => {
  state.people = Math.max(1, Math.round(Number($('people').value) || 1));
  saveState();
  render();
});

// ---------- Backup ----------

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `prep-tracker-backup-${toIsoDate(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  saveBackupInfo({ last: toIsoDate(new Date()), changedSince: null, itemChanges: 0, snoozeUntil: null });
  render();
}

$('export-btn').addEventListener('click', exportBackup);
$('backup-reminder-export').addEventListener('click', exportBackup);

$('backup-reminder-later').addEventListener('click', () => {
  const later = new Date();
  later.setDate(later.getDate() + BACKUP_SNOOZE_DAYS);
  saveBackupInfo({ ...backupInfo(), snoozeUntil: toIsoDate(later) });
  render();
});

// Replaces everything with a backup file. Returns true if it was imported.
// With nothing to replace yet (a returning user's first visit), it doesn't
// ask to confirm.
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.items)) throw new Error('No items list found');
    if (state.items.length &&
        !confirm(`Replace your current ${state.items.length} items with ${data.items.length} from the backup?`)) return false;
    const imported = normalize(data);
    imported.items = imported.items.map((i) => ({ ...i, id: i.id || newId() }));
    imported.tier = imported.tier || state.tier;
    Object.assign(state, imported);
    saveState();
    // What's here now matches a backup file, so nothing is unsaved.
    saveBackupInfo({ ...backupInfo(), changedSince: null, itemChanges: 0 });
    render();
    return true;
  } catch (err) {
    alert(`That file couldn't be imported: ${err.message}`);
    return false;
  }
}

$('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) await importBackup(file);
  e.target.value = '';
});

// ---------- Welcome (first visit) ----------

// The tier picker opens whenever there's no tier yet, except on the welcome
// guide, which ends with its own "Get started" button.
function askForTierIfNeeded() {
  if (state.tier || currentPage() === WELCOME_PAGE) return;
  if ($('welcome-dialog').open || $('tier-dialog').open) return;
  openTierPicker();
}

function openWelcome() {
  $('welcome-ask').hidden = false;
  $('welcome-back').hidden = true;
  $('welcome-dialog').showModal();
}

// Saving right away means the popup only appears once, even if the page is
// reloaded before a tier is chosen.
function closeWelcome() {
  saveState();
  $('welcome-dialog').close();
}

// The popup needs an answer, so Escape doesn't close it.
$('welcome-dialog').addEventListener('cancel', (e) => e.preventDefault());

$('welcome-new').addEventListener('click', () => {
  closeWelcome();
  location.hash = '#/welcome';
});

$('welcome-returning').addEventListener('click', () => {
  $('welcome-ask').hidden = true;
  $('welcome-back').hidden = false;
  $('welcome-fresh').focus();
});

$('welcome-import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !(await importBackup(file))) return;
  closeWelcome();
  askForTierIfNeeded(); // older backups may not have a tier
});

$('welcome-fresh').addEventListener('click', () => {
  closeWelcome();
  askForTierIfNeeded();
});

$('welcome-start').addEventListener('click', () => {
  location.hash = '#/';
  askForTierIfNeeded();
});

// ---------- Number fields: select on focus ----------
// Tapping into a number field highlights what's already there (including a
// 0), so typing replaces it instead of the user having to delete it first.

let selectOnRelease = null;

document.addEventListener('focusin', (e) => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement) || el.type !== 'number') return;
  el.select();
  // Phones can move the caret once the tap finishes, so select again after it.
  setTimeout(() => { if (document.activeElement === el) el.select(); }, 0);
});

// A click that focuses the field would otherwise drop the selection on release.
document.addEventListener('pointerdown', (e) => {
  const el = e.target;
  const isNumber = el instanceof HTMLInputElement && el.type === 'number';
  selectOnRelease = isNumber && document.activeElement !== el ? el : null;
});

document.addEventListener('mouseup', (e) => {
  if (selectOnRelease && e.target === selectOnRelease) {
    e.preventDefault();
    selectOnRelease.select();
  }
  selectOnRelease = null;
});

// ---------- Offline ----------
// sw.js saves the app's files on the device so it opens with no connection.
// Service workers need http or https, so opening index.html as a file skips
// this, and the app works as before.

function registerOffline() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // Shown once a saved copy is active, even if re-registering fails while offline.
  navigator.serviceWorker.ready.then(() => { $('offline-status').hidden = false; });
}

// ---------- Init ----------

registerOffline();

resetForm();
render();
if (!hadSavedData) openWelcome();
else askForTierIfNeeded();
