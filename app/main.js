// ---------- Number fields: select on focus ----------
// Tapping into a number field highlights what's already there (including a
// 0), so typing replaces it instead of the user having to delete it first.

let selectOnRelease = null;

document.addEventListener('focusin', (e) => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement) || el.type !== 'number') return;
  el.select();
  // Phones can move the caret once the tap finishes, so select again after it.
  setTimeout(() => { if (document.activeElement === el) el.select(); }, 0);
});

// A click that focuses the field would otherwise drop the selection on release.
document.addEventListener('pointerdown', (e) => {
  const el = e.target;
  const isNumber = el instanceof HTMLInputElement && el.type === 'number';
  selectOnRelease = isNumber && document.activeElement !== el ? el : null;
});

document.addEventListener('mouseup', (e) => {
  if (selectOnRelease && e.target === selectOnRelease) {
    e.preventDefault();
    selectOnRelease.select();
  }
  selectOnRelease = null;
});

// ---------- Offline ----------
// sw.js saves the app's files on the device so it opens with no connection.
// Service workers need http or https, so opening index.html as a file skips
// this, and the app works as before.

function registerOffline() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // Shown once a saved copy is active, even if re-registering fails while offline.
  navigator.serviceWorker.ready.then(() => { $('offline-status').hidden = false; });
  startUpdateChecks();
}

// ---------- Init ----------

registerOffline();

// Keep this month's progress snapshot current. Written straight to storage,
// so it doesn't count as a change for the backup reminder.
if (hadSavedData) {
  recordSnapshot();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* not essential */ }
}

recordFirstOpened();
resetForm();
render();
if (!hadSavedData) openWelcome();
else askForTierIfNeeded();
inviteTipIfDue();
