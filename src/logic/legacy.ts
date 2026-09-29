// Conversión de los datos de la versión 1 (solo prostatitis) al formato por
// módulos. Se usa en la migración v3 de la base de datos.

export type LegacyDailyRow = {
  date: string;
  pain: number;
  locations: string;
  urinary: string;
  nocturia: number;
  triggers: string;
  reliefs: string;
  flags: string;
  notes: string;
  updated_at: string;
};

export type LegacyCpsiRow = {
  date: string;
  answers: string;
  dolor: number;
  urinario: number;
  calidad: number;
  total: number;
};

function list(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function convertLegacyDaily(r: LegacyDailyRow) {
  return {
    prostatitis: { dolor: r.pain, zonas: list(r.locations), orina: list(r.urinary), nocturia: r.nocturia },
    general: { triggers: list(r.triggers), reliefs: list(r.reliefs), flags: list(r.flags), notes: r.notes ?? '' },
  };
}

export function convertLegacyCpsi(r: LegacyCpsiRow) {
  return {
    code: 'nih-cpsi',
    date: r.date,
    answers: r.answers,
    parts: JSON.stringify([
      { label: 'Dolor', value: r.dolor, max: 21 },
      { label: 'Síntomas urinarios', value: r.urinario, max: 10 },
      { label: 'Calidad de vida', value: r.calidad, max: 12 },
    ]),
    total: r.total,
  };
}
