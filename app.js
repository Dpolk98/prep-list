// Prep Tracker — emergency supplies inventory.
// All data is stored in this browser's localStorage; nothing leaves the device.

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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { items: data.items ?? [], people: data.people ?? 2 };
    }
  } catch (err) {
    console.warn('Could not read saved data:', err);
  }
  return { items: [], people: 2 };
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

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
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

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ---------- Rendering ----------

function render() {
  // Summary
  $('stat-items').textContent = state.items.length;
  $('stat-soon').textContent = state.items.filter((i) => statusOf(i) === 'soon').length;
  $('stat-expired').textContent = state.items.filter((i) => statusOf(i) === 'expired').length;
  const wd = waterDays();
  $('stat-water').textContent = wd >= 10 ? Math.floor(wd) : wd.toFixed(1).replace(/\.0$/, '');
  $('people').value = state.people;

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
    state.items = data.items.map((i) => ({ ...i, id: i.id || newId() }));
    state.people = data.people || state.people;
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
