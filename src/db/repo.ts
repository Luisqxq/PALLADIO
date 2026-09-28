// Lectura y escritura de datos. Siempre con consultas parametrizadas.

import { getDb } from './database.ts';
import type { CpsiAnswers, CpsiScore } from '../logic/cpsi.ts';
import type { MedlineTopic } from '../logic/medlineplus.ts';

// ---------- utilidades ----------

function parseList(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

const now = () => new Date().toISOString();

// ---------- registro diario ----------

export type DailyLog = {
  date: string;
  pain: number;
  locations: string[];
  urinary: string[];
  nocturia: number;
  triggers: string[];
  reliefs: string[];
  flags: string[];
  notes: string;
};

type DailyRow = Omit<DailyLog, 'locations' | 'urinary' | 'triggers' | 'reliefs' | 'flags'> & {
  locations: string; urinary: string; triggers: string; reliefs: string; flags: string;
};

const fromDailyRow = (r: DailyRow): DailyLog => ({
  date: r.date,
  pain: r.pain,
  locations: parseList(r.locations),
  urinary: parseList(r.urinary),
  nocturia: r.nocturia,
  triggers: parseList(r.triggers),
  reliefs: parseList(r.reliefs),
  flags: parseList(r.flags),
  notes: r.notes,
});

export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const row = await getDb().getFirstAsync<DailyRow>('SELECT * FROM daily_log WHERE date = ?', date);
  return row ? fromDailyRow(row) : null;
}

export async function saveDailyLog(log: DailyLog): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO daily_log (date, pain, locations, urinary, nocturia, triggers, reliefs, flags, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       pain = excluded.pain, locations = excluded.locations, urinary = excluded.urinary,
       nocturia = excluded.nocturia, triggers = excluded.triggers, reliefs = excluded.reliefs,
       flags = excluded.flags, notes = excluded.notes, updated_at = excluded.updated_at`,
    log.date,
    Math.max(0, Math.min(10, Math.round(log.pain))),
    JSON.stringify(log.locations),
    JSON.stringify(log.urinary),
    Math.max(0, Math.min(20, Math.round(log.nocturia))),
    JSON.stringify(log.triggers),
    JSON.stringify(log.reliefs),
    JSON.stringify(log.flags),
    log.notes.slice(0, 2000),
    now(),
  );
}

export async function listDailyLogs(fromDate: string): Promise<DailyLog[]> {
  const rows = await getDb().getAllAsync<DailyRow>(
    'SELECT * FROM daily_log WHERE date >= ? ORDER BY date DESC',
    fromDate,
  );
  return rows.map(fromDailyRow);
}

// ---------- medicamentos ----------

export type Medication = {
  id: number;
  name: string;
  dose: string;
  times: string[];
  reminders: boolean;
  notificationIds: string[];
  createdAt: string; // ISO
};

type MedRow = {
  id: number; name: string; dose: string; times: string; reminders: number; notification_ids: string; created_at: string;
};

const fromMedRow = (r: MedRow): Medication => ({
  id: r.id,
  name: r.name,
  dose: r.dose,
  times: parseList(r.times).sort(),
  reminders: r.reminders === 1,
  notificationIds: parseList(r.notification_ids),
  createdAt: r.created_at,
});

export async function listMedications(): Promise<Medication[]> {
  const rows = await getDb().getAllAsync<MedRow>(
    'SELECT id, name, dose, times, reminders, notification_ids, created_at FROM medication WHERE active = 1 ORDER BY name COLLATE NOCASE',
  );
  return rows.map(fromMedRow);
}

export async function addMedication(m: Omit<Medication, 'id' | 'notificationIds' | 'createdAt'>): Promise<number> {
  const res = await getDb().runAsync(
    'INSERT INTO medication (name, dose, times, reminders, created_at) VALUES (?, ?, ?, ?, ?)',
    m.name.trim().slice(0, 100),
    m.dose.trim().slice(0, 100),
    JSON.stringify(m.times),
    m.reminders ? 1 : 0,
    now(),
  );
  return res.lastInsertRowId;
}

export async function setNotificationIds(id: number, ids: string[]): Promise<void> {
  await getDb().runAsync('UPDATE medication SET notification_ids = ? WHERE id = ?', JSON.stringify(ids), id);
}

// Se archiva en lugar de borrar, para conservar el historial de tomas.
export async function archiveMedication(id: number): Promise<void> {
  await getDb().runAsync("UPDATE medication SET active = 0, notification_ids = '[]' WHERE id = ?", id);
}

export type IntakeStatus = 'tomada' | 'omitida';
export type Intake = { medicationId: number; date: string; slot: string; status: IntakeStatus };

export async function listIntakes(fromDate: string): Promise<Intake[]> {
  return getDb().getAllAsync<Intake>(
    'SELECT medication_id AS medicationId, date, slot, status FROM intake WHERE date >= ?',
    fromDate,
  );
}

export async function setIntake(i: Intake | (Omit<Intake, 'status'> & { status: null })): Promise<void> {
  if (i.status === null) {
    await getDb().runAsync(
      'DELETE FROM intake WHERE medication_id = ? AND date = ? AND slot = ?',
      i.medicationId, i.date, i.slot,
    );
    return;
  }
  await getDb().runAsync(
    `INSERT INTO intake (medication_id, date, slot, status, recorded_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(medication_id, date, slot) DO UPDATE SET status = excluded.status, recorded_at = excluded.recorded_at`,
    i.medicationId, i.date, i.slot, i.status, now(),
  );
}

// ---------- cuestionario NIH-CPSI ----------

export type CpsiEntry = { id: number; date: string; dolor: number; urinario: number; calidad: number; total: number };

export async function saveCpsi(date: string, answers: CpsiAnswers, score: CpsiScore): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO cpsi (date, answers, dolor, urinario, calidad, total) VALUES (?, ?, ?, ?, ?, ?)',
    date, JSON.stringify(answers), score.dolor, score.urinario, score.calidad, score.total,
  );
}

export async function listCpsi(): Promise<CpsiEntry[]> {
  return getDb().getAllAsync<CpsiEntry>(
    'SELECT id, date, dolor, urinario, calidad, total FROM cpsi ORDER BY date DESC, id DESC',
  );
}

// ---------- ajustes ----------

export async function getSetting(key: string): Promise<string | null> {
  const row = await getDb().getFirstAsync<{ value: string }>('SELECT value FROM setting WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO setting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key, value,
  );
}

// ---------- MedlinePlus (copia local cifrada) ----------

export type CachedSearch = { term: string; fetchedAt: string; results: MedlineTopic[] };

const cacheKey = (term: string) => term.trim().toLowerCase();

export async function getCachedSearch(term: string): Promise<CachedSearch | null> {
  const row = await getDb().getFirstAsync<{ term: string; fetched_at: string; results: string }>(
    'SELECT term, fetched_at, results FROM medline_cache WHERE term = ?',
    cacheKey(term),
  );
  if (!row) return null;
  try {
    return { term: row.term, fetchedAt: row.fetched_at, results: JSON.parse(row.results) as MedlineTopic[] };
  } catch {
    return null;
  }
}

export async function saveCachedSearch(term: string, results: MedlineTopic[]): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO medline_cache (term, fetched_at, results) VALUES (?, ?, ?)
     ON CONFLICT(term) DO UPDATE SET fetched_at = excluded.fetched_at, results = excluded.results`,
    cacheKey(term), now(), JSON.stringify(results),
  );
}

export async function listCachedTerms(): Promise<string[]> {
  const rows = await getDb().getAllAsync<{ term: string }>('SELECT term FROM medline_cache ORDER BY fetched_at DESC LIMIT 20');
  return rows.map((r) => r.term);
}

export async function clearMedlineCache(): Promise<void> {
  await getDb().runAsync('DELETE FROM medline_cache');
}
