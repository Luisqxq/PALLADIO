// Busca asociaciones simples entre lo que registraste y tu dolor.
// Solo muestra diferencias con suficientes datos. Es una pista, no una prueba.

import type { Item } from './catalog.ts';
import { addDays } from './dates.ts';

export type DayRecord = {
  date: string; // YYYY-MM-DD
  pain: number; // 0–10
  triggers: string[];
  reliefs: string[];
};

export type Pattern = {
  id: string;
  label: string;
  kind: 'detonante' | 'alivio';
  withAvg: number;
  withoutAvg: number;
  diff: number; // withAvg − withoutAvg
  withCount: number;
  withoutCount: number;
};

export const MIN_SAMPLES = 3;
export const MIN_DIFF = 1;

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function compare(
  pairs: { has: boolean; pain: number }[],
  item: Item,
  kind: Pattern['kind'],
): Pattern | null {
  const withP = pairs.filter((p) => p.has).map((p) => p.pain);
  const withoutP = pairs.filter((p) => !p.has).map((p) => p.pain);
  if (withP.length < MIN_SAMPLES || withoutP.length < MIN_SAMPLES) return null;
  const withAvg = avg(withP);
  const withoutAvg = avg(withoutP);
  const diff = withAvg - withoutAvg;
  if (Math.abs(diff) < MIN_DIFF) return null;
  return {
    id: item.id, label: item.label, kind,
    withAvg, withoutAvg, diff,
    withCount: withP.length, withoutCount: withoutP.length,
  };
}

// Detonantes: se comparan con el dolor del DÍA SIGUIENTE (el efecto suele tardar).
// Alivios: se comparan con el dolor del día siguiente también, para no confundir
// "me dolía, por eso me di un baño" con "el baño me hizo doler".
export function findPatterns(records: DayRecord[], triggers: Item[], reliefs: Item[]): Pattern[] {
  const byDate = new Map(records.map((r) => [r.date, r]));
  const pairs = records
    .map((r) => ({ today: r, tomorrow: byDate.get(addDays(r.date, 1)) }))
    .filter((p): p is { today: DayRecord; tomorrow: DayRecord } => !!p.tomorrow);

  const result: Pattern[] = [];
  for (const t of triggers) {
    const p = compare(pairs.map((x) => ({ has: x.today.triggers.includes(t.id), pain: x.tomorrow.pain })), t, 'detonante');
    if (p && p.diff > 0) result.push(p);
  }
  for (const r of reliefs) {
    const p = compare(pairs.map((x) => ({ has: x.today.reliefs.includes(r.id), pain: x.tomorrow.pain })), r, 'alivio');
    if (p && p.diff < 0) result.push(p);
  }
  return result.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}
