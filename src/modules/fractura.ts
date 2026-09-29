import type { ModuleDef } from './types.ts';

export const fractura: ModuleDef = {
  id: 'fractura',
  name: 'Recuperación de fractura de pierna',
  emoji: '🦴',
  description: 'Dolor e hinchazón de la pierna, actividad y alertas del material (placas y tornillos).',
  main: { id: 'dolor_pierna', label: '¿Cuánto dolor sentiste en la pierna?', short: 'Dolor de pierna' },
  fields: [
    { kind: 'scale', id: 'dolor_pierna', label: '¿Cuánto dolor sentiste en la pierna?', hint: '0 = nada · 10 = el peor imaginable' },
  ],
  details: [
    {
      kind: 'single', id: 'hinchazon', label: 'Hinchazón',
      items: [
        { id: 'ninguna', label: 'Ninguna' },
        { id: 'leve', label: 'Leve' },
        { id: 'moderada', label: 'Moderada' },
        { id: 'mucha', label: 'Mucha' },
      ],
    },
    {
      kind: 'chips', id: 'zonas', label: '¿Dónde?',
      items: [
        { id: 'tobillo', label: 'Tobillo' },
        { id: 'canilla', label: 'Canilla (tibia)' },
        { id: 'lateral', label: 'Parte externa (peroné)' },
        { id: 'cicatriz', label: 'Cicatriz / zona de las placas' },
        { id: 'rodilla', label: 'Rodilla' },
        { id: 'pie', label: 'Pie' },
      ],
    },
    {
      kind: 'single', id: 'caminata', label: '¿Cuánto caminaste?',
      items: [
        { id: '0', label: 'Casi nada' },
        { id: '15', label: 'Menos de 15 min' },
        { id: '30', label: '15–30 min' },
        { id: '60', label: '30–60 min' },
        { id: '61', label: 'Más de 1 hora' },
      ],
    },
  ],
  triggers: [
    { id: 'mucho_de_pie', label: 'Mucho tiempo de pie' },
    { id: 'escaleras', label: 'Muchas escaleras' },
    { id: 'clima', label: 'Frío / cambio de clima' },
  ],
  reliefs: [
    { id: 'fisioterapia', label: 'Ejercicios de fisioterapia' },
    { id: 'elevar_pierna', label: 'Elevé la pierna' },
    { id: 'frio_local', label: 'Frío local (hielo envuelto)' },
    { id: 'natacion', label: 'Natación / piscina' },
  ],
  redFlags: [
    {
      id: 'tvp', label: 'Pantorrilla hinchada, roja, caliente o dolorosa', urgent: true,
      advice: 'Puede ser un coágulo (trombosis venosa). Acude hoy a emergencia; no te masajees la pierna.',
    },
    {
      id: 'falta_aire', label: 'Falta de aire o dolor de pecho repentinos', urgent: true,
      advice: 'Puede ser un coágulo en el pulmón. Es una emergencia: llama al 106 o acude de inmediato.',
    },
    {
      id: 'golpe', label: 'Dolor fuerte o deformidad después de un golpe o caída', urgent: true,
      advice: 'Podría haber una nueva lesión o un problema con el material. Acude a emergencia para una radiografía.',
    },
    {
      id: 'herida', label: 'Cicatriz roja, caliente, con pus, o fiebre', urgent: false,
      advice: 'Puede ser una infección alrededor del material. Consulta con tu traumatólogo en 24 horas; si hay fiebre, hoy.',
    },
    {
      id: 'hormigueo', label: 'Adormecimiento u hormigueo persistente del pie', urgent: false,
      advice: 'Coméntalo con tu traumatólogo en los próximos días.',
    },
  ],
  medlineTopics: ['Fracturas', 'Lesiones y enfermedades de las piernas', 'Salud ósea'],
};
