// ---------- Update check ----------
// Each time the app is opened, and each time it comes back to the screen,
// the service worker (sw.js) compares the app's saved files with the site's.
// This matters most for a copy added to the home screen: phones usually
// resume it where it was left instead of loading it again, so it could keep
// running an old version for a long time.
//
// When something changed, the new files are already saved on the device, and
// a bar in the lower part of the screen offers "Update now", which reloads
// the app. Nothing is
// reloaded without asking, so nothing being typed is lost, and the saved data
// in localStorage is never touched. "Later" hides the bar; the new version
// then starts the next time the app is opened fresh, and Settings → About
// keeps an "Update now" button until then.
//
// Needs a service worker, so it does nothing when index.html is opened as a
// file: that copy is the file itself and has no site to compare against.

const UPDATE_RECHECK_MS = 30 * 1000;

let updateReady = false;
let updateChecking = null;
let updateLastCheck = 0;

function showUpdateStatus(text) {
  $('update-status').textContent = text;
}

function showUpdateReady({ bar = true } = {}) {
  updateReady = true;
  $('update-apply-settings').hidden = false;
  showUpdateStatus('A new version is ready.');
  if (bar && $('update-bar').hidden) showWithMotion($('update-bar'));
}

// Asks the active service worker to compare files. Resolves with
// { changed, offline }, or null when there's no service worker to ask.
function askServiceWorkerToCheck() {
  const worker = navigator.serviceWorker && navigator.serviceWorker.controller;
  if (!worker) return Promise.resolve(null);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve({ changed: false, offline: true }), 60 * 1000);
    channel.port1.onmessage = (e) => { clearTimeout(timer); resolve(e.data); };
    worker.postMessage({ type: 'check-update' }, [channel.port2]);
  });
}

// fromUser: tapped "Check for updates", so it always runs and shows the result.
async function checkForUpdate({ fromUser = false } = {}) {
  if (updateReady) {
    if (fromUser && $('update-bar').hidden) showWithMotion($('update-bar'));
    return;
  }
  if (updateChecking) return updateChecking;
  if (!fromUser && Date.now() - updateLastCheck < UPDATE_RECHECK_MS) return;
  if (!fromUser && navigator.onLine === false) return;

  updateLastCheck = Date.now();
  if (fromUser) showUpdateStatus('Checking…');
  updateChecking = (async () => {
    const result = await askServiceWorkerToCheck();
    if (result && result.changed) {
      showUpdateReady({ bar: true });
    } else if (fromUser) {
      showUpdateStatus(!result || result.offline
        ? 'Couldn’t reach the site. Try again when you have a connection.'
        : 'You have the latest version.');
    }
    // Also lets the browser fetch a changed sw.js. A new one saves every file
    // again as it installs, which is why the files are compared first.
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) await registration.update();
    } catch { /* offline; the next open tries again */ }
  })().finally(() => { updateChecking = null; });
  return updateChecking;
}

// ---------- Updating ----------
// "Update now" opens a pop-up with a spinner, then reloads the app. A reload
// wipes the page, so a note in localStorage tells the new copy to carry on:
// it reopens the pop-up straight away (no animation, so it looks like the
// same one), keeps the spinner going until about a second has passed in
// all, then shows "Update complete" with a Close button.

const UPDATE_DONE_KEY = 'prep-tracker:update-started';
const UPDATE_SPIN_MS = 1000; // how long the spinner shows in all
const UPDATE_RELOAD_DELAY_MS = 350; // lets the pop-up finish appearing first
const UPDATE_NOTE_MAX_AGE_MS = 60 * 1000;

let updateApplying = false;

function setUpdateDialogDone(done) {
  $('update-progress').hidden = done;
  $('update-done').hidden = !done;
  $('update-dialog').setAttribute('aria-labelledby', done ? 'update-done-title' : 'update-dialog-title');
}

function applyUpdate() {
  if (updateApplying) return;
  updateApplying = true;
  const bar = $('update-bar');
  if (!bar.hidden) hideWithMotion(bar);
  setUpdateDialogDone(false);
  try {
    localStorage.setItem(UPDATE_DONE_KEY, String(Date.now()));
  } catch { /* storage blocked: it still updates, just without "Update complete" */ }
  for (const d of document.querySelectorAll('dialog[open]')) d.close();
  $('update-dialog').showModal();
  setTimeout(() => location.reload(), UPDATE_RELOAD_DELAY_MS);
}

// Called once on start-up (app/main.js). True when the pop-up was reopened.
function finishUpdateIfPending() {
  let started = 0;
  try {
    started = Number(localStorage.getItem(UPDATE_DONE_KEY)) || 0;
    localStorage.removeItem(UPDATE_DONE_KEY);
  } catch { return false; }
  const age = Date.now() - started;
  if (!started || age < 0 || age > UPDATE_NOTE_MAX_AGE_MS) return false;

  const dialog = $('update-dialog');
  setUpdateDialogDone(false);
  nativeShowModal.call(dialog); // no pop: it's meant to look like it never left
  setTimeout(() => {
    animateSize($('update-dialog-body'), () => setUpdateDialogDone(true));
    showWithMotion($('update-done'), 'fade');
  }, Math.max(0, UPDATE_SPIN_MS - age));
  return true;
}

// The spinner can't be dismissed; "Update complete" closes like any pop-up.
$('update-dialog').addEventListener('cancel', (e) => {
  if ($('update-done').hidden) e.preventDefault();
});
$('update-done-close').addEventListener('click', () => $('update-dialog').close());

function startUpdateChecks() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.ready.then(() => {
    $('update-check').hidden = false;
    // On opening: catches a version the page missed because the connection
    // was too slow and the saved copy was used instead.
    checkForUpdate();
  });
  // Brought back to the screen: a resumed home-screen app, or a tab.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
  // Restored from the browser's back/forward cache.
  window.addEventListener('pageshow', (e) => { if (e.persisted) checkForUpdate(); });
  window.addEventListener('online', () => checkForUpdate());
}

$('update-apply').addEventListener('click', applyUpdate);
$('update-apply-settings').addEventListener('click', applyUpdate);
$('update-later').addEventListener('click', () => hideWithMotion($('update-bar')));
$('update-check-btn').addEventListener('click', () => checkForUpdate({ fromUser: true }));
