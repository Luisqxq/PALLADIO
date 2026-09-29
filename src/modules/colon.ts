import type { ModuleDef } from './types.ts';

// Escala de Bristol: forma de las heces, del 1 (estreñimiento) al 7 (diarrea).
export const BRISTOL = [
  { id: 'no', label: 'No fui al baño' },
  { id: '1', label: '1 · Bolitas duras separadas' },
  { id: '2', label: '2 · Salchicha con grumos' },
  { id: '3', label: '3 · Salchicha con grietas' },
  { id: '4', label: '4 · Salchicha lisa y blanda (ideal)' },
  { id: '5', label: '5 · Trozos blandos' },
  { id: '6', label: '6 · Pastosa' },
  { id: '7', label: '7 · Líquida' },
];

export const colon: ModuleDef = {
  id: 'colon',
  name: 'Colon irritable',
  emoji: '🟢',
  description: 'Dolor abdominal, hinchazón, deposiciones (escala de Bristol) y cuestionario IBS-SSS.',
  main: { id: 'dolor_abdominal', label: '¿Cuánto dolor abdominal sentiste?', short: 'Dolor abdominal' },
  fields: [
    { kind: 'scale', id: 'dolor_abdominal', label: '¿Cuánto dolor abdominal sentiste?', hint: '0 = nada · 10 = el peor imaginable' },
    { kind: 'single', id: 'bristol', label: '¿Cómo fue tu deposición? (escala de Bristol)', items: BRISTOL },
  ],
  details: [
    { kind: 'scale', id: 'hinchazon', label: '¿Cuánta hinchazón o gases?' },
    { kind: 'stepper', id: 'deposiciones', label: '¿Cuántas veces fuiste al baño (deposición)?', min: 0, max: 15 },
    {
      kind: 'chips', id: 'sintomas', label: 'Otros síntomas',
      items: [
        { id: 'urgencia', label: 'Urgencia' },
        { id: 'incompleta', label: 'Sensación de no terminar' },
        { id: 'moco', label: 'Moco en las heces' },
        { id: 'gases', label: 'Muchos gases' },
        { id: 'nauseas', label: 'Náuseas' },
        { id: 'acidez', label: 'Acidez / reflujo' },
      ],
    },
  ],
  triggers: [
    { id: 'lacteos', label: 'Leche / lácteos' },
    { id: 'menestras', label: 'Menestras' },
    { id: 'cebolla_ajo', label: 'Cebolla / ajo' },
    { id: 'harinas', label: 'Pan / harinas' },
    { id: 'dulces', label: 'Dulces' },
    { id: 'comi_rapido', label: 'Comí muy rápido o muy tarde' },
  ],
  reliefs: [
    { id: 'fibra', label: 'Fibra soluble / linaza' },
    { id: 'menta', label: 'Aceite de menta' },
    { id: 'comer_despacio', label: 'Comí despacio' },
  ],
  redFlags: [
    {
      id: 'dolor_abdominal_intenso', label: 'Dolor abdominal intenso y constante, o abdomen duro', urgent: true,
      advice: 'Un dolor abdominal intenso que no cede, sobre todo con abdomen duro, fiebre o vómitos, requiere emergencia.',
    },
    {
      id: 'sangre_heces', label: 'Sangre en las heces o heces negras', urgent: false,
      advice: 'Consulta con tu médico. Si es abundante, o hay mareo o debilidad, acude a emergencia.',
    },
    {
      id: 'perdida_peso', label: 'Bajé de peso sin buscarlo', urgent: false,
      advice: 'La pérdida de peso sin causa no es propia del colon irritable. Coméntalo con tu médico.',
    },
    {
      id: 'diarrea_nocturna', label: 'Diarrea que me despierta de noche', urgent: false,
      advice: 'La diarrea que despierta de noche no es típica del colon irritable. Consulta con tu médico.',
    },
  ],
  questionnaire: 'ibs-sss',
  medlineTopics: ['Síndrome del intestino irritable', 'Fibra dietética', 'Gases'],
};
