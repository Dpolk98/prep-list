// ---------- Year in review ----------

const REVIEW_KEY = 'prep-tracker:review';  // { seenYears }: the last anniversary celebrated
const YEAR_WORDS = ['', 'One Year', 'Two Years', 'Three Years', 'Four Years', 'Five Years', 'Six Years', 'Seven Years', 'Eight Years', 'Nine Years', 'Ten Years'];

// Whole years since you started.
function yearsSinceStart() {
  if (!state.startedOn) return 0;
  const [y, m, d] = state.startedOn.split('-').map(Number);
  const now = new Date();
  const beforeAnniversary = now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d);
  return Math.max(0, now.getFullYear() - y - (beforeAnniversary ? 1 : 0));
}

function reviewSeenYears() {
  try { return Number(JSON.parse(localStorage.getItem(REVIEW_KEY))?.seenYears) || 0; } catch { return 0; }
}
function markReviewSeen() {
  try { localStorage.setItem(REVIEW_KEY, JSON.stringify({ seenYears: yearsSinceStart() })); } catch { /* not essential */ }
}

// True from each anniversary until it's been seen or put off.
const shouldCelebrate = () => yearsSinceStart() >= 1 && reviewSeenYears() < yearsSinceStart();

// The months in the review: the last 12, or fewer if you started more recently.
function reviewMonths() {
  const first = (state.startedOn || toIsoDate(new Date())).slice(0, 7);
  const months = [];
  const d = new Date();
  d.setDate(1);
  for (let k = 0; k < 12; k++) {
    const key = monthKey(d);
    if (key < first) break;
    months.unshift(key);
    d.setMonth(d.getMonth() - 1);
  }
  return months;
}

const monthDate = (key) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1);
const monthName = (key, month = 'short') => monthDate(key).toLocaleDateString('en-US', { month, year: 'numeric' });
const monthEnd = (key) => { const d = monthDate(key); return toIsoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };

// A metric's value at the end of a month: this month live, a saved snapshot
// if there is one, or else worked out from the items added by then.
// Savings can't be worked out after the fact, so months without a snapshot
// have none.
function monthValue(key, metric) {
  if (key === monthKey()) return snapshotNow()[metric];
  const snap = state.history.find((h) => h.month === key);
  if (snap && snap[metric] != null) return snap[metric];
  if (metric === 'saved') return null;
  const end = monthEnd(key);
  const items = state.items.filter((i) => (i.added || state.startedOn || '') <= end);
  if (metric === 'items') return items.length;
  if (metric === 'water') return round1(waterSummary(items).days);
  return round1(foodCalories(items).days);
}

const compactMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
const REVIEW_METRICS = [
  { key: 'items', label: 'Items', format: (n) => String(n), short: (n) => String(n), noun: 'items on hand' },
  { key: 'water', label: 'Water', format: (n) => `${formatDays(n)} days`, short: (n) => formatDays(n), noun: 'days of water' },
  { key: 'food', label: 'Food', format: (n) => `${formatDays(n)} days`, short: (n) => formatDays(n), noun: 'days of food, roughly' },
  { key: 'saved', label: 'Savings', format: (n) => money.format(n), short: (n) => compactMoney.format(n), noun: 'saved' },
];
let reviewMetric = 'items';
let celebrateOnOpen = false;

function reviewTitle(months) {
  const years = yearsSinceStart();
  if (years >= 1 && years < YEAR_WORDS.length && reviewSeenYears() <= years) {
    // Within a couple of months of an anniversary, say so.
    const [, m, d] = state.startedOn.split('-').map(Number);
    const anniversary = new Date(new Date().getFullYear(), m - 1, d);
    if (anniversary > new Date()) anniversary.setFullYear(anniversary.getFullYear() - 1);
    if ((new Date() - anniversary) / 86400000 <= 60) return `${YEAR_WORDS[years]} of Being Prepared`;
  }
  return months.length >= 12 ? 'Your Last 12 Months' : 'Your Year So Far';
}

function reviewChart(months) {
  const metric = REVIEW_METRICS.find((m) => m.key === reviewMetric);
  const values = months.map((k) => monthValue(k, metric.key));
  const max = Math.max(1, ...values.filter((v) => v != null));
  const cols = months.map((k, i) => {
    const v = values[i];
    const label = monthDate(k).toLocaleDateString('en-US', { month: 'narrow' });
    const title = `${monthName(k, 'long')}: ${v == null ? 'not recorded' : metric.format(v)}`;
    return `
      <div class="rv-col" title="${title}">
        <div class="rv-track">
          ${v == null ? '<span class="rv-bar empty"></span>' : `
          <span class="rv-value">${metric.short(v)}</span>
          <span class="rv-bar" style="height:${Math.max(2, (v / max) * 80)}%"></span>`}
        </div>
        <span class="rv-label">${label}</span>
      </div>`;
  }).join('');
  const firstSaved = state.history.find((h) => h.saved != null)?.month;
  const note = metric.key === 'saved'
    ? `Savings are recorded month by month${firstSaved ? `, starting in ${monthName(firstSaved, 'long')}` : ''}.`
    : 'Months before Prep Tracker kept a monthly record are worked out from the dates items were added.';
  return `
    <div class="review-chart" role="img" aria-label="${metric.label} each month, ${monthName(months[0], 'long')} to ${monthName(months.at(-1), 'long')}">${cols}</div>
    <p class="hint review-note">${note}</p>`;
}

function renderReview() {
  if (yearsSinceStart() >= 1) markReviewSeen();
  const tier = currentTier();
  const months = reviewMonths();
  const first = months[0];
  const range = months.length > 1
    ? `${monthName(first, 'long')} to ${monthName(months.at(-1), 'long')}`
    : `Since you started in ${monthName(first, 'long')}`;

  const stats = REVIEW_METRICS.map((m) => {
    const now = monthValue(months.at(-1), m.key);
    // Compare with the earliest month in the review that has a value.
    const thenMonth = months.slice(0, -1).find((k) => monthValue(k, m.key) != null);
    const then = thenMonth ? monthValue(thenMonth, m.key) : null;
    let change = '';
    if (then != null && now != null) {
      change = now > then ? `Up from ${m.format(then)} in ${monthName(thenMonth)}`
        : now < then ? `${m.format(then)} in ${monthName(thenMonth)}`
        : `Steady since ${monthName(thenMonth)}`;
    }
    return `
      <div class="review-stat">
        <span class="num">${m.format(now ?? 0)}</span>
        <span class="label">${m.noun}</span>
        ${change ? `<span class="change">${change}</span>` : ''}
      </div>`;
  }).join('');

  // Highlights: only good news, and only what's true.
  const startIso = `${first}-01`;
  const added = state.items.filter((i) => i.added && i.added >= startIso);
  const perMonth = {};
  added.forEach((i) => { const k = i.added.slice(0, 7); perMonth[k] = (perMonth[k] || 0) + 1; });
  const busiest = Object.entries(perMonth).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const covered = CATEGORIES.filter((c) => state.items.some((i) => i.category === c)).length;
  const seen = new Set();
  const suggestions = [...includedTiers(), ...chosenHazards()].flatMap((t) => t.supplies)
    .filter((s) => CATEGORIES.includes(s.cat) && !seen.has(s.name) && seen.add(s.name));
  const have = suggestions.filter((s) => inInventory(s.name, s.cat) || state.items.some((i) => addedFrom(i, s))).length;
  const earliestTier = state.history.find((h) => h.month >= first && h.tier)?.tier;
  const movedUp = earliestTier && TIERS.findIndex((t) => t.id === earliestTier) < TIERS.indexOf(tier);
  const highlights = [
    added.length && `You added <strong>${plural(added.length, 'item')}</strong> to your inventory${busiest && added.length > 1 ? `, the most in ${monthName(busiest[0], 'long')} (${busiest[1]})` : ''}.`,
    covered && (covered === CATEGORIES.length
      ? `Every one of your <strong>${CATEGORIES.length} categories</strong> has supplies in it.`
      : `<strong>${covered} of ${CATEGORIES.length}</strong> categories have supplies in them.`),
    have && `<strong>${plural(have, 'item')}</strong> in your inventory came straight from the What to Buy suggestions.`,
    movedUp && `You moved up from the ${escapeHtml(TIERS.find((t) => t.id === earliestTier).name)} tier to ${escapeHtml(tier.name)}.`,
    state.items.length && !state.items.some((i) => statusOf(i) === 'expired') && 'Nothing in your inventory has expired.',
  ].filter(Boolean);

  // Looking ahead: progress toward this tier's goals.
  const goals = [
    { label: 'Water', now: waterDays(), goal: tier.waterGoalDays, text: (n, g) => `${formatDays(n)} of ${g} days` },
    { label: 'Food', now: foodCalories().days, goal: foodGoalDays(tier), text: (n, g) => `${formatDays(n)} of ${g} days` },
    { label: 'Savings', now: totalSaved(), goal: savingsGoal(tier), text: (n, g) => `${money.format(n)} of ${money.format(g)}` },
  ];
  const ahead = goals.map((g) => {
    const pct = g.goal ? Math.min(100, Math.round((g.now / g.goal) * 100)) : 0;
    return `
      <div class="ahead-row">
        <div class="ahead-text"><strong>${g.label}</strong><span>${pct >= 100 ? 'Goal reached' : g.text(g.now, g.goal)}</span></div>
        <span class="mini-bar"><span style="width:${pct}%"></span></span>
      </div>`;
  }).join('');

  $('review-content').innerHTML = `
    <section class="card review-hero">
      <h2>${reviewTitle(months)}</h2>
      <p>${range}</p>
    </section>

    <section class="review-stats">${stats}</section>

    <section class="card">
      <h2>Month by Month</h2>
      <div class="metric-tabs" role="group" aria-label="Show in the chart">
        ${REVIEW_METRICS.map((m) => `<button type="button" data-metric="${m.key}" aria-pressed="${m.key === reviewMetric}">${m.label}</button>`).join('')}
      </div>
      ${reviewChart(months)}
    </section>

    ${highlights.length ? `
    <section class="card">
      <h2>Highlights</h2>
      <ul class="reasons">${highlights.map((h) => `<li>${h}</li>`).join('')}</ul>
    </section>` : ''}

    <section class="card">
      <h2>Looking Ahead</h2>
      <p class="hint">Where you stand on your ${escapeHtml(tier.name)} goals.</p>
      ${ahead}
    </section>

    <p class="review-closing">Every item on the shelf is one less thing to worry about when something unexpected happens. Thank you for looking after your household, and here’s to another steady year.</p>`;

  if (celebrateOnOpen) {
    celebrateOnOpen = false;
    celebrate();
  }
}

$('review-content').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-metric]');
  if (!btn) return;
  reviewMetric = btn.dataset.metric;
  renderReview();
  document.querySelector(`[data-metric="${reviewMetric}"]`)?.focus();
});

// A short shower of confetti, skipped for anyone who prefers less motion.
function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div');
  box.className = 'confetti';
  box.setAttribute('aria-hidden', 'true');
  const colors = ['#2f6b4f', '#5fb38a', '#e0a83a', '#7fcaa3', '#c9e4d4'];
  box.innerHTML = Array.from({ length: 40 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.6;
    const dur = 2.2 + Math.random() * 1.2;
    const drift = (Math.random() - 0.5) * 120;
    return `<span style="left:${left}%;background:${colors[i % colors.length]};animation-delay:${delay}s;animation-duration:${dur}s;--drift:${drift}px"></span>`;
  }).join('');
  document.body.append(box);
  setTimeout(() => box.remove(), 4000);
}

// The yearly card on the Overview.
function renderCelebration() {
  const show = shouldCelebrate();
  $('celebrate-card').hidden = !show;
  if (!show) return;
  const years = yearsSinceStart();
  $('celebrate-title').textContent = `${YEAR_WORDS[years] || `${years} Years`} of Being Prepared`;
  $('celebrate-text').textContent = years === 1
    ? 'It’s been a year since you started tracking your supplies. Take a moment to look back at what you’ve built.'
    : `It’s been ${years} years since you started tracking your supplies. Take a moment to look back at this past year.`;
}

$('celebrate-open').addEventListener('click', () => {
  markReviewSeen();
  celebrateOnOpen = true;
  location.hash = '#/review';
});
$('celebrate-later').addEventListener('click', () => {
  markReviewSeen();
  render();
});
