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

// Replaces everything with a backup file. Returns true if it was imported.
// With nothing to replace yet (a returning user's first visit), it doesn't
// ask to confirm.
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.items)) throw new Error('No items list found');
    if (state.items.length &&
        !confirm(`Replace your current ${state.items.length} items with ${data.items.length} from the backup?`)) return false;
    const imported = normalize(data);
    imported.items = imported.items.map((i) => ({ ...i, id: i.id || newId() }));
    imported.tier = imported.tier || state.tier;
    Object.assign(state, imported);
    saveState();
    // What's here now matches a backup file, so nothing is unsaved.
    saveBackupInfo({ ...backupInfo(), changedSince: null, itemChanges: 0 });
    render();
    return true;
  } catch (err) {
    alert(`That file couldn't be imported: ${err.message}`);
    return false;
  }
}

$('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) await importBackup(file);
  e.target.value = '';
});
