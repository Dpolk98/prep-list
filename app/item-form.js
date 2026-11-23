// ---------- Form ----------

// The date an item was added, used as the starting point for shelf-life
// estimates. For a new item that's today; when editing, it's the original date.
let editingAddedDate = null;
// The What to buy suggestion whose Add button opened the form, if any.
let addingSupply = null;

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

// ---------- Scanned details (see scan.js) ----------
// After a barcode scan fills in the form, its barcode and label figures wait
// here until the item is added. `pendingScan` = { barcode, nutrition, source }.
let pendingScan = null;

// On every category page, adding starts folded: on Food, two buttons, Scan
// a barcode and Enter manually; elsewhere (no scanner), one Add an item
// button. The form itself stays folded away until it's needed: one of those
// is tapped, an item is being edited, or a What to buy suggestion is added.
let manualOpen = false;

const formFolds = () => CATEGORIES.includes(currentPage().cat) && !$('item-id').value;

const TOGGLE_ICONS = {
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.4 3.6a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
};

function renderEntryMode() {
  const folds = formFolds();
  const food = currentPage().cat === 'Food';
  $('scan-row').hidden = !folds;
  $('scan-row').classList.toggle('single', !food);
  $('scan-btn').hidden = !food;
  $('scan-hint').hidden = !food;
  $('manual-toggle-text').textContent = food ? 'Enter manually' : 'Add an item';
  const iconName = food ? 'pencil' : 'plus';
  if ($('manual-toggle-icon').dataset.icon !== iconName) {
    $('manual-toggle-icon').innerHTML = TOGGLE_ICONS[iconName];
    $('manual-toggle-icon').dataset.icon = iconName;
  }
  $('item-form').hidden = folds && !manualOpen;
  $('form-card').classList.toggle('folded', folds && !manualOpen);
  $('manual-toggle').setAttribute('aria-expanded', String(folds && manualOpen));
}

function openManualEntry() {
  manualOpen = true;
  renderEntryMode();
}

$('manual-toggle').addEventListener('click', () => {
  manualOpen = !manualOpen;
  renderEntryMode();
  if (manualOpen) $('name').focus();
});

// The line under the buttons that says what a scan filled in.
function renderScanInfo(item = null) {
  renderEntryMode();
  const info = item || pendingScan;
  const parts = [];
  if (info?.barcode) parts.push(`Barcode ${BARCODE.display(info.barcode)}`);
  const n = info?.nutrition;
  if (n?.kcal) {
    const pkg = n.size ? Math.round((n.size * n.kcal) / 100 / 10) * 10 : null;
    parts.push(pkg
      ? `about ${pkg.toLocaleString('en-US')} calories per package, from the label`
      : `${Math.round(n.kcal)} calories per 100 ${n.per === 'ml' ? 'mL' : 'g'}, from the label`);
  }
  $('scan-info-text').textContent = parts.join(' · ');
  $('scan-info').hidden = !parts.length;
  // Only a scan that's waiting to be added can be cleared.
  $('scan-clear').hidden = Boolean(item) || !pendingScan;
}

$('scan-clear').addEventListener('click', () => {
  pendingScan = null;
  renderScanInfo();
});

// An example name for each category's form.
const NAME_EXAMPLES = {
  'Water': 'Bottled water',
  'Food': 'Canned black beans',
  'Medical and First Aid': 'First aid kit',
  'Toiletries and Hygiene': 'Toilet paper',
  'Light and Power': 'AA batteries',
  'Documents': 'Copies of IDs',
  'Other': 'Duct tape',
};

function resetForm() {
  pendingScan = null;
  manualOpen = false;
  editingAddedDate = null;
  addingSupply = null;
  typeTouched = false;
  $('item-form').reset();
  $('item-id').value = '';
  // Left blank so there's nothing to erase before typing the amount.
  $('quantity').value = '';
  // The form only adds items to the category of the page it's on.
  const page = currentPage();
  $('category').value = CATEGORIES.includes(page.cat) ? page.cat : '';
  $('name').placeholder = `e.g. ${NAME_EXAMPLES[page.cat] || 'Canned black beans'}`;
  fillTypeOptions();
  unitsForType = null;
  syncUnitsToType();
  $('form-title').textContent = page.cat ? `Add to ${page.cat}` : 'Add an item';
  $('submit-btn').textContent = 'Add item';
  $('cancel-edit').hidden = true;
  updateExpiresHint();
  renderScanInfo();
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
  pendingScan = null;
  renderScanInfo(item.barcode || item.nutrition ? item : null);
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
    // A scan's barcode and label figures go with the new item.
    const scanned = pendingScan ? { barcode: pendingScan.barcode, ...(pendingScan.nutrition ? { nutrition: pendingScan.nutrition } : {}) } : {};
    const fromSupply = addingSupply ? { supply: addingSupply } : {};
    state.items.push({ id: newId(), added: toIsoDate(new Date()), ...data, ...scanned, ...fromSupply });
  }
  // Open the item's group so you can see where it went.
  setGroupOpen(category, groupOf(data).key, true);
  saveState();
  resetForm();
  render();
});

$('cancel-edit').addEventListener('click', resetForm);
