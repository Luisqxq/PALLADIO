// Índice de Síntomas de Prostatitis Crónica de los NIH (NIH-CPSI).
// Litwin MS et al., J Urol 1999;162:369-375. Traducción propia al español
// (no es la versión validada oficial); la puntuación es la original.

export type CpsiOption = { label: string; value: number };
export type CpsiQuestion = {
  id: string;
  domain: 'dolor' | 'urinario' | 'calidad';
  text: string;
  options: CpsiOption[];
};

const SI_NO: CpsiOption[] = [
  { label: 'Sí', value: 1 },
  { label: 'No', value: 0 },
];

const FRECUENCIA_VACIADO: CpsiOption[] = [
  { label: 'Nunca', value: 0 },
  { label: 'Menos de 1 vez de cada 5', value: 1 },
  { label: 'Menos de la mitad de las veces', value: 2 },
  { label: 'Alrededor de la mitad de las veces', value: 3 },
  { label: 'Más de la mitad de las veces', value: 4 },
  { label: 'Casi siempre', value: 5 },
];

const CUANTO: CpsiOption[] = [
  { label: 'Nada', value: 0 },
  { label: 'Solo un poco', value: 1 },
  { label: 'Algo', value: 2 },
  { label: 'Mucho', value: 3 },
];

export const CPSI_QUESTIONS: CpsiQuestion[] = [
  { id: 'q1a', domain: 'dolor', text: 'En la última semana, ¿has tenido dolor o molestia en el área entre el recto y los testículos (perineo)?', options: SI_NO },
  { id: 'q1b', domain: 'dolor', text: '¿…en los testículos?', options: SI_NO },
  { id: 'q1c', domain: 'dolor', text: '¿…en la punta del pene (sin relación con orinar)?', options: SI_NO },
  { id: 'q1d', domain: 'dolor', text: '¿…debajo de la cintura, en la zona del pubis o la vejiga?', options: SI_NO },
  { id: 'q2a', domain: 'dolor', text: 'En la última semana, ¿has tenido dolor o ardor al orinar?', options: SI_NO },
  { id: 'q2b', domain: 'dolor', text: '¿Dolor o molestia durante o después de la eyaculación?', options: SI_NO },
  {
    id: 'q3', domain: 'dolor',
    text: '¿Con qué frecuencia has tenido dolor o molestia en cualquiera de esas zonas en la última semana?',
    options: [
      { label: 'Nunca', value: 0 },
      { label: 'Rara vez', value: 1 },
      { label: 'A veces', value: 2 },
      { label: 'A menudo', value: 3 },
      { label: 'Casi siempre', value: 4 },
      { label: 'Siempre', value: 5 },
    ],
  },
  {
    id: 'q4', domain: 'dolor',
    text: '¿Qué número describe mejor tu dolor PROMEDIO los días que lo tuviste en la última semana? (0 = sin dolor, 10 = el peor imaginable)',
    options: Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i })),
  },
  { id: 'q5', domain: 'urinario', text: 'En la última semana, ¿con qué frecuencia sentiste que no vaciabas completamente la vejiga al terminar de orinar?', options: FRECUENCIA_VACIADO },
  { id: 'q6', domain: 'urinario', text: 'En la última semana, ¿con qué frecuencia tuviste que orinar otra vez antes de dos horas de haber orinado?', options: FRECUENCIA_VACIADO },
  { id: 'q7', domain: 'calidad', text: '¿Cuánto te han impedido tus síntomas hacer tus actividades habituales en la última semana?', options: CUANTO },
  { id: 'q8', domain: 'calidad', text: '¿Cuánto pensaste en tus síntomas en la última semana?', options: CUANTO },
  {
    id: 'q9', domain: 'calidad',
    text: 'Si tuvieras que pasar el resto de tu vida con los síntomas de la última semana, ¿cómo te sentirías?',
    options: [
      { label: 'Encantado', value: 0 },
      { label: 'Contento', value: 1 },
      { label: 'Más bien satisfecho', value: 2 },
      { label: 'Ni satisfecho ni insatisfecho', value: 3 },
      { label: 'Más bien insatisfecho', value: 4 },
      { label: 'Descontento', value: 5 },
      { label: 'Fatal', value: 6 },
    ],
  },
];

export type CpsiAnswers = Record<string, number>;

export type CpsiScore = {
  dolor: number; // 0–21
  urinario: number; // 0–10
  calidad: number; // 0–12
  sintomas: number; // dolor + urinario, 0–31
  total: number; // 0–43
  severidad: 'leve' | 'moderada' | 'severa';
};

export function isComplete(answers: CpsiAnswers): boolean {
  return CPSI_QUESTIONS.every((q) => typeof answers[q.id] === 'number');
}

export function scoreCpsi(answers: CpsiAnswers): CpsiScore {
  if (!isComplete(answers)) throw new Error('Cuestionario incompleto');
  const sum = (domain: CpsiQuestion['domain']) =>
    CPSI_QUESTIONS.filter((q) => q.domain === domain).reduce((acc, q) => acc + answers[q.id], 0);
  const dolor = sum('dolor');
  const urinario = sum('urinario');
  const calidad = sum('calidad');
  const sintomas = dolor + urinario;
  const severidad = sintomas <= 9 ? 'leve' : sintomas <= 18 ? 'moderada' : 'severa';
  return { dolor, urinario, calidad, sintomas, total: sintomas + calidad, severidad };
}

// Un descenso de 6 puntos o más en el total se considera una mejoría
// clínicamente importante (Propert AJ et al., J Urol 2006).
export const CAMBIO_IMPORTANTE = 6;

export function describeChange(previousTotal: number, currentTotal: number): string {
  const diff = currentTotal - previousTotal;
  if (diff <= -CAMBIO_IMPORTANTE) return `Mejoraste ${-diff} puntos: es una mejoría importante.`;
  if (diff < 0) return `Bajaste ${-diff} puntos respecto al cuestionario anterior.`;
  if (diff === 0) return 'Igual que el cuestionario anterior.';
  if (diff >= CAMBIO_IMPORTANTE) return `Subiste ${diff} puntos: un empeoramiento marcado. Coméntalo con tu médico.`;
  return `Subiste ${diff} puntos respecto al cuestionario anterior.`;
}
