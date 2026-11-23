// Barcode scanning for the Food page's add form.
//
// The camera view reads barcodes with the browser's own reader when it has
// one (Android, desktop Chrome), and otherwise with barcode.js. A photo or a
// typed number works too. A code that matches something already in your
// inventory offers Add one and Use one; anything else is looked up on Open
// Food Facts (https://world.openfoodfacts.org), a free, open food database.
// Only the barcode number is sent. Its name, package size, and calories fill
// in the add form; the item is saved when you tap Add item as usual.

(() => {
  const dialog = $('scan-dialog');
  const video = $('scan-video');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // The on-screen frame, as fractions of the visible camera picture. Kept in
  // step with .scan-frame in styles.css.
  const GUIDE = { x: 0.08, y: 0.22, w: 0.84, h: 0.56 };
  const FRAME_GAP_MS = 120;

  let stream = null;
  let timer = 0;
  let lastCodes = new Set();
  let native;           // the browser's BarcodeDetector, null if none (checked once)
  let session = 0;      // bumped on every open and close, so late work is dropped

  const OFF_PRODUCT = 'https://world.openfoodfacts.org/api/v2/product/';
  const OFF_FIELDS = ['product_name', 'product_name_en', 'generic_name', 'brands', 'quantity',
    'product_quantity', 'product_quantity_unit', 'nutriments', 'categories_tags', 'packaging_tags'].join(',');

  // Open Food Facts category tags (without "en:") for each Food type. Tags
  // run from general to specific, so they're checked from the last one back.
  const CATEGORY_TYPES = Object.entries({
    'canned-meat': ['canned-fishes', 'canned-tunas', 'canned-sardines', 'canned-salmons', 'canned-meats', 'canned-chicken', 'luncheon-meats', 'corned-beef'],
    'canned-veg': ['canned-vegetables', 'canned-legumes', 'canned-beans', 'canned-common-beans', 'canned-chickpeas', 'canned-corn', 'canned-green-beans', 'canned-peas', 'baked-beans'],
    'canned-soup': ['soups', 'canned-soups', 'condensed-soups', 'chili-con-carne', 'stews', 'broths'],
    'canned-fruit': ['canned-fruits', 'fruits-in-syrup', 'canned-tomatoes', 'tomato-pastes', 'applesauces', 'fruit-juices'],
    'jarred': ['pasta-sauces', 'tomato-sauces', 'salsas', 'pickles', 'pickled-vegetables', 'sauces', 'condiments'],
    'rice-white': ['rices', 'white-rices', 'long-grain-rices', 'basmati-rices', 'jasmine-rices'],
    'rice-brown': ['brown-rices', 'wholegrain-rices'],
    'beans-dry': ['dried-legumes', 'dried-beans', 'lentils', 'dried-lentils', 'split-peas'],
    'pasta': ['pastas', 'dry-pastas', 'spaghetti', 'noodles', 'instant-noodles', 'macaroni'],
    'oats': ['oat-flakes', 'rolled-oats', 'oatmeals', 'porridge-oats'],
    'cereal': ['breakfast-cereals', 'mueslis', 'granolas', 'corn-flakes'],
    'flour': ['flours', 'wheat-flours', 'baking-mixes', 'pancake-mixes', 'cake-mixes'],
    'powdered': ['milk-powders', 'powdered-milks', 'powdered-eggs'],
    'oil': ['vegetable-oils', 'olive-oils', 'cooking-oils', 'shortenings'],
    'spices': ['spices', 'herbs', 'bouillon-cubes', 'stock-cubes', 'seasonings'],
    'staples-none': ['sugars', 'honeys', 'salts', 'vinegars', 'syrups', 'maple-syrups'],
    'nut-butter': ['nut-butters', 'peanut-butters', 'almond-butters', 'hazelnut-spreads', 'cocoa-and-hazelnuts-spreads'],
    'nuts': ['nuts', 'mixed-nuts', 'trail-mixes', 'peanuts', 'almonds', 'cashew-nuts', 'pistachios', 'seeds'],
    'bars': ['cereal-bars', 'granola-bars', 'protein-bars', 'energy-bars'],
    'snacks': ['crackers', 'crisps', 'potato-crisps', 'chips', 'tortilla-chips', 'pretzels', 'popcorn', 'biscuits', 'cookies'],
    'dried-fruit': ['dried-fruits', 'raisins', 'dried-apricots', 'prunes', 'dates'],
    'jerky': ['jerky', 'beef-jerky', 'meat-snacks', 'dried-meats'],
    'coffee-ground': ['ground-coffees', 'coffee-beans'],
    'coffee-instant': ['instant-coffees', 'teas', 'tea-bags', 'herbal-teas'],
    'drink-mix': ['cocoa-powders', 'hot-chocolate', 'chocolate-powders', 'drink-mixes', 'powdered-drinks'],
    'baby': ['baby-foods', 'infant-formulas', 'baby-milks', 'infant-milks'],
    'bread': ['breads', 'sliced-breads', 'tortillas', 'flatbreads'],
    'eggs': ['eggs', 'chicken-eggs'],
    'dairy': ['milks', 'cow-milks', 'cheeses', 'yogurts', 'butters'],
    'produce': ['potatoes', 'onions', 'root-vegetables'],
    'freeze-dried': ['freeze-dried-meals', 'freeze-dried-foods'],
  }).reduce((map, [type, tags]) => { tags.forEach((t) => map.set(t, type)); return map; }, new Map());

  function typeFromCategories(tags) {
    for (let i = tags.length - 1; i >= 0; i--) {
      const type = CATEGORY_TYPES.get(String(tags[i]).replace(/^[a-z]{2}:/, ''));
      if (type) return type;
    }
    return null;
  }

  // ----- Status, buttons, and views -----

  function setStatus(text) { $('scan-status').textContent = text; }

  function showCamera(on) { $('scan-view').hidden = !on; }

  // A result card with its buttons: [label, handler, 'primary'?].
  function showResult(html, actions = []) {
    $('scan-result').innerHTML = `${html}<div class="actions scan-actions">${actions
      .map(([label, , primary], i) => `<button type="button" data-i="${i}" ${primary ? 'class="primary"' : ''}>${label}</button>`)
      .join('')}</div>`;
    $('scan-result').hidden = false;
    $('scan-result').querySelectorAll('button[data-i]').forEach((b) => {
      b.addEventListener('click', () => actions[Number(b.dataset.i)][1]());
    });
    $('scan-result').querySelector('button')?.focus();
  }

  function resetDialog() {
    $('scan-result').hidden = true;
    $('scan-result').innerHTML = '';
    $('scan-alt').hidden = false;
    $('scan-code').value = '';
    setStatus('');
  }

  // ----- Camera -----

  async function nativeDetector() {
    if (typeof window.BarcodeDetector !== 'function') return null;
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e'].filter((f) => supported.includes(f));
      return formats.length ? new window.BarcodeDetector({ formats }) : null;
    } catch {
      return null;
    }
  }

  const fromNative = (r) => BARCODE.normalizeTyped(r.rawValue, { upcE: r.format === 'upc_e' });

  async function startCamera() {
    const mine = session;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      showCamera(false);
      setStatus('The camera isn’t available here. You can take a photo or type the number instead.');
      return;
    }
    setStatus('Starting the camera…');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (mine !== session) { s.getTracks().forEach((t) => t.stop()); return; }
      stream = s;
      video.srcObject = s;
      await video.play();
      // Keep the picture sharp up close, where the camera allows it.
      const track = s.getVideoTracks()[0];
      if (track?.getCapabilities?.().focusMode?.includes('continuous')) {
        track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
      }
      showCamera(true);
      setStatus('Hold the barcode level inside the frame, about a hand’s width away.');
      lastCodes = new Set();
      timer = setTimeout(tick, FRAME_GAP_MS);
    } catch (err) {
      if (mine !== session) return;
      showCamera(false);
      setStatus(err?.name === 'NotAllowedError'
        ? 'Camera access is turned off for this site. You can allow it in your browser’s settings, or take a photo or type the number instead.'
        : err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError'
          ? 'No camera was found. You can take a photo or type the number instead.'
          : 'The camera couldn’t start. You can take a photo or type the number instead.');
    }
  }

  function stopCamera() {
    clearTimeout(timer);
    timer = 0;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
  }

  // The part of the current frame inside the on-screen guide. The picture
  // fills its box (object-fit: cover), so the visible part of the frame is
  // worked out first.
  function grabGuide() {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const box = video.getBoundingClientRect();
    if (!vw || !vh || !box.width) return null;
    const scale = Math.max(box.width / vw, box.height / vh);
    const visW = box.width / scale;
    const visH = box.height / scale;
    const sx = (vw - visW) / 2 + GUIDE.x * visW;
    const sy = (vh - visH) / 2 + GUIDE.y * visH;
    const sw = GUIDE.w * visW;
    const sh = GUIDE.h * visH;
    const outW = Math.min(960, Math.round(sw));
    const outH = Math.max(1, Math.round((sh * outW) / sw));
    canvas.width = outW;
    canvas.height = outH;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);
    return ctx.getImageData(0, 0, outW, outH);
  }

  // A code read on only one line still counts once it's read again in the
  // very next frame.
  function agree(codes) {
    const hit = codes.find((c) => lastCodes.has(c)) || null;
    lastCodes = new Set(codes);
    return hit;
  }

  async function scanFrame() {
    const mine = session;
    const img = grabGuide();
    if (!img) return;
    let code = null;
    if (native) {
      const results = await native.detect(canvas);
      code = agree(results.map(fromNative).filter(Boolean));
    } else {
      const counts = BARCODE.decodeImage(img, { lines: 12, enough: 2 });
      const [best] = [...counts].sort((a, b) => b[1] - a[1]);
      code = best && best[1] >= 2 ? best[0] : agree(best ? [best[0]] : []);
    }
    if (code && mine === session && stream) found(code);
  }

  // Checks a frame, then schedules the next one once it's done, so a slow
  // phone never has two checks running at once.
  async function tick() {
    if (!stream) return;
    if (video.readyState >= 2) await scanFrame().catch(() => {});
    if (stream) timer = setTimeout(tick, FRAME_GAP_MS);
  }

  function found(code) {
    stopCamera();
    showCamera(false);
    navigator.vibrate?.(40);
    handleCode(code);
  }

  // ----- Photos and typed numbers -----

  async function loadImage(file) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(file); } catch { /* fall back */ }
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function decodePhoto(file) {
    const pic = await loadImage(file);
    const w = pic.width;
    const h = pic.height;
    const scale = Math.min(1, 1600 / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.drawImage(pic, 0, 0, canvas.width, canvas.height);
    if (native) {
      const code = (await native.detect(canvas)).map(fromNative).find(Boolean);
      if (code) return code;
    }
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // A small barcode in a big photo needs lines close together.
    for (const lines of [40, 120]) {
      const [best] = [...BARCODE.decodeImage(img, { lines, enough: 3 })].sort((a, b) => b[1] - a[1]);
      if (best && best[1] >= 2) return best[0];
    }
    return null;
  }

  $('scan-photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const mine = session;
    stopCamera();
    showCamera(false);
    setStatus('Reading the photo…');
    try {
      const code = await decodePhoto(file);
      if (mine !== session) return;
      if (code) handleCode(code);
      else setStatus('No barcode could be read in that photo. Try again closer up, with the barcode level and in good light, or type the number.');
    } catch {
      if (mine === session) setStatus('That photo couldn’t be opened. You can try another, or type the number.');
    }
  });

  $('scan-manual').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = BARCODE.normalizeTyped($('scan-code').value);
    if (!code) {
      setStatus('That doesn’t look like a full barcode number. Check the digits under the barcode (usually 12 or 13) and try again.');
      $('scan-code').focus();
      return;
    }
    stopCamera();
    showCamera(false);
    handleCode(code);
  });

  // ----- What a code leads to -----

  const units = (item) => `${item.quantity} ${item.unit || ''}`.trim();

  function showExisting(item) {
    setStatus(`Found ${BARCODE.display(item.barcode)}.`);
    const where = item.location ? ` · ${escapeHtml(item.location)}` : '';
    const change = (delta) => {
      item.quantity = Math.max(0, (Number(item.quantity) || 0) + delta);
      saveState();
      render();
      setStatus(delta > 0 ? 'Added one.' : 'Used one.');
      showResult(`
        <div class="scan-product"><strong>${escapeHtml(item.name)}</strong>
        <span>You now have ${item.quantity ? escapeHtml(units(item)) : 'none left'}${where}</span></div>`,
      [['Scan another', restart, true], ['Done', () => dialog.close()]]);
    };
    showResult(`
      <p class="scan-note">This is already in your inventory:</p>
      <div class="scan-product"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(units(item))}${where}</span></div>`,
    [['Add one', () => change(1), true], ['Use one', () => change(-1)],
      ['Add as a new item', () => useDetails(item.barcode, {
        name: item.name, type: item.type, unit: item.unit, nutrition: item.nutrition || null,
      })]]);
    $('scan-alt').hidden = true;
  }

  async function lookUp(code) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 10000);
    try {
      const res = await fetch(`${OFF_PRODUCT}${code}.json?fields=${OFF_FIELDS}`, { signal: ctl.signal });
      if (res.status === 404) return { found: false };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.status === 1 && data.product ? { found: true, product: data.product } : { found: false };
    } finally {
      clearTimeout(timer);
    }
  }

  const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));

  // Package size from text like "15 oz (425 g)" or "1 L": { size, per }.
  function sizeFromText(text) {
    const sized = parseUnitSize(String(text || '').toLowerCase());
    if (!sized?.measure || !(sized.amount > 0)) return null;
    if (WEIGHT_IN_LB.has(sized.measure)) return { size: sized.amount * WEIGHT_IN_LB.get(sized.measure) * 453.592, per: 'g' };
    const vol = VOLUME_IN_CUPS.get(sized.measure);
    return vol ? { size: sized.amount * vol * 236.588, per: 'ml' } : null;
  }

  // What the form needs from an Open Food Facts product.
  function productDetails(p) {
    const title = (p.product_name_en || p.product_name || p.generic_name || '').trim();
    const brand = String(p.brands || '').split(',')[0].trim();
    const name = !title ? brand
      : brand && !title.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${title}` : title;
    const n = p.nutriments || {};
    let kcal = num(n['energy-kcal_100g']);
    if (kcal === null && num(n.energy_100g) !== null) kcal = num(n.energy_100g) / 4.184; // from kJ
    let size = num(p.product_quantity);
    let per = String(p.product_quantity_unit || '').toLowerCase() === 'ml' ? 'ml' : 'g';
    if (!(size > 0)) ({ size = null, per = 'g' } = sizeFromText(p.quantity) || {});
    if (!(size > 0) || size > 100000) size = null;
    const packaging = (p.packaging_tags || []).map((t) => t.replace(/^[a-z]{2}:/, '').split(':')[0].trim());
    return {
      name,
      // Without the ℮ ("estimated") mark some labels carry: "400 g e" → "400 g".
      quantityText: String(p.quantity || '').replace(/\s*(?:℮|\be)\s*$/u, '').trim(),
      type: typeFromCategories(p.categories_tags || []),
      packaging,
      nutrition: kcal > 0 && kcal < 1000 ? { kcal: Math.round(kcal * 10) / 10, per, size: size && Math.round(size) } : null,
    };
  }

  // A unit for the form from the packaging, if the type offers it.
  const PACKAGING_UNITS = [[/can|tin/, 'cans'], [/jar/, 'jars'], [/box|carton/, 'boxes'], [/pouch/, 'pouches'],
    [/bag|sachet/, 'bags'], [/bottle/, 'bottles'], [/packet/, 'packets']];
  function unitFromPackaging(packaging, type) {
    const offered = unitsFor('Food', type).map(([v]) => normUnit(v));
    for (const tag of packaging) {
      const hit = PACKAGING_UNITS.find(([re]) => re.test(tag));
      if (hit && offered.includes(normUnit(hit[1]))) return hit[1];
    }
    return null;
  }

  async function handleCode(code) {
    const mine = session;
    $('scan-alt').hidden = true;
    const existing = state.items.find((i) => i.barcode === code);
    if (existing) { showExisting(existing); return; }

    setStatus(`Found ${BARCODE.display(code)}. Looking it up…`);
    $('scan-result').hidden = true;
    let result;
    try {
      result = await lookUp(code);
    } catch {
      result = { error: true };
    }
    if (mine !== session) return;

    if (result.error) {
      setStatus(`Found ${BARCODE.display(code)}.`);
      showResult('<p class="scan-note">Open Food Facts couldn’t be reached. Check your connection and try again, or fill in the details yourself.</p>',
        [['Try again', () => handleCode(code), true], ['Fill in myself', () => useDetails(code, null)]]);
      return;
    }
    if (!result.found) {
      setStatus(`Found ${BARCODE.display(code)}.`);
      showResult('<p class="scan-note">Open Food Facts doesn’t have this product yet. You can fill in the details yourself, and the barcode is saved with the item so it’s recognized next time.</p>',
        [['Fill in myself', () => useDetails(code, null), true], ['Scan another', restart]]);
      return;
    }
    const d = productDetails(result.product);
    const pkgCalories = d.nutrition?.size ? Math.round((d.nutrition.size * d.nutrition.kcal) / 100 / 10) * 10 : null;
    const facts = [
      d.quantityText,
      pkgCalories ? `about ${pkgCalories.toLocaleString('en-US')} calories` : d.nutrition ? `${Math.round(d.nutrition.kcal)} calories per 100 ${d.nutrition.per === 'ml' ? 'mL' : 'g'}` : 'no calories listed',
    ].filter(Boolean).map(escapeHtml).join(' · ');
    setStatus(`Found ${BARCODE.display(code)}.`);
    showResult(`<div class="scan-product"><strong>${escapeHtml(d.name || 'Unnamed product')}</strong><span>${facts}</span></div>`,
      [['Use these details', () => useDetails(code, d), true], ['Scan another', restart]]);
  }

  // Fills in the add form from a scan; the item is saved with Add item.
  function useDetails(code, d) {
    dialog.close();
    resetForm();
    openManualEntry();
    if (d) {
      $('name').value = d.name || '';
      // The type from the product's categories, or else its name. If neither
      // gives one, Type is left for you to choose.
      const type = (d.type && findType('Food', d.type) ? d.type : null) || guessType({ name: d.name, category: 'Food' });
      if (type) {
        $('type').value = type;
        typeTouched = true;
      }
      syncUnitsToType();
      const unit = d.unit || (type && d.packaging ? unitFromPackaging(d.packaging, type) : null);
      if (unit) setUnit(unit);
      updateExpiresHint();
    }
    // A scanned item starts at 1, ready to add as it is.
    $('quantity').value = 1;
    pendingScan = { barcode: code, nutrition: d?.nutrition || null };
    renderScanInfo();
    $('form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Focus what still needs filling in; with a name and type, that's
    // nothing, so Add item (which doesn't bring up the keyboard).
    const next = !$('name').value ? 'name' : !$('type').value ? 'type' : 'submit-btn';
    $(next).focus({ preventScroll: true });
  }

  // ----- Opening and closing -----

  function restart() {
    session++;
    stopCamera();
    resetDialog();
    startCamera();
  }

  $('scan-btn').addEventListener('click', async () => {
    session++;
    resetDialog();
    dialog.showModal();
    if (native === undefined) native = await nativeDetector();
    startCamera();
  });

  $('scan-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    session++;
    stopCamera();
    showCamera(false);
  });
})();
