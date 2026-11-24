// ---------- Rendering: page shell ----------

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
  $('page-title').textContent = page.name;
  $('page-sub').textContent = page.blurb;

  renderNav(page);

  const view = page.slug === '' ? 'overview'
    : ['savings', 'settings', 'welcome', 'print', 'grab', 'reference', 'review'].includes(page.slug) ? page.slug
    : page.slug === 'go-bag' ? 'gobag'
    : page.status ? 'status' : 'category';
  for (const v of ['overview', 'category', 'savings', 'settings', 'status', 'welcome', 'print', 'grab', 'gobag', 'reference', 'review']) $(`view-${v}`).hidden = v !== view;

  if (view === 'overview') renderOverview(wd);
  if (view === 'category') renderCategory(page, wd);
  if (view === 'savings') renderSavings();
  if (view === 'status') renderStatus(page);
  if (view === 'settings') renderSettings();
  if (view === 'print') renderPrint();
  if (view === 'grab') renderGrab();
  if (view === 'gobag') renderGoBag();
  if (view === 'reference') renderReference();
  if (view === 'review') renderReview();
}
