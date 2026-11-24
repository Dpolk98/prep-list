// ---------- Tip invite ----------
// One month after Prep Tracker was first opened on this device, a small popup
// invites the user to leave a tip on Ko-fi. It appears at most once: tapping
// "Leave a tip", "No thanks", or closing it any other way means it never
// shows again. A Ko-fi link stays in Settings either way. The app can't tell whether a tip was actually sent, so opening
// the link counts as tipping.
//
// Kept apart from the inventory (and out of backups), like the backup
// reminder: { firstOpened: 'YYYY-MM-DD', done: null | 'tipped' | 'declined' }.

// Also linked from Settings, under Support the app.
const KOFI_URL = 'https://ko-fi.com/DanielPolk';

const TIP_KEY = 'prep-tracker:tip';
const TIP_AFTER_MONTHS = 1;

function tipInfo() {
  try {
    const info = JSON.parse(localStorage.getItem(TIP_KEY));
    if (info && typeof info === 'object') return info;
  } catch { /* fall through */ }
  return { firstOpened: null, done: null };
}

function saveTipInfo(info) {
  try { localStorage.setItem(TIP_KEY, JSON.stringify(info)); } catch { /* not essential */ }
}

// Remembers the first time the app was opened here. People who were already
// using it before this was added count from the day they started.
function recordFirstOpened() {
  const info = tipInfo();
  if (/^\d{4}-\d{2}-\d{2}$/.test(info.firstOpened)) return;
  const started = hadSavedData && /^\d{4}-\d{2}-\d{2}$/.test(state.startedOn) ? state.startedOn : null;
  saveTipInfo({ ...info, firstOpened: started || toIsoDate(new Date()) });
}

function tipIsDue(info, today = new Date()) {
  if (info.done || !info.firstOpened) return false;
  const [y, m, d] = info.firstOpened.split('-').map(Number);
  const due = addToDate(new Date(y, m - 1, d), { months: TIP_AFTER_MONTHS });
  return toIsoDate(today) >= toIsoDate(due);
}

// Waits for a quiet moment: not over another popup, not before setup is
// finished, and only when online, since the tip page needs a connection.
function inviteTipIfDue() {
  if (!navigator.onLine || !state.tier) return;
  if (document.querySelector('dialog[open]')) return;
  if (!tipIsDue(tipInfo())) return;
  $('tip-link').href = KOFI_URL;
  $('tip-dialog').showModal();
}

function finishTip(done) {
  saveTipInfo({ ...tipInfo(), done });
  if ($('tip-dialog').open) $('tip-dialog').close();
}

// The link opens Ko-fi in a new tab on its own; this only records it.
$('tip-link').addEventListener('click', () => finishTip('tipped'));
// Tipping from Settings first counts too, so the popup never asks.
for (const id of ['settings-tip-link', 'kofi-link']) {
  $(id).href = KOFI_URL;
  $(id).addEventListener('click', () => {
    if (!tipInfo().done) saveTipInfo({ ...tipInfo(), done: 'tipped' });
  });
}
$('tip-later').addEventListener('click', () => finishTip('declined'));
// Escape, or the browser closing it, counts as "No thanks".
$('tip-dialog').addEventListener('close', () => {
  if (!tipInfo().done) saveTipInfo({ ...tipInfo(), done: 'declined' });
});
