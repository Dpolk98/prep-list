// ---------- Rendering: Go-Bag ----------
// One bag of 30 L or less that works as both a get-home and a get-out bag.
// The list lives in go-bag.js. Each piece of gear can be ticked off as
// packed (saved), shows whether it's already in your inventory (with Add to
// log it there, like What to buy), and counts toward the space and weight
// meter at the top.

// "2.3 L", "0.3 L", "<0.1 L"
const litersText = (n) => (n > 0 && n < 0.1 ? '<0.1' : String(round1(n))) + ' L';
// "4.7 lb", "<0.1 lb"
const poundsText = (n) => (n > 0 && n < 0.1 ? '<0.1' : String(round1(n))) + ' lb';

function useTag(use) {
  const u = GO_BAG_USES[use] || GO_BAG_USES.both;
  return `<span class="use-tag ${use}" title="${u.long}">${u.label}</span>`;
}

function gearRow({ gear: g, packed, have }) {
  const page = PAGES.find((p) => p.cat === g.cat);
  const space = g.container ? 'The bag itself'
    : g.outside ? 'Clips outside'
    : litersText(g.liters);
  const inventory = have ? '<span class="have">In inventory</span>'
    : page ? `<button type="button" class="link-btn gear-add" data-gear-add="${escapeHtml(g.name)}" aria-label="Add ${escapeHtml(g.name)} to inventory">Add to inventory</button>`
    : '';
  return `
    <li class="gear ${packed ? 'packed' : ''}">
      <div class="gear-body">
        <span class="supply-name">${escapeHtml(g.name)}</span>
        <span class="supply-note">${escapeHtml(g.note)}</span>
        <span class="gear-meta">${useTag(g.use)}<span>${space}</span><span>${poundsText(g.lb)}</span>${inventory}</span>
      </div>
      <input type="checkbox" class="grab-check" data-gear-pack="${escapeHtml(g.name)}" ${packed ? 'checked' : ''} aria-label="${escapeHtml(g.name)}: packed">
    </li>`;
}

// Sections the user opened or closed, by id, kept until the app is closed
// (the same as the What to buy sections).
const goBagOpen = new Map();

function renderGoBag() {
  const sections = goBagSections(chosenHazards(), state.goBag.packed, state.items);
  const t = goBagTotals(sections);
  const limit = GO_BAG_LIMIT_L;

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
  $('gobag-plan').innerHTML = left >= 0
    ? `The full list ${state.hazards.length ? `for your Local Hazards ` : ''}comes to about <strong>${litersText(t.liters)}</strong> and <strong>${poundsText(t.lb)}</strong>, marked on the bar. That leaves about ${litersText(left)} for the gaps between things and for personal items.`
    : `The full list comes to about <strong>${litersText(t.liters)}</strong>, which is over the ${limit} L limit. Wear the bulkiest layer, keep walking shoes at work or in the car, or leave out what you’re least likely to need.`;
  $('gobag-plan').classList.toggle('warn-text', left < 0);

  // The packing list, in collapsible sections.
  const hazardTip = state.hazards.length ? '' :
    '<p class="hint hazard-tip">Choose your Local Hazards, such as winter storms or wildfire, on the <a href="#/settings">Settings</a> page to add what they call for.</p>';
  $('gobag-list').innerHTML = sections.map((s) => {
    const open = goBagOpen.has(s.id) ? goBagOpen.get(s.id) : s.open;
    const status = s.packedCount === s.entries.length ? 'All packed' : `${s.packedCount} of ${s.entries.length} packed`;
    return `
      <details class="supply-section gobag-section" data-section="${s.id}"${open ? ' open' : ''}>
        <summary>
          <span class="supply-section-label">${escapeHtml(s.label)}</span>
          <span class="supply-section-count">${status}${s.liters ? ` · ${litersText(s.liters)}` : ''}</span>
        </summary>
        <ul class="supplies gear-list">${s.entries.map(gearRow).join('')}</ul>
      </details>`;
  }).join('') + hazardTip;
}

$('gobag-list').addEventListener('toggle', (e) => {
  const section = e.target.closest?.('.gobag-section');
  if (section === e.target) goBagOpen.set(section.dataset.section, section.open);
}, true);

$('gobag-list').addEventListener('change', (e) => {
  const box = e.target.closest('[data-gear-pack]');
  if (!box) return;
  const name = box.dataset.gearPack;
  const packed = state.goBag.packed.filter((n) => n !== name);
  if (box.checked) packed.push(name);
  state.goBag.packed = packed;
  // Keep each section as it is while ticking things off.
  for (const d of $('gobag-list').querySelectorAll('.gobag-section')) goBagOpen.set(d.dataset.section, d.open);
  saveState();
  renderGoBag();
  [...$('gobag-list').querySelectorAll('[data-gear-pack]')].find((b) => b.dataset.gearPack === name)?.focus();
});

// "Add to inventory" opens the gear's category page with the add-item form
// filled in, linked to the gear the same way What to buy's Add is.
$('gobag-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-gear-add]');
  if (!btn) return;
  const gear = goBagSections(HAZARDS, [], []).flatMap((s) => s.entries).find((x) => x.gear.name === btn.dataset.gearAdd)?.gear;
  const page = gear && PAGES.find((p) => p.cat === gear.cat);
  if (!page) return;
  goToAfter(`#/${page.slug}`, () => addSupplyToInventory(gear.name));
});
