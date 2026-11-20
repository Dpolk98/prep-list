// Spinning number dial (like the iOS alarm picker) for number fields.
// On touch screens, tapping a number field opens this bottom sheet instead of
// the keyboard. With a mouse and keyboard, the fields work as normal inputs.

(function () {
  const ROW = 40;      // height of one row, in px (matches styles.css)
  const VISIBLE = 5;   // rows shown at once; the middle one is selected

  const range = (from, to, step = 1) => {
    const out = [];
    for (let v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
    return out;
  };
  const money = (n) => '$' + Math.round(n).toLocaleString();
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // One entry per number field. Each column is a list of values; split() turns
  // a field's value into one value per column and join() does the reverse.
  const FIELDS = {
    quantity: {
      title: 'Quantity',
      columns: [
        { values: range(0, 999) },
        { values: [0, 0.25, 0.5, 0.75], label: (v) => (v ? String(v).slice(1) : '.0') },
      ],
      split: (v) => [Math.floor(v), v - Math.floor(v)],
      join: ([whole, part]) => whole + part,
      preview: (v) => {
        const unit = document.getElementById('unit-select')?.selectedOptions[0];
        const custom = document.getElementById('unit')?.value.trim();
        const name = unit && unit.value === '__other__' ? custom : unit?.value;
        // "1 gallon", not "1 gallons".
        const word = v === 1 && name && /[^s]s$/.test(name) ? name.slice(0, -1) : name;
        return `${v} ${word || ''}`.trim();
      },
    },
    people: {
      title: 'People in household',
      columns: [{ values: range(1, 30), unit: 'people' }],
      split: (v) => [v],
      join: ([v]) => v,
      preview: (v) => plural(v, 'person', 'people'),
    },
    'savings-current': {
      title: 'Saved so far',
      columns: [
        { values: range(0, 500), label: (v) => `$${v}`, unit: 'thousand' },
        { values: range(0, 950, 50), label: (v) => String(v).padStart(3, '0') },
      ],
      split: (v) => [Math.floor(v / 1000), v % 1000],
      join: ([k, rest]) => k * 1000 + rest,
      preview: money,
    },
    'savings-weekly': {
      title: 'Baseline per week',
      columns: [{ values: range(0, 5000, 50), label: money, unit: 'per week' }],
      split: (v) => [v],
      join: ([v]) => v,
      preview: (v) => `${money(v)} per week`,
    },
    'beyond-years': {
      title: 'Years to cover',
      columns: [{ values: range(1, 50), unit: 'years' }],
      split: (v) => [v],
      join: ([v]) => v,
      preview: (v) => plural(v, 'year', 'years'),
    },
  };

  if (!window.matchMedia('(pointer: coarse)').matches) return;

  // ---------- Sheet ----------

  const sheet = document.createElement('dialog');
  sheet.id = 'dial';
  sheet.setAttribute('aria-labelledby', 'dial-title');
  sheet.innerHTML = `
    <div class="dial-head">
      <button type="button" class="dial-cancel">Cancel</button>
      <div class="dial-heading">
        <div class="dial-title" id="dial-title"></div>
        <div class="dial-preview" aria-live="polite"></div>
      </div>
      <button type="button" class="dial-done">Done</button>
    </div>
    <div class="dial-wheels"><div class="dial-band" aria-hidden="true"></div></div>`;
  document.body.append(sheet);

  const wheels = sheet.querySelector('.dial-wheels');
  let active = null; // { input, field, cols: [{ el, values, items }] }

  function nearestIndex(values, v) {
    let best = 0;
    values.forEach((x, i) => { if (Math.abs(x - v) < Math.abs(values[best] - v)) best = i; });
    return best;
  }

  const selectedIndex = (col) =>
    Math.max(0, Math.min(col.values.length - 1, Math.round(col.el.scrollTop / ROW)));

  const currentValue = () => active.field.join(active.cols.map((c) => c.values[selectedIndex(c)]));

  // Tilts and fades rows by their distance from the middle, like a drum.
  function paint(col) {
    const center = col.el.scrollTop / ROW;
    const sel = Math.round(center);
    // A fast spin can skip past the old selection, so clear it first.
    col.el.querySelectorAll('.selected').forEach((el) => {
      el.classList.remove('selected');
      el.setAttribute('aria-selected', 'false');
    });
    for (let i = Math.max(0, sel - 4); i <= Math.min(col.items.length - 1, sel + 4); i++) {
      const d = i - center;
      const item = col.items[i];
      item.style.transform = `rotateX(${(-d * 20).toFixed(1)}deg)`;
      item.style.opacity = Math.max(0.15, 1 - Math.abs(d) * 0.28).toFixed(2);
      item.classList.toggle('selected', i === sel);
      item.setAttribute('aria-selected', i === sel);
    }
    sheet.querySelector('.dial-preview').textContent = active.field.preview(currentValue());
  }

  function buildColumn(spec, startIndex) {
    const wrap = document.createElement('div');
    wrap.className = 'dial-col';
    const el = document.createElement('div');
    el.className = 'dial-scroll';
    el.tabIndex = 0;
    el.setAttribute('role', 'listbox');
    el.setAttribute('aria-label', spec.unit || active.field.title);
    const label = spec.label || String;
    el.innerHTML = '<div class="dial-pad"></div>' +
      spec.values.map((v, i) => `<div class="dial-item" role="option" data-i="${i}">${label(v)}</div>`).join('') +
      '<div class="dial-pad"></div>';
    wrap.append(el);
    if (spec.unit) {
      const u = document.createElement('span');
      u.className = 'dial-unit';
      u.textContent = spec.unit;
      wrap.append(u);
    }
    const col = { el, values: spec.values, items: [...el.querySelectorAll('.dial-item')], start: startIndex };

    let frame = 0;
    el.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => paint(col));
    }, { passive: true });
    // Tap a row to spin to it.
    el.addEventListener('click', (e) => {
      const item = e.target.closest('.dial-item');
      if (item) el.scrollTo({ top: Number(item.dataset.i) * ROW, behavior: 'smooth' });
    });
    el.addEventListener('keydown', (e) => {
      const step = { ArrowUp: -1, ArrowDown: 1, PageUp: -10, PageDown: 10 }[e.key];
      if (!step) return;
      e.preventDefault();
      el.scrollTo({ top: (selectedIndex(col) + step) * ROW, behavior: 'smooth' });
    });
    return { wrap, col };
  }

  function open(input) {
    const field = FIELDS[input.id];
    active = { input, field, cols: [] };
    const parts = field.split(Number(input.value) || 0);

    wheels.querySelectorAll('.dial-col').forEach((c) => c.remove());
    field.columns.forEach((spec, i) => {
      const { wrap, col } = buildColumn(spec, nearestIndex(spec.values, parts[i]));
      wheels.append(wrap);
      active.cols.push(col);
    });
    sheet.querySelector('.dial-title').textContent = field.title;
    sheet.showModal();
    // Scroll positions can only be set once the sheet is laid out.
    for (const col of active.cols) {
      col.el.scrollTop = col.start * ROW;
      paint(col);
    }
    active.cols[0].el.focus({ preventScroll: true });
  }

  function close(save) {
    if (!active) return;
    if (save) {
      const { input } = active;
      input.value = currentValue();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    active = null;
    sheet.close();
  }

  sheet.querySelector('.dial-done').addEventListener('click', () => close(true));
  sheet.querySelector('.dial-cancel').addEventListener('click', () => close(false));
  sheet.addEventListener('cancel', (e) => { e.preventDefault(); close(false); }); // Escape
  // Tapping the dimmed area outside the sheet cancels.
  sheet.addEventListener('click', (e) => { if (e.target === sheet) close(false); });

  // ---------- Hook up the number fields ----------

  for (const id of Object.keys(FIELDS)) {
    const input = document.getElementById(id);
    if (!input) continue;
    input.readOnly = true;          // keeps the keyboard from opening
    input.setAttribute('inputmode', 'none');
    input.classList.add('dial-input');
    input.addEventListener('click', () => open(input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(input); }
    });
  }
})();
