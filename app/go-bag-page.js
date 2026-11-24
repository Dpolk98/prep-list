// ---------- Rendering: Go-Bags ----------
// One bag of 30 L or less that works as both a get-home and a get-out bag.
// The list lives in go-bag.js. Each piece of gear can be ticked off as
// packed (saved), and counts toward the space and weight meter at the top.
// The bag is tracked on its own: nothing here reads from or adds to the
// inventory on the Preps pages.

// "2.3 L", "0.3 L", "<0.1 L"
const litersText = (n) => (n > 0 && n < 0.1 ? '<0.1' : String(round1(n))) + ' L';
// "4.7 lb", "<0.1 lb"
const poundsText = (n) => (n > 0 && n < 0.1 ? '<0.1' : String(round1(n))) + ' lb';

function useTag(use) {
  const u = GO_BAG_USES[use] || GO_BAG_USES.both;
  return `<span class="use-tag ${use}" title="${u.long}">${u.label}</span>`;
}

function gearRow({ gear: g, packed }) {
  const space = g.outside ? 'Clips outside' : litersText(g.liters);
  return `
    <li class="gear ${packed ? 'packed' : ''}">
      <div class="gear-body">
        <span class="supply-name">${escapeHtml(g.name)}</span>
        <span class="supply-note">${escapeHtml(g.note)}</span>
        ${g.mapTip ? offlineMapsTip() : ''}
        <span class="gear-meta">${useTag(g.use)}<span>${space}</span><span>${poundsText(g.lb)}</span></span>
      </div>
      <input type="checkbox" class="grab-check" data-gear-pack="${escapeHtml(g.name)}" ${packed ? 'checked' : ''} aria-label="${escapeHtml(g.name)}: packed">
    </li>`;
}

// Sections the user opened or closed, by id, kept until the app is closed
// (the same as the What to buy sections).
const goBagOpen = new Map();

// The bag the page shows.
function currentBag() {
  return state.goBag.bags.find((b) => b.id === state.goBag.current) || state.goBag.bags[0];
}

// One bag's list and totals, for the grid and for the page.
function bagTotals(bag, hazards = chosenHazards()) {
  const sections = goBagSections(hazards, bag.packed, bag.type);
  return { sections, t: goBagTotals(sections) };
}

const packedStatus = (t) => (t.packedCount === 0 ? 'Not started'
  : t.packedCount === t.count ? 'All packed'
  : `${t.packedCount} of ${t.count} packed`);

function bagSquare(bag, hazards) {
  const { t } = bagTotals(bag, hazards);
  const pct = t.count ? Math.round((t.packedCount / t.count) * 100) : 0;
  const here = bag.id === state.goBag.current;
  return `
    <button type="button" class="gobag-bag ${here ? 'selected' : ''}" data-bag="${escapeHtml(bag.id)}" aria-pressed="${here}">
      <span class="gobag-bag-name">${escapeHtml(bag.name)}</span>
      ${useTag(bag.type)}
      <span class="gobag-bag-where ${bag.location ? '' : 'none'}">${bag.location ? escapeHtml(bag.location) : 'No location yet'}</span>
      <span class="gobag-bag-bar" aria-hidden="true"><span style="width:${pct}%"></span></span>
      <span class="gobag-bag-status">${t.count && t.packedCount === t.count ? `<span class="all-packed">${packedStatus(t)}</span>` : packedStatus(t)} · ${goBagSize(t.liters)} L</span>
    </button>`;
}

function renderGoBag() {
  const hazards = chosenHazards();
  const bag = currentBag();
  const mode = bag.type;
  const { sections, t } = bagTotals(bag, hazards);
  const limit = goBagSize(t.liters);

  // Your bags: a square for each bag, then one for adding another.
  const n = state.goBag.bags.length;
  $('gobag-bags-count').textContent = n === 1 ? '1 bag' : `${n} bags`;
  $('gobag-grid').innerHTML = state.goBag.bags.map((b) => bagSquare(b, hazards)).join('') + `
    <button type="button" class="gobag-bag gobag-add" id="gobag-add">
      <span class="gobag-add-plus" aria-hidden="true">+</span>
      <span class="gobag-bag-name">Add a bag</span>
    </button>`;

  // The bag being packed.
  $('gobag-current-name').textContent = bag.name;
  $('gobag-current-meta').innerHTML = `${useTag(mode)}<span>${bag.location ? escapeHtml(bag.location) : 'No location yet'}</span>`;
  $('gobag-mode-blurb').textContent = GO_BAG_MODES[mode].blurb;
  $('gobag-size-label').textContent = `of space packed in a ${limit} L bag, estimated`;

  // Space and weight meter.
  $('gobag-liters').textContent = round1(t.packedLiters);
  $('gobag-limit').textContent = ` / ${limit} L`;
  $('gobag-bar').style.width = `${Math.min(100, Math.round((t.packedLiters / limit) * 100))}%`;
  $('gobag-bar').classList.toggle('over', t.packedLiters > limit);
  $('gobag-plan-mark').style.left = `${Math.min(100, (t.liters / limit) * 100)}%`;
  const left = limit - t.liters;
  $('gobag-weight').innerHTML = t.packedCount
    ? `About <strong>${poundsText(t.packedLb)}</strong> packed so far: ${t.packedCount} of ${plural(t.count, 'thing')}.`
    : `Nothing packed yet. Tick things off below as they go in the bag.`;
  const which = mode === 'both' ? 'The full list' : `The ${GO_BAG_MODES[mode].label} list`;
  $('gobag-plan').innerHTML = left >= 0
    ? `${which} ${state.hazards.length ? `for your Local Hazards ` : ''}comes to about <strong>${litersText(t.liters)}</strong> and <strong>${poundsText(t.lb)}</strong>, marked on the bar, so a <strong>${limit} L bag</strong> is enough. That leaves about ${litersText(left)} for the gaps between things and for personal items.`
    : `${which} comes to about <strong>${litersText(t.liters)}</strong>, which is over the ${limit} L limit. Wear the bulkiest layer, keep walking shoes at work or in the car, or leave out what you’re least likely to need.`;
  $('gobag-plan').classList.toggle('warn-text', left < 0);

  // The packing list, in collapsible sections.
  const hazardTip = state.hazards.length ? '' :
    '<p class="hint hazard-tip">Choose your Local Hazards, such as winter storms or wildfire, on the <a href="#/settings">Settings</a> page to add what they call for.</p>';
  $('gobag-list').innerHTML = sections.map((s) => {
    const open = goBagOpen.has(s.id) ? goBagOpen.get(s.id) : s.open;
    const done = s.packedCount === s.entries.length;
    const status = done ? 'All packed' : `${s.packedCount} of ${s.entries.length} packed`;
    return `
      <details class="supply-section gobag-section" data-section="${s.id}"${open ? ' open' : ''}>
        <summary>
          <span class="supply-section-label">${escapeHtml(s.label)}</span>
          <span class="supply-section-count">${done ? `<span class="all-packed">${status}</span>` : status}${s.liters ? ` · ${litersText(s.liters)}` : ''}</span>
        </summary>
        <ul class="supplies gear-list">${s.entries.map(gearRow).join('')}</ul>
      </details>`;
  }).join('') + hazardTip;
  renderGoBagToggle();
}

// "Expand all" or "Collapse all", as on the inventory lists.
function renderGoBagToggle() {
  const all = [...$('gobag-list').querySelectorAll('.gobag-section')];
  // With any section open the button collapses them all; otherwise it expands.
  const anyOpen = all.some(isDetailsOpen);
  $('gobag-toggle-all').textContent = anyOpen ? 'Collapse all' : 'Expand all';
  $('gobag-toggle-all').dataset.open = String(!anyOpen);
}

$('gobag-toggle-all').addEventListener('click', () => {
  const open = $('gobag-toggle-all').dataset.open === 'true';
  for (const d of $('gobag-list').querySelectorAll('.gobag-section')) {
    setDetailsOpen(d, open);
    goBagOpen.set(d.dataset.section, open);
  }
  renderGoBagToggle();
});

$('gobag-list').addEventListener('toggle', (e) => {
  const section = e.target.closest?.('.gobag-section');
  if (section !== e.target) return;
  goBagOpen.set(section.dataset.section, section.open);
  renderGoBagToggle();
}, true);

$('gobag-list').addEventListener('change', (e) => {
  const box = e.target.closest('[data-gear-pack]');
  if (!box) return;
  const name = box.dataset.gearPack;
  const bag = currentBag();
  bag.packed = bag.packed.filter((n) => n !== name);
  if (box.checked) bag.packed.push(name);
  // Keep each section as it is while ticking things off.
  for (const d of $('gobag-list').querySelectorAll('.gobag-section')) goBagOpen.set(d.dataset.section, d.open);
  saveState();
  renderGoBag();
  [...$('gobag-list').querySelectorAll('[data-gear-pack]')].find((b) => b.dataset.gearPack === name)?.focus();
});

// Show a bag's list, keeping the grid where it was.
function showBag(id) {
  if (id === state.goBag.current) return;
  state.goBag.current = id;
  goBagOpen.clear(); // a different list, so its sections start fresh
  saveState();
  renderGoBag();
  $('gobag-grid').querySelector(`[data-bag="${CSS.escape(id)}"]`)?.focus();
}

$('gobag-grid').addEventListener('click', (e) => {
  if (e.target.closest('#gobag-add')) return openBagDialog();
  const btn = e.target.closest('[data-bag]');
  if (btn) showBag(btn.dataset.bag);
});

$('gobag-edit').addEventListener('click', () => openBagDialog(currentBag()));

// ---------- Add or edit a bag ----------
let editingBagId = null;

function openBagDialog(bag = null) {
  editingBagId = bag?.id || null;
  $('gobag-bag-title').textContent = bag ? 'Edit bag' : 'Add a bag';
  $('gobag-bag-save').textContent = bag ? 'Save' : 'Add';
  // A bag can be deleted as long as another one is left.
  $('gobag-bag-delete').hidden = !bag || state.goBag.bags.length < 2;
  $('gobag-bag-delete').textContent = 'Delete bag';
  delete $('gobag-bag-delete').dataset.confirm;
  $('gobag-bag-name').value = bag?.name || '';
  $('gobag-bag-location').value = bag?.location || '';
  const type = bag?.type || 'both';
  $('gobag-bag-type').innerHTML = Object.entries(GO_BAG_MODES).map(([id, m]) => `
    <label class="tier-option gobag-type-option">
      <input type="radio" name="gobag-type" value="${id}" ${id === type ? 'checked' : ''}>
      <strong>${m.label}</strong>
      <span class="tier-title">${m.blurb}</span>
    </label>`).join('');
  $('gobag-bag-dialog').showModal();
  $('gobag-bag-name').focus();
}

$('gobag-bag-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('gobag-bag-name').value.trim().slice(0, GO_BAG_NAME_MAX);
  if (!name) return;
  const type = goBagMode($('gobag-bag-form').elements['gobag-type'].value);
  const location = $('gobag-bag-location').value.trim().slice(0, GO_BAG_LOCATION_MAX);
  const bag = editingBagId && state.goBag.bags.find((b) => b.id === editingBagId);
  if (bag) {
    // Changing the type keeps everything packed: gear the new type doesn't
    // list is hidden, and comes back if the type is changed back.
    if (bag.type !== type) goBagOpen.clear();
    Object.assign(bag, { name, type, location });
  } else {
    const id = newId();
    state.goBag.bags.push({ id, name, type, location, packed: [] });
    state.goBag.current = id;
    goBagOpen.clear();
  }
  saveState();
  $('gobag-bag-dialog').close();
  renderGoBag();
});

// The keyboard's Enter (or Done) key just closes the keyboard, so the
// popup only saves from its Add or Save button.
$('gobag-bag-form').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
  e.preventDefault();
  e.target.blur();
});

$('gobag-bag-cancel').addEventListener('click', () => $('gobag-bag-dialog').close());

// Deleting takes a second tap, since the bag's packing list goes with it.
$('gobag-bag-delete').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  if (!btn.dataset.confirm) {
    btn.dataset.confirm = '1';
    btn.textContent = 'Tap again to delete';
    return;
  }
  state.goBag.bags = state.goBag.bags.filter((b) => b.id !== editingBagId);
  if (state.goBag.current === editingBagId) state.goBag.current = state.goBag.bags[0].id;
  goBagOpen.clear();
  saveState();
  $('gobag-bag-dialog').close();
  renderGoBag();
});

// ---------- First visit: "Do you already have a bag set up?" ----------
// Asked once (saved as state.goBag.asked, so it's part of backups). "Not yet"
// opens the Choosing a bag section as a popup; it also stays at the bottom of
// the page. Waits while another popup, such as first-use setup, is open.
function askAboutBagIfNeeded() {
  if (state.goBag.asked || !state.tier) return;
  if (document.querySelector('dialog[open]')) return;
  $('gobag-ask-dialog').showModal();
}

// Any way of closing it, Escape included, counts as answered.
$('gobag-ask-dialog').addEventListener('close', () => {
  if (state.goBag.asked) return;
  state.goBag.asked = true;
  saveState();
});

$('gobag-ask-yes').addEventListener('click', () => $('gobag-ask-dialog').close());

$('gobag-ask-no').addEventListener('click', () => {
  $('gobag-ask-dialog').close();
  openChooseBag();
});

// The popup shows a copy of the section at the bottom of the page.
function openChooseBag() {
  const body = $('gobag-choose-dialog-body');
  body.replaceChildren(...[...$('gobag-choose-body').children].map((el) => el.cloneNode(true)));
  $('gobag-choose-dialog').showModal();
  // Start at the top, even on a phone where the button is below the fold.
  $('gobag-choose-done').focus({ preventScroll: true });
  $('gobag-choose-dialog').scrollTop = 0;
}

$('gobag-choose-done').addEventListener('click', () => $('gobag-choose-dialog').close());
