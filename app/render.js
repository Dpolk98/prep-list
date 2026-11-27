// ---------- Rendering: page shell ----------

// Where a page's back button goes, or null for a page without one. A settings
// page goes back to the Settings list; a prep category page (Water, Food…)
// and the Expired / Expiring Soon pages go back to the Overview. The button
// is the same size as the page icon it replaces, so nothing changes size.
function pageBack(page) {
  if (page.parent === 'settings') return { href: '#/settings', label: 'Back to Settings' };
  if (page.group === 'preps' || page.status) return { href: '#/', label: 'Back to Overview' };
  return null;
}

function render() {
  // Low-battery mode replaces every page with one plain screen.
  const low = lowPowerOn();
  document.body.classList.toggle('low-power', low);
  setThemeColor(low);
  $('view-low-power').hidden = !low;
  if (low) {
    document.title = 'Low-battery mode · Prep Tracker';
    renderLowPower();
    return;
  }

  const page = currentPage();
  const wd = waterDays();

  document.title = page.slug ? `${page.name} · Prep Tracker` : 'Prep Tracker';
  $('page-icon').innerHTML = icon(page.icon);
  // Some pages have a back button in place of their icon (see pageBack).
  const back = pageBack(page);
  $('page-icon').hidden = Boolean(back);
  $('page-back').hidden = !back;
  if (back) {
    $('page-back').href = back.href;
    $('page-back').setAttribute('aria-label', back.label);
  }
  $('page-sub').hidden = !page.blurb;
  $('page-title').textContent = page.name;
  $('page-sub').textContent = page.blurb;

  renderNav(page);

  const view = page.slug === '' ? 'overview'
    : page.parent ? page.parent
    : ['savings', 'settings', 'welcome', 'print', 'grab', 'reference', 'review'].includes(page.slug) ? page.slug
    : page.slug === 'go-bag' ? 'gobag'
    : page.status ? 'status' : 'category';
  for (const v of ['overview', 'category', 'savings', 'settings', 'status', 'welcome', 'print', 'grab', 'gobag', 'reference', 'review']) $(`view-${v}`).hidden = v !== view;

  if (view === 'overview') renderOverview(wd);
  if (view === 'category') renderCategory(page, wd);
  if (view === 'savings') renderSavings();
  if (view === 'status') renderStatus(page);
  if (view === 'settings') renderSettings(page);
  if (view === 'print') renderPrint();
  if (view === 'grab') renderGrab();
  if (view === 'gobag') { renderGoBag(); askAboutBagIfNeeded(); }
  if (view === 'reference') renderReference();
  if (view === 'review') renderReview();
}
