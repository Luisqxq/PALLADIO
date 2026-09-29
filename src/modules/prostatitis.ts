import type { ModuleDef } from './types.ts';

export const prostatitis: ModuleDef = {
  id: 'prostatitis',
  name: 'Prostatitis crónica',
  emoji: '🔵',
  description: 'Dolor pélvico, síntomas al orinar y cuestionario NIH-CPSI.',
  main: { id: 'dolor', label: '¿Cuánto dolor pélvico sentiste?', short: 'Dolor pélvico' },
  fields: [
    { kind: 'scale', id: 'dolor', label: '¿Cuánto dolor pélvico sentiste?', hint: '0 = nada · 10 = el peor imaginable' },
  ],
  details: [
    {
      kind: 'chips', id: 'zonas', label: '¿Dónde?',
      items: [
        { id: 'perineo', label: 'Perineo' },
        { id: 'testiculos', label: 'Testículos' },
        { id: 'pene', label: 'Pene' },
        { id: 'pubis', label: 'Bajo vientre / pubis' },
        { id: 'espalda', label: 'Espalda baja' },
        { id: 'recto', label: 'Recto / ano' },
      ],
    },
    {
      kind: 'chips', id: 'orina', label: 'Al orinar',
      items: [
        { id: 'urgencia', label: 'Urgencia' },
        { id: 'ardor', label: 'Ardor al orinar' },
        { id: 'chorro_debil', label: 'Chorro débil' },
        { id: 'vaciado_incompleto', label: 'Vaciado incompleto' },
        { id: 'frecuencia', label: 'Orinar muy seguido' },
        { id: 'dolor_eyacular', label: 'Molestia al eyacular' },
      ],
    },
    { kind: 'stepper', id: 'nocturia', label: '¿Cuántas veces te levantaste de noche a orinar?', min: 0, max: 10 },
  ],
  triggers: [
    { id: 'sentado', label: 'Muchas horas sentado' },
    { id: 'frio', label: 'Frío' },
    { id: 'bicicleta', label: 'Bicicleta / moto' },
    { id: 'relaciones', label: 'Relaciones / eyaculación' },
  ],
  reliefs: [
    { id: 'bano_asiento', label: 'Baño de asiento tibio' },
    { id: 'bano_geranio', label: 'Baño con geranio' },
    { id: 'estiramientos', label: 'Estiramientos pélvicos' },
    { id: 'cojin', label: 'Cojín al sentarme' },
    { id: 'calor', label: 'Calor local' },
  ],
  redFlags: [
    {
      id: 'fiebre', label: 'Fiebre o escalofríos con dolor pélvico o al orinar', urgent: true,
      advice: 'Fiebre con dolor pélvico o al orinar puede ser una prostatitis bacteriana aguda. Acude hoy a emergencia.',
    },
    {
      id: 'no_orina', label: 'No puedo orinar', urgent: true,
      advice: 'La retención de orina es una urgencia. Acude a emergencia de inmediato.',
    },
    {
      id: 'dolor_testicular_subito', label: 'Dolor testicular fuerte y repentino', urgent: true,
      advice: 'Un dolor testicular súbito e intenso puede ser una torsión. Es una urgencia: acude de inmediato.',
    },
    {
      id: 'sangre_orina', label: 'Sangre en la orina', urgent: false,
      advice: 'Pide una cita con tu médico o urólogo en los próximos días. Si es abundante o con coágulos, acude a emergencia.',
    },
    {
      id: 'sangre_semen', label: 'Sangre en el semen', urgent: false,
      advice: 'Suele no ser grave, pero debe revisarlo tu urólogo.',
    },
  ],
  questionnaire: 'nih-cpsi',
  medlineTopics: ['Prostatitis', 'Enfermedades de la próstata', 'Dolor pélvico'],
};
