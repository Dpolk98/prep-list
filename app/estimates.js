// Days from today until an ISO date (YYYY-MM-DD). Negative = in the past.
function daysUntil(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function statusOf(item) {
  const days = daysUntil(item.expires);
  if (days === null) return 'ok';
  if (days < 0) return 'expired';
  if (days <= SOON_DAYS) return 'soon';
  return 'ok';
}

// A number of days as a short, rounded span: days up to 2 months,
// then months up to 2 years, then years ("45 days", "5 months", "3 years").
const DAYS_PER_MONTH = 365.25 / 12;
function formatSpan(days) {
  const count = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (days > 730) return count(Math.round(days / 365.25), 'year');
  if (days > 60) return count(Math.round(days / DAYS_PER_MONTH), 'month');
  return count(days, 'day');
}

// The Expires row of an item: its label and text.
function expiryParts(item) {
  const days = daysUntil(item.expires);
  if (days === null) return { label: 'Expires', text: 'No date' };
  const date = formatLongDate(item.expires);
  if (days < 0) return { label: 'Expired', text: `${formatSpan(-days)} ago (${date})` };
  if (days === 0) return { label: 'Expires', text: `Today (${date})` };
  return { label: 'Expires', text: `In ${formatSpan(days)} (${date})` };
}

// Water types that aren't drinking water themselves, so they never count
// toward days of water (a bottle of bleach isn't a bottle of water).
const NOT_DRINKING_WATER = new Set(['tablets', 'bleach', 'filter']);
// Equipment that may or may not be full: counted when its unit is a volume
// ("55 gallons"), but never listed as "not counted".
const WATER_EQUIPMENT = new Set(['containers']);

// Stored drinking water (non-expired), and the items whose unit couldn't be
// converted to gallons (see gallonsPerUnit in units.js). Takes any list of
// items, so the Year in review can work out earlier months too.
function waterSummary(items = state.items) {
  let gallons = 0;
  const uncounted = [];
  for (const i of items) {
    if (i.category !== 'Water' || statusOf(i) === 'expired') continue;
    // Older items have no type; go by the name instead.
    const type = i.type || guessType({ name: i.name, unit: i.unit, category: 'Water' });
    if (NOT_DRINKING_WATER.has(type)) continue;
    const per = gallonsPerUnit(i.unit);
    if (per !== null) gallons += Math.max(0, Number(i.quantity) || 0) * per;
    else if (!WATER_EQUIPMENT.has(type)) uncounted.push(i);
  }
  return { days: gallons / Math.max(1, state.people), uncounted };
}

function waterDays() {
  return waterSummary().days;
}

// "Rice and Honey", or "Rice, Honey, Oats, and 2 more", for naming items an
// estimate left out.
function listNames(items) {
  const names = items.slice(0, 3).map((i) => escapeHtml(i.name));
  if (items.length > 3) names.push(`${items.length - 3} more`);
  return new Intl.ListFormat('en-US', { type: 'conjunction' }).format(names);
}

function formatDays(d) {
  return d >= 10 ? String(Math.floor(d)) : d.toFixed(1).replace(/\.0$/, '');
}

function waterHint(tier) {
  return tier.waterGoalDays < 30 || tier.id === 'month'
    ? `Goal: 1 gallon per person per day for ${tier.waterGoalDays} days.`
    : 'Keep 30 days stored. Past that, rely on a water source you can filter and purify.';
}

// ---------- Food calories ----------

const CALORIES_PER_DAY = 2000; // per person, a common planning figure

// The food goal follows the tier, up to a year: past that, the plan shifts
// from storing food to producing it (as water caps at 30 days).
function foodGoalDays(tier) {
  return tier.days ?? 365;
}

// Rounds down to two significant figures (48,250 → 48,000), since the
// estimate isn't precise enough for more and should lean low.
function roughCalories(n) {
  const whole = Math.max(0, Math.floor(n));
  const step = 10 ** Math.max(0, String(whole).length - 2);
  return (Math.floor(whole / step) * step).toLocaleString('en-US');
}

// Total estimated calories in non-expired Food items, and the items the
// estimate couldn't work out (no type, or a unit it can't convert).
function foodCalories(items = state.items) {
  let calories = 0;
  let count = 0;
  const unestimated = [];
  for (const i of items) {
    if (i.category !== 'Food') continue;
    count += 1;
    if (statusOf(i) === 'expired') continue;
    const est = estimateCalories(i);
    if (est?.unknown) unestimated.push(i);
    else if (est?.calories) calories += est.calories;
  }
  const days = calories / (CALORIES_PER_DAY * Math.max(1, state.people));
  return { calories, days, count, unestimated };
}

// The Calories row of a Food item, or null for items that aren't counted.
function caloriesFact(item) {
  const est = estimateCalories(item);
  if (!est || est.none) return null;
  if (est.unknown === 'type') return '<span class="est">Not estimated without a type</span>';
  if (est.unknown && !String(item.unit || '').trim()) return '<span class="est">Not estimated without a unit</span>';
  if (est.unknown) return `<span class="est">Not estimated for “${escapeHtml(item.unit)}”</span>`;
  const expired = statusOf(item) === 'expired' ? ' <span class="est">(not counted while expired)</span>' : '';
  if (est.label) return `${(Math.round(est.calories / 10) * 10).toLocaleString('en-US')} <span class="est">from the label</span>${expired}`;
  return `About ${roughCalories(est.calories)} <span class="est">est.</span>${expired}`;
}

// A Food item's servings, "about 24 servings", or null when there's no
// sensible figure. Shown after the quantity on the same line when it fits,
// and otherwise with the item's other facts in a Details toggle (see fitServings).
function servingsText(item) {
  const n = estimateServings(item);
  return n ? `about ${n.toLocaleString('en-US')} serving${n === 1 ? '' : 's'}` : null;
}

// Rows whose quantity line would wrap with the servings after it get the
// "servings-wrapped" class, which folds all of the item's facts, servings
// included, into the Details toggle.
// Rows in a closed group have no size yet, so they're checked when it opens.
function fitServings() {
  document.querySelectorAll('.item:has(.servings-inline)').forEach((li) => {
    const dd = li.querySelector('.facts dd');
    const dt = li.querySelector('.facts dt');
    li.classList.remove('servings-wrapped');
    const line = dt.getBoundingClientRect().height;
    if (!line) return; // not on screen
    li.classList.toggle('servings-wrapped', dd.getBoundingClientRect().height > line * 1.5);
  });
}
let fitQueued = false;
function queueFitServings() {
  if (fitQueued) return;
  fitQueued = true;
  queueMicrotask(() => { fitQueued = false; fitServings(); });
}
new MutationObserver(queueFitServings).observe(document.querySelector('main'), { childList: true, subtree: true });
window.addEventListener('resize', queueFitServings);
document.addEventListener('toggle', (e) => { if (e.target.matches?.('.item-group')) queueFitServings(); }, true);
document.addEventListener('click', (e) => { if (e.target.closest('.item-group > summary')) setTimeout(fitServings, 0); });

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ---------- Supplies and savings math ----------

// Suggested supplies for a category, across the current tier and the ones below it.
function suppliesFor(cat) {
  return includedTiers().flatMap((t) => t.supplies.filter((s) => s.cat === cat));
}

// True if the inventory already has an item with this name in this category.
// Commas are ignored and "&" counts as "and", so "Rice, pasta and oats" (an
// older suggestion name) still matches "Rice, pasta, and oats".
function inInventory(name, cat) {
  const key = (s) => spellOutAnd(s).replace(/,/g, '').trim().toLowerCase();
  const n = key(name);
  return state.items.some((i) => i.category === cat && key(i.name) === n);
}

function tierWeeks(tier) {
  const days = tier.days ?? state.savings.beyondYears * 365;
  return days / 7;
}

// The emergency cash goal is the weekly baseline times the tier's length.
function cashGoal(tier) {
  return Math.round(tierWeeks(tier) * (Number(state.savings.weekly) || 0));
}

// The investment goal is a rough guide based on Fidelity's savings-by-age
// guideline (fidelity.com/viewpoints/retirement/how-much-do-i-need): at least
// 1x your yearly income by 30, 3x by 40, 6x by 50, 8x by 60, and 10x by 67.
// The app aims a little lower, at 80% of those milestones (8x by 67). That
// matches the 8x Fidelity gives for a smaller lifestyle in retirement (35% of
// income replaced instead of 45%) or for retiring at 70 instead of 67.
// You pick an age range and an income bracket rather than exact numbers.
// Each age range uses the middle of the range, read off a straight line
// between the milestones. Each income bracket uses its midpoint, or its edge
// for the open-ended ones. Index 0 means not chosen.
const AGE_RANGES = [
  null,
  { label: 'Under 30', multiple: 0.8 },
  { label: '30 to 39', multiple: 1.6 },
  { label: '40 to 49', multiple: 3.6 },
  { label: '50 to 59', multiple: 5.6 },
  { label: '60 to 66', multiple: 7.2 },
  { label: '67 or older', multiple: 8 },
];
const INCOME_BRACKETS = [
  null,
  { label: 'Under $25,000', income: 20000 },
  { label: '$25,000 to $50,000', income: 37500 },
  { label: '$50,000 to $75,000', income: 62500 },
  { label: '$75,000 to $100,000', income: 87500 },
  { label: '$100,000 to $150,000', income: 125000 },
  { label: '$150,000 to $200,000', income: 175000 },
  { label: 'Over $200,000', income: 200000 },
];

// <option>s for an age or income picker, with `selected` (an index) chosen.
function rangeOptions(list, selected) {
  return list.map((o, i) => `<option value="${i}"${i === Number(selected) ? ' selected' : ''}>${o ? escapeHtml(o.label) : 'Choose a range'}</option>`).join('');
}

const ageRange = () => AGE_RANGES[Number(state.savings.ageRange) || 0] || null;
const incomeBracket = () => INCOME_BRACKETS[Number(state.savings.incomeBracket) || 0] || null;

// 0 until both are chosen. Rounded to the nearest $1,000, since it's an estimate.
function investGoal() {
  const age = ageRange();
  const bracket = incomeBracket();
  if (!age || !bracket) return 0;
  return Math.round((age.multiple * bracket.income) / 1000) * 1000;
}

function savingsGoal(tier) {
  return cashGoal(tier) + investGoal();
}

function totalSaved() {
  return (Number(state.savings.current) || 0) + (Number(state.savings.invested) || 0);
}

function alertsFor(cat) {
  const items = state.items.filter((i) => i.category === cat);
  return {
    expired: items.filter((i) => statusOf(i) === 'expired').length,
    soon: items.filter((i) => statusOf(i) === 'soon').length,
  };
}
