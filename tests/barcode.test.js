const test = require('node:test');
const assert = require('node:assert/strict');
const { BARCODE } = require('./load.js');

// ----- Drawing test barcodes -----
// Published module widths (space, bar, space, bar) for each digit's L code.
const L = [[3, 2, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [1, 4, 1, 1], [1, 1, 3, 2],
  [1, 2, 3, 1], [1, 1, 1, 4], [1, 3, 1, 2], [1, 2, 1, 3], [3, 1, 1, 2]];
const G = L.map((p) => [...p].reverse());
const EAN13_FIRST = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
const UPCE_PARITY = ['GGGLLL', 'GGLGLL', 'GGLLGL', 'GGLLLG', 'GLGGLL',
  'GLLGGL', 'GLLLGG', 'GLGLGL', 'GLGLLG', 'GLLGLG'];

// Module widths, alternating light and dark and starting light, as one
// scanline of brightness values: `px` pixels per module, 10 modules of quiet
// space on each side. Every code starts with a dark guard bar, so its widths
// go straight after the light quiet zone.
function draw(widths, px = 3) {
  const line = [];
  const all = [10, ...widths, 10];
  all.forEach((w, i) => { for (let k = 0; k < w * px; k++) line.push(i % 2 === 0 ? 240 : 20); });
  return Float32Array.from(line);
}
const digitsOf = (s) => [...s].map(Number);

function ean13(code) {
  const d = digitsOf(code);
  const parity = EAN13_FIRST[d[0]];
  const w = [1, 1, 1];
  d.slice(1, 7).forEach((n, i) => w.push(...(parity[i] === 'L' ? L[n] : G[n])));
  w.push(1, 1, 1, 1, 1);
  d.slice(7).forEach((n) => w.push(...L[n]));
  w.push(1, 1, 1);
  return draw(w);
}

function ean8(code) {
  const d = digitsOf(code);
  const w = [1, 1, 1];
  d.slice(0, 4).forEach((n) => w.push(...L[n]));
  w.push(1, 1, 1, 1, 1);
  d.slice(4).forEach((n) => w.push(...L[n]));
  w.push(1, 1, 1);
  return draw(w);
}

// UPC-E as printed: number system 0, six digits, check digit.
function upcE(code) {
  const d = digitsOf(code);
  const parity = UPCE_PARITY[d[7]];
  const w = [1, 1, 1];
  d.slice(1, 7).forEach((n, i) => w.push(...(parity[i] === 'L' ? L[n] : G[n])));
  w.push(1, 1, 1, 1, 1, 1);
  return draw(w);
}

test('test barcode helper draws the expected number of modules', () => {
  assert.equal(ean13('4006381333931').length, (10 + 95 + 10) * 3);
  assert.equal(ean8('96385074').length, (10 + 67 + 10) * 3);
  assert.equal(upcE('04252614').length, (10 + 51 + 10) * 3);
});

// ----- Check digits -----

test('checksumOk follows the GTIN check digit rule', () => {
  assert.equal(BARCODE.checksumOk(digitsOf('4006381333931')), true);
  assert.equal(BARCODE.checksumOk(digitsOf('4006381333932')), false);
  assert.equal(BARCODE.checksumOk(digitsOf('036000291452')), true);
  assert.equal(BARCODE.checksumOk(digitsOf('96385074')), true);
  assert.equal(BARCODE.checksumOk(digitsOf('96385075')), false);
});

// ----- Typed numbers -----

test('normalizeTyped accepts EAN-13, UPC-A, and EAN-8, ignoring spaces and dashes', () => {
  assert.equal(BARCODE.normalizeTyped('4006381333931'), '4006381333931');
  assert.equal(BARCODE.normalizeTyped('0 36000 29145 2'), '0036000291452');
  assert.equal(BARCODE.normalizeTyped('036000-291452'), '0036000291452');
  assert.equal(BARCODE.normalizeTyped('9638-5074'), '96385074');
});

test('normalizeTyped expands UPC-E to its full UPC-A number', () => {
  // 0425261 + check 4 expands to 042100005264.
  assert.equal(BARCODE.normalizeTyped('04252614'), '0042100005264');
  assert.equal(BARCODE.normalizeTyped('04252614', { upcE: true }), '0042100005264');
});

test('normalizeTyped rejects bad check digits, wrong lengths, and junk', () => {
  assert.equal(BARCODE.normalizeTyped('4006381333932'), null);
  assert.equal(BARCODE.normalizeTyped('12345'), null);
  assert.equal(BARCODE.normalizeTyped(''), null);
  assert.equal(BARCODE.normalizeTyped(null), null);
  assert.equal(BARCODE.normalizeTyped('abcdefgh'), null);
});

test('display drops the leading 0 of a UPC-A only', () => {
  assert.equal(BARCODE.display('0036000291452'), '036000291452');
  assert.equal(BARCODE.display('4006381333931'), '4006381333931');
  assert.equal(BARCODE.display('96385074'), '96385074');
});

// ----- Reading scanlines -----

test('decodeLine reads an EAN-13', () => {
  assert.deepEqual([...BARCODE.decodeLine(ean13('4006381333931'))], ['4006381333931']);
});

test('decodeLine reads a UPC-A as a 13-digit code with a leading 0', () => {
  assert.deepEqual([...BARCODE.decodeLine(ean13('0036000291452'))], ['0036000291452']);
});

test('decodeLine reads an EAN-8', () => {
  assert.deepEqual([...BARCODE.decodeLine(ean8('96385074'))], ['96385074']);
});

test('decodeLine reads a UPC-E and expands it', () => {
  assert.deepEqual([...BARCODE.decodeLine(upcE('04252614'))], ['0042100005264']);
});

test('decodeLine reads a code scanned upside down', () => {
  const line = ean13('4006381333931').reverse();
  assert.deepEqual([...BARCODE.decodeLine(line)], ['4006381333931']);
});

test('decodeLine copes with uneven lighting', () => {
  const line = ean13('4006381333931').map((v, i, a) => v * (0.4 + (0.6 * i) / a.length));
  assert.deepEqual([...BARCODE.decodeLine(line)], ['4006381333931']);
});

test('decodeLine finds nothing on a blank line or random stripes', () => {
  assert.equal(BARCODE.decodeLine(new Float32Array(400).fill(200)).size, 0);
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const stripes = Float32Array.from({ length: 600 }, () => (rand() < 0.5 ? 20 : 240));
  assert.equal(BARCODE.decodeLine(stripes).size, 0);
});

test('decodeLine rejects a code with a wrong check digit', () => {
  // Same bars as a real EAN-13, but the last digit changed.
  assert.equal(BARCODE.decodeLine(ean13('4006381333932')).size, 0);
});

// ----- Reading images -----

// The Map comes from the scripts' sandbox, so copy it into plain arrays here.
const entries = (map) => [...map].map(([code, n]) => [code, n]);

// A grey image with the scanline repeated down every row, as RGBA ImageData.
function image(line, height = 40) {
  const width = line.length;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      data[p] = data[p + 1] = data[p + 2] = line[x];
      data[p + 3] = 255;
    }
  }
  return { width, height, data };
}

test('decodeImage counts how many lines read each code', () => {
  const counts = BARCODE.decodeImage(image(ean13('4006381333931')), { lines: 8 });
  assert.deepEqual(entries(counts), [['4006381333931', 8]]);
});

test('decodeImage stops early once a code has been read enough times', () => {
  const counts = BARCODE.decodeImage(image(ean13('4006381333931')), { lines: 8, enough: 2 });
  assert.deepEqual(entries(counts), [['4006381333931', 2]]);
});

test('decodeImage returns an empty map for an image with no barcode', () => {
  const blank = image(new Float32Array(300).fill(128));
  assert.equal(BARCODE.decodeImage(blank, { lines: 4 }).size, 0);
});
