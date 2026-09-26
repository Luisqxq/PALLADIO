// Listas fijas que se usan en el registro diario.

export type Item = { id: string; label: string };

export const PAIN_LOCATIONS: Item[] = [
  { id: 'perineo', label: 'Perineo' },
  { id: 'testiculos', label: 'Testículos' },
  { id: 'pene', label: 'Pene' },
  { id: 'pubis', label: 'Bajo vientre / pubis' },
  { id: 'espalda', label: 'Espalda baja' },
  { id: 'recto', label: 'Recto / ano' },
];

export const URINARY_SYMPTOMS: Item[] = [
  { id: 'urgencia', label: 'Urgencia' },
  { id: 'ardor', label: 'Ardor al orinar' },
  { id: 'chorro_debil', label: 'Chorro débil' },
  { id: 'vaciado_incompleto', label: 'Vaciado incompleto' },
  { id: 'frecuencia', label: 'Orinar muy seguido' },
  { id: 'dolor_eyacular', label: 'Molestia al eyacular' },
];

// Posibles detonantes. Se comparan con el dolor del día siguiente.
export const TRIGGERS: Item[] = [
  { id: 'cafe', label: 'Café' },
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'picante', label: 'Ají / picante' },
  { id: 'gaseosa', label: 'Gaseosa' },
  { id: 'fritura', label: 'Frituras' },
  { id: 'sentado', label: 'Muchas horas sentado' },
  { id: 'estres', label: 'Estrés' },
  { id: 'frio', label: 'Frío' },
  { id: 'poco_sueno', label: 'Dormí mal' },
  { id: 'poca_agua', label: 'Tomé poca agua' },
  { id: 'bicicleta', label: 'Bicicleta / moto' },
  { id: 'relaciones', label: 'Relaciones / eyaculación' },
];

// Cosas que hiciste para sentirte mejor.
export const RELIEFS: Item[] = [
  { id: 'bano_asiento', label: 'Baño de asiento tibio' },
  { id: 'bano_geranio', label: 'Baño con geranio' },
  { id: 'estiramientos', label: 'Estiramientos pélvicos' },
  { id: 'respiracion', label: 'Respiración / relajación' },
  { id: 'caminata', label: 'Caminata' },
  { id: 'cojin', label: 'Cojín al sentarme' },
  { id: 'calor', label: 'Calor local' },
  { id: 'infusion', label: 'Infusión (manzanilla, muña…)' },
];

export function labelFor(list: Item[], id: string): string {
  return list.find((i) => i.id === id)?.label ?? id;
}
