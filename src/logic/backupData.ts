// Contenido del respaldo (antes de cifrar) y su validación al importar.
// Todo lo que viene de un archivo se revisa campo por campo.

export const BACKUP_SCHEMA = 3;

export type BackupData = {
  schema: number;
  exportedAt: string;
  settings: { key: string; value: string }[];
  dayEntries: { date: string; module: string; data: string; updated_at: string }[];
  medications: {
    id: number; name: string; dose: string; times: string; reminders: number; active: number; created_at: string;
  }[];
  intakes: { medication_id: number; date: string; slot: string; status: string; recorded_at: string }[];
  questionnaires: { code: string; date: string; answers: string; parts: string; total: number }[];
  familyHistory: { relative: string; condition: string; note: string; created_at: string }[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, max = 5000): v is string => typeof v === 'string' && v.length <= max;
const int = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const arr = (v: unknown, max = 100_000): v is unknown[] => Array.isArray(v) && v.length <= max;
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

// Ajustes que se restauran. La llave de cifrado nunca está en el respaldo.
const RESTORABLE_SETTINGS = new Set([
  'profile', 'profile_confirmed', 'disclaimer_accepted', 'lock_mode', 'screenshots_blocked', 'medline_enabled',
]);

export function validateBackupData(raw: unknown): BackupData {
  const fail = (what: string): never => {
    throw new Error(`Respaldo no válido (${what}).`);
  };
  if (!obj(raw)) fail('estructura');
  const r = raw as Record<string, unknown>;
  if (!int(r.schema) || r.schema > BACKUP_SCHEMA || r.schema < 3) fail('versión');
  if (!str(r.exportedAt, 40)) fail('fecha');
  for (const k of ['settings', 'dayEntries', 'medications', 'intakes', 'questionnaires', 'familyHistory']) {
    if (!arr(r[k])) fail(k);
  }
  const settings = (r.settings as unknown[]).filter(obj).filter(
    (s) => str(s.key, 60) && str(s.value, 5000) && RESTORABLE_SETTINGS.has(s.key as string),
  ) as BackupData['settings'];
  const dayEntries = (r.dayEntries as unknown[]).map((e) => {
    if (!obj(e) || !str(e.date) || !DATE.test(e.date) || !str(e.module, 40) || !str(e.data, 20_000) || !str(e.updated_at, 40)) fail('registro diario');
    return e as BackupData['dayEntries'][number];
  });
  const medications = (r.medications as unknown[]).map((m) => {
    if (!obj(m) || !int(m.id) || !str(m.name, 100) || !str(m.dose, 100) || !str(m.times, 500)
      || !int(m.reminders) || !int(m.active) || !str(m.created_at, 40)) fail('medicamento');
    return m as BackupData['medications'][number];
  });
  const medIds = new Set(medications.map((m) => m.id));
  const intakes = (r.intakes as unknown[]).map((i) => {
    if (!obj(i) || !int(i.medication_id) || !medIds.has(i.medication_id) || !str(i.date) || !DATE.test(i.date)
      || !str(i.slot, 10) || (i.status !== 'tomada' && i.status !== 'omitida') || !str(i.recorded_at, 40)) fail('toma');
    return i as BackupData['intakes'][number];
  });
  const questionnaires = (r.questionnaires as unknown[]).map((q) => {
    if (!obj(q) || !str(q.code, 40) || !str(q.date) || !DATE.test(q.date) || !str(q.answers, 5000)
      || !str(q.parts, 5000) || !int(q.total)) fail('cuestionario');
    return q as BackupData['questionnaires'][number];
  });
  const familyHistory = (r.familyHistory as unknown[]).map((f) => {
    if (!obj(f) || !str(f.relative, 40) || !str(f.condition, 60) || !str(f.note, 200) || !str(f.created_at, 40)) fail('antecedente');
    return f as BackupData['familyHistory'][number];
  });
  return {
    schema: r.schema as number, exportedAt: r.exportedAt as string,
    settings, dayEntries, medications, intakes, questionnaires, familyHistory,
  };
}
