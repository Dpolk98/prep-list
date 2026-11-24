// ---------- Rendering: savings ----------

// Fills in one card on the Savings page: the amount, goal, bar, and math line.
function renderFund(prefix, current, goal, math, noGoalText) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  $(`${prefix}-current-display`).textContent = money.format(current);
  $(`${prefix}-goal`).textContent = money.format(goal);
  $(`${prefix}-bar`).style.width = `${pct}%`;
  $(`${prefix}-bar`).classList.toggle('complete', goal > 0 && current >= goal);
  const remaining = Math.max(0, goal - current);
  if (!goal && noGoalText) { $(`${prefix}-math`).textContent = noGoalText; return; }
  $(`${prefix}-math`).textContent =
    `${math} ` + (remaining > 0 ? `${money.format(remaining)} to go.` : 'Goal reached.');
}

function renderSavings() {
  const tier = currentTier();
  const cash = Number(state.savings.current) || 0;
  const invested = Number(state.savings.invested) || 0;

  $('savings-note').textContent = tier.savingsNote;

  const weeks = tierWeeks(tier);
  const weeksText = weeks === 1 ? '1 week' : `${weeks.toFixed(1).replace(/\.0$/, '')} weeks`;
  const span = tier.days === null
    ? `${state.savings.beyondYears} year${state.savings.beyondYears === 1 ? '' : 's'} (${weeksText})`
    : weeksText;
  renderFund('savings', cash, cashGoal(tier),
    `${tier.name} tier: ${span} × ${money.format(CASH_PER_WEEK)}/week.`);
  const age = ageRange();
  const bracket = incomeBracket();
  renderFund('invest', invested, investGoal(),
    age && bracket ? `Age ${age.label.toLowerCase()}: about ${age.multiple}× a yearly income of ${money.format(bracket.income)}${investLevel() === INVEST_LEVEL.suggested ? '' : `, at your ${investLevel()}% goal level`}.` : '',
    'No goal yet. Choose your age and income ranges in Settings.');

  // Don't overwrite a field while the user is typing in it.
  const fields = {
    'savings-current': cash, 'invest-current': invested,
    'beyond-years': state.savings.beyondYears,
  };
  for (const [id, val] of Object.entries(fields)) {
    if (document.activeElement !== $(id)) $(id).value = val;
  }
  $('beyond-years-wrap').hidden = tier.days !== null;
}

// ---------- Savings inputs ----------

$('savings-current').addEventListener('input', (e) => {
  state.savings.current = Math.max(0, Number(e.target.value) || 0);
  saveState();
  renderSavings();
});

$('invest-current').addEventListener('input', (e) => {
  state.savings.invested = Math.max(0, Number(e.target.value) || 0);
  saveState();
  renderSavings();
});

$('beyond-years').addEventListener('input', (e) => {
  const years = Math.round(Number(e.target.value));
  if (years >= 1) {
    state.savings.beyondYears = Math.min(50, years);
    saveState();
    renderSavings();
  }
});

