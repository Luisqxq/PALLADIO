// Hábitos por condición y precauciones cuando se combinan condiciones.

import type { ConditionId } from '../modules/types.ts';

export type Habit = { title: string; text: string; for: ConditionId[] | 'todos' };

export const HABITS: Habit[] = [
  { for: 'todos', title: 'Duerme bien', text: 'Dormir mal aumenta la sensibilidad al dolor. Intenta horarios fijos, también el fin de semana.' },
  { for: 'todos', title: 'Maneja el estrés', text: 'El estrés empeora el dolor pélvico, el colon y el dolor de cabeza. Caminar, respirar lento y hablar con alguien de confianza ayudan. Un psicólogo también puede ayudarte, y no es señal de debilidad.' },
  { for: 'todos', title: 'Toma agua', text: '6 a 8 vasos al día, repartidos. Menos si te levantas mucho de noche a orinar: toma más en la mañana y menos después de las 7 p. m.' },
  { for: ['prostatitis'], title: 'No pases muchas horas sentado', text: 'Levántate cada 30–45 minutos. Usa un cojín en forma de dona o de U para no presionar el perineo.' },
  { for: ['prostatitis'], title: 'Relaja el piso pélvico', text: 'Respiración abdominal lenta: inhala 4 segundos inflando el abdomen, exhala 6 segundos soltando la pelvis. 5 minutos, 2 veces al día.' },
  { for: ['prostatitis'], title: 'Abrígate', text: 'El frío en la zona pélvica empeora las molestias en muchas personas.' },
  { for: ['prostatitis'], title: 'Vida sexual', text: 'En muchas personas, una eyaculación regular (sin exceso) alivia. Si te produce dolor, anótalo y coméntalo con tu urólogo.' },
  { for: ['colon'], title: 'Come despacio y a horas fijas', text: 'Comer rápido o saltarse comidas empeora la hinchazón. Mastica bien y no te acuestes justo después de comer.' },
  { for: ['colon'], title: 'Ve al baño sin apuro', text: 'No aguantes las ganas ni pujes con fuerza. Un banquito bajo los pies ayuda a evacuar.' },
  { for: ['colon'], title: 'Busca tus alimentos problema', text: 'Marca en "¿Qué hubo en el día?" lo que comiste: en unas semanas verás en Evolución qué te cae mal.' },
  { for: ['fractura'], title: 'Camina todos los días', text: 'Sube la distancia de a pocos. Caminar fortalece el hueso y la pierna. Usa zapatillas con buena suela y apoyo.' },
  { for: ['fractura'], title: 'Cuida la hinchazón', text: 'Después de un día de mucha actividad, eleva la pierna. Es normal que se hinche un poco al final del día durante meses.' },
  { for: ['fractura'], title: 'Evita caídas', text: 'Cuidado con pisos mojados, escaleras sin pasamanos y alfombras sueltas mientras recuperas la fuerza y el equilibrio.' },
  { for: ['sop'], title: 'Muévete 150 minutos a la semana', text: 'Caminar rápido, bailar o bicicleta. Ayuda al ciclo, a la insulina y al ánimo, aunque no bajes de peso.' },
  { for: ['sop'], title: 'Registra tu regla', text: 'Marca cada día de regla en Hoy. En Evolución verás la duración de tus ciclos para mostrársela a tu ginecóloga.' },
  { for: ['cefalea'], title: 'Pausas con las pantallas', text: 'Regla 20-20-20: cada 20 minutos, mira a lo lejos 20 segundos. Levántate cada hora. Baja el brillo por la noche.' },
  { for: ['cefalea'], title: 'No te saltes comidas', text: 'El ayuno y la deshidratación disparan el dolor de cabeza. Lleva agua y algo para comer.' },
  { for: ['cefalea'], title: 'Cuidado con los analgésicos', text: 'Tomar analgésicos 10 días o más al mes puede causar más dolor de cabeza. La app te avisa si te pasa.' },
  { for: ['cefalea'], title: 'Lleva tu diario al neurólogo', text: 'Anota cuándo empieza el dolor, cuánto dura y las horas de pantalla. Ese registro ayuda mucho a llegar al diagnóstico.' },
];

export type Precaution = { when: ConditionId[]; title: string; text: string };

// Se muestran solo si el perfil tiene TODAS las condiciones de "when".
export const PRECAUTIONS: Precaution[] = [
  {
    when: ['fractura'], title: 'Tienes placas y tornillos',
    text: 'Avisa siempre que tienes material metálico antes de una resonancia magnética o una tomografía. En aeropuertos puede sonar el detector: lleva tu informe médico. No se retira el material sin indicación del traumatólogo.',
  },
  {
    when: ['fractura'], title: 'Antiinflamatorios (ibuprofeno, naproxeno)',
    text: 'Úsalos por pocos días. De forma prolongada irritan el estómago, suben la presión y afectan los riñones. Si los necesitas seguido, coméntalo con tu médico.',
  },
  {
    when: ['fractura', 'prostatitis'], title: 'Bicicleta: buena para la pierna, mala para la próstata',
    text: 'La bicicleta es un ejercicio de bajo impacto ideal para recuperar la pierna, pero el asiento presiona el perineo y puede empeorar la prostatitis. Usa asiento con hueco central o una bicicleta estática reclinada, y sesiones cortas. La natación ayuda a ambas cosas.',
  },
  {
    when: ['fractura', 'prostatitis'], title: 'Estar sentado y elevar la pierna',
    text: 'Para la hinchazón conviene elevar la pierna, pero estar mucho tiempo sentado empeora la prostatitis. Mejor: elévala recostado, y levántate a caminar un poco cada 30–45 minutos.',
  },
  {
    when: ['fractura', 'colon'], title: 'Calcio y estreñimiento',
    text: 'Los suplementos de calcio (y los analgésicos fuertes) pueden estreñir y empeorar el colon. Prefiere el calcio de los alimentos y aumenta el agua y la fibra soluble.',
  },
  {
    when: ['fractura', 'colon'], title: 'Antiinflamatorios y colon',
    text: 'El ibuprofeno y similares pueden irritar el estómago y empeorar los síntomas digestivos. Para el dolor de la pierna, prioriza frío local, elevación y fisioterapia.',
  },
  {
    when: ['prostatitis', 'colon'], title: 'El estreñimiento empeora el dolor pélvico',
    text: 'Pujar y el estreñimiento tensan el piso pélvico. Fibra soluble, agua y no pujar ayudan a la vez al colon y a la próstata.',
  },
  {
    when: ['prostatitis', 'colon'], title: 'Alimentos que irritan a ambos',
    text: 'El ají, el café, el alcohol y las gaseosas empeoran tanto la próstata como el colon en muchas personas. Son los primeros a probar dejar por 2 semanas.',
  },
  {
    when: ['cefalea', 'sop'], title: 'Azúcar en sangre estable',
    text: 'Saltarse comidas dispara el dolor de cabeza y altera la insulina en el SOP. Come cada 4–5 horas con proteína y fibra; evita los picos de azúcar.',
  },
  {
    when: ['cefalea', 'sop'], title: 'Dolor de cabeza y hormonas',
    text: 'En algunas mujeres el dolor de cabeza aparece alrededor de la regla. Registrar ambos en la app permite ver si hay relación. Si tomas anticonceptivos y tienes migraña con aura (destellos o manchas antes del dolor), coméntalo con tu médico.',
  },
];

export function habitsFor(profile: ConditionId[]): Habit[] {
  return HABITS.filter((h) => h.for === 'todos' || h.for.some((c) => profile.includes(c)));
}

export function precautionsFor(profile: ConditionId[]): Precaution[] {
  return PRECAUTIONS.filter((p) => p.when.every((c) => profile.includes(c)));
}

export const DISCLAIMER =
  'Palladio Health es una guía de apoyo y un diario personal. No da diagnósticos ni reemplaza ' +
  'a tu médico. No dejes ni cambies tus medicamentos sin consultarlo. Ante una señal de alarma, ' +
  'acude a un establecimiento de salud.';
