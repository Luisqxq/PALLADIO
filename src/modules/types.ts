// Tipos del sistema de módulos: cada condición de salud define qué se
// registra cada día, sus señales de alarma y sus detonantes o alivios.

export type Item = { id: string; label: string };

export type ConditionId = 'prostatitis' | 'colon' | 'fractura' | 'sop' | 'cefalea';

export type Field =
  | { kind: 'scale'; id: string; label: string; hint?: string } // 0–10
  | { kind: 'chips'; id: string; label: string; items: Item[] } // varias opciones
  | { kind: 'single'; id: string; label: string; items: Item[] } // una opción
  | { kind: 'stepper'; id: string; label: string; min: number; max: number; unit?: string };

export type RedFlag = { id: string; label: string; urgent: boolean; advice: string };

export type ModuleDef = {
  id: ConditionId;
  name: string;
  emoji: string;
  description: string;
  // Escala 0–10 principal: se usa en gráficos, patrones y alertas.
  main: { id: string; label: string; short: string };
  // Campos que se muestran siempre (el principal va primero).
  fields: Field[];
  // Campos que se muestran en "Más detalles".
  details: Field[];
  triggers: Item[];
  reliefs: Item[];
  redFlags: RedFlag[];
  questionnaire?: string; // código del cuestionario semanal
  medlineTopics: string[];
};

export type EntryValue = number | string | string[];
export type EntryData = Record<string, EntryValue>;
