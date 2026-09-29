// Registro de módulos y utilidades para combinar los del perfil del usuario.

import { cefalea } from './cefalea.ts';
import { colon } from './colon.ts';
import { fractura } from './fractura.ts';
import { prostatitis } from './prostatitis.ts';
import { sop } from './sop.ts';
import type { ConditionId, Item, ModuleDef, RedFlag } from './types.ts';

export const MODULES: ModuleDef[] = [prostatitis, colon, fractura, sop, cefalea];

export const GENERAL_TRIGGERS: Item[] = [
  { id: 'cafe', label: 'Café' },
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'picante', label: 'Ají / picante' },
  { id: 'gaseosa', label: 'Gaseosa' },
  { id: 'fritura', label: 'Frituras' },
  { id: 'estres', label: 'Estrés' },
  { id: 'poco_sueno', label: 'Dormí mal' },
  { id: 'poca_agua', label: 'Tomé poca agua' },
];

export const GENERAL_RELIEFS: Item[] = [
  { id: 'respiracion', label: 'Respiración / relajación' },
  { id: 'caminata', label: 'Caminata' },
  { id: 'infusion', label: 'Infusión (manzanilla, muña…)' },
];

export function isConditionId(id: string): id is ConditionId {
  return MODULES.some((m) => m.id === id);
}

export function getModule(id: ConditionId): ModuleDef {
  const m = MODULES.find((x) => x.id === id);
  if (!m) throw new Error(`Módulo desconocido: ${id}`);
  return m;
}

// Módulos del perfil, siempre en el orden del registro.
export function modulesFor(profile: string[]): ModuleDef[] {
  return MODULES.filter((m) => profile.includes(m.id));
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
}

export function triggersFor(profile: string[]): Item[] {
  return uniqueById([...GENERAL_TRIGGERS, ...modulesFor(profile).flatMap((m) => m.triggers)]);
}

export function reliefsFor(profile: string[]): Item[] {
  return uniqueById([...GENERAL_RELIEFS, ...modulesFor(profile).flatMap((m) => m.reliefs)]);
}

export function redFlagsFor(profile: string[]): RedFlag[] {
  return uniqueById(modulesFor(profile).flatMap((m) => m.redFlags));
}

export function evaluateFlags(ids: string[], flags: RedFlag[]): { urgent: RedFlag[]; soon: RedFlag[] } {
  const selected = flags.filter((f) => ids.includes(f.id));
  return { urgent: selected.filter((f) => f.urgent), soon: selected.filter((f) => !f.urgent) };
}

export function labelOf(items: Item[], id: string): string {
  return items.find((i) => i.id === id)?.label ?? id;
}

// Sanea lo que llega de la base de datos o de un respaldo: solo se aceptan
// números, textos y listas de textos.
export function cleanEntry(raw: unknown): Record<string, number | string | string[]> {
  const out: Record<string, number | string | string[]> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'string') out[k] = v.slice(0, 2000);
    else if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === 'string').slice(0, 50);
  }
  return out;
}
