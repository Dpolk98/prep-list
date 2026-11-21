// Prep Tracker — emergency supplies inventory.
// All data is stored in this browser's localStorage; nothing leaves the device.
// Tier definitions (suggested supplies, mindset, savings notes) live in tiers.js.
// Shelf-life estimates live in shelf-life.js.

const STORAGE_KEY = 'prep-tracker:v1';
const SOON_DAYS = 60;

// ---------- Icons (Lucide-style, 24×24 stroke paths) ----------

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
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  dots: '<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>',
  dollar: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

// ---------- Pages ----------
// `cat` ties a page to an inventory category and to its suggested supplies.

const PAGES = [
  { slug: '', name: 'Overview', icon: 'home', blurb: 'Your readiness across every category.' },
  { slug: 'savings', name: 'Savings', icon: 'dollar', blurb: 'Your emergency fund: the most flexible part of being prepared.' },
  { slug: 'water', name: 'Water', cat: 'Water', icon: 'droplet', blurb: 'Stored water, purification, and sources.' },
  { slug: 'food', name: 'Food', cat: 'Food', icon: 'utensils', blurb: 'Shelf-stable food, cooking fuel, and long-term staples.' },
  { slug: 'medical', name: 'Medical and First Aid', cat: 'Medical and First Aid', icon: 'medkit', blurb: 'First aid, medications, and medical skills.' },
  { slug: 'hygiene', name: 'Toiletries and Hygiene', cat: 'Toiletries and Hygiene', icon: 'soap', blurb: 'Toiletries, cleaning, and sanitation.' },
  { slug: 'power', name: 'Light and Power', cat: 'Light and Power', icon: 'zap', blurb: 'Lighting, batteries, charging, and generation.' },
  { slug: 'documents', name: 'Documents', cat: 'Documents', icon: 'file', blurb: 'Important papers, copies, and records.' },
  { slug: 'other', name: 'Other', cat: 'Other', icon: 'package', blurb: 'Tools, shelter, pets, and anything else.' },
  { slug: 'plans', name: 'Plans and Skills', cat: 'Plans and Skills', icon: 'clipboard', noInventory: true, blurb: 'Household plans, training, and community.' },
  { slug: 'settings', name: 'Settings', icon: 'sliders', blurb: 'Household size, how long you’re preparing for, and backups.' },
];

// Inventory categories, in menu order.
// Pages reached from the overview's Expired / Expiring tiles (not in the menu).
// Each lists items with that status across every category.
const STATUS_PAGES = [
  { slug: 'expired', name: 'Expired', status: 'expired', icon: 'alert', blurb: 'Items past their expiration date. Use, replace, or throw them out.' },
  { slug: 'expiring', name: 'Expiring soon', status: 'soon', icon: 'clock', blurb: 'Items that expire within the next 60 days. Use these first.' },
];

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
  return PAGES.find((p) => p.slug === slug) || STATUS_PAGES.find((p) => p.slug === slug) || PAGES[0];
}

// ---------- State ----------

const DEFAULT_SAVINGS = { current: 0, weekly: 500, beyondYears: 2 };

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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (err) {
    console.warn('Could not read saved data:', err);
  }
  return normalize();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    alert('Could not save. Your browser storage may be full or disabled.');
  }
}

const state = loadState();

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

// Converts a water item's quantity to gallons, based on its unit.
function toGallons(qty, unit) {
  const u = (unit || '').toLowerCase().trim();
  if (/^(gal|gallon)s?$/.test(u)) return qty;
  if (/^(l|liter|litre)s?$/.test(u)) return qty * 0.264172;
  if (/^(oz|fl ?oz|ounce)s?$/.test(u)) return qty / 128;
  if (/^(ml)$/.test(u)) return qty * 0.000264172;
  if (/^(bottle|box|boxe|can)s?$/.test(u)) return qty * 0.132; // assumes 16.9 oz (500 mL) bottles, boxes, or cans
  if (/^(case)s?$/.test(u)) return qty * 24 * 0.132;  // assumes cases of 24 × 500 mL
  return 0;
}

function waterDays() {
  const gallons = state.items
    .filter((i) => i.category === 'Water' && statusOf(i) !== 'expired')
    .reduce((sum, i) => sum + toGallons(Number(i.quantity) || 0, i.unit), 0);
  return gallons / Math.max(1, state.people);
}

function formatDays(d) {
  return d >= 10 ? String(Math.floor(d)) : d.toFixed(1).replace(/\.0$/, '');
}

function waterHint(tier) {
  return tier.waterGoalDays < 30 || tier.id === 'month'
    ? `Goal: 1 gallon per person per day for ${tier.waterGoalDays} days.`
    : 'Keep 30 days stored. Past that, rely on a water source you can filter and purify.';
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

function savingsGoal(tier) {
  return Math.round(tierWeeks(tier) * (Number(state.savings.weekly) || 0));
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
});

// ---------- Rendering: Overview ----------

function renderOverview(wd) {
  const tier = currentTier();

  $('stat-items').textContent = state.items.length;
  $('stat-soon').textContent = state.items.filter((i) => statusOf(i) === 'soon').length;
  $('stat-expired').textContent = state.items.filter((i) => statusOf(i) === 'expired').length;
  $('stat-water').textContent = formatDays(wd);

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

  const goal = savingsGoal(tier);
  const saved = Number(state.savings.current) || 0;
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
  const expiry = i.expiresEstimated
    ? `${exp.text} <span class="est" title="Estimated from the item type's typical shelf life. Edit the item to enter the printed date.">est.${basis}</span>`
    : exp.text;
  // One labelled row per detail; empty ones are left out.
  const facts = [
    ['Quantity', `${i.quantity} ${escapeHtml(i.unit)}`.trim()],
    type && ['Type', escapeHtml(type.name)],
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
  if (!type) return { key: NO_TYPE, name: 'No type', order: Infinity };
  if (GROUP_BY_SECTION.has(item.category) && type.group) {
    return { key: `section:${type.group}`, name: type.group, order: types.findIndex((t) => t.group === type.group) };
  }
  return { key: type.id, name: type.name, order: types.indexOf(type) };
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
            <span class="group-name">${escapeHtml(g.name)}</span>
            <span class="group-meta">${badges}<span class="group-count">${count}</span></span>
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
  }

  renderSupplies(page);

  $('inventory-card').hidden = Boolean(page.noInventory);
  $('form-card').hidden = Boolean(page.noInventory);
  if (!page.noInventory) renderInventory(page);
}

// ---------- Rendering: savings ----------

function renderSavings() {
  const tier = currentTier();
  const goal = savingsGoal(tier);
  const current = Number(state.savings.current) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;

  $('savings-note').textContent = tier.savingsNote;
  $('savings-current-display').textContent = money.format(current);
  $('savings-goal').textContent = money.format(goal);
  $('savings-bar').style.width = `${pct}%`;
  $('savings-bar').classList.toggle('complete', goal > 0 && current >= goal);

  const weeks = tierWeeks(tier);
  const weeksText = weeks === 1 ? '1 week' : `${weeks.toFixed(1).replace(/\.0$/, '')} weeks`;
  const span = tier.days === null
    ? `${state.savings.beyondYears} year${state.savings.beyondYears === 1 ? '' : 's'} (${weeksText})`
    : weeksText;
  const remaining = Math.max(0, goal - current);
  $('savings-math').textContent =
    `${tier.name} tier: ${span} × ${money.format(Number(state.savings.weekly) || 0)}/week. ` +
    (remaining > 0 ? `${money.format(remaining)} to go.` : 'Goal reached.');

  // Don't overwrite a field while the user is typing in it.
  const fields = { 'savings-current': current, 'savings-weekly': state.savings.weekly, 'beyond-years': state.savings.beyondYears };
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
    : page.slug === 'savings' || page.slug === 'settings' ? page.slug
    : page.status ? 'status' : 'category';
  for (const v of ['overview', 'category', 'savings', 'settings', 'status']) $(`view-${v}`).hidden = v !== view;

  if (view === 'overview') renderOverview(wd);
  if (view === 'category') renderCategory(page, wd);
  if (view === 'savings') renderSavings();
  if (view === 'status') renderStatus(page);
  if (view === 'settings') renderSettings();
}

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
  $('quantity').value = 1;
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

$('export-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `prep-tracker-backup-${toIsoDate(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.items)) throw new Error('No items list found');
    if (!confirm(`Replace your current ${state.items.length} items with ${data.items.length} from the backup?`)) return;
    const imported = normalize(data);
    imported.items = imported.items.map((i) => ({ ...i, id: i.id || newId() }));
    imported.tier = imported.tier || state.tier;
    Object.assign(state, imported);
    saveState();
    render();
  } catch (err) {
    alert(`That file couldn't be imported: ${err.message}`);
  } finally {
    e.target.value = '';
  }
});

// ---------- Init ----------

resetForm();
render();
if (!state.tier) openTierPicker();
