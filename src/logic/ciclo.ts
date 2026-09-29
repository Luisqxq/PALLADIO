// Cálculo del ciclo menstrual a partir de los días con regla registrados.
// Un nuevo ciclo empieza el primer día con regla (leve, moderada o abundante)
// después de al menos 7 días sin regla. El manchado no inicia un ciclo.

import { addDays } from './dates.ts';

const STARTS_PERIOD = new Set(['leve', 'moderada', 'abundante']);
const MIN_GAP_DAYS = 7;

export type CycleSummary = {
  periodStarts: string[]; // fechas de inicio, de la más antigua a la más reciente
  lastStart: string | null;
  cycleLengths: number[]; // días entre inicios consecutivos
  averageLength: number | null;
  daysSinceLastStart: number | null;
};

function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

export function summarizeCycle(flowByDate: Record<string, string>, today: string): CycleSummary {
  const bleedingDays = Object.entries(flowByDate)
    .filter(([, flow]) => STARTS_PERIOD.has(flow))
    .map(([d]) => d)
    .sort();

  const starts: string[] = [];
  let lastBleed: string | null = null;
  for (const d of bleedingDays) {
    if (lastBleed === null || daysBetween(lastBleed, d) > MIN_GAP_DAYS) starts.push(d);
    lastBleed = d;
  }

  const lengths = starts.slice(1).map((d, i) => daysBetween(starts[i], d));
  const lastStart = starts.length ? starts[starts.length - 1] : null;
  return {
    periodStarts: starts,
    lastStart,
    cycleLengths: lengths,
    averageLength: lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : null,
    daysSinceLastStart: lastStart ? daysBetween(lastStart, today) : null,
  };
}

export function describeCycle(s: CycleSummary): string[] {
  const lines: string[] = [];
  if (!s.lastStart) return ['Registra los días con regla para ver tu ciclo.'];
  lines.push(`Última regla: hace ${s.daysSinceLastStart} días.`);
  if (s.averageLength !== null) {
    lines.push(`Duración promedio del ciclo: ${s.averageLength} días (${s.cycleLengths.length} ciclos).`);
    if (s.averageLength > 35) lines.push('Ciclos de más de 35 días son frecuentes en el SOP. Coméntalo con tu ginecólogo.');
    if (s.averageLength < 21) lines.push('Ciclos de menos de 21 días: coméntalo con tu ginecólogo.');
  }
  if (s.daysSinceLastStart !== null && s.daysSinceLastStart > 90) {
    lines.push('Más de 3 meses sin regla: consulta con tu ginecólogo.');
  }
  return lines;
}

// Días con analgésico en los últimos 30 días (para avisar del dolor de cabeza
// por uso excesivo de medicamentos).
export function analgesicDays(entries: { date: string; otros?: string[] }[], today: string): number {
  const from = addDays(today, -29);
  return entries.filter((e) => e.date >= from && e.date <= today && (e.otros ?? []).includes('analgesico')).length;
}
