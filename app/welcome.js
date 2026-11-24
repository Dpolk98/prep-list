// ---------- Welcome (first visit) ----------

// Setup opens whenever there's no tier yet, except on the welcome guide,
// which ends with its own "Get started" button.
function askForTierIfNeeded() {
  if (state.tier || currentPage() === WELCOME_PAGE) return;
  if ($('welcome-dialog').open || $('setup-dialog').open) return;
  openSetup();
}

function openWelcome() {
  $('welcome-ask').hidden = false;
  $('welcome-back').hidden = true;
  $('welcome-dialog').showModal();
}

// Saving right away means the popup only appears once, even if the page is
// reloaded before a tier is chosen.
function closeWelcome() {
  saveState();
  $('welcome-dialog').close();
}

// The popup needs an answer, so Escape doesn't close it.
$('welcome-dialog').addEventListener('cancel', (e) => e.preventDefault());

$('welcome-new').addEventListener('click', () => {
  closeWelcome();
  location.hash = '#/welcome';
});

$('welcome-returning').addEventListener('click', () => {
  animateSize($('welcome-dialog'), () => {
    $('welcome-ask').hidden = true;
    $('welcome-back').hidden = false;
  });
  $('welcome-fresh').focus();
});

$('welcome-import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !(await importBackup(file))) return;
  closeWelcome();
  askForTierIfNeeded(); // older backups may not have a tier
});

$('welcome-fresh').addEventListener('click', () => {
  closeWelcome();
  askForTierIfNeeded();
});

$('welcome-start').addEventListener('click', () => {
  location.hash = '#/';
  askForTierIfNeeded();
});
