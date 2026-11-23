// Reads grocery barcodes (EAN-13, UPC-A, EAN-8, and UPC-E) from camera
// frames and photos, with no outside library. Browsers that have their own
// barcode reader (BarcodeDetector) use it instead; see scan.js.
//
// How it works: pixels are read along straight lines across the image. Each
// line is turned into a list of bar and space widths, which are matched
// against the published widths for each digit. A code only counts if its
// check digit is right, and in a live camera view it must also be read on
// two lines before it's accepted.
//
// Results are digit strings: 13 digits for EAN-13 and UPC-A (with a leading
// 0), and for UPC-E expanded to its full UPC-A number; 8 digits for EAN-8.

const BARCODE = (() => {
  // Widths, in modules, of the bar-and-space runs for each digit's "L" code
  // (space, bar, space, bar). "R" codes have the same widths starting with a
  // bar, and "G" codes are the L widths reversed.
  const L = [[3, 2, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [1, 4, 1, 1], [1, 1, 3, 2],
    [1, 2, 3, 1], [1, 1, 1, 4], [1, 3, 1, 2], [1, 2, 1, 3], [3, 1, 1, 2]];
  const G = L.map((p) => [...p].reverse());

  // EAN-13's first digit isn't drawn: it's the pattern of L and G codes in
  // the left half.
  const EAN13_FIRST = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
    'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  // UPC-E (number system 0): the pattern of the 6 digits gives the check digit.
  const UPCE_PARITY = ['GGGLLL', 'GGLGLL', 'GGLLGL', 'GGLLLG', 'GLGGLL',
    'GLLGGL', 'GLLLGG', 'GLGLGL', 'GLGLLG', 'GLLGLG'];

  // How far a run may stray from its expected width (as in ZXing).
  const MAX_AVG_VARIANCE = 0.48;
  const MAX_INDIVIDUAL_VARIANCE = 0.7;
  // Light space needed before and after a code, in modules. Spaces inside a
  // code are at most 4 modules wide, so asking for 5 means a read can only
  // start and end at a code's real edges, not partway through a bigger one.
  const QUIET_MODULES = 5;

  // How closely some runs match a pattern of module widths: 0 is a perfect
  // match, Infinity a clear miss.
  function variance(runs, start, pattern) {
    let total = 0;
    let modules = 0;
    for (let i = 0; i < pattern.length; i++) {
      total += runs[start + i];
      modules += pattern[i];
    }
    if (total < modules) return Infinity; // under a pixel per module
    const unit = total / modules;
    const maxOne = MAX_INDIVIDUAL_VARIANCE * unit;
    let sum = 0;
    for (let i = 0; i < pattern.length; i++) {
      const v = Math.abs(runs[start + i] - pattern[i] * unit);
      if (v > maxOne) return Infinity;
      sum += v;
    }
    return sum / total;
  }

  // The best-matching digit for 4 runs: { digit, parity: 'L' | 'G' }, or null.
  function matchDigit(runs, start, allowG) {
    let best = null;
    let bestV = MAX_AVG_VARIANCE;
    for (let d = 0; d < 10; d++) {
      const v = variance(runs, start, L[d]);
      if (v < bestV) { bestV = v; best = { digit: d, parity: 'L' }; }
      if (allowG) {
        const g = variance(runs, start, G[d]);
        if (g < bestV) { bestV = g; best = { digit: d, parity: 'G' }; }
      }
    }
    return best;
  }

  const guard = (runs, start, n) => variance(runs, start, Array(n).fill(1)) < MAX_AVG_VARIANCE;

  // Width of `n` runs, scaled to what 7 modules would be.
  const width7 = (runs, start, n, modules) => {
    let w = 0;
    for (let i = 0; i < n; i++) w += runs[start + i];
    return (w / modules) * 7;
  };

  // Every digit of a real code is 7 modules wide, so in each half the digits
  // (and guards) should all be about the same width. This turns away random
  // stripes that happen to look like digits one at a time. Each half is
  // checked on its own, so a code seen at an angle still passes.
  function evenWidths(widths) {
    const mean = widths.reduce((a, b) => a + b, 0) / widths.length;
    return widths.every((w) => Math.abs(w - mean) <= 0.3 * mean);
  }
  const digitWidths = (runs, start, count) =>
    Array.from({ length: count }, (_, k) => width7(runs, start + k * 4, 4, 7));

  // True when the check digit (the last one) is right, by the usual GTIN rule.
  function checksumOk(digits) {
    const n = digits.length - 1;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += digits[i] * ((n - i) % 2 === 1 ? 3 : 1);
    return (10 - (sum % 10)) % 10 === digits[n];
  }

  // UPC-E to its full 12-digit UPC-A number.
  function expandUpcE(ns, d, check) {
    const [d1, d2, d3, d4, d5, d6] = d;
    const body = d6 <= 2 ? [d1, d2, d6, 0, 0, 0, 0, d3, d4, d5]
      : d6 === 3 ? [d1, d2, d3, 0, 0, 0, 0, 0, d4, d5]
      : d6 === 4 ? [d1, d2, d3, d4, 0, 0, 0, 0, 0, d5]
      : [d1, d2, d3, d4, d5, 0, 0, 0, 0, d6];
    return [ns, ...body, check];
  }

  // Tries each format at runs[s], which must be a bar after a light space.
  // `runs` alternate light and dark, so runs[s + odd] are spaces.
  function decodeAt(runs, s) {
    if (!guard(runs, s, 3)) return null;
    const module = (runs[s] + runs[s + 1] + runs[s + 2]) / 3;
    if (runs[s - 1] < QUIET_MODULES * module) return null;
    const quietAfter = (i) => i < runs.length && runs[i] >= QUIET_MODULES * module;

    // EAN-13 and UPC-A: guard, 6 digits, middle guard, 6 digits, guard.
    if (quietAfter(s + 59)) {
      const left = [];
      let ok = true;
      for (let k = 0; k < 6 && ok; k++) {
        const m = matchDigit(runs, s + 3 + k * 4, true);
        if (m) left.push(m); else ok = false;
      }
      if (ok && guard(runs, s + 27, 5)) {
        const right = [];
        for (let k = 0; k < 6 && ok; k++) {
          const m = matchDigit(runs, s + 32 + k * 4, false);
          if (m) right.push(m.digit); else ok = false;
        }
        const even = ok && evenWidths([width7(runs, s, 3, 3), ...digitWidths(runs, s + 3, 6), width7(runs, s + 27, 5, 5)])
          && evenWidths([width7(runs, s + 27, 5, 5), ...digitWidths(runs, s + 32, 6), width7(runs, s + 56, 3, 3)]);
        if (even && guard(runs, s + 56, 3)) {
          const first = EAN13_FIRST.indexOf(left.map((m) => m.parity).join(''));
          if (first !== -1) {
            const digits = [first, ...left.map((m) => m.digit), ...right];
            if (checksumOk(digits)) return digits.join('');
          }
        }
      }
    }

    // EAN-8: guard, 4 digits, middle guard, 4 digits, guard.
    if (quietAfter(s + 43)) {
      const digits = [];
      let ok = true;
      for (let k = 0; k < 4 && ok; k++) {
        const m = matchDigit(runs, s + 3 + k * 4, false);
        if (m) digits.push(m.digit); else ok = false;
      }
      if (ok && guard(runs, s + 19, 5)) {
        for (let k = 0; k < 4 && ok; k++) {
          const m = matchDigit(runs, s + 24 + k * 4, false);
          if (m) digits.push(m.digit); else ok = false;
        }
        const even = ok && evenWidths([width7(runs, s, 3, 3), ...digitWidths(runs, s + 3, 4), width7(runs, s + 19, 5, 5)])
          && evenWidths([width7(runs, s + 19, 5, 5), ...digitWidths(runs, s + 24, 4), width7(runs, s + 40, 3, 3)]);
        if (even && guard(runs, s + 40, 3) && checksumOk(digits)) return digits.join('');
      }
    }

    // UPC-E: guard, 6 digits, a 6-run end guard. Only number system 0, the
    // one used on products: number system 1 has the same digit patterns as
    // the left half of an EAN-13, so a blurry EAN-13 could pass for it.
    if (quietAfter(s + 33)) {
      const six = [];
      let ok = true;
      for (let k = 0; k < 6 && ok; k++) {
        const m = matchDigit(runs, s + 3 + k * 4, true);
        if (m) six.push(m); else ok = false;
      }
      const even = ok && evenWidths([width7(runs, s, 3, 3), ...digitWidths(runs, s + 3, 6), width7(runs, s + 27, 6, 6)]);
      if (even && guard(runs, s + 27, 6)) {
        const check = UPCE_PARITY.indexOf(six.map((m) => m.parity).join(''));
        if (check !== -1) {
          const upcA = expandUpcE(0, six.map((m) => m.digit), check);
          if (checksumOk(upcA)) return `0${upcA.join('')}`;
        }
      }
    }
    return null;
  }

  // Bar and space widths along a line of brightness values, split at a
  // threshold (a single value, or one per pixel). Crossings are placed
  // between pixels, so narrow bars keep their width. The first run is
  // always light; a line that starts dark gets a zero-width light run.
  function runsAt(line, threshold) {
    const n = line.length;
    const t = (i) => (typeof threshold === 'number' ? threshold : threshold[i]);
    const runs = [];
    let dark = line[0] < t(0);
    if (dark) runs.push(0);
    let last = 0;
    for (let i = 1; i < n; i++) {
      const isDark = line[i] < t(i);
      if (isDark === dark) continue;
      const a = line[i - 1] - t(i - 1);
      const b = line[i] - t(i);
      const x = i - 1 + (a === b ? 0.5 : a / (a - b));
      runs.push(x - last);
      last = x;
      dark = isDark;
    }
    runs.push(n - last);
    return runs;
  }

  // Thresholds to try, in order: halfway between the line's dark and light
  // ends, then (only if that finds nothing) a local midpoint that copes with
  // shadows and uneven light.
  function* thresholds(line) {
    const n = line.length;
    const sorted = Float32Array.from(line).sort();
    const lo = sorted[Math.floor(n * 0.05)];
    const hi = sorted[Math.floor(n * 0.95)];
    if (hi - lo < 24) return; // too flat to hold a barcode
    yield (lo + hi) / 2;
    // The local midpoint uses the darkest and lightest values within about a
    // tenth of the line either side, found 16 pixels at a time to keep it quick.
    const BLOCK = 16;
    const blocks = Math.ceil(n / BLOCK);
    const bMin = new Float32Array(blocks).fill(255);
    const bMax = new Float32Array(blocks);
    for (let i = 0; i < n; i++) {
      const b = (i / BLOCK) | 0;
      if (line[i] < bMin[b]) bMin[b] = line[i];
      if (line[i] > bMax[b]) bMax[b] = line[i];
    }
    const reach = Math.max(1, Math.round(n / 10 / BLOCK));
    const local = new Float32Array(n);
    for (let b = 0; b < blocks; b++) {
      let mn = 255;
      let mx = 0;
      for (let j = Math.max(0, b - reach); j <= Math.min(blocks - 1, b + reach); j++) {
        if (bMin[j] < mn) mn = bMin[j];
        if (bMax[j] > mx) mx = bMax[j];
      }
      const t = mx - mn < 24 ? lo - 1 : (mn + mx) / 2; // flat areas count as light
      local.fill(t, b * BLOCK, Math.min(n, (b + 1) * BLOCK));
    }
    yield local;
  }

  // Every code found along one line of brightness values, read both ways.
  // The thresholds are worked out once and reused for the reverse reading.
  function decodeLine(line) {
    const found = new Set();
    const reversed = Float32Array.from(line).reverse();
    for (const threshold of thresholds(line)) {
      const flipped = typeof threshold === 'number' ? threshold : Float32Array.from(threshold).reverse();
      for (const [values, t] of [[line, threshold], [reversed, flipped]]) {
        const runs = runsAt(values, t);
        for (let s = 1; s < runs.length - 2; s += 2) {
          const code = decodeAt(runs, s);
          if (code) found.add(code);
        }
      }
      if (found.size) return found;
    }
    return found;
  }

  // Brightness along a row or column, averaged over 3 neighbouring lines.
  function lineOf(img, index, vertical) {
    const { width, height, data } = img;
    const n = vertical ? height : width;
    const max = vertical ? width - 1 : height - 1;
    const out = new Float32Array(n);
    for (let k = -1; k <= 1; k++) {
      const at = Math.min(max, Math.max(0, index + k));
      for (let i = 0; i < n; i++) {
        const p = (vertical ? i * width + at : at * width + i) * 4;
        out[i] += (data[p] + 2 * data[p + 1] + data[p + 2]) / 12;
      }
    }
    return out;
  }

  // Reads an ImageData along `lines` rows (and, if those find nothing, as
  // many columns) spread across its middle, starting from the centre.
  // Returns a Map of code → how many lines read it. With `enough`, it stops
  // once any code has been read on that many lines.
  function decodeImage(img, { lines = 16, vertical = true, enough = Infinity } = {}) {
    const counts = new Map();
    let done = false;
    const add = (set) => set.forEach((c) => {
      const n = (counts.get(c) || 0) + 1;
      counts.set(c, n);
      if (n >= enough) done = true;
    });
    // Centre first, then working outwards, where a barcode is most likely.
    const order = Array.from({ length: lines }, (_, k) => k)
      .sort((a, b) => Math.abs(a - (lines - 1) / 2) - Math.abs(b - (lines - 1) / 2));
    const sweep = (size, isVertical) => {
      for (const k of order) {
        if (done) return;
        const index = Math.round(size * (0.1 + (0.8 * (k + 0.5)) / lines));
        add(decodeLine(lineOf(img, index, isVertical)));
      }
    };
    sweep(img.height, false);
    if (vertical && !counts.size) sweep(img.width, true);
    return counts;
  }

  // A typed number (or one from the browser's own reader), cleaned up and
  // checked: returns the code as the decoder would give it, or null when it
  // isn't a valid product barcode. `upcE` says an 8-digit number is a UPC-E.
  function normalizeTyped(text, { upcE = false } = {}) {
    const digits = String(text || '').replace(/\D/g, '');
    const arr = [...digits].map(Number);
    if (upcE && digits.length === 8 && arr[0] === 0) {
      const upcA = expandUpcE(0, arr.slice(1, 7), arr[7]);
      return checksumOk(upcA) ? `0${upcA.join('')}` : null;
    }
    if (digits.length === 13 && checksumOk(arr)) return digits;
    if (digits.length === 12 && checksumOk(arr)) return `0${digits}`;
    if (digits.length === 8 && checksumOk(arr)) return digits; // EAN-8
    if (digits.length === 8 && arr[0] === 0) {
      // UPC-E as printed: number system, 6 digits, check digit.
      const upcA = expandUpcE(arr[0], arr.slice(1, 7), arr[7]);
      if (checksumOk(upcA)) return `0${upcA.join('')}`;
    }
    return null;
  }

  // As printed on US packages: UPC-A without the leading 0.
  const display = (code) => (code.length === 13 && code.startsWith('0') ? code.slice(1) : code);

  return { decodeImage, decodeLine, normalizeTyped, display, checksumOk };
})();
