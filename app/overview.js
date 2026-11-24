// ---------- Rendering: Overview ----------

function renderOverview(wd) {
  const tier = currentTier();

  $('stat-items').textContent = state.items.length;
  $('stat-soon').textContent = state.items.filter((i) => statusOf(i) === 'soon').length;
  $('stat-expired').textContent = state.items.filter((i) => statusOf(i) === 'expired').length;
  $('stat-water').textContent = formatDays(wd);

  renderBatteryCard();
  renderCelebration();
  renderBackupReminder();

  $('plan-title').textContent = `${tier.name} Plan: ${tier.title}`;
  $('plan-mindset').textContent = tier.mindset;
  $('plan-hazards').hidden = !state.hazards.length;
  $('plan-hazards').innerHTML = state.hazards.length
    ? `<span class="plan-hazards-label">Also preparing for</span>${chosenHazards().map((h) => `<button type="button" class="hazard-chip" data-hazard="${h.id}" aria-label="${escapeHtml(h.name)}: see what it adds">${icon(h.icon)}${escapeHtml(titleCase(h.name))}</button>`).join('')}`
    : '';

  // Savings first, then one card per category page.
  const cards = PAGES.filter((p) => p.cat).map((p) => {
    const count = state.items.filter((i) => i.category === p.cat).length;
    const a = alertsFor(p.cat);
    // Inventory pages show how many items you have; Plans and Skills has no
    // inventory, so it shows its description instead.
    const meta = p.noInventory ? escapeHtml(p.blurb) : `${count} item${count === 1 ? '' : 's'}`;
    const badges = [
      a.expired && `<span class="badge expired">${a.expired} expired</span>`,
      a.soon && `<span class="badge soon">${a.soon} expiring</span>`,
    ].filter(Boolean).join('');
    return `
      <a class="cat-card" href="#/${p.slug}">
        <span class="cat-icon">${icon(p.icon)}</span>
        <span class="cat-name">${escapeHtml(p.name)}</span>
        <span class="cat-meta">${meta}</span>
        ${badges ? `<span class="cat-badges">${badges}</span>` : ''}
      </a>`;
  });

  // Emergency cash and investments together.
  const goal = savingsGoal(tier);
  const saved = totalSaved();
  const sp = goal ? Math.min(100, Math.round((saved / goal) * 100)) : 0;
  cards.unshift(`
    <a class="cat-card" href="#/savings">
      <span class="cat-icon">${icon('dollar')}</span>
      <span class="cat-name">Savings</span>
      <span class="cat-meta">${money.format(saved)} of ${money.format(goal)}</span>
      <span class="mini-bar"><span style="width:${sp}%"></span></span>
    </a>`);

  $('cat-grid').innerHTML = cards.join('');
}

// A gentle note on the Overview when changes have gone a while without a backup.
function renderBackupReminder() {
  const show = shouldRemindBackup();
  $('backup-reminder').hidden = !show;
  if (!show) return;
  const info = backupInfo();
  $('backup-reminder-text').textContent = info.last
    ? `Your last backup was ${daysAgo(info.last)}, and you’ve made ${changesSinceText(info)} since then. Your data is saved only on this device, so exporting a backup keeps a copy somewhere safe.`
    : 'You haven’t exported a backup from this device yet. Your data is saved only here, so exporting one keeps a copy somewhere safe.';
}
