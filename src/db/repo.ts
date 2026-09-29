// Lectura y escritura de datos. Siempre con consultas parametrizadas.

import { getDb } from './database.ts';
import type { QAnswers, QScore } from '../logic/questionnaires.ts';
import { cleanEntry, isConditionId } from '../modules/index.ts';
import type { ConditionId, EntryData } from '../modules/types.ts';
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

// ---------- registro diario por módulo ----------
// Cada día tiene una fila por módulo (prostatitis, colon, …) y una "general"
// con detonantes, alivios, señales de alarma y notas.

export type DayEntries = Record<string, EntryData>; // módulo -> datos

type EntryRow = { date: string; module: string; data: string };

function parseEntry(json: string): EntryData {
  try {
    return cleanEntry(JSON.parse(json));
  } catch {
    return {};
  }
}

export async function getDayEntries(date: string): Promise<DayEntries> {
  const rows = await getDb().getAllAsync<EntryRow>('SELECT date, module, data FROM day_entry WHERE date = ?', date);
  return Object.fromEntries(rows.map((r) => [r.module, parseEntry(r.data)]));
}

export async function saveDayEntries(date: string, entries: DayEntries): Promise<void> {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    for (const [module, data] of Object.entries(entries)) {
      await db.runAsync(
        `INSERT INTO day_entry (date, module, data, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(date, module) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
        date, module.slice(0, 40), JSON.stringify(cleanEntry(data)), now(),
      );
    }
  });
}

// Registros desde una fecha: fecha -> módulo -> datos, de la más reciente a la más antigua.
export async function listDayEntries(fromDate: string): Promise<{ date: string; entries: DayEntries }[]> {
  const rows = await getDb().getAllAsync<EntryRow>(
    'SELECT date, module, data FROM day_entry WHERE date >= ? ORDER BY date DESC',
    fromDate,
  );
  const byDate = new Map<string, DayEntries>();
  for (const r of rows) {
    const e = byDate.get(r.date) ?? {};
    e[r.module] = parseEntry(r.data);
    byDate.set(r.date, e);
  }
  return [...byDate.entries()].map(([date, entries]) => ({ date, entries }));
}

// ---------- perfil ----------

export async function getProfile(): Promise<{ conditions: ConditionId[]; confirmed: boolean }> {
  const raw = await getSetting('profile');
  const confirmed = (await getSetting('profile_confirmed')) === '1';
  const conditions = raw ? parseList(raw).filter(isConditionId) : [];
  return { conditions, confirmed };
}

export async function saveProfile(conditions: ConditionId[]): Promise<void> {
  await setSetting('profile', JSON.stringify(conditions.filter(isConditionId)));
  await setSetting('profile_confirmed', '1');
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

// ---------- cuestionarios ----------

export type QuestionnaireEntry = {
  id: number;
  code: string;
  date: string;
  total: number;
  parts: { label: string; value: number; max: number }[];
};

type QRow = { id: number; code: string; date: string; total: number; parts: string };

export async function saveQuestionnaire(code: string, date: string, answers: QAnswers, score: QScore): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO questionnaire (code, date, answers, parts, total) VALUES (?, ?, ?, ?, ?)',
    code, date, JSON.stringify(answers), JSON.stringify(score.parts), score.total,
  );
}

export async function listQuestionnaires(code?: string): Promise<QuestionnaireEntry[]> {
  const rows = code
    ? await getDb().getAllAsync<QRow>(
      'SELECT id, code, date, total, parts FROM questionnaire WHERE code = ? ORDER BY date DESC, id DESC', code)
    : await getDb().getAllAsync<QRow>('SELECT id, code, date, total, parts FROM questionnaire ORDER BY date DESC, id DESC');
  return rows.map((r) => {
    let parts: QuestionnaireEntry['parts'] = [];
    try {
      const p = JSON.parse(r.parts);
      if (Array.isArray(p)) parts = p;
    } catch { /* se ignora */ }
    return { id: r.id, code: r.code, date: r.date, total: r.total, parts };
  });
}

// ---------- antecedentes familiares ----------

export type FamilyHistoryItem = { id: number; relative: string; condition: string; note: string };

export async function listFamilyHistory(): Promise<FamilyHistoryItem[]> {
  return getDb().getAllAsync<FamilyHistoryItem>(
    'SELECT id, relative, condition, note FROM family_history ORDER BY id',
  );
}

export async function addFamilyHistory(relative: string, condition: string, note: string): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO family_history (relative, condition, note, created_at) VALUES (?, ?, ?, ?)',
    relative.slice(0, 40), condition.slice(0, 60), note.trim().slice(0, 200), now(),
  );
}

export async function removeFamilyHistory(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM family_history WHERE id = ?', id);
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
