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
  const people = householdNow();
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
      ['Investments', investGoal()
        ? `${money.format(Number(state.savings.invested) || 0)} of ${money.format(investGoal())}`
        : money.format(Number(state.savings.invested) || 0)],
    );
  }

  const attention = [...expired, ...soon].sort(byExpiry);
  const groups = printGroups(groupBy);

  $('print-doc').innerHTML = `
    <header class="pd-head">
      <h2>Prep Tracker Summary</h2>
      <p class="pd-meta">Printed ${printDate()} · Household: ${householdNow()} · ${escapeHtml(tier.name).replaceAll(' ', '&nbsp;')} plan: ${escapeHtml(tier.title)}</p>
      ${state.hazards.length ? `<p class="pd-meta">Also preparing for ${escapeHtml(hazardList())}</p>` : ''}
    </header>

    <section class="pd-section">
      <h3>At a Glance</h3>
      <dl class="pd-glance">
        ${glance.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
      </dl>
    </section>

    ${FEATURES.grabList && GRAB_LISTS.some(({ key }) => visibleGrab(key).length) ? `
    <section class="pd-section">
      <h3>Grab List</h3>
      <div class="pd-grab">
        ${GRAB_LISTS.filter(({ key }) => visibleGrab(key).length).map(({ key, title }) => `
          <div>
            <h4>${title}</h4>
            <ol class="pd-grab-list">${visibleGrab(key).map((e, i) => {
              // An empty box to tick by hand, then the entry and where it's kept.
              const where = grabWhere(e) || grabCategoryWhere(e);
              return `<li><span class="pd-box" aria-hidden="true"></span><span class="pd-grab-num">${i + 1}.</span><span><strong>${escapeHtml(grabName(e))}</strong>${where ? `<br><span class="pd-muted">${escapeHtml(where)}</span>` : ''}</span></li>`;
            }).join('')}</ol>
          </div>`).join('')}
      </div>
    </section>` : ''}

    ${attention.length ? `
    <section class="pd-section">
      <h3>Use or Replace Soon</h3>
      ${printTable(attention, ['Category', 'Location'])}
    </section>` : ''}

    <section class="pd-section">
      <h3>Inventory${groupBy === 'location' ? ' by Location' : ''}</h3>
      ${groups.length ? groups.map((g) => `
        <div class="pd-group">
          <h4><span>${escapeHtml(g.label)}</span><span class="pd-muted">${plural(g.items.length, 'item')}</span></h4>
          ${printTable(g.items, g.columns)}
        </div>`).join('') : '<p class="pd-muted">No items yet.</p>'}
    </section>

    ${$('print-reference').checked ? `
    <section class="pd-section pd-reference">
      <h3>Quick Reference</h3>
      <div class="pd-ref-cards">
        ${REFERENCE.map((card) => `<div class="pd-ref-card"><h4>${card.title}</h4>${referenceBody(card)}</div>`).join('')}
      </div>
    </section>` : ''}

    <p class="pd-foot">A snapshot from ${printDate()}. The up-to-date list is in Prep Tracker on your device.</p>`;
}

$('print-group').addEventListener('change', renderPrint);
$('print-savings').addEventListener('change', renderPrint);
$('print-reference').addEventListener('change', renderPrint);
$('print-btn').addEventListener('click', () => window.print());
