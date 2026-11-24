// ---------- Rendering: category page ----------

// Reference list of suggested supplies. Category pages show it in a
// collapsible section; Plans and Skills (no inventory) shows it in a plain card.
function renderSupplies(page) {
  const tier = currentTier();
  const canAdd = !page.noInventory;
  let total = 0;

  // Sections, their order, and which start open come from supplySections
  // (supply-match.js). Above the first tier each section is a collapsible
  // <details>; a section the user opened or closed stays that way while
  // the app is open, even as the list redraws after an Add.
  const sections = supplySections(includedTiers(), chosenHazards(), page.cat, canAdd ? state.items : null);
  const html = sections.map(({ label, entries, toBuy, collapsible, open }) => {
    total += entries.length;
    const list = `
      <ul class="supplies">
        ${entries.map(({ supply: s, have }) => {
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
    if (!collapsible) return `<h3>${escapeHtml(label)}</h3>${list}`;
    const key = `${page.cat}|${label}`;
    const isOpen = sectionOpen.has(key) ? sectionOpen.get(key) : open;
    const status = !canAdd ? plural(entries.length, 'idea')
      : toBuy ? `${toBuy} to buy` : 'All in inventory';
    return `
      <details class="supply-section" data-section="${escapeHtml(key)}"${isOpen ? ' open' : ''}>
        <summary><span class="supply-section-label">${escapeHtml(label)}</span><span class="supply-section-count">${status}</span></summary>
        ${list}
      </details>`;
  }).join('');

  // With no hazards chosen, a pointer to where they're chosen.
  const hazardTip = state.hazards.length ? '' :
    '<p class="hint hazard-tip">You can add suggestions for Local Hazards, such as winter storms or wildfire, on the <a href="#/settings/hazards">Local Hazards</a> page in Settings.</p>';
  const plusHazards = state.hazards.length ? `, plus a few for your Local Hazards: ${hazardList()}` : '';

  $('plans-card').hidden = !page.noInventory || total === 0;
  $('supplies-card').hidden = Boolean(page.noInventory) || total === 0;
  if (page.noInventory) {
    $('plans-intro').textContent = `Plans and skills worth having at the ${tier.name} tier${plusHazards}.`;
    $('plans-list').innerHTML = html + hazardTip;
    $('supplies').innerHTML = '';
    return;
  }
  $('supplies-count').textContent = `${total} idea${total === 1 ? '' : 's'}`;
  $('supplies-intro').textContent =
    `Ideas for your shopping list at the ${tier.name} tier${plusHazards}. Tap Add once you have something to log it in your inventory.`;
  $('supplies').innerHTML = html + hazardTip;
  $('plans-list').innerHTML = '';
}

// Sections the user has opened or closed, by "category|label". Kept in
// memory only: the next visit starts from the defaults again.
const sectionOpen = new Map();
for (const id of ['supplies', 'plans-list']) {
  // toggle doesn't bubble, so listen in the capture phase.
  $(id).addEventListener('toggle', (e) => {
    const section = e.target.closest?.('.supply-section');
    if (section === e.target) sectionOpen.set(section.dataset.section, section.open);
  }, true);
}

// "Add" on a suggestion fills the add-item form with its name.
$('supplies').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  resetForm();
  openManualEntry();
  $('name').value = btn.dataset.add;
  // Remembered on the new item, so it keeps counting toward this
  // suggestion even if it's renamed or given another type.
  addingSupply = btn.dataset.add;
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
  const servings = servingsText(i);
  const expiry = i.expiresEstimated
    ? `${exp.text} <span class="est" title="Estimated from the item type's typical shelf life. Edit the item to enter the printed date.">est.${basis}</span>`
    : exp.text;
  // One labelled row per detail; empty ones are left out. The Details
  // toggle (used when the servings wouldn't fit on the quantity line) holds
  // the same facts, with servings on a row of their own.
  const quantity = `${i.quantity} ${escapeHtml(i.unit)}`.trim();
  const factList = (servingsRow) => [
    ['Quantity', servingsRow ? quantity : quantity + (servings ? ` <span class="est servings-inline">· ${servings}</span>` : '')],
    servingsRow && servings && ['Servings', `${servings[0].toUpperCase() + servings.slice(1)} <span class="est">est.</span>`],
    type && ['Type', escapeHtml(type.name)],
    calories && ['Calories', calories],
    [exp.label, expiry],
    i.location && ['Location', escapeHtml(i.location)],
    i.notes && ['Notes', escapeHtml(i.notes)],
  ].filter(Boolean).map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join('');
  const facts = factList(false);
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
      ${servings ? `
        <details class="item-more">
          <summary>Details</summary>
          <dl class="facts">${factList(true)}</dl>
        </details>` : ''}
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

    // With any group open the button collapses them all; otherwise it expands.
    const anyOpen = list.some((g) => isGroupOpen(page.cat, g));
    $('group-tools').hidden = filtering;
    $('toggle-groups').textContent = anyOpen ? 'Collapse all' : 'Expand all';
    $('toggle-groups').dataset.open = String(!anyOpen);
  }

  $('empty').hidden = visible.length > 0;
  $('empty').textContent = items.length
    ? 'No items match your filters.'
    : `No ${page.name.toLowerCase()} items yet. Add one above.`;
}

// Adding comes first: the (folded) add section sits above the inventory.
function placeFormCard() {
  const form = $('form-card');
  const list = $('inventory-card');
  if (form.nextElementSibling !== list) list.before(form);
}

function renderCategory(page, wd) {
  const tier = currentTier();
  placeFormCard();

  // Water gets a headline "days stored" panel.
  $('water-panel').hidden = page.slug !== 'water';
  if (page.slug === 'water') {
    const pct = Math.min(100, Math.round((wd / tier.waterGoalDays) * 100));
    $('water-days').textContent = formatDays(wd);
    $('water-goal').textContent = ` / ${tier.waterGoalDays}`;
    $('water-bar').style.width = `${pct}%`;
    $('water-bar').classList.toggle('complete', pct >= 100);
    $('water-panel-hint').innerHTML =
      `For ${state.people} ${state.people === 1 ? 'person' : 'people'} (change in <a href="#/settings/household">Settings</a>). ${escapeHtml(waterHint(tier))}`;
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
    ? 'Add food to your inventory to see an estimate.'
    : `About ${formatDays(shownDays)} ${shownDays === 1 ? 'day' : 'days'} of food for ${people} ` +
      `(change in <a href="#/settings/household">Settings</a>). ` +
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
