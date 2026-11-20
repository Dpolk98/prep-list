// Prep Tracker — emergency supplies inventory.
// All data is stored in this browser's localStorage; nothing leaves the device.
// Tier definitions (checklists, mindset, savings notes) live in tiers.js.

const STORAGE_KEY = 'prep-tracker:v1';
const SOON_DAYS = 60;

const CATEGORIES = [
  'Food',
  'Water',
  'Medical & First Aid',
  'Toiletries & Hygiene',
  'Tools & Gear',
  'Light & Power',
  'Documents & Cash',
  'Other',
];

// ---------- State ----------

const DEFAULT_SAVINGS = { current: 0, weekly: 500, beyondYears: 2 };

// Fills in any missing fields, so data saved by older versions still loads.
function normalize(data = {}) {
  return {
    items: Array.isArray(data.items) ? data.items : [],
    people: data.people ?? 2,
    tier: TIERS.some((t) => t.id === data.tier) ? data.tier : null,
    checklist: data.checklist && typeof data.checklist === 'object' ? data.checklist : {},
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

// Which earlier-tier sections the user has expanded (kept across re-renders).
const openTiers = new Set();

// ---------- Helpers ----------

const $ = (id) => document.getElementById(id);

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function currentTier() {
  return TIERS.find((t) => t.id === state.tier) || TIERS[0];
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

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ---------- Tiers & checklist ----------

// A checklist item is done if the user ticked it, or (for water-storage items)
// if the inventory already holds enough water.
function isChecked(item, wd) {
  if (item.autoWater) return wd >= item.autoWater;
  return Boolean(state.checklist[item.id]);
}

function tierWeeks(tier) {
  const days = tier.days ?? state.savings.beyondYears * 365;
  return days / 7;
}

function savingsGoal(tier) {
  return Math.round(tierWeeks(tier) * (Number(state.savings.weekly) || 0));
}

function renderTierChecklist(tier, wd, isCurrent) {
  const done = tier.checklist.filter((c) => isChecked(c, wd)).length;
  const groups = {};
  for (const c of tier.checklist) (groups[c.cat] ||= []).push(c);

  const body = Object.entries(groups).map(([cat, list]) => `
    <h3>${escapeHtml(cat)}</h3>
    <ul class="checks">
      ${list.map((c) => {
        const checked = isChecked(c, wd);
        const auto = c.autoWater
          ? `<span class="auto">From inventory: ${formatDays(wd)} of ${c.autoWater} days</span>`
          : '';
        return `
          <li class="${checked ? 'done' : ''}">
            <label>
              <input type="checkbox" data-check="${c.id}" ${checked ? 'checked' : ''} ${c.autoWater ? 'disabled' : ''}>
              <span>${escapeHtml(c.text)}${auto}</span>
            </label>
          </li>`;
      }).join('')}
    </ul>`).join('');

  const open = isCurrent || openTiers.has(tier.id);
  const label = isCurrent ? tier.title : `Foundation: ${tier.name} · ${tier.title}`;
  return `
    <details class="tier-block ${isCurrent ? 'current' : ''}" data-tier="${tier.id}" ${open ? 'open' : ''}>
      <summary><span>${escapeHtml(label)}</span><span class="count">${done}/${tier.checklist.length}</span></summary>
      ${body}
    </details>`;
}

function renderPlan(wd) {
  const tier = currentTier();
  const idx = TIERS.indexOf(tier);
  const included = TIERS.slice(0, idx + 1);

  $('tier-name').textContent = state.tier ? tier.name : '—';
  $('plan-title').textContent = `${tier.name} plan: ${tier.title}`;
  $('plan-mindset').textContent = tier.mindset;

  const all = included.flatMap((t) => t.checklist);
  const done = all.filter((c) => isChecked(c, wd)).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  $('plan-pct').textContent = `${pct}%`;
  $('plan-bar').style.width = `${pct}%`;

  // Current tier first, then the foundations it builds on, nearest first.
  $('checklists').innerHTML = [...included].reverse()
    .map((t) => renderTierChecklist(t, wd, t === tier))
    .join('');

  // Water summary
  $('stat-water-goal').textContent = ` / ${tier.waterGoalDays}`;
  $('water-hint').textContent = tier.waterGoalDays < 30 || tier.id === 'month'
    ? `Water goal: 1 gallon per person per day for ${tier.waterGoalDays} days.`
    : 'Keep 30 days stored. Past that, rely on a water source you can filter and purify.';
}

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
    `${span} × ${money.format(Number(state.savings.weekly) || 0)}/week. ` +
    (remaining > 0 ? `${money.format(remaining)} to go.` : 'Goal reached.');

  // Don't overwrite a field while the user is typing in it.
  const fields = { 'savings-current': current, 'savings-weekly': state.savings.weekly, 'beyond-years': state.savings.beyondYears };
  for (const [id, val] of Object.entries(fields)) {
    if (document.activeElement !== $(id)) $(id).value = val;
  }
  $('beyond-years-wrap').hidden = tier.days !== null;
}

// ---------- Rendering ----------

function render() {
  const wd = waterDays();

  // Summary
  $('stat-items').textContent = state.items.length;
  $('stat-soon').textContent = state.items.filter((i) => statusOf(i) === 'soon').length;
  $('stat-expired').textContent = state.items.filter((i) => statusOf(i) === 'expired').length;
  $('stat-water').textContent = formatDays(wd);
  $('people').value = state.people;

  renderPlan(wd);
  renderSavings();

  // Suggestions for unit and location fields
  const uniq = (key) => [...new Set(state.items.map((i) => i[key]).filter(Boolean))].sort();
  $('unit-list').innerHTML = uniq('unit').map((u) => `<option value="${escapeHtml(u)}">`).join('');
  $('location-list').innerHTML = uniq('location').map((l) => `<option value="${escapeHtml(l)}">`).join('');

  // Filtered list, most urgent first
  const q = $('search').value.trim().toLowerCase();
  const cat = $('filter-category').value;
  const st = $('filter-status').value;
  const order = { expired: 0, soon: 1, ok: 2 };

  const visible = state.items
    .filter((i) => !cat || i.category === cat)
    .filter((i) => !st || statusOf(i) === st)
    .filter((i) => !q || [i.name, i.location, i.notes, i.category].join(' ').toLowerCase().includes(q))
    .sort((a, b) =>
      order[statusOf(a)] - order[statusOf(b)] ||
      (a.expires || '9999').localeCompare(b.expires || '9999') ||
      a.name.localeCompare(b.name));

  $('items').innerHTML = visible.map((i) => {
    const s = statusOf(i);
    const badge = s === 'ok' ? '' :
      `<span class="badge ${s}">${s === 'expired' ? 'Expired' : 'Expiring soon'}</span>`;
    const meta = [
      `${i.quantity} ${escapeHtml(i.unit)}`.trim(),
      expiryText(i),
      i.location && `📍 ${escapeHtml(i.location)}`,
      i.notes && escapeHtml(i.notes),
    ].filter(Boolean).join(' · ');
    return `
      <li class="item" data-id="${i.id}">
        <div class="title">${escapeHtml(i.name)}<span class="badge cat">${escapeHtml(i.category)}</span>${badge}</div>
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
  $('empty').textContent = state.items.length
    ? 'No items match your filters.'
    : 'No items yet. Add your first supply above.';
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

// ---------- Checklist & savings inputs ----------

$('checklists').addEventListener('change', (e) => {
  const id = e.target.dataset.check;
  if (!id) return;
  if (e.target.checked) state.checklist[id] = true;
  else delete state.checklist[id];
  saveState();
  render();
});

// <details> "toggle" doesn't bubble, so listen in the capture phase.
$('checklists').addEventListener('toggle', (e) => {
  const block = e.target.closest('.tier-block');
  if (!block || block.classList.contains('current')) return;
  if (block.open) openTiers.add(block.dataset.tier);
  else openTiers.delete(block.dataset.tier);
}, true);

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

function resetForm() {
  $('item-form').reset();
  $('item-id').value = '';
  $('quantity').value = 1;
  $('form-title').textContent = 'Add an item';
  $('submit-btn').textContent = 'Add item';
  $('cancel-edit').hidden = true;
}

function startEdit(item) {
  $('item-id').value = item.id;
  for (const key of ['name', 'category', 'quantity', 'unit', 'expires', 'location', 'notes']) {
    $(key).value = item[key] ?? '';
  }
  $('form-title').textContent = 'Edit item';
  $('submit-btn').textContent = 'Save changes';
  $('cancel-edit').hidden = false;
  $('item-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('name').focus();
}

$('item-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    name: $('name').value.trim(),
    category: $('category').value,
    quantity: Number($('quantity').value) || 0,
    unit: $('unit').value.trim(),
    expires: $('expires').value,
    location: $('location').value.trim(),
    notes: $('notes').value.trim(),
  };
  if (!data.name) return;

  const id = $('item-id').value;
  if (id) {
    Object.assign(state.items.find((i) => i.id === id), data);
  } else {
    state.items.push({ id: newId(), added: new Date().toISOString().slice(0, 10), ...data });
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

for (const id of ['search', 'filter-category', 'filter-status']) {
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
  a.download = `prep-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
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

$('category').innerHTML = CATEGORIES.map((c) => `<option>${c}</option>`).join('');
$('filter-category').innerHTML += CATEGORIES.map((c) => `<option>${c}</option>`).join('');
render();
if (!state.tier) openTierPicker();
