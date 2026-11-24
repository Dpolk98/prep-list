// ---------- Rendering: grab list ----------


// The inventory item an entry is linked to, if it still exists.
const grabItem = (entry) => (entry.itemId ? state.items.find((i) => i.id === entry.itemId) : null);

// Where an entry is kept: a linked item's current location, or what was typed.
const grabWhere = (entry) => (grabItem(entry)?.location || entry.where || '').trim();

// Where the inventory items an entry goes with are stored: "Hall closet,
// Kitchen cabinet", or "" if none of them have a location.
function grabCategoryWhere(entry) {
  if (!entry.cat) return '';
  const seen = new Map();
  state.items
    .filter((i) => i.category === entry.cat && (!entry.types || entry.types.includes(i.type)))
    .forEach((i) => {
      const loc = (i.location || '').trim();
      if (loc && !seen.has(loc.toLowerCase())) seen.set(loc.toLowerCase(), loc);
    });
  const places = [...seen.values()];
  if (!places.length) return '';
  return places.length > 3 ? `${places.slice(0, 3).join(', ')}, and ${places.length - 3} more` : new Intl.ListFormat('en-US').format(places);
}

function grabRow(entry, index) {
  const item = grabItem(entry);
  const s = item ? statusOf(item) : 'ok';
  const badge = s === 'ok' ? '' : `<span class="badge ${s}">${s === 'expired' ? 'Expired' : 'Expiring soon'}</span>`;
  const where = grabWhere(entry);
  const kept = where || grabCategoryWhere(entry);
  const details = kept ? `Kept in: ${kept}` : '';
  // Number on the left, the entry in the middle, and a checkbox on the
  // right to tick it off once it's grabbed. Only in edit mode does tapping
  // an entry open it, so a stray tap while checking things off can't.
  const body = `
        <span class="grab-name">${escapeHtml(grabName(entry))}${badge}</span>
        ${details ? `<span class="grab-where">${escapeHtml(details)}</span>` : ''}`;
  return `
    <li class="grab-entry ${entry.done ? 'done' : ''}" data-id="${entry.id}">
      <span class="grab-num">${index + 1}</span>
      ${grabEditing
        ? `<button type="button" class="grab-body" data-grab="edit" aria-label="Edit ${escapeHtml(grabName(entry))}">${body}</button>
           <span class="grab-edit-mark" aria-hidden="true">›</span>`
        : `<div class="grab-body">${body}</div>
           <input type="checkbox" class="grab-check" data-grab="check" ${entry.done ? 'checked' : ''} aria-label="${escapeHtml(grabName(entry))}: done">`}
    </li>`;
}

// Edit mode, switched on from the bottom of the page.
let grabEditing = false;

function renderGrab() {
  $('view-grab').classList.toggle('grab-editing', grabEditing);
  $('grab-lists').innerHTML = GRAB_LISTS.map(({ key, title, hint }) => {
    const list = visibleGrab(key);
    const done = list.filter((e) => e.done).length;
    return `
      <section class="card grab-card" data-list="${key}">
        <div class="grab-card-head">
          <h2>${title}</h2>
          ${done ? `<span class="grab-progress">${done} of ${list.length} done</span>` : ''}
        </div>
        <p class="hint">${grabEditing ? 'Tap an entry to change or remove it.' : hint}</p>
        ${list.length
          ? `<ol class="grab-list">${list.map(grabRow).join('')}</ol>`
          : '<p class="empty">Nothing here yet.</p>'}
        <div class="actions grab-card-actions">
          ${grabEditing ? '<button type="button" data-grab="add">Add to this list</button>' : ''}
          ${done && !grabEditing ? '<button type="button" class="link-btn" data-grab="uncheck">Uncheck all</button>' : ''}
        </div>
      </section>`;
  }).join('') + `
    <div class="grab-mode">
      ${grabEditing
        ? '<button type="button" class="primary" data-grab-mode="off">Done editing</button>'
        : '<button type="button" data-grab-mode="on">Edit list</button><p class="hint">Change, add, or remove entries.</p>'}
    </div>`;
}

// Which list an entry is in, and where.
function findGrab(id) {
  for (const { key } of GRAB_LISTS) {
    const index = state.grab[key].findIndex((e) => e.id === id);
    if (index !== -1) return { key, index, entry: state.grab[key][index] };
  }
  return null;
}

$('grab-lists').addEventListener('click', (e) => {
  const mode = e.target.closest('[data-grab-mode]');
  if (mode) {
    grabEditing = mode.dataset.grabMode === 'on';
    renderGrab();
    // Back to the top of the lists, where the change is visible.
    $('grab-lists').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -70);
    return;
  }
  const btn = e.target.closest('[data-grab]');
  if (!btn || btn.disabled) return;
  const act = btn.dataset.grab;
  if (act === 'add') return openGrabDialog({ list: btn.closest('.grab-card').dataset.list });
  if (act === 'uncheck') {
    visibleGrab(btn.closest('.grab-card').dataset.list).forEach((entry) => { entry.done = false; });
    saveState();
    render();
    return;
  }

  const id = btn.closest('.grab-entry').dataset.id;
  const found = findGrab(id);
  if (!found) return;
  if (act === 'edit') return openGrabDialog({ list: found.key, entry: found.entry });
  // Ticked off as it's grabbed; saved, so it survives the app closing.
  if (act === 'check') found.entry.done = btn.checked;
  saveState();
  render();
  if (act === 'check') document.querySelector(`.grab-entry[data-id="${id}"] .grab-check`)?.focus();
});

// ---------- Grab list: add and edit ----------

let editingGrabId = null;

// Fills the Where field from a linked item, locked so it follows the item.
function syncGrabWhere() {
  const item = state.items.find((i) => i.id === $('grab-item').value);
  $('grab-where').disabled = Boolean(item);
  if (item) $('grab-where').value = item.location || '';
  $('grab-where-hint').hidden = !item;
}

function openGrabDialog({ list, entry = null }) {
  editingGrabId = entry?.id || null;
  $('grab-dialog-title').textContent = entry ? 'Edit Grab List Entry' : 'Add to the Grab List';
  $('grab-save').textContent = entry ? 'Save' : 'Add';
  $('grab-remove').hidden = !entry;
  $('grab-item').innerHTML = '<option value="">Not linked</option>' + CATEGORIES.map((cat) => {
    const items = state.items.filter((i) => i.category === cat).sort(byName);
    if (!items.length) return '';
    return `<optgroup label="${escapeHtml(cat)}">${items.map((i) =>
      `<option value="${i.id}">${escapeHtml(i.name)}${i.location ? ` (${escapeHtml(i.location)})` : ''}</option>`).join('')}</optgroup>`;
  }).join('');
  $('grab-item').value = grabItem(entry || {}) ? entry.itemId : '';
  $('grab-name').value = entry?.name || '';
  $('grab-where').value = entry?.where || '';
  $('grab-list').value = list;
  $('grab-cat').innerHTML = '<option value="">None</option>' + CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  $('grab-cat').value = entry?.cat || '';
  syncGrabWhere();
  $('grab-dialog').showModal();
  $('grab-name').focus();
}

// Picking an item fills in its name, unless a different name was typed.
let lastLinkedName = '';
$('grab-item').addEventListener('change', () => {
  const item = state.items.find((i) => i.id === $('grab-item').value);
  const name = $('grab-name').value.trim();
  if (item && (!name || name === lastLinkedName)) $('grab-name').value = item.name;
  if (item) $('grab-cat').value = item.category;
  lastLinkedName = item ? item.name : '';
  syncGrabWhere();
});

$('grab-cancel').addEventListener('click', () => $('grab-dialog').close());

$('grab-remove').addEventListener('click', () => {
  const found = editingGrabId && findGrab(editingGrabId);
  if (found) state.grab[found.key].splice(found.index, 1);
  saveState();
  $('grab-dialog').close();
  render();
});

$('grab-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('grab-name').value.trim();
  if (!name) return;
  const itemId = $('grab-item').value || null;
  const found = editingGrabId && findGrab(editingGrabId);
  // A starter entry keeps its narrower types while its category is unchanged.
  const cat = $('grab-cat').value || null;
  const types = found && found.entry.cat === cat ? found.entry.types : null;
  // A linked entry keeps a copy of the item's location, in case the item is deleted later.
  const entry = grabEntry({ id: editingGrabId, name, where: $('grab-where').value, itemId, cat, types, done: found?.entry.done });
  const to = $('grab-list').value;
  if (found && found.key === to) state.grab[to][found.index] = entry;
  else {
    if (found) state.grab[found.key].splice(found.index, 1);
    state.grab[to].push(entry);
  }
  saveState();
  $('grab-dialog').close();
  render();
});
