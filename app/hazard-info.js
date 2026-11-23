// ---------- Local Hazard details ----------
// Tapping a hazard on the Overview shows everything it adds: supplies (by
// category, marked when they're already in your inventory), plans and
// skills, and the Quick reference cards that go with it.

function openHazardInfo(id) {
  const h = HAZARDS.find((x) => x.id === id);
  if (!h) return;
  const supplies = h.supplies.filter((s) => CATEGORIES.includes(s.cat));
  const plans = h.supplies.filter((s) => s.cat === 'Plans and Skills');
  const cards = (h.reference || []).map((rid) => REFERENCE.find((c) => c.id === rid)).filter(Boolean);

  const item = (s, canHave) => `
    <li>
      <div><span class="supply-name">${escapeHtml(s.name)}</span><span class="supply-note">${escapeHtml(s.note)}</span></div>
      ${canHave && inInventory(s.name, s.cat) ? '<span class="have">In inventory</span>' : ''}
    </li>`;
  const byCategory = PAGES.filter((p) => CATEGORIES.includes(p.cat)).map((p) => {
    const list = supplies.filter((s) => s.cat === p.cat);
    if (!list.length) return '';
    return `
      <h4><button type="button" class="link-btn hazard-info-cat" data-page="${p.slug}">${icon(p.icon)}${escapeHtml(p.name)}<span aria-hidden="true">›</span></button></h4>
      <ul class="supplies">${list.map((s) => item(s, true)).join('')}</ul>`;
  }).join('');
  const have = supplies.filter((s) => inInventory(s.name, s.cat)).length;

  $('hazard-info-icon').innerHTML = icon(h.icon);
  $('hazard-info-title').textContent = h.name;
  $('hazard-info-intro').textContent =
    `Preparing for ${h.name.toLowerCase()} adds these to your plan, whatever your tier.` +
    (!supplies.length ? ''
      : have ? ` You have ${have} of its ${plural(supplies.length, 'supply suggestion')} so far.`
      : ` It adds ${plural(supplies.length, 'supply suggestion')}.`);
  $('hazard-info-body').innerHTML = `
    ${supplies.length ? `<section><h3>Supplies added to What to buy</h3>${byCategory}</section>` : ''}
    ${plans.length ? `<section><h3>Plans and skills</h3><ul class="supplies">${plans.map((s) => item(s, false)).join('')}</ul>
      <button type="button" class="link-btn hazard-info-cat" data-page="plans">${icon('clipboard')}Open Plans and Skills<span aria-hidden="true">›</span></button></section>` : ''}
    ${cards.length ? `<section><h3>Quick reference</h3><div class="hazard-info-refs">${cards.map((c) =>
      `<button type="button" class="hazard-info-ref" data-ref="${c.id}">${icon(c.icon)}<span>${escapeHtml(c.title)}</span><span aria-hidden="true">›</span></button>`).join('')}</div></section>` : ''}`;
  $('hazard-info').showModal();
  // Start at the top, with focus on the close button there.
  $('hazard-info').scrollTop = 0;
  $('hazard-info-close').focus({ preventScroll: true });
}

$('plan-hazards').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-hazard]');
  if (chip) openHazardInfo(chip.dataset.hazard);
});

$('hazard-info-body').addEventListener('click', (e) => {
  const cat = e.target.closest('[data-page]');
  const ref = e.target.closest('[data-ref]');
  if (!cat && !ref) return;
  $('hazard-info').close();
  if (ref) { openReferenceCard(ref.dataset.ref); return; }
  // A category opens with its What to buy list showing; Plans and Skills
  // shows its list on its own.
  goToAfter(`#/${cat.dataset.page}`, () => {
    if (cat.dataset.page === 'plans') return;
    $('supplies-details').open = true;
    $('supplies-card').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -70);
  });
});

$('hazard-info-done').addEventListener('click', () => $('hazard-info').close());
$('hazard-info-close').addEventListener('click', () => $('hazard-info').close());
$('hazard-info-settings').addEventListener('click', () => {
  $('hazard-info').close();
  goToAfter('#/settings', () => {
    $('settings-hazards').closest('section').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -70);
  });
});

// "winter storms, floods, and wildfire"
function hazardList(hazards = chosenHazards()) {
  return new Intl.ListFormat('en-US', { type: 'conjunction' }).format(hazards.map((h) => h.name.toLowerCase()));
}
