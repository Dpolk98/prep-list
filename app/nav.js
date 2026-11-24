// ---------- Navigation ----------

// Menu groups. Pages tagged with a group are nested under its heading, which
// opens and closes; the choice is remembered in this browser. Pages without a
// group (Overview, Savings, Settings, and Print summary) sit on their own.
const NAV_GROUPS = { preps: 'Preps', resources: 'Resources' };
const NAV_GROUPS_KEY = 'prep-tracker:nav-groups';
let navGroupChoices = {};
try { navGroupChoices = JSON.parse(localStorage.getItem(NAV_GROUPS_KEY)) || {}; } catch { /* no storage */ }

function navAlert(pages) {
  const a = pages.reduce((sum, p) => {
    const n = p.cat ? alertsFor(p.cat) : { expired: 0, soon: 0 };
    return { expired: sum.expired + n.expired, soon: sum.soon + n.soon };
  }, { expired: 0, soon: 0 });
  const n = a.expired + a.soon;
  return n
    ? `<span class="nav-alert ${a.expired ? 'bad' : 'warn'}" title="${a.expired} expired, ${a.soon} expiring soon">${n}</span>`
    : '';
}

function navLink(p, page) {
  return `
    <a class="nav-link" href="#/${p.slug}" ${p === page || p.slug === page.parent ? 'aria-current="page"' : ''}>
      ${icon(p.icon)}<span>${escapeHtml(p.name)}</span>${navAlert([p])}
    </a>`;
}

function renderNav(page) {
  const html = [];
  PAGES.forEach((p, i) => {
    if (!p.group) {
      html.push(`<li class="${['settings'].includes(p.slug) ? 'sep' : ''}">${navLink(p, page)}</li>`);
      return;
    }
    if (PAGES[i - 1]?.group === p.group) return; // already drawn with its group
    const pages = PAGES.filter((q) => q.group === p.group);
    // Open unless the user closed it, and always open around the current page.
    const open = pages.includes(page) || navGroupChoices[p.group] !== false;
    html.push(`
      <li class="sep">
        <details class="nav-group" data-group="${p.group}" ${open ? 'open' : ''}>
          <summary><span>${NAV_GROUPS[p.group]}</span><span class="nav-group-alert">${navAlert(pages)}</span></summary>
          <ul>${pages.map((q) => `<li>${navLink(q, page)}</li>`).join('')}</ul>
        </details>
      </li>`);
  });
  $('nav-list').innerHTML = html.join('');
}

// Saved on the tap itself rather than the "toggle" event, which arrives later.
$('nav-list').addEventListener('click', (e) => {
  const summary = e.target.closest('.nav-group > summary');
  if (!summary) return;
  const details = summary.parentElement;
  navGroupChoices[details.dataset.group] = !details.open;
  try { localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify(navGroupChoices)); } catch { /* no storage */ }
});

function openDrawer() {
  $('drawer').inert = false;
  $('drawer').classList.add('open');
  showWithMotion($('scrim'), 'fade');
  $('menu-btn').setAttribute('aria-expanded', 'true');
  ($('drawer').querySelector('[aria-current]') || $('menu-close')).focus();
}

function closeDrawer({ restoreFocus = true } = {}) {
  if (!$('drawer').classList.contains('open')) return;
  $('drawer').classList.remove('open');
  $('drawer').inert = true;
  hideWithMotion($('scrim'), 'fade');
  $('menu-btn').setAttribute('aria-expanded', 'false');
  if (restoreFocus) $('menu-btn').focus();
}

$('menu-btn').addEventListener('click', openDrawer);
$('menu-close').addEventListener('click', () => closeDrawer());
$('scrim').addEventListener('click', () => closeDrawer());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});

// Set when "Edit" is tapped on the Expired / Expiring pages; the item opens
// in its category page's form once the page changes.
let pendingEditId = null;

window.addEventListener('hashchange', () => {
  closeDrawer({ restoreFocus: false });
  grabEditing = false;
  $('search').value = '';
  $('filter-status').value = '';
  $('supplies-details').open = false;
  resetForm();
  render();
  window.scrollTo(0, 0);
  // "Edit" on the Expired / Expiring pages opens the item on its category page.
  const pending = state.items.find((i) => i.id === pendingEditId);
  pendingEditId = null;
  if (pending && currentPage().cat === pending.category) startEdit(pending);
  // A new user who leaves the welcome guide through the menu still needs a tier.
  askForTierIfNeeded();
  // Something to do once the new page is showing (see goToAfter).
  const after = pendingAfterNav;
  pendingAfterNav = null;
  after?.();
});

// Goes to a page, then runs `after` once it's showing.
let pendingAfterNav = null;
function goToAfter(hash, after) {
  pendingAfterNav = after;
  location.hash = hash;
}
