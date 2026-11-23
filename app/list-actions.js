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

$('settings-hazards').addEventListener('change', () => {
  const checked = [...$('settings-hazards').querySelectorAll('input:checked')].map((el) => el.value);
  state.hazards = HAZARDS.map((h) => h.id).filter((id) => checked.includes(id));
  saveState();
  render();
});

$('people').addEventListener('change', () => {
  state.people = Math.max(1, Math.round(Number($('people').value) || 1));
  saveState();
  render();
});
