// Exportar e importar todos los datos (para el respaldo cifrado).

import { BACKUP_SCHEMA, validateBackupData, type BackupData } from '../logic/backupData.ts';
import { getDb } from './database.ts';

export async function collectBackupData(): Promise<BackupData> {
  const db = getDb();
  return {
    schema: BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    settings: await db.getAllAsync('SELECT key, value FROM setting'),
    dayEntries: await db.getAllAsync('SELECT date, module, data, updated_at FROM day_entry ORDER BY date'),
    medications: await db.getAllAsync(
      'SELECT id, name, dose, times, reminders, active, created_at FROM medication ORDER BY id',
    ),
    intakes: await db.getAllAsync('SELECT medication_id, date, slot, status, recorded_at FROM intake'),
    questionnaires: await db.getAllAsync('SELECT code, date, answers, parts, total FROM questionnaire ORDER BY id'),
    familyHistory: await db.getAllAsync('SELECT relative, condition, note, created_at FROM family_history ORDER BY id'),
  };
}

// Reemplaza TODOS los datos por los del respaldo, en una sola transacción:
// si algo falla, no se cambia nada.
export async function restoreBackupData(raw: unknown): Promise<void> {
  const d = validateBackupData(raw);
  const db = getDb();
  await db.withTransactionAsync(async () => {
    for (const t of ['day_entry', 'intake', 'medication', 'questionnaire', 'family_history']) {
      await db.runAsync(`DELETE FROM ${t}`);
    }
    for (const s of d.settings) {
      await db.runAsync(
        'INSERT INTO setting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        s.key, s.value,
      );
    }
    for (const e of d.dayEntries) {
      await db.runAsync(
        'INSERT OR REPLACE INTO day_entry (date, module, data, updated_at) VALUES (?, ?, ?, ?)',
        e.date, e.module, e.data, e.updated_at,
      );
    }
    for (const m of d.medications) {
      // Los recordatorios se vuelven a programar después de importar.
      await db.runAsync(
        `INSERT INTO medication (id, name, dose, times, reminders, notification_ids, active, created_at)
         VALUES (?, ?, ?, ?, ?, '[]', ?, ?)`,
        m.id, m.name, m.dose, m.times, m.reminders ? 1 : 0, m.active ? 1 : 0, m.created_at,
      );
    }
    for (const i of d.intakes) {
      await db.runAsync(
        'INSERT OR REPLACE INTO intake (medication_id, date, slot, status, recorded_at) VALUES (?, ?, ?, ?, ?)',
        i.medication_id, i.date, i.slot, i.status, i.recorded_at,
      );
    }
    for (const q of d.questionnaires) {
      await db.runAsync(
        'INSERT INTO questionnaire (code, date, answers, parts, total) VALUES (?, ?, ?, ?, ?)',
        q.code, q.date, q.answers, q.parts, q.total,
      );
    }
    for (const f of d.familyHistory) {
      await db.runAsync(
        'INSERT INTO family_history (relative, condition, note, created_at) VALUES (?, ?, ?, ?)',
        f.relative, f.condition, f.note, f.created_at,
      );
    }
  });
}
