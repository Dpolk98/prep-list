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
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8M16 17H8M10 9H8"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  dollar: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

// ---------- Pages ----------
// `cat` ties a page to an inventory category and to its suggested supplies.

const PAGES = [
  { slug: '', name: 'Overview', icon: 'home', blurb: 'Your readiness across every category.' },
  { slug: 'water', name: 'Water', cat: 'Water', icon: 'droplet', blurb: 'Stored water, purification and sources.' },
  { slug: 'food', name: 'Food', cat: 'Food', icon: 'utensils', blurb: 'Shelf-stable food, cooking and long-term staples.' },
  { slug: 'medical', name: 'Medical & First Aid', cat: 'Medical & First Aid', icon: 'medkit', blurb: 'First aid, medications and medical skills.' },
  { slug: 'hygiene', name: 'Toiletries & Hygiene', cat: 'Toiletries & Hygiene', icon: 'soap', blurb: 'Toiletries, cleaning and sanitation.' },
  { slug: 'power', name: 'Light & Power', cat: 'Light & Power', icon: 'zap', blurb: 'Lighting, batteries, charging and generation.' },
  { slug: 'tools', name: 'Tools & Gear', cat: 'Tools & Gear', icon: 'wrench', blurb: 'Tools, shelter, warmth and go-bags.' },
  { slug: 'documents', name: 'Documents & Cash', cat: 'Documents & Cash', icon: 'file', blurb: 'Important papers, copies and cash on hand.' },
  { slug: 'other', name: 'Other', cat: 'Other', icon: 'package', blurb: 'Anything that doesn’t fit elsewhere.' },
  { slug: 'plans', name: 'Plans & Skills', cat: 'Plans & Skills', icon: 'clipboard', noInventory: true, blurb: 'Household plans, training and community.' },
  { slug: 'savings', name: 'Savings', icon: 'dollar', blurb: 'Your emergency fund goal for this tier.' },
];

// Inventory categories, in menu order.
const CATEGORIES = PAGES.filter((p) => p.cat && !p.noInventory).map((p) => p.cat);

function currentPage() {
  const slug = location.hash.replace(/^#\/?/, '');
  return PAGES.find((p) => p.slug === slug) || PAGES[0];
}

// ---------- State ----------

const DEFAULT_SAVINGS = { current: 0, weekly: 500, beyondYears: 2 };

// Fills in any missing fields, so data saved by older versions still loads.
function normalize(data = {}) {
  return {
    items: Array.isArray(data.items) ? data.items : [],
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

function expiryText(item) {
  const days = daysUntil(item.expires);
  if (days === null) return 'No expiration';
  if (days < 0) return `Expired ${-days} day${days === -1 ? '' : 's'} ago`;
  if (days === 0) return 'Expires today';
  return `Expires in ${days} day${days === 1 ? '' : 's'} (${item.expires})`;
}

// Converts a water item's quantity to gallons, based on its unit.
function toGallons(qty, unit) {
  const u = (unit || '').toLowerCase().trim();
  if (/^(gal|gallon)s?$/.test(u)) return qty;
  if (/^(l|liter|litre)s?$/.test(u)) return qty * 0.264172;
  if (/^(oz|fl ?oz|ounce)s?$/.test(u)) return qty / 128;
  if (/^(ml)$/.test(u)) return qty * 0.000264172;
  if (/^(bottle)s?$/.test(u)) return qty * 0.132; // assumes 16.9 oz (500 mL) bottles
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

// ---------- Supplies & savings math ----------

// Suggested supplies for a category, across the current tier and the ones below it.
function suppliesFor(cat) {
  return includedTiers().flatMap((t) => t.supplies.filter((s) => s.cat === cat));
}

// True if the inventory already has an item with this exact name in this category.
function inInventory(name, cat) {
  const n = name.trim().toLowerCase();
  return state.items.some((i) => i.category === cat && i.name.trim().toLowerCase() === n);
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
      <li class="${p.slug === 'plans' || p.slug === 'savings' ? 'sep' : ''}">
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

window.addEventListener('hashchange', () => {
  closeDrawer({ restoreFocus: false });
  $('search').value = '';
  $('filter-status').value = '';
  $('supplies-details').open = false;
  resetForm();
  render();
  window.scrollTo(0, 0);
});

// ---------- Rendering: Overview ----------

function renderOverview(wd) {
  const tier = currentTier();

  $('stat-items').textContent = state.items.length;
  $('stat-soon').textContent = state.items.filter((i) => statusOf(i) === 'soon').length;
  $('stat-expired').textContent = state.items.filter((i) => statusOf(i) === 'expired').length;
  $('stat-water').textContent = formatDays(wd);
  $('stat-water-goal').textContent = ` / ${tier.waterGoalDays}`;
  $('water-hint').textContent = `Water ${waterHint(tier).toLowerCase()}`;
  if (document.activeElement !== $('people')) $('people').value = state.people;

  $('plan-title').textContent = `${tier.name} plan: ${tier.title}`;
  $('plan-mindset').textContent = tier.mindset;

  // One card per category page, plus savings.
  const cards = PAGES.filter((p) => p.cat).map((p) => {
    const ideas = suppliesFor(p.cat).length;
    const count = state.items.filter((i) => i.category === p.cat).length;
    const a = alertsFor(p.cat);
    const meta = [
      !p.noInventory && `${count} item${count === 1 ? '' : 's'}`,
      ideas && `${ideas} idea${ideas === 1 ? '' : 's'}`,
    ].filter(Boolean).join(' · ');
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
  cards.push(`
    <a class="cat-card" href="#/savings">
      <span class="cat-icon">${icon('dollar')}</span>
      <span class="cat-name">Savings</span>
      <span class="cat-meta">${money.format(saved)} of ${money.format(goal)}</span>
      <span class="mini-bar"><span style="width:${sp}%"></span></span>
    </a>`);

  $('cat-grid').innerHTML = cards.join('');
}

// ---------- Rendering: category page ----------

// Reference list of suggested supplies, in a collapsible section.
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

  $('supplies-card').hidden = total === 0;
  $('supplies-title').textContent = page.noInventory ? 'Things to set up' : 'What to buy';
  $('supplies-count').textContent = `${total} idea${total === 1 ? '' : 's'}`;
  $('supplies-intro').textContent = page.noInventory
    ? `Plans and skills worth having at the ${tier.name} tier.`
    : `Ideas for your shopping list at the ${tier.name} tier. Tap Add once you have something to log it in your inventory.`;
  $('supplies').innerHTML = html;
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

function renderInventory(page) {
  const items = state.items.filter((i) => i.category === page.cat);

  const uniq = (key) => [...new Set(state.items.map((i) => i[key]).filter(Boolean))].sort();
  $('unit-list').innerHTML = uniq('unit').map((u) => `<option value="${escapeHtml(u)}">`).join('');
  $('location-list').innerHTML = uniq('location').map((l) => `<option value="${escapeHtml(l)}">`).join('');

  const q = $('search').value.trim().toLowerCase();
  const st = $('filter-status').value;
  const order = { expired: 0, soon: 1, ok: 2 };

  const visible = items
    .filter((i) => !st || statusOf(i) === st)
    .filter((i) => !q || [i.name, findType(i.category, i.type)?.name, i.location, i.notes].join(' ').toLowerCase().includes(q))
    .sort((a, b) =>
      order[statusOf(a)] - order[statusOf(b)] ||
      (a.expires || '9999').localeCompare(b.expires || '9999') ||
      a.name.localeCompare(b.name));

  $('items').innerHTML = visible.map((i) => {
    const s = statusOf(i);
    const badge = s === 'ok' ? '' :
      `<span class="badge ${s}">${s === 'expired' ? 'Expired' : 'Expiring soon'}</span>`;
    const type = findType(i.category, i.type);
    // With a type shown, "(est.)" is enough; older items name their basis.
    const basis = type ? '' : ` · ${escapeHtml(i.expiresBasis || 'typical shelf life')}`;
    const expiry = i.expiresEstimated
      ? `${expiryText(i)} <span class="est" title="Estimated from the item type's typical shelf life. Edit the item to enter the printed date.">(est.${basis})</span>`
      : expiryText(i);
    const meta = [
      `${i.quantity} ${escapeHtml(i.unit)}`.trim(),
      type && escapeHtml(type.name),
      expiry,
      i.location && `📍 ${escapeHtml(i.location)}`,
      i.notes && escapeHtml(i.notes),
    ].filter(Boolean).join(' · ');
    return `
      <li class="item" data-id="${i.id}">
        <div class="title">${escapeHtml(i.name)}${badge}</div>
        <div class="controls">
          <button class="qty-btn" data-act="dec" aria-label="Use one">−</button>
          <button class="qty-btn" data-act="inc" aria-label="Add one">+</button>
          <button data-act="edit">Edit</button>
          <button data-act="del">Delete</button>
        </div>
        <div class="meta">${meta}</div>
      </li>`;
  }).join('');

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
    $('water-panel-hint').textContent =
      `For ${state.people} ${state.people === 1 ? 'person' : 'people'} (change on Overview). ${waterHint(tier)}`;
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
  $('tier-name').textContent = state.tier ? currentTier().name : '—';

  renderNav(page);

  const view = page.slug === '' ? 'overview' : page.slug === 'savings' ? 'savings' : 'category';
  for (const v of ['overview', 'category', 'savings']) $(`view-${v}`).hidden = v !== view;

  if (view === 'overview') renderOverview(wd);
  if (view === 'category') renderCategory(page, wd);
  if (view === 'savings') renderSavings();
}

// ---------- Tier picker ----------

function openTierPicker() {
  const dialog = $('tier-dialog');
  $('tier-options').innerHTML = TIERS.map((t) => {
    const goal = t.days === null
      ? `${money.format(savingsGoal(t))} for ${state.savings.beyondYears} yrs`
      : money.format(savingsGoal(t));
    return `
      <button value="${t.id}" class="tier-option ${t.id === state.tier ? 'selected' : ''}">
        <strong>${t.name}</strong>
        <span class="tier-title">${t.title}</span>
        <span class="tier-goal">Savings goal ${goal}</span>
      </button>`;
  }).join('');
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

$('change-tier').addEventListener('click', openTierPicker);

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

// Pre-selects the most likely type from the name, until the user picks one.
function suggestType() {
  if (typeTouched) return;
  $('type').value = guessType({ name: $('name').value, unit: $('unit').value, category: $('category').value }) || '';
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
    hint.textContent = 'Choose a type and we’ll estimate the expiration date if you leave it blank.';
  } else if (est.none) {
    hint.textContent = 'This type usually doesn’t expire, so no date will be set.';
  } else {
    hint.innerHTML =
      `If left blank, we’ll estimate <strong>${formatLongDate(est.date)}</strong> ` +
      `(${escapeHtml(est.label.toLowerCase())}: about ${est.life}).`;
  }
}

function onFormInput(e) {
  if (e.target.id === 'type') typeTouched = Boolean($('type').value);
  if (['name', 'unit'].includes(e.target.id)) suggestType();
  updateExpiresHint();
}

for (const id of ['name', 'unit', 'type', 'expires']) {
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
  $('form-title').textContent = page.cat ? `Add to ${page.cat}` : 'Add an item';
  $('submit-btn').textContent = 'Add item';
  $('cancel-edit').hidden = true;
  updateExpiresHint();
}

function startEdit(item) {
  $('item-id').value = item.id;
  editingAddedDate = item.added || null;
  for (const key of ['name', 'quantity', 'unit', 'expires', 'location', 'notes']) {
    $(key).value = item[key] ?? '';
  }
  fillTypeOptions();
  // Items saved before types existed get a suggested type.
  typeTouched = Boolean(findType(item.category, item.type));
  if (typeTouched) $('type').value = item.type;
  else suggestType();
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
    unit: $('unit').value.trim(),
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
  saveState();
  resetForm();
  render();
});

$('cancel-edit').addEventListener('click', resetForm);

// ---------- List actions (event delegation) ----------

$('items').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.closest('.item').dataset.id;
  const item = state.items.find((i) => i.id === id);
  if (!item) return;

  switch (btn.dataset.act) {
    case 'inc': item.quantity = (Number(item.quantity) || 0) + 1; break;
    case 'dec': item.quantity = Math.max(0, (Number(item.quantity) || 0) - 1); break;
    case 'edit': startEdit(item); return;
    case 'del':
      if (!confirm(`Delete "${item.name}"?`)) return;
      state.items = state.items.filter((i) => i.id !== id);
      break;
  }
  saveState();
  render();
});

// ---------- Filters & household ----------

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
