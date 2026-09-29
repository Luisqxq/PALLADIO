import type { ModuleDef } from './types.ts';

export const cefalea: ModuleDef = {
  id: 'cefalea',
  name: 'Dolor de cabeza',
  emoji: '🟠',
  description: 'Diario del dolor de cabeza con horas de pantalla, síntomas visuales y uso de analgésicos.',
  main: { id: 'intensidad', label: '¿Qué tan fuerte fue el dolor de cabeza?', short: 'Dolor de cabeza' },
  fields: [
    { kind: 'scale', id: 'intensidad', label: '¿Qué tan fuerte fue el dolor de cabeza?', hint: '0 = no tuve · 10 = el peor imaginable' },
    { kind: 'stepper', id: 'laptop', label: 'Horas de laptop / computadora', min: 0, max: 18, unit: 'h' },
    { kind: 'stepper', id: 'celular', label: 'Horas de celular', min: 0, max: 18, unit: 'h' },
  ],
  details: [
    {
      kind: 'single', id: 'duracion', label: '¿Cuánto duró?',
      items: [
        { id: 'no', label: 'No tuve' },
        { id: 'menos1', label: 'Menos de 1 hora' },
        { id: '1a4', label: '1–4 horas' },
        { id: '4a24', label: '4–24 horas' },
        { id: 'mas24', label: 'Más de un día' },
      ],
    },
    {
      kind: 'chips', id: 'zonas', label: '¿Dónde?',
      items: [
        { id: 'frente', label: 'Frente' },
        { id: 'sienes', label: 'Sienes' },
        { id: 'ojos', label: 'Detrás de los ojos' },
        { id: 'nuca', label: 'Nuca / cuello' },
        { id: 'un_lado', label: 'Un solo lado' },
        { id: 'toda', label: 'Toda la cabeza' },
      ],
    },
    {
      kind: 'chips', id: 'vision', label: 'Síntomas de la vista',
      items: [
        { id: 'borrosa', label: 'Visión borrosa' },
        { id: 'cansancio_ojos', label: 'Ojos cansados o secos' },
        { id: 'luz', label: 'Molestia con la luz' },
        { id: 'destellos', label: 'Destellos o manchas antes del dolor' },
      ],
    },
    {
      kind: 'chips', id: 'otros', label: 'Otros',
      items: [
        { id: 'nauseas', label: 'Náuseas' },
        { id: 'ruido', label: 'Molestia con el ruido' },
        { id: 'mareo', label: 'Mareo' },
        { id: 'analgesico', label: 'Tomé analgésico' },
      ],
    },
  ],
  triggers: [
    { id: 'pantalla_larga', label: 'Mucho rato seguido en pantalla' },
    { id: 'celular_noche', label: 'Celular antes de dormir' },
    { id: 'salte_comida', label: 'Me salté una comida' },
    { id: 'luz_fuerte', label: 'Luz fuerte / sol' },
  ],
  reliefs: [
    { id: 'pausas_20', label: 'Pausas 20-20-20' },
    { id: 'oscuridad', label: 'Descansé a oscuras' },
    { id: 'hidratacion', label: 'Tomé agua' },
    { id: 'masaje_cuello', label: 'Masaje / estiramiento de cuello' },
  ],
  redFlags: [
    {
      id: 'trueno', label: 'Dolor súbito, el peor de mi vida, que llega al máximo en segundos o minutos', urgent: true,
      advice: 'Es una señal de alarma (puede ser un sangrado cerebral). Llama al 106 o acude a emergencia de inmediato.',
    },
    {
      id: 'neuro', label: 'Pérdida de visión, visión doble, debilidad, dificultad para hablar o confusión', urgent: true,
      advice: 'Pueden ser síntomas neurológicos graves. Acude a emergencia de inmediato.',
    },
    {
      id: 'fiebre_cuello', label: 'Fiebre con cuello rígido', urgent: true,
      advice: 'Puede ser una infección de las meninges. Acude a emergencia de inmediato.',
    },
    {
      id: 'golpe_cabeza', label: 'Dolor de cabeza después de un golpe en la cabeza', urgent: true,
      advice: 'Acude a emergencia para una evaluación, sobre todo si hay vómitos, somnolencia o confusión.',
    },
    {
      id: 'cambio_patron', label: 'El dolor empeora semana a semana, cambió de forma o me despierta de noche', urgent: false,
      advice: 'Un cambio en el patrón del dolor debe revisarlo tu neurólogo pronto. Lleva tu diario de la app.',
    },
  ],
  medlineTopics: ['Dolor de cabeza', 'Migraña', 'Fatiga visual'],
};
