// ---------- Low-battery mode ----------
// One plain screen on true black (which an OLED phone screen doesn't light at
// all), with no animations, showing only the essentials: water and food,
// what to use first, where things are, the quick reference, and tips for
// making the battery last. It stays on, even if the app is closed and opened
// again, until it's turned off. Your data isn't changed.

const LOW_POWER_KEY = 'prep-tracker:low-power';

function lowPowerOn() {
  try { return localStorage.getItem(LOW_POWER_KEY) === '1'; } catch { return false; }
}

function setLowPower(on) {
  try {
    if (on) localStorage.setItem(LOW_POWER_KEY, '1');
    else localStorage.removeItem(LOW_POWER_KEY);
  } catch { /* stays as it is */ }
  closeDrawer({ restoreFocus: false });
  document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  lowPowerOpen.clear();
  window.scrollTo(0, 0);
  render();
  (on ? $('low-power-off') : $('menu-btn')).focus();
}

// The phone's status bar matches the black screen while it's on.
// Otherwise it matches the chosen theme, in light or dark mode.
const THEME_COLORS = [...document.querySelectorAll('meta[name="theme-color"]')];
function setThemeColor(low) {
  const [light, dark] = currentTheme().status;
  THEME_COLORS.forEach((m) => { m.content = low ? '#000000' : m.media.includes('dark') ? dark : light; });
  document.documentElement.style.colorScheme = low ? 'dark' : '';
}

// Which sections are open, kept while the screen is redrawn.
const lowPowerOpen = new Set();

const lpItem = (i) => {
  const s = statusOf(i);
  // The actual date, so there's no guessing what "soon" means.
  const [y, m, d] = (i.expires || '').split('-').map(Number);
  const date = i.expires ? new Date(y, m - 1, d).toLocaleDateString('en-US',
    y === new Date().getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const flag = s === 'ok' ? '' : ` <span class="lp-flag ${s}">${s === 'expired' ? 'Expired' : 'Expires'} ${date}</span>`;
  return `<li><span>${escapeHtml(i.name)}${flag}</span><span class="lp-qty">${escapeHtml(`${i.quantity} ${i.unit || ''}`.trim())}</span></li>`;
};

function lpSection(id, title, body, { open = false } = {}) {
  const isOpen = lowPowerOpen.has(id) || (open && !lowPowerOpen.has(`closed:${id}`));
  return `<details class="lp-section" data-id="${id}" ${isOpen ? 'open' : ''}><summary>${title}</summary><div class="lp-body">${body}</div></details>`;
}

function renderLowPower() {
  const tier = currentTier();
  const people = householdNow();
  const water = waterDays();
  const food = foodCalories();
  const expired = state.items.filter((i) => statusOf(i) === 'expired').length;
  const soon = state.items.filter((i) => statusOf(i) === 'soon');
  const useFirst = state.items.filter((i) => statusOf(i) !== 'ok').sort(byExpiry);

  const glance = [
    ['Water', water > 0 ? `About ${formatDays(water)} days for ${people}` : 'None counted yet'],
    ['Food', food.calories > 0 ? `About ${formatDays(food.days)} days, roughly` : 'None counted yet'],
    ['Expiring soon', String(soon.length)],
    ['Expired', String(expired)],
  ];

  const sections = [];
  if (FEATURES.grabList && visibleGrab('five').length) {
    sections.push(lpSection('grab', 'If You Need to Leave', `<ol class="lp-grab">${visibleGrab('five').map((e) => {
      const where = grabWhere(e);
      return `<li>${escapeHtml(grabName(e))}${where ? ` <span class="lp-qty">· ${escapeHtml(where)}</span>` : ''}</li>`;
    }).join('')}</ol>`));
  }
  if (useFirst.length) {
    sections.push(lpSection('use-first', `Use First <span class="lp-count">${useFirst.length}</span>`, `<ul class="lp-list">${useFirst.map(lpItem).join('')}</ul>`, { open: true }));
  }
  const groups = printGroups('location');
  sections.push(lpSection('where', 'Where Things Are', groups.length
    ? groups.map((g) => `<h3>${escapeHtml(g.label)}</h3><ul class="lp-list">${g.items.map(lpItem).join('')}</ul>`).join('')
    : '<p>Nothing in your inventory yet.</p>'));
  sections.push(...REFERENCE.map((card) => lpSection(`ref-${card.id}`, card.title, referenceBody(card))));
  sections.push(lpSection('battery', 'Making the Battery Last', `<ul class="ref-points">
    <li>Turn on Low Power Mode (on iPhone, in Settings, then Battery) or Battery Saver on Android.</li>
    <li>Turn the screen brightness down, and lock the phone when you aren’t using it.</li>
    <li>When you don’t need a signal, turn on Airplane Mode. Searching for a weak signal drains the battery quickly.</li>
    <li>Turn off Bluetooth, Wi-Fi, and location when you aren’t using them, and close apps you don’t need.</li>
    <li>Keep the phone warm in cold weather, like in an inside pocket. Cold makes a battery run down faster.</li>
    <li>Charge from a power bank, or from a car only while it’s running outdoors, never in a closed garage.</li>
  </ul>`, { open: true }));

  $('low-power-content').innerHTML = `
    <section class="lp-glance">
      <p class="lp-plan">${escapeHtml(tier.name)} plan · ${householdNow()}</p>
      <dl>${glance.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    </section>
    ${sections.join('')}
    <p class="lp-foot">Nothing in your inventory has changed. Leave low-battery mode any time to see everything again.</p>`;
}

$('low-power-content').addEventListener('toggle', (e) => {
  const id = e.target.dataset?.id;
  if (!id) return;
  lowPowerOpen.delete(id);
  lowPowerOpen.delete(`closed:${id}`);
  lowPowerOpen.add(e.target.open ? id : `closed:${id}`);
}, true);

$('low-power-on').addEventListener('click', () => setLowPower(true));
$('low-power-settings').addEventListener('click', () => setLowPower(true));
$('low-power-off').addEventListener('click', () => setLowPower(false));
$('low-power-on').insertAdjacentHTML('afterbegin', icon('battery'));

// On phones and browsers that report the battery (not iPhone), the Overview
// suggests low-battery mode once it's at 20% or below and not charging.
let battery = null;
let batteryDismissed = false;
function renderBatteryCard() {
  const show = Boolean(battery) && !battery.charging && battery.level <= 0.2 && !batteryDismissed;
  $('battery-card').hidden = !show;
  if (show) {
    $('battery-text').textContent = `Your battery is at ${Math.round(battery.level * 100)}%. Low-battery mode shows just the essentials on a black screen, which uses less power.`;
  }
}
navigator.getBattery?.().then((b) => {
  battery = b;
  const update = () => { if (!lowPowerOn() && currentPage() === PAGES[0]) renderBatteryCard(); };
  b.addEventListener('levelchange', update);
  b.addEventListener('chargingchange', update);
  update();
}).catch(() => {});
$('battery-switch').addEventListener('click', () => setLowPower(true));
$('battery-later').addEventListener('click', () => {
  batteryDismissed = true;
  renderBatteryCard();
});
