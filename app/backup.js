// ---------- Backup ----------

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `prep-tracker-backup-${toIsoDate(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  saveBackupInfo({ last: toIsoDate(new Date()), changedSince: null, itemChanges: 0, snoozeUntil: null });
  render();
}

$('export-btn').addEventListener('click', exportBackup);
$('backup-reminder-export').addEventListener('click', exportBackup);

$('backup-reminder-later').addEventListener('click', () => {
  const later = new Date();
  later.setDate(later.getDate() + BACKUP_SNOOZE_DAYS);
  saveBackupInfo({ ...backupInfo(), snoozeUntil: toIsoDate(later) });
  render();
});

// Checks a parsed backup file before anything is replaced. Returns a list of
// problems, each a sentence for the user; an empty list means it's fine.
// Categories from older versions are accepted, since normalize moves them
// over. At most a few item problems are listed, plus a count of the rest.
const OLD_CATEGORIES = ['Documents & Cash', 'Tools & Gear'];
const MAX_LISTED_PROBLEMS = 3;
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNumberLike = (v) => v === '' || v === null || Number.isFinite(Number(v));

function validateBackup(data) {
  if (!isPlainObject(data) || !('items' in data)) {
    return ['It isn’t a Prep Tracker backup (there’s no list of items in it).'];
  }
  if (!Array.isArray(data.items)) return ['Its list of items is damaged.'];

  const itemProblems = [];
  const ids = new Set();
  data.items.forEach((item, n) => {
    const label = isPlainObject(item) && typeof item.name === 'string' && item.name.trim()
      ? `Item ${n + 1} (“${item.name.trim()}”)`
      : `Item ${n + 1}`;
    if (!isPlainObject(item)) { itemProblems.push(`${label} isn’t an item.`); return; }
    if (typeof item.name !== 'string' || !item.name.trim()) itemProblems.push(`${label} has no name.`);
    const cat = spellOutAnd(item.category);
    if (!CATEGORIES.includes(cat) && !OLD_CATEGORIES.includes(item.category)) {
      itemProblems.push(`${label} has an unknown category${typeof item.category === 'string' ? ` (“${item.category}”)` : ''}.`);
    }
    if (item.quantity !== undefined && !isNumberLike(item.quantity)) itemProblems.push(`${label} has a quantity that isn’t a number.`);
    if (item.expires && !(typeof item.expires === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.expires))) {
      itemProblems.push(`${label} has an expiration date that isn’t a date.`);
    }
    if (item.id !== undefined && item.id !== null && item.id !== '') {
      if (typeof item.id !== 'string') itemProblems.push(`${label} has a damaged id.`);
      else if (ids.has(item.id)) itemProblems.push(`${label} has the same id as an earlier item.`);
      else ids.add(item.id);
    }
  });

  const problems = itemProblems.slice(0, MAX_LISTED_PROBLEMS);
  if (itemProblems.length > MAX_LISTED_PROBLEMS) {
    problems.push(`…and ${itemProblems.length - MAX_LISTED_PROBLEMS} more problems with items.`);
  }
  if (data.people !== undefined && !(Number.isFinite(Number(data.people)) && Number(data.people) >= 1)) {
    problems.push('Its household size isn’t a number of people.');
  }
  for (const [key, min, word] of [['adults', 1, 'adults'], ['children', 0, 'children']]) {
    if (data[key] !== undefined && !(Number.isFinite(Number(data[key])) && Number(data[key]) >= min)) {
      problems.push(`Its number of ${word} isn’t a number.`);
    }
  }
  if (data.savings !== undefined && data.savings !== null) {
    if (!isPlainObject(data.savings) || Object.keys(DEFAULT_SAVINGS).some((k) => !isNumberLike(data.savings[k] ?? ''))) {
      problems.push('Its savings amounts are damaged.');
    }
  }
  for (const key of ['history', 'hazards']) {
    if (data[key] !== undefined && data[key] !== null && !Array.isArray(data[key])) problems.push(`Its ${key === 'history' ? 'progress history' : 'Local Hazards'} are damaged.`);
  }
  if (data.grab !== undefined && data.grab !== null && !isPlainObject(data.grab)) problems.push('Its grab list is damaged.');
  return problems;
}

// Reads a backup file into data, or throws an Error whose message lists
// what's wrong with it, for the import alert.
async function readBackupFile(file) {
  let text;
  try { text = await file.text(); } catch { throw new Error('The file couldn’t be read.'); }
  let data;
  try { data = JSON.parse(text.replace(/^﻿/, '')); } catch {
    throw new Error('It isn’t a Prep Tracker backup (it isn’t a JSON file, or it’s incomplete or damaged).');
  }
  const problems = validateBackup(data);
  if (problems.length) throw new Error(problems.join('\n'));
  return data;
}

// Replaces everything with a backup file, once it has been checked. A file
// with problems changes nothing. Returns true if it was imported.
// With nothing to replace yet (a returning user's first visit), it doesn't
// ask to confirm.
async function importBackup(file) {
  let data;
  try {
    data = await readBackupFile(file);
  } catch (err) {
    alert(`“${file.name}” couldn’t be imported, and nothing was changed.\n\n${err.message}`);
    return false;
  }
  try {
    if (state.items.length &&
        !confirm(`Replace your current ${state.items.length} items with ${data.items.length} from the backup?`)) return false;
    const imported = normalize(data);
    imported.items = imported.items.map((i) => ({ ...i, id: i.id || newId() }));
    imported.tier = imported.tier || state.tier;
    const previous = structuredClone(state);
    Object.assign(state, imported);
    // If it can't be saved, put back what was here so the screen still
    // matches what's stored (saveState has already said why).
    if (!saveState()) {
      Object.assign(state, previous);
      render();
      return false;
    }
    // What's here now matches a backup file, so nothing is unsaved.
    saveBackupInfo({ ...backupInfo(), changedSince: null, itemChanges: 0 });
    render();
    return true;
  } catch (err) {
    console.error('Import failed:', err);
    alert(`“${file.name}” couldn’t be imported, and nothing was changed.\n\n${err.message}`);
    return false;
  }
}

$('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) await importBackup(file);
  e.target.value = '';
});
