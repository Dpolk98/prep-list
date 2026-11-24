// ---------- Rendering: settings ----------

// One button per tier, used on the Settings page and the first-use picker.
function tierOptions(selectedId = state.tier) {
  return TIERS.map((t) => {
    const goal = t.days === null
      ? `${money.format(savingsGoal(t))} for ${state.savings.beyondYears} yrs`
      : money.format(savingsGoal(t));
    const selected = t.id === selectedId;
    return `
      <button value="${t.id}" data-tier="${t.id}" class="tier-option ${selected ? 'selected' : ''}" aria-pressed="${selected}">
        <strong>${t.name}</strong>
        <span class="tier-title">${t.title}</span>
        <span class="tier-goal">Savings goal ${goal}</span>
      </button>`;
  }).join('');
}

// One checkbox per hazard, used on the Settings page and in onboarding.
function hazardOptions(chosen = state.hazards) {
  return HAZARDS.map((h) => `
    <label class="hazard-option">
      <input type="checkbox" value="${h.id}" ${chosen.includes(h.id) ? 'checked' : ''}>
      ${icon(h.icon)}<span>${escapeHtml(h.name)}</span>
    </label>`).join('');
}

// ---------- Themes ----------
// How the app looks, kept per device (in this browser only, not in backups).
// The page's <head> applies the saved theme before anything is drawn, so
// there's no flash of the default look. `status` colours the phone's status
// bar in light and dark mode.
const THEME_KEY = 'prep-tracker:theme';
const THEMES = [
  { id: 'default', name: 'Default', note: 'Calm greens on a warm, plain background.', status: ['#f6f5f1', '#141715'] },
  { id: 'aero', name: 'Aero glass', note: 'Glossy, see-through panels over a bright sky, like desktops of the late 2000s.', status: ['#bfe3fa', '#0b2233'] },
  { id: 'contrast', name: 'High contrast', note: 'Black and white, bigger text, and heavy outlines. Easiest to read in bright sun.', status: ['#ffffff', '#000000'] },
  { id: 'night', name: 'Night red', note: 'Dim red on black, which is gentler on your night vision in the dark.', status: ['#000000', '#000000'] },
  { id: 'field', name: 'Field manual', note: 'Bold, plain type on grid paper, like a field notebook.', status: ['#4b5320', '#363c1a'] },
  { id: 'terminal', name: 'Terminal', note: 'Glowing green type on a black screen, like an old computer.', status: ['#020a04', '#020a04'] },
  { id: 'paper', name: 'Paper', note: 'Handwritten headings on lined notebook paper.', status: ['#f3eee2', '#1b1a1f'] },
  { id: 'pastel', name: 'Pastel', note: 'Soft colors and rounded shapes.', status: ['#f6f1fa', '#1f1b30'] },
];

function currentTheme() {
  let id = null;
  try { id = localStorage.getItem(THEME_KEY); } catch { /* no storage */ }
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

function setTheme(id) {
  try {
    if (id === THEMES[0].id) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, id);
  } catch { /* stays for this visit only */ }
  if (id === THEMES[0].id) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = id;
  render();
}

function themeOptions() {
  const chosen = currentTheme().id;
  return THEMES.map((t) => `
    <button type="button" class="theme-option ${t.id === chosen ? 'selected' : ''}" data-theme-id="${t.id}" aria-pressed="${t.id === chosen}">
      <span class="theme-swatch theme-swatch-${t.id}" aria-hidden="true"><span></span><span></span><span></span></span>
      <strong>${escapeHtml(t.name)}</strong>
      <span class="theme-note">${escapeHtml(t.note)}</span>
    </button>`).join('');
}

$('settings-themes').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-theme-id]');
  if (!btn || btn.dataset.themeId === currentTheme().id) return;
  setTheme(btn.dataset.themeId);
  $('settings-themes').querySelector(`[data-theme-id="${btn.dataset.themeId}"]`)?.focus();
});

// ---------- Settings list and pages ----------

function settingsMenu() {
  const groups = [...new Set(SETTINGS_PAGES.map((p) => p.group))];
  return groups.map((g) => `
    <ul class="card settings-list">
      ${SETTINGS_PAGES.filter((p) => p.group === g).map((p) => `
        <li><a href="#/${p.slug}">${icon(p.icon)}<span>${escapeHtml(p.name)}</span>${icon('chevronRight')}</a></li>`).join('')}
    </ul>`).join('');
}

// The list of titles on Settings itself, or one setting's page.
function renderSettings(page) {
  const section = page.parent === 'settings' ? page.section : null;
  $('settings-menu').hidden = Boolean(section);
  if (!section) $('settings-menu').innerHTML = settingsMenu();
  $('view-settings').querySelectorAll('[data-settings]').forEach((el) => { el.hidden = el.dataset.settings !== section; });

  if (section === 'household' && document.activeElement !== $('people')) $('people').value = state.people;
  if (section === 'tier') $('settings-tiers').innerHTML = tierOptions();
  if (section === 'hazards') $('settings-hazards').innerHTML = hazardOptions();
  if (section === 'theme') $('settings-themes').innerHTML = themeOptions();
  if (section === 'savings') renderSavingsSettings();

  if (section === 'backup') {
    const info = backupInfo();
    $('backup-last').textContent = info.last
      ? `Last backup exported from this device: ${formatLongDate(info.last)} (${daysAgo(info.last)}).${info.changedSince ? ` You’ve made ${changesSinceText(info)} since then.` : ''}`
      : 'No backup exported from this device yet.';
  }
}

$('settings-tiers').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tier]');
  if (!btn || btn.dataset.tier === state.tier) return;
  state.tier = btn.dataset.tier;
  saveState();
  render();
  $('settings-tiers').querySelector(`[data-tier="${state.tier}"]`)?.focus();
});

// The age and income pickers on the Savings goal settings page, and the goal they give.
function renderSavingsSettings() {
  $('settings-age').innerHTML = rangeOptions(AGE_RANGES, state.savings.ageRange);
  $('settings-income').innerHTML = rangeOptions(INCOME_BRACKETS, state.savings.incomeBracket);
  renderInvestLevel();
  const age = ageRange();
  const bracket = incomeBracket();
  $('settings-invest-goal').textContent = age && bracket
    ? `Your investment goal: ${money.format(investGoal())} (about ${age.multiple}× a yearly income of ${money.format(bracket.income)}${investLevel() === INVEST_LEVEL.suggested ? '' : `, at ${investLevel()}%`}).`
    : 'Choose both to see your investment goal.';
}

// The goal level slider: its value, the % beside it, and the reset button.
function renderInvestLevel() {
  const level = investLevel();
  if (document.activeElement !== $('settings-level')) $('settings-level').value = level;
  $('settings-level-value').textContent = `${level}%`;
  $('settings-level-reset').hidden = level === INVEST_LEVEL.suggested;
}

$('settings-level').addEventListener('input', (e) => {
  state.savings.investLevel = Number(e.target.value) || INVEST_LEVEL.suggested;
  saveState();
  animateSize($('settings-level-reset'), renderSavingsSettings);
});

$('settings-level-reset').addEventListener('click', () => {
  state.savings.investLevel = INVEST_LEVEL.suggested;
  saveState();
  animateSize($('settings-level-reset'), renderSavingsSettings);
  $('settings-level').focus();
});

for (const [id, key] of [['settings-age', 'ageRange'], ['settings-income', 'incomeBracket']]) {
  $(id).addEventListener('change', (e) => {
    state.savings[key] = Number(e.target.value) || 0;
    saveState();
    renderSavingsSettings();
  });
}

// ---------- Tier picker ----------

// ---------- First-use setup ----------
// Four short questions, answered once: how long you're preparing for, how
// many people, your Local Hazards, and age and income ranges for the
// investment goal. Nothing is saved until Finish, so if
// the app is closed partway through, setup simply starts again next time.

let setup = null; // { step, tier, people, hazards, ageRange, incomeBracket } while setup is open
const SETUP_STEPS = [
  {
    title: 'How long are you preparing for?',
    hint: 'Each tier builds on the ones before it. You can change this any time in Settings.',
  },
  {
    title: 'How many people are you preparing for?',
    hint: 'Count everyone in your household, including yourself. It sets how much water and food you’ll need.',
  },
  {
    title: 'Local Hazards',
    hint: 'Choose any that apply where you live. Each one adds a few suggestions to the What to buy lists. It’s fine to leave these blank, and you can change them any time in Settings.',
  },
  {
    title: 'Your savings goal',
    hint: 'Your age and income ranges suggest a goal for your investments. Your answers stay on this device and are never shared. You can skip this, and change it any time in Settings.',
  },
];

// `again` is a run from Settings: it starts from the current answers and
// can be cancelled, which leaves everything as it was.
function openSetup() {
  setup = {
    step: 1, tier: state.tier, people: state.people || 2, hazards: [...state.hazards], again: Boolean(state.tier),
    ageRange: Number(state.savings.ageRange) || 0, incomeBracket: Number(state.savings.incomeBracket) || 0,
  };
  renderSetup();
  $('setup-dialog').showModal();
  focusSetup();
}

const clampPeople = (n) => Math.min(99, Math.max(1, Math.round(Number(n) || 1)));

function renderSetup() {
  const { step } = setup;
  const info = SETUP_STEPS[step - 1];
  $('setup-step').textContent = `Step ${step} of ${SETUP_STEPS.length}`;
  [...$('setup-progress').children].forEach((bar, i) => {
    bar.classList.toggle('done', i < step - 1);
    bar.classList.toggle('current', i === step - 1);
  });
  $('setup-title').textContent = info.title;
  $('setup-hint').textContent = info.hint;
  $('setup-tier').hidden = step !== 1;
  $('setup-people').hidden = step !== 2;
  $('setup-hazards').hidden = step !== 3;
  $('setup-savings').hidden = step !== 4;
  if (step === 1) $('setup-tier').innerHTML = tierOptions(setup.tier);
  if (step === 2) renderPeople();
  if (step === 3) $('setup-hazards').innerHTML = hazardOptions(setup.hazards);
  if (step === 4) {
    $('setup-age').innerHTML = rangeOptions(AGE_RANGES, setup.ageRange);
    $('setup-income').innerHTML = rangeOptions(INCOME_BRACKETS, setup.incomeBracket);
  }
  $('setup-back').hidden = step === 1 && !setup.again;
  $('setup-back').textContent = step === 1 ? 'Cancel' : 'Back';
  // Choosing a tier moves straight on; Continue is there when coming back.
  $('setup-next').hidden = step === 1 && !setup.tier;
  $('setup-next').textContent = step === SETUP_STEPS.length ? 'Finish' : 'Continue';
}

function renderPeople() {
  $('setup-people-count').value = setup.people;
  $('setup-people-word').textContent = setup.people === 1 ? 'person' : 'people';
  $('people-minus').disabled = setup.people <= 1;
}

// Focus lands on what's useful for each step, without bringing up a
// phone's keyboard: the chosen (or first) tier, then the + button, then the
// first hazard.
function focusSetup() {
  const target = setup.step === 1 ? ($('setup-tier').querySelector('.selected') || $('setup-tier').querySelector('button'))
    : setup.step === 2 ? $('people-plus')
    : setup.step === 3 ? $('setup-hazards').querySelector('input')
    : $('setup-age');
  target?.focus();
}

// What's been entered on the current step.
function readSetupStep() {
  if (setup.step === 2) setup.people = clampPeople($('setup-people-count').value);
  if (setup.step === 3) {
    const checked = [...$('setup-hazards').querySelectorAll('input:checked')].map((el) => el.value);
    setup.hazards = HAZARDS.map((h) => h.id).filter((id) => checked.includes(id));
  }
  if (setup.step === 4) {
    setup.ageRange = Number($('setup-age').value) || 0;
    setup.incomeBracket = Number($('setup-income').value) || 0;
  }
}

function goToSetupStep(step) {
  readSetupStep();
  setup.step = step;
  animateSize($('setup-dialog'), renderSetup);
  focusSetup();
}

function finishSetup() {
  readSetupStep();
  state.tier = setup.tier || TIERS[0].id;
  state.people = setup.people;
  state.hazards = setup.hazards;
  state.savings.ageRange = setup.ageRange;
  state.savings.incomeBracket = setup.incomeBracket;
  setup = null;
  saveState();
  $('setup-dialog').close();
  render();
}

$('setup-tier').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tier]');
  if (!btn) return;
  setup.tier = btn.dataset.tier;
  goToSetupStep(2);
});
$('setup-next').addEventListener('click', () => {
  if (setup.step < SETUP_STEPS.length) goToSetupStep(setup.step + 1);
  else finishSetup();
});
$('setup-back').addEventListener('click', () => {
  if (setup.step > 1) goToSetupStep(setup.step - 1);
  else cancelSetup();
});

function cancelSetup() {
  setup = null;
  $('setup-dialog').close();
  $('setup-again').focus();
}

$('setup-again').addEventListener('click', openSetup);
$('people-minus').addEventListener('click', () => { setup.people = clampPeople(setup.people - 1); renderPeople(); });
$('people-plus').addEventListener('click', () => { setup.people = clampPeople(setup.people + 1); renderPeople(); });
$('setup-people-count').addEventListener('change', () => { setup.people = clampPeople($('setup-people-count').value); renderPeople(); });
$('setup-people-count').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); goToSetupStep(3); }
});
// First-use setup needs its answers, so Escape doesn't close it; a run
// from Settings can be cancelled with Escape.
$('setup-dialog').addEventListener('cancel', (e) => {
  e.preventDefault();
  if (setup?.again) cancelSetup();
});
