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

function renderSettings() {
  if (document.activeElement !== $('people')) $('people').value = state.people;
  $('settings-tiers').innerHTML = tierOptions();
  $('settings-hazards').innerHTML = hazardOptions();

  const info = backupInfo();
  $('backup-last').textContent = info.last
    ? `Last backup exported from this device: ${formatLongDate(info.last)} (${daysAgo(info.last)}).${info.changedSince ? ` You’ve made ${changesSinceText(info)} since then.` : ''}`
    : 'No backup exported from this device yet.';
}

$('settings-tiers').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tier]');
  if (!btn || btn.dataset.tier === state.tier) return;
  state.tier = btn.dataset.tier;
  saveState();
  render();
  $('settings-tiers').querySelector(`[data-tier="${state.tier}"]`)?.focus();
});

// ---------- Tier picker ----------

// ---------- First-use setup ----------
// Three short questions, answered once: how long you're preparing for, how
// many people, and your Local Hazards. Nothing is saved until Finish, so if
// the app is closed partway through, setup simply starts again next time.

let setup = null; // { step, tier, people, hazards } while setup is open
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
];

// `again` is a run from Settings: it starts from the current answers and
// can be cancelled, which leaves everything as it was.
function openSetup() {
  setup = { step: 1, tier: state.tier, people: state.people || 2, hazards: [...state.hazards], again: Boolean(state.tier) };
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
  if (step === 1) $('setup-tier').innerHTML = tierOptions(setup.tier);
  if (step === 2) renderPeople();
  if (step === 3) $('setup-hazards').innerHTML = hazardOptions(setup.hazards);
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
    : $('setup-hazards').querySelector('input');
  target?.focus();
}

// What's been entered on the current step.
function readSetupStep() {
  if (setup.step === 2) setup.people = clampPeople($('setup-people-count').value);
  if (setup.step === 3) {
    const checked = [...$('setup-hazards').querySelectorAll('input:checked')].map((el) => el.value);
    setup.hazards = HAZARDS.map((h) => h.id).filter((id) => checked.includes(id));
  }
}

function goToSetupStep(step) {
  readSetupStep();
  setup.step = step;
  renderSetup();
  focusSetup();
}

function finishSetup() {
  readSetupStep();
  state.tier = setup.tier || TIERS[0].id;
  state.people = setup.people;
  state.hazards = setup.hazards;
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
