// ---------- Rendering: quick reference ----------
// The cards in reference.js. Their content never changes, so they're built
// once, and stay open or closed as you left them while you move around.

function referenceBody(card) {
  const table = card.table ? `
    <table class="ref-table">
      <thead><tr>${card.table.head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
      <tbody>${card.table.rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>` : '';
  return `<ul class="ref-points">${card.points.map((p) => `<li>${p}</li>`).join('')}</ul>${table}`;
}

function renderReference() {
  if ($('reference-list').children.length) return;
  $('reference-list').innerHTML = REFERENCE.map((card) => `
    <details class="card ref-card" id="ref-${card.id}">
      <summary>
        <span class="group-icon">${icon(card.icon)}</span>
        <span class="ref-title">${card.title}</span>
      </summary>
      <div class="ref-body">${referenceBody(card)}</div>
    </details>`).join('');
  updateReferenceToggle();
}

// Opens the Quick reference page with one card open and in view.
function openReferenceCard(id) {
  goToAfter('#/reference', () => {
    const card = $(`ref-${id}`);
    if (!card) return;
    card.open = true;
    updateReferenceToggle();
    card.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -70);
  });
}

function updateReferenceToggle() {
  const cards = [...$('reference-list').querySelectorAll('details')];
  // With any card open the button collapses them all; otherwise it expands.
  $('reference-toggle').textContent = cards.some(isDetailsOpen) ? 'Collapse all' : 'Expand all';
}

$('reference-toggle').addEventListener('click', () => {
  const cards = [...$('reference-list').querySelectorAll('details')];
  const open = !cards.some(isDetailsOpen);
  cards.forEach((d) => setDetailsOpen(d, open));
  updateReferenceToggle();
});
$('reference-list').addEventListener('toggle', updateReferenceToggle, true);
