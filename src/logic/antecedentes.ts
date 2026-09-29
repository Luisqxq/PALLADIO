// Antecedentes familiares: recomendaciones de prevención según la enfermedad y
// el grado de parentesco. Orientativas: el médico decide los controles.

export type Degree = 1 | 2 | 3;

export const RELATIVES: { id: string; label: string; degree: Degree }[] = [
  { id: 'padre', label: 'Padre', degree: 1 },
  { id: 'madre', label: 'Madre', degree: 1 },
  { id: 'hermano', label: 'Hermano/a', degree: 1 },
  { id: 'hijo', label: 'Hijo/a', degree: 1 },
  { id: 'abuelo', label: 'Abuelo/a', degree: 2 },
  { id: 'tio', label: 'Tío/a', degree: 2 },
  { id: 'medio_hermano', label: 'Medio hermano/a', degree: 2 },
  { id: 'primo', label: 'Primo/a', degree: 3 },
];

export type FamilyCondition = {
  id: string;
  label: string;
  close: string; // familiar de 1.er grado
  distant: string; // 2.º o 3.er grado
  twoClose?: string; // dos o más familiares de 1.er grado
};

export const FAMILY_CONDITIONS: FamilyCondition[] = [
  {
    id: 'diabetes', label: 'Diabetes tipo 2',
    close: 'Tu riesgo de diabetes es mayor. Hazte glucosa en ayunas o hemoglobina glicosilada (HbA1c) cada 1–3 años, antes de los 35 si tienes sobrepeso. Mantén un peso saludable y actividad física.',
    distant: 'Aumenta un poco tu riesgo. Hazte glucosa en ayunas a partir de los 35 años (antes si tienes sobrepeso), cada 3 años si sale normal.',
  },
  {
    id: 'hipertension', label: 'Presión alta',
    close: 'Mídete la presión al menos una vez al año (en farmacias es gratis o barato). Reduce la sal y mantente activo.',
    distant: 'Mídete la presión al menos una vez al año.',
  },
  {
    id: 'infarto', label: 'Infarto o enfermedad del corazón',
    close: 'Si fue antes de los 55 años (hombre) o 65 (mujer), tu riesgo cardiovascular es mayor: controla colesterol, presión y glucosa, y coméntalo con tu médico.',
    distant: 'Controla tu presión y colesterol periódicamente, y no fumes.',
  },
  {
    id: 'acv', label: 'Derrame cerebral (ACV)',
    close: 'Controla la presión arterial con regularidad; es el principal factor para prevenirlo. No fumes y modera el alcohol.',
    distant: 'Controla tu presión arterial al menos una vez al año.',
  },
  {
    id: 'aneurisma', label: 'Aneurisma cerebral',
    close: 'Con un familiar directo el riesgo sube algo. Lo más importante: controlar la presión, no fumar y moderar el alcohol. Conoce la señal de alarma: un dolor de cabeza súbito, el peor de tu vida, es una emergencia.',
    twoClose: 'Con dos o más familiares directos (padres, hermanos, hijos) con aneurisma, las guías recomiendan hablar con un neurólogo sobre un estudio de detección (angiorresonancia).',
    distant: 'Un familiar lejano casi no cambia tu riesgo. Controla la presión y no fumes.',
  },
  {
    id: 'cancer_prostata', label: 'Cáncer de próstata',
    close: 'Si fue tu padre o hermano, habla con tu urólogo sobre empezar el control (PSA) a partir de los 40–45 años, en lugar de los 50.',
    distant: 'Coméntalo con tu médico al llegar a los 50 años para decidir el control de próstata.',
  },
  {
    id: 'cancer_colon', label: 'Cáncer de colon',
    close: 'Suele recomendarse colonoscopía desde los 40 años o 10 años antes de la edad en que se diagnosticó a tu familiar (lo que ocurra primero). Coméntalo con tu médico.',
    distant: 'Coméntalo con tu médico; en general, el control empieza a los 45 años.',
  },
  {
    id: 'cancer_mama_ovario', label: 'Cáncer de mama u ovario',
    close: 'Coméntalo con tu médico: según la edad del diagnóstico y cuántos familiares, puede convenir empezar antes los controles o una consulta de genética.',
    distant: 'Si hay varios casos en la misma rama de la familia, coméntalo con tu médico.',
  },
  {
    id: 'glaucoma', label: 'Glaucoma',
    close: 'Tu riesgo es varias veces mayor. Hazte un examen de ojos con medida de la presión ocular cada 1–2 años desde los 40 (o antes).',
    distant: 'Hazte un examen de ojos completo a partir de los 40 años.',
  },
  {
    id: 'osteoporosis', label: 'Osteoporosis o fracturas por huesos débiles',
    close: 'Cuida tu calcio, vitamina D y ejercicio con carga. Pregunta a tu médico si conviene una densitometría, sobre todo si ya tuviste una fractura.',
    distant: 'Cuida tu calcio, vitamina D y ejercicio.',
  },
  {
    id: 'colesterol', label: 'Colesterol alto',
    close: 'Hazte un perfil lipídico (colesterol y triglicéridos) desde joven y repítelo según indique tu médico.',
    distant: 'Hazte un perfil lipídico periódicamente.',
  },
  {
    id: 'renal', label: 'Enfermedad de los riñones',
    close: 'Hazte un examen de orina y de creatinina en sangre periódicamente, y controla presión y glucosa.',
    distant: 'Controla presión y glucosa, que son las principales causas de daño renal.',
  },
];

export type FamilyEntry = { relative: string; condition: string };

export type Recommendation = { condition: string; label: string; relatives: string[]; text: string; closest: Degree };

export function degreeOf(relative: string): Degree {
  return RELATIVES.find((r) => r.id === relative)?.degree ?? 3;
}

export function recommendations(entries: FamilyEntry[]): Recommendation[] {
  const result: Recommendation[] = [];
  for (const c of FAMILY_CONDITIONS) {
    const matches = entries.filter((e) => e.condition === c.id);
    if (matches.length === 0) continue;
    const closeCount = matches.filter((e) => degreeOf(e.relative) === 1).length;
    const closest = Math.min(...matches.map((e) => degreeOf(e.relative))) as Degree;
    const text = closeCount >= 2 && c.twoClose ? `${c.close} ${c.twoClose}` : closest === 1 ? c.close : c.distant;
    result.push({
      condition: c.id,
      label: c.label,
      relatives: matches.map((e) => RELATIVES.find((r) => r.id === e.relative)?.label ?? e.relative),
      text,
      closest,
    });
  }
  // Primero lo que involucra a familiares directos.
  return result.sort((a, b) => a.closest - b.closest);
}
