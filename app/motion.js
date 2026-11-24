// ---------- Motion ----------
// Short animations whenever something grows or shrinks: sections opening and
// closing, the add-item form, item menus, the side menu and pop-ups. Each
// theme sets its own speed, easing and pop-up style in styles.css with the
// --motion-* properties, and nothing runs longer than half a second.
// Skipped when the device asks for reduced motion, and in low-power mode.

const MOTION_MAX_MS = 500;
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');

function motionOn() {
  return !reducedMotion?.matches
    && !document.body.classList.contains('low-power')
    && typeof Element.prototype.animate === 'function';
}

// The current theme's timing. `closing` uses the theme's closing easing,
// which is calmer than the opening one on springy themes.
function motionTiming(closing = false) {
  const css = getComputedStyle(document.body);
  const read = (name) => css.getPropertyValue(name).trim();
  const ms = Number.parseFloat(read(closing ? '--motion-ms-close' : '--motion-ms')) || 220;
  return {
    duration: Math.min(MOTION_MAX_MS, ms),
    easing: read(closing ? '--motion-ease-close' : '--motion-ease') || 'ease',
    fade: read('--motion-fade') !== '0',
    pop: read('--motion-pop') || 'rise',
  };
}

// How pop-ups and menus appear, by theme (--motion-pop). Played in reverse
// when they close.
const MOTION_POPS = {
  rise: { opacity: [0, 1], transform: ['translateY(14px) scale(.98)', 'none'] },
  zoom: { opacity: [0, 1], transform: ['scale(.93)', 'none'] },
  spring: { opacity: [0, 1], transform: ['scale(.86)', 'none'] },
  sheet: { opacity: [0, 1], transform: ['translateY(28px)', 'none'] },
  paper: { opacity: [0, 1], transform: ['translateY(12px) rotate(-1.2deg)', 'none'] },
  draw: { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0 0)'] },
  fade: { opacity: [0, 1] },
};

const runningMotion = new WeakMap();

// Stops an element's animation where it is and clears what it set.
function stopMotion(el) {
  const run = runningMotion.get(el);
  if (!run) return;
  runningMotion.delete(el);
  run.anims.forEach((a) => a.cancel());
  run.cleanup();
}

function playMotion(el, anims, cleanup, done) {
  const run = { anims, cleanup };
  runningMotion.set(el, run);
  Promise.all(anims.map((a) => a.finished)).then(() => {
    if (runningMotion.get(el) !== run) return;
    runningMotion.delete(el);
    cleanup();
    done?.();
  }, () => { /* cancelled: stopMotion cleaned up */ });
}

// ---------- Growing and shrinking ----------

// Runs `change`, then animates `el` from the height it had to the height it
// has now, including appearing (hidden removed) and disappearing (hidden
// set). The hidden attribute changes straight away, so code that reads it
// sees the new state; only the picture catches up.
function animateSize(el, change) {
  if (!el) { change(); return; }
  if (!motionOn() || !el.isConnected) { stopMotion(el); change(); return; }
  const before = measureBox(el);
  const wasRunning = runningMotion.has(el);
  stopMotion(el);
  change();
  if (!el.isConnected) return;

  const leaving = before.shown && el.hidden;
  // Keep it on screen while it shrinks away. Inline !important beats the
  // stylesheet's [hidden] rule.
  if (leaving) el.style.setProperty('display', before.display, 'important');
  const after = leaving ? GONE_BOX : measureBox(el);
  if (!before.shown && !after.shown) return;
  if (Math.abs(after.height - before.height) < 1 && !wasRunning) return;

  const t = motionTiming(leaving);
  const frames = { height: [`${before.height}px`, `${after.height}px`] };
  // Appearing or disappearing (or changing its mind halfway): margins and
  // padding fold too, so nothing jumps at the start or the end.
  if (!before.shown || leaving || wasRunning) {
    for (const p of BOX_EDGES) frames[p] = [before[p], after[p]];
    if (t.fade) frames.opacity = [before.opacity, after.opacity];
  }
  el.style.overflow = 'hidden';
  const anim = el.animate(frames, { duration: t.duration, easing: t.easing });
  playMotion(el, [anim], () => {
    el.style.removeProperty('overflow');
    if (leaving) el.style.removeProperty('display');
  });
}

const BOX_EDGES = ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom'];
const GONE_BOX = { shown: false, height: 0, opacity: '0', marginTop: '0px', marginBottom: '0px', paddingTop: '0px', paddingBottom: '0px' };

function measureBox(el) {
  const rect = el.getBoundingClientRect();
  const css = getComputedStyle(el);
  if (css.display === 'none' || (rect.height === 0 && rect.width === 0)) return { ...GONE_BOX, display: css.display };
  const box = { shown: true, height: rect.height, opacity: css.opacity, display: css.display };
  for (const p of BOX_EDGES) box[p] = css[p];
  return box;
}

// ---------- Sections that open and close (<details>) ----------

// True for a section that is open and not on its way closed.
function isDetailsOpen(details) {
  return details.open && !details.classList.contains('is-closing');
}

// Opens or closes a section, animated when motion is on. A closing section
// keeps `open` until it has folded away (styles use .is-closing to show it
// as closed straight away), and the toggle event fires at the end.
function setDetailsOpen(details, open) {
  if (isDetailsOpen(details) === open) return;
  if (!motionOn() || !details.isConnected) {
    stopMotion(details);
    details.open = open;
    return;
  }
  const summary = details.querySelector(':scope > summary');
  const from = details.getBoundingClientRect().height;
  stopMotion(details);
  details.classList.toggle('is-closing', !open);
  details.open = true;
  const box = details.getBoundingClientRect();
  const css = getComputedStyle(details);
  const to = open ? box.height
    : summary
      ? summary.getBoundingClientRect().bottom - box.top
        + Number.parseFloat(css.paddingBottom) + Number.parseFloat(css.borderBottomWidth)
      : 0;
  const finish = () => {
    details.classList.remove('is-closing');
    if (!open) details.open = false;
  };
  if (Math.abs(to - from) < 1) { finish(); return; }

  const t = motionTiming(!open);
  const timing = { duration: t.duration, easing: t.easing };
  details.style.overflow = 'hidden';
  const anims = [details.animate({ height: [`${from}px`, `${to}px`] }, timing)];
  if (t.fade) {
    const opacity = open ? ['0', '1'] : ['1', '0'];
    for (const child of details.querySelectorAll(':scope > :not(summary)')) {
      anims.push(child.animate({ opacity }, { ...timing, easing: 'linear' }));
    }
  }
  playMotion(details, anims, () => {
    details.style.removeProperty('overflow');
  }, finish);
}

// Every section's own tap, app-wide. The change waits until the tap has
// reached every other listener, because several of them read `open` and
// expect the browser's toggle still to come.
let pendingDetailsTap = null;
window.addEventListener('click', (e) => {
  pendingDetailsTap = null;
  if (e.defaultPrevented || !motionOn()) return;
  const summary = e.target.closest?.('summary');
  const details = summary?.parentElement;
  if (!(details instanceof HTMLDetailsElement) || details.querySelector(':scope > summary') !== summary) return;
  // Buttons, links and fields inside a summary do their own thing.
  const control = e.target.closest('a, button, input, select, textarea, label');
  if (control && summary.contains(control)) return;
  e.preventDefault();
  pendingDetailsTap = { details, open: !isDetailsOpen(details) };
  setTimeout(runDetailsTap, 0); // in case a listener stops the tap
}, true);
window.addEventListener('click', runDetailsTap);
function runDetailsTap() {
  const tap = pendingDetailsTap;
  pendingDetailsTap = null;
  if (tap) setDetailsOpen(tap.details, tap.open);
}

// ---------- Pop-ups, menus and the side menu ----------

function popFrames(t) {
  return MOTION_POPS[t.pop] || MOTION_POPS.rise;
}

// Shows a hidden element with the theme's pop (menus) or a fade (backdrops).
function showWithMotion(el, kind = 'pop') {
  stopMotion(el);
  el.hidden = false;
  if (!motionOn()) return;
  const t = motionTiming();
  const frames = kind === 'fade' ? MOTION_POPS.fade : popFrames(t);
  playMotion(el, [el.animate(frames, { duration: t.duration, easing: t.easing })], () => {});
}

// Hides an element straight away for the code, and lets it fade or pop away.
function hideWithMotion(el, kind = 'pop') {
  if (el.hidden && !runningMotion.has(el)) return;
  const display = getComputedStyle(el).display;
  stopMotion(el);
  el.hidden = true;
  if (!motionOn() || display === 'none') return;
  const t = motionTiming(true);
  const frames = kind === 'fade' ? MOTION_POPS.fade : popFrames(t);
  el.style.setProperty('display', display, 'important');
  el.style.pointerEvents = 'none';
  const anim = el.animate(frames, { duration: t.duration, easing: t.easing, direction: 'reverse' });
  playMotion(el, [anim], () => {
    el.style.removeProperty('display');
    el.style.removeProperty('pointer-events');
  });
}

// Pop-ups (<dialog>): every showModal() and close() in the app goes through
// these, so each pop-up opens and closes with the theme's pop. A closing
// pop-up stays `open` until it has gone, then closes for real (and fires its
// close event).
const nativeShowModal = HTMLDialogElement.prototype.showModal;
const nativeClose = HTMLDialogElement.prototype.close;
const closingDialogs = new WeakMap();

function finishDialogClose(dialog) {
  const finish = closingDialogs.get(dialog);
  if (finish) finish();
}

function dialogAnims(dialog, closing) {
  const t = motionTiming(closing);
  const timing = { duration: t.duration, easing: t.easing, direction: closing ? 'reverse' : 'normal', fill: closing ? 'forwards' : 'none' };
  const anims = [dialog.animate(popFrames(t), timing)];
  try {
    anims.push(dialog.animate({ opacity: [0, 1] }, { ...timing, easing: 'linear', pseudoElement: '::backdrop' }));
  } catch { /* no ::backdrop animation on this browser */ }
  return anims;
}

HTMLDialogElement.prototype.showModal = function showModal() {
  finishDialogClose(this);
  nativeShowModal.call(this);
  if (motionOn()) dialogAnims(this, false);
};

HTMLDialogElement.prototype.close = function close(...args) {
  if (closingDialogs.has(this)) return;
  if (!this.open || !motionOn()) { nativeClose.apply(this, args); return; }
  const anims = dialogAnims(this, true);
  this.classList.add('is-closing');
  const finish = () => {
    if (closingDialogs.get(this) !== finish) return;
    closingDialogs.delete(this);
    this.classList.remove('is-closing');
    nativeClose.apply(this, args);
    anims.forEach((a) => a.cancel());
  };
  closingDialogs.set(this, finish);
  Promise.all(anims.map((a) => a.finished)).then(finish, finish);
};

// Escape closes a pop-up without calling close(), so route it through
// close() too. Added once every script has run, so a pop-up's own cancel
// listener (for one that can't be dismissed) gets the first say.
document.addEventListener('DOMContentLoaded', () => {
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('cancel', (e) => {
      if (e.defaultPrevented || !motionOn()) return;
      e.preventDefault();
      dialog.close();
    });
  }
});
