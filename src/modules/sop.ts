import type { ModuleDef } from './types.ts';

export const SOP_FLOW = [
  { id: 'no', label: 'Sin regla' },
  { id: 'manchado', label: 'Manchado' },
  { id: 'leve', label: 'Leve' },
  { id: 'moderada', label: 'Moderada' },
  { id: 'abundante', label: 'Abundante' },
];

export const sop: ModuleDef = {
  id: 'sop',
  name: 'Síndrome de ovario poliquístico',
  emoji: '🟣',
  description: 'Ciclo menstrual, síntomas y malestar general.',
  main: { id: 'malestar', label: '¿Cuánto malestar general sentiste?', short: 'Malestar (SOP)' },
  fields: [
    { kind: 'scale', id: 'malestar', label: '¿Cuánto malestar general sentiste?', hint: '0 = nada · 10 = muchísimo' },
    { kind: 'single', id: 'regla', label: 'Regla hoy', items: SOP_FLOW },
  ],
  details: [
    {
      kind: 'chips', id: 'sintomas', label: 'Síntomas',
      items: [
        { id: 'colicos', label: 'Cólicos' },
        { id: 'dolor_pelvico', label: 'Dolor pélvico' },
        { id: 'hinchazon', label: 'Hinchazón' },
        { id: 'acne', label: 'Acné' },
        { id: 'animo', label: 'Cambios de ánimo' },
        { id: 'cansancio', label: 'Cansancio' },
        { id: 'antojos', label: 'Antojos de dulce' },
        { id: 'mamas', label: 'Dolor de mamas' },
      ],
    },
  ],
  triggers: [
    { id: 'dulces', label: 'Dulces' },
    { id: 'harinas', label: 'Pan / harinas' },
    { id: 'sedentario', label: 'Día sin actividad física' },
  ],
  reliefs: [
    { id: 'ejercicio', label: 'Ejercicio (30 min o más)' },
    { id: 'calor', label: 'Calor local' },
  ],
  redFlags: [
    {
      id: 'sangrado_abundante', label: 'Sangrado que empapa una toalla o tampón cada hora, por más de 2 horas', urgent: true,
      advice: 'Es un sangrado muy abundante. Acude hoy a emergencia, sobre todo si hay mareo o debilidad.',
    },
    {
      id: 'dolor_pelvico_subito', label: 'Dolor pélvico súbito e intenso, con náuseas o desmayo', urgent: true,
      advice: 'Puede ser un quiste roto o una torsión de ovario. Es una urgencia: acude de inmediato.',
    },
    {
      id: 'sin_regla', label: 'Más de 3 meses sin regla', urgent: false,
      advice: 'Consulta con tu ginecólogo (y descarta un embarazo). No es bueno pasar mucho tiempo sin regla.',
    },
  ],
  medlineTopics: ['Síndrome de ovario poliquístico', 'Menstruación', 'Resistencia a la insulina'],
};
