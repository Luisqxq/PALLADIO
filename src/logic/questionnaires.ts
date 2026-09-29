// Cuestionarios semanales validados, con una forma común.

import { CPSI_QUESTIONS, describeChange as cpsiChange, scoreCpsi } from './cpsi.ts';

export type QOption = { label: string; value: number };
export type QQuestion = { id: string; text: string; options: QOption[] };
export type QAnswers = Record<string, number>;

export type QScore = {
  total: number;
  parts: { label: string; value: number; max: number }[];
  severity: string;
};

export type QuestionnaireDef = {
  code: string;
  name: string;
  module: string;
  intro: string;
  maxTotal: number;
  questions: QQuestion[];
  score: (a: QAnswers) => QScore;
  describeChange: (previousTotal: number, currentTotal: number) => string;
  source: string;
};

export function isComplete(def: QuestionnaireDef, a: QAnswers): boolean {
  return def.questions.every((q) => typeof a[q.id] === 'number');
}

// ---------- NIH-CPSI (prostatitis crónica) ----------

export const NIH_CPSI: QuestionnaireDef = {
  code: 'nih-cpsi',
  name: 'NIH-CPSI',
  module: 'prostatitis',
  intro: 'El cuestionario que usan los urólogos para medir la prostatitis crónica. Toma 2 minutos. Responde pensando en la última semana.',
  maxTotal: 43,
  questions: CPSI_QUESTIONS.map(({ id, text, options }) => ({ id, text, options })),
  score: (a) => {
    const s = scoreCpsi(a);
    return {
      total: s.total,
      parts: [
        { label: 'Dolor', value: s.dolor, max: 21 },
        { label: 'Síntomas urinarios', value: s.urinario, max: 10 },
        { label: 'Calidad de vida', value: s.calidad, max: 12 },
      ],
      severity: `Síntomas de intensidad ${s.severidad}`,
    };
  },
  describeChange: cpsiChange,
  source: 'Litwin MS et al., J Urol 1999. Bajar 6 puntos o más es una mejoría importante.',
};

// ---------- IBS-SSS (colon irritable) ----------
// Francis CY et al., Aliment Pharmacol Ther 1997. Cinco ítems de 0 a 100.

const PERCENT: QOption[] = Array.from({ length: 11 }, (_, i) => ({ label: String(i * 10), value: i * 10 }));

export const IBS_SSS: QuestionnaireDef = {
  code: 'ibs-sss',
  name: 'IBS-SSS',
  module: 'colon',
  intro: 'Escala de gravedad del colon irritable, usada por gastroenterólogos. Responde pensando en los últimos 10 días. 0 es nada y 100 es lo máximo.',
  maxTotal: 500,
  questions: [
    { id: 'dolor', text: '¿Qué tan fuerte fue tu dolor abdominal? (0 si no tuviste)', options: PERCENT },
    {
      id: 'dias', text: '¿Cuántos de los últimos 10 días tuviste dolor abdominal?',
      options: Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i })),
    },
    { id: 'hinchazon', text: '¿Qué tan fuerte fue la hinchazón o distensión del abdomen? (0 si no tuviste)', options: PERCENT },
    { id: 'insatisfaccion', text: '¿Qué tan insatisfecho estás con cómo vas al baño? (0 = muy satisfecho, 100 = muy insatisfecho)', options: PERCENT },
    { id: 'interferencia', text: '¿Cuánto afecta el colon a tu vida diaria? (0 = nada, 100 = completamente)', options: PERCENT },
  ],
  score: (a) => {
    const parts = [
      { label: 'Dolor', value: a.dolor, max: 100 },
      { label: 'Días con dolor', value: a.dias * 10, max: 100 },
      { label: 'Hinchazón', value: a.hinchazon, max: 100 },
      { label: 'Insatisfacción con el baño', value: a.insatisfaccion, max: 100 },
      { label: 'Impacto en tu vida', value: a.interferencia, max: 100 },
    ];
    const total = parts.reduce((s, p) => s + p.value, 0);
    const severity = total < 75 ? 'En remisión o síntomas mínimos'
      : total < 175 ? 'Colon irritable leve'
      : total < 300 ? 'Colon irritable moderado'
      : 'Colon irritable severo';
    return { total, parts, severity };
  },
  describeChange: (prev, curr) => {
    const diff = curr - prev;
    if (diff <= -50) return `Mejoraste ${-diff} puntos: es una mejoría importante.`;
    if (diff < 0) return `Bajaste ${-diff} puntos respecto al cuestionario anterior.`;
    if (diff === 0) return 'Igual que el cuestionario anterior.';
    if (diff >= 50) return `Subiste ${diff} puntos: un empeoramiento marcado. Coméntalo con tu médico.`;
    return `Subiste ${diff} puntos respecto al cuestionario anterior.`;
  },
  source: 'Francis CY et al., 1997. Bajar 50 puntos o más es una mejoría importante.',
};

export const QUESTIONNAIRES: QuestionnaireDef[] = [NIH_CPSI, IBS_SSS];

export function questionnaireFor(code: string): QuestionnaireDef | undefined {
  return QUESTIONNAIRES.find((q) => q.code === code);
}
