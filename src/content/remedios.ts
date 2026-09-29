// Remedios y medidas de apoyo, con su nivel de evidencia.
// Esta información es orientativa. Antes de tomar cualquier planta o
// suplemento, consúltalo con tu médico, sobre todo si tomas medicamentos.

import type { ConditionId } from '../modules/types.ts';

export type Evidence = 'respaldo' | 'preliminar' | 'tradicional' | 'sin_beneficio';

export const EVIDENCE_INFO: Record<Evidence, { label: string; color: string; bg: string; detail: string }> = {
  respaldo: {
    label: 'Respaldo científico', color: '#1E5E3E', bg: '#DFF2E7',
    detail: 'Hay ensayos clínicos en personas que muestran beneficio.',
  },
  preliminar: {
    label: 'Evidencia preliminar', color: '#7A5200', bg: '#FFF1D6',
    detail: 'Hay estudios pequeños o de laboratorio prometedores, pero no concluyentes.',
  },
  tradicional: {
    label: 'Uso tradicional', color: '#4A4A4A', bg: '#ECECEC',
    detail: 'Se usa desde hace generaciones, pero no hay estudios clínicos todavía. No quiere decir que no funcione.',
  },
  sin_beneficio: {
    label: 'Estudiado: sin beneficio', color: '#8A1C1C', bg: '#FBE3E1',
    detail: 'Se estudió en personas con este problema y no mostró un beneficio claro.',
  },
};

export type Remedy = {
  id: string;
  name: string;
  for: ConditionId[];
  evidence: Evidence;
  summary: string;
  how?: string;
  cautions: string;
  source: string;
};

export const REMEDIES: Remedy[] = [
  // ---------- Próstata (prostatitis crónica / dolor pélvico crónico) ----------
  {
    id: 'bano_asiento', name: 'Baño de asiento con agua tibia', for: ['prostatitis'], evidence: 'preliminar',
    summary: 'El agua tibia relaja los músculos del piso pélvico y suele aliviar el dolor. Los urólogos la recomiendan como medida de apoyo: hay pocos estudios formales, pero es segura y barata.',
    how: 'Siéntate en una tina o recipiente con agua tibia (no caliente) que cubra caderas y glúteos, 15–20 minutos, 1 o 2 veces al día.',
    cautions: 'Prueba la temperatura con el codo antes de sentarte. Evítalo si tienes heridas abiertas en la zona.',
    source: 'Recomendación habitual en urología como medida de apoyo (terapia de calor local).',
  },
  {
    id: 'piso_pelvico', name: 'Fisioterapia de piso pélvico', for: ['prostatitis'], evidence: 'respaldo',
    summary: 'La terapia manual y los ejercicios de relajación del piso pélvico mejoraron los síntomas en ensayos clínicos. Muchas veces el dolor viene de músculos tensos, no de infección.',
    how: 'Lo ideal es con un fisioterapeuta especializado en piso pélvico. En casa: respiración abdominal lenta y estiramientos suaves de cadera (postura del niño, mariposa).',
    cautions: 'Evita los ejercicios de "apretar" (Kegel) si tu problema es tensión: pueden empeorar el dolor. Pregúntale al fisioterapeuta.',
    source: 'FitzGerald MP et al., J Urol 2009 y 2012 (ensayos clínicos).',
  },
  {
    id: 'acupuntura', name: 'Acupuntura', for: ['prostatitis'], evidence: 'respaldo',
    summary: 'Un ensayo clínico grande mostró mejoría de los síntomas frente a acupuntura simulada, que se mantuvo meses después.',
    cautions: 'Solo con profesionales con agujas descartables y estériles.',
    source: 'Sun Y et al., Annals of Internal Medicine 2021.',
  },
  {
    id: 'polen', name: 'Extracto de polen (Cernilton)', for: ['prostatitis'], evidence: 'respaldo',
    summary: 'Una revisión Cochrane encontró que probablemente reduce los síntomas de prostatitis crónica, con muy pocos efectos adversos.',
    cautions: 'Evítalo si eres alérgico al polen. Consulta a tu médico.',
    source: 'Franco JVA et al., Revisión Cochrane 2019 (tratamientos farmacológicos y fitoterapia).',
  },
  {
    id: 'quercetina', name: 'Quercetina', for: ['prostatitis'], evidence: 'preliminar',
    summary: 'Es un antioxidante presente en la cebolla, la manzana y el té. Un ensayo pequeño mostró mejoría del dolor en prostatitis crónica.',
    how: 'En estudios se usó en cápsulas (500 mg dos veces al día). Consulta la dosis con tu médico.',
    cautions: 'Puede interactuar con algunos antibióticos (quinolonas) y anticoagulantes.',
    source: 'Shoskes DA et al., Urology 1999.',
  },
  {
    id: 'geranio', name: 'Baños con geranio', for: ['prostatitis', 'colon'], evidence: 'tradicional',
    summary: 'Muy usado en la medicina tradicional peruana para desinflamar. No hay estudios clínicos en prostatitis. Parte de su alivio probablemente viene del agua tibia, que relaja el piso pélvico.',
    how: 'Hierve un puñado de hojas y flores de geranio en 2–3 litros de agua por 5–10 minutos, cuela y deja entibiar. Úsalo como baño de asiento de 15–20 minutos.',
    cautions: 'Usa el agua tibia, nunca caliente. Solo uso externo. Suspende si notas irritación o picazón en la piel.',
    source: 'Uso tradicional andino. Sin ensayos clínicos publicados.',
  },
  {
    id: 'calabaza', name: 'Semillas de calabaza (pepitas)', for: ['prostatitis'], evidence: 'preliminar',
    summary: 'Son ricas en zinc. Hay estudios en próstata agrandada (hiperplasia), no en prostatitis. Son un alimento sano y barato.',
    how: 'Un puñado (unos 30 g) al día, tostadas sin sal.',
    cautions: 'Son muy calóricas: no más de un puñado al día.',
    source: 'Vahlensieck W et al., Urologia Internationalis 2015 (hiperplasia).',
  },
  {
    id: 'cola_caballo', name: 'Cola de caballo (infusión)', for: ['prostatitis'], evidence: 'tradicional',
    summary: 'Se usa tradicionalmente como diurético (hace orinar más).',
    cautions: 'No la tomes por más de 2 semanas seguidas. Evítala si tienes problemas de riñón o corazón, o si tomas diuréticos o litio. Puede bajar la vitamina B1.',
    source: 'NCCIH (Institutos Nacionales de Salud de EE. UU.).',
  },
  {
    id: 'saw_palmetto', name: 'Saw palmetto (palma enana)', for: ['prostatitis'], evidence: 'sin_beneficio',
    summary: 'Se vende mucho "para la próstata", pero en un estudio de un año en prostatitis crónica no produjo una mejoría duradera. Para este problema, mejor no gastar en él.',
    cautions: 'Puede interactuar con anticoagulantes.',
    source: 'Kaplan SA et al., J Urol 2004.',
  },
  {
    id: 'una_gato', name: 'Uña de gato', for: ['prostatitis', 'colon'], evidence: 'preliminar',
    summary: 'Planta amazónica con efecto antiinflamatorio en estudios de laboratorio y ensayos pequeños (artrosis). No hay estudios en prostatitis.',
    cautions: 'Puede interactuar con anticoagulantes, medicinas para la presión y para el sistema inmune. Evítala si tienes una enfermedad autoinmune.',
    source: 'NCCIH; Piscoya J et al., Inflammation Research 2001.',
  },
  // ---------- Colon (colon irritable) ----------
  {
    id: 'menta', name: 'Aceite de menta en cápsulas', for: ['colon'], evidence: 'respaldo',
    summary: 'Las cápsulas con cubierta entérica reducen el dolor y la hinchazón del colon irritable en varios ensayos clínicos.',
    cautions: 'Puede empeorar la acidez o el reflujo. Consulta la dosis con tu médico.',
    source: 'Colegio Americano de Gastroenterología (ACG), guía 2021.',
  },
  {
    id: 'psyllium', name: 'Fibra soluble (psyllium / linaza)', for: ['colon'], evidence: 'respaldo',
    summary: 'La fibra soluble mejora los síntomas del colon irritable. La linaza molida es una opción barata con evidencia más limitada.',
    how: 'Empieza con poco (1 cucharadita) y sube de a pocos, siempre con bastante agua.',
    cautions: 'Tómala separada 2 horas de tus medicamentos. Si aumentas muy rápido, puede dar gases.',
    source: 'ACG, guía 2021.',
  },
  {
    id: 'fodmap', name: 'Dieta baja en FODMAP', for: ['colon'], evidence: 'respaldo',
    summary: 'Reducir por unas semanas ciertos alimentos que fermentan (cebolla, ajo, menestras, algunas frutas y lácteos) y luego reintroducirlos de a uno ayuda a encontrar qué te cae mal.',
    cautions: 'No es para siempre. Idealmente guiada por un nutricionista.',
    source: 'ACG, guía 2021.',
  },
  {
    id: 'manzanilla', name: 'Manzanilla (infusión)', for: ['colon', 'prostatitis'], evidence: 'tradicional',
    summary: 'Uso tradicional para calmar el estómago y relajar. Hay pocos estudios clínicos.',
    cautions: 'Evítala si eres alérgico a plantas como el girasol o la margarita. Puede interactuar con anticoagulantes (warfarina).',
    source: 'NCCIH.',
  },
  {
    id: 'muna', name: 'Muña (infusión)', for: ['colon'], evidence: 'tradicional',
    summary: 'Planta andina usada tradicionalmente para los gases, la hinchazón y la digestión.',
    cautions: 'Con moderación: 1 o 2 tazas al día. Evítala en el embarazo.',
    source: 'Uso tradicional andino.',
  },
  {
    id: 'curcuma', name: 'Cúrcuma (palillo)', for: ['colon', 'prostatitis'], evidence: 'preliminar',
    summary: 'Tiene efecto antiinflamatorio en estudios de laboratorio. En personas, la evidencia es limitada y se absorbe poco (mejora con pimienta negra y grasa).',
    how: 'Como condimento en las comidas.',
    cautions: 'En cápsulas, puede interactuar con anticoagulantes. Evítala si tienes cálculos en la vesícula.',
    source: 'NCCIH.',
  },
  // ---------- Fractura (recuperación, con placas y tornillos) ----------
  {
    id: 'fisio_pierna', name: 'Fisioterapia y ejercicio progresivo', for: ['fractura'], evidence: 'respaldo',
    summary: 'Los ejercicios guiados de fuerza, equilibrio y movilidad del tobillo son lo que más ayuda a recuperar la marcha después de una fractura de tibia y peroné.',
    how: 'Sigue la rutina de tu fisioterapeuta. Caminar a diario, subir de a pocos la distancia, y ejercicios de tobillo (círculos, puntas y talones).',
    cautions: 'Si un ejercicio aumenta mucho el dolor o la hinchazón al día siguiente, bájale la intensidad y coméntalo con tu fisioterapeuta.',
    source: 'Guías de rehabilitación tras fractura de tibia; consenso de traumatología.',
  },
  {
    id: 'calcio_vitd', name: 'Calcio y vitamina D', for: ['fractura'], evidence: 'respaldo',
    summary: 'Son necesarios para que el hueso se mantenga fuerte. Lo mejor es obtenerlos de los alimentos y del sol; los suplementos, solo si tu médico ve que te faltan.',
    how: 'Calcio: yogur, queso fresco, sardinas o caballa en lata (con espinas), hojas verdes, tarwi. Vitamina D: 15 minutos de sol en brazos y piernas, pescado azul, huevo.',
    cautions: 'Los suplementos de calcio pueden estreñir (ojo con el colon) y no conviene tomarlos sin indicación si tienes cálculos renales.',
    source: 'NIH Office of Dietary Supplements; guías de salud ósea.',
  },
  {
    id: 'proteina', name: 'Proteína suficiente', for: ['fractura'], evidence: 'respaldo',
    summary: 'El hueso y el músculo se reparan con proteína. Comer proteína en cada comida ayuda a recuperar fuerza en la pierna.',
    how: 'Huevo, pescado, pollo, menestras, quinua o tarwi en cada comida principal.',
    cautions: 'Si tienes enfermedad renal, consulta la cantidad con tu médico.',
    source: 'Consenso de nutrición en rehabilitación ortopédica.',
  },
  {
    id: 'frio_elevacion', name: 'Frío local y elevar la pierna', for: ['fractura'], evidence: 'preliminar',
    summary: 'Ayudan a bajar la hinchazón después de un día de mucha actividad.',
    how: 'Eleva la pierna por encima del corazón 15–20 minutos. Frío: hielo envuelto en una toalla, 10–15 minutos.',
    cautions: 'Nunca el hielo directo sobre la piel ni sobre la cicatriz. Si la hinchazón no baja con reposo, consulta.',
    source: 'Práctica habitual en traumatología.',
  },
  {
    id: 'colageno', name: 'Colágeno', for: ['fractura'], evidence: 'preliminar',
    summary: 'Algunos estudios pequeños sugieren beneficio para huesos y articulaciones, pero la evidencia es limitada. Una dieta con proteína suficiente cubre lo esencial.',
    cautions: 'Es caro: prioriza la comida. Consulta si tienes problemas renales.',
    source: 'Revisiones de suplementos para salud ósea (evidencia limitada).',
  },
  // ---------- Ovario poliquístico ----------
  {
    id: 'estilo_vida_sop', name: 'Alimentación y ejercicio', for: ['sop'], evidence: 'respaldo',
    summary: 'Es el primer tratamiento según la guía internacional: mejora la regularidad del ciclo, la resistencia a la insulina y el ánimo, incluso sin bajar mucho de peso.',
    how: 'Al menos 150 minutos de actividad a la semana (caminar rápido, bailar, bicicleta) y comidas con fibra, proteína y pocos azúcares y harinas refinadas.',
    cautions: 'Evita dietas extremas. Un nutricionista puede ayudarte a armar un plan.',
    source: 'Guía internacional basada en evidencia para el SOP, 2023.',
  },
  {
    id: 'inositol', name: 'Inositol (mio-inositol)', for: ['sop'], evidence: 'preliminar',
    summary: 'Puede mejorar la regularidad del ciclo y la sensibilidad a la insulina en algunas mujeres con SOP, pero la evidencia aún no es firme.',
    cautions: 'Puede dar molestias digestivas leves. Consulta con tu ginecóloga antes de tomarlo, sobre todo si tomas metformina.',
    source: 'Guía internacional para el SOP, 2023 (evidencia limitada).',
  },
  {
    id: 'menta_verde', name: 'Infusión de hierbabuena (menta verde)', for: ['sop'], evidence: 'preliminar',
    summary: 'Un ensayo pequeño mostró que 2 tazas al día bajaron las hormonas masculinas en mujeres con SOP. Es barata y segura para la mayoría.',
    how: '2 tazas al día.',
    cautions: 'Puede empeorar la acidez o el reflujo.',
    source: 'Grant P, Phytotherapy Research 2010.',
  },
  {
    id: 'canela', name: 'Canela', for: ['sop'], evidence: 'preliminar',
    summary: 'Estudios pequeños sugieren que podría ayudar a regular el ciclo y la glucosa. Como condimento es segura.',
    cautions: 'En cápsulas y dosis altas puede dañar el hígado (canela cassia). Prefiérela en las comidas.',
    source: 'Kort DH et al., Am J Obstet Gynecol 2014.',
  },
  {
    id: 'maca', name: 'Maca', for: ['sop'], evidence: 'tradicional',
    summary: 'Muy usada en el Perú para la energía y la fertilidad. No hay estudios sólidos en el SOP y no se sabe bien su efecto sobre las hormonas.',
    cautions: 'Por su posible efecto hormonal, consulta con tu ginecóloga antes de tomarla en cantidad.',
    source: 'Uso tradicional andino; evidencia clínica muy limitada.',
  },
  // ---------- Dolor de cabeza ----------
  {
    id: 'regla_202020', name: 'Regla 20-20-20 y ergonomía de pantallas', for: ['cefalea'], evidence: 'preliminar',
    summary: 'Cada 20 minutos, mira algo a 6 metros (20 pies) durante 20 segundos. Reduce la fatiga visual, que puede disparar el dolor de cabeza.',
    how: 'Pantalla a un brazo de distancia y un poco por debajo de los ojos. Brillo parecido al de la habitación. Letra más grande. Parpadea a propósito.',
    cautions: 'Si el dolor sigue igual con estos cambios, no es solo fatiga visual: consulta.',
    source: 'Academia Americana de Oftalmología.',
  },
  {
    id: 'examen_vista', name: 'Examen de la vista', for: ['cefalea'], evidence: 'respaldo',
    summary: 'Un problema de visión sin corregir (astigmatismo, vista cansada, dificultad para enfocar de cerca) puede causar dolor de cabeza que empeora con pantallas. Un oftalmólogo lo puede medir.',
    how: 'Pide una evaluación con oftalmólogo u optómetra que incluya medida de la vista y del enfoque de cerca (convergencia).',
    cautions: 'Si hay pérdida de visión o visión doble repentina, es una emergencia.',
    source: 'Academia Americana de Oftalmología.',
  },
  {
    id: 'magnesio', name: 'Magnesio', for: ['cefalea'], evidence: 'respaldo',
    summary: 'Se usa para prevenir la migraña: las guías lo consideran probablemente eficaz.',
    how: 'En estudios: 400–600 mg al día. Consulta la dosis con tu médico. En alimentos: pepitas de calabaza, cacao, menestras, avena.',
    cautions: 'Puede dar diarrea. Evítalo si tienes enfermedad renal.',
    source: 'Guía de la Academia Americana de Neurología (nivel B) para migraña.',
  },
  {
    id: 'riboflavina', name: 'Vitamina B2 (riboflavina)', for: ['cefalea'], evidence: 'respaldo',
    summary: 'También se usa para prevenir la migraña, con efecto después de 2–3 meses.',
    how: 'En estudios: 400 mg al día. Consulta con tu médico.',
    cautions: 'Pone la orina amarilla intensa (es normal).',
    source: 'Guía de la Academia Americana de Neurología (nivel B) para migraña.',
  },
  {
    id: 'menta_sienes', name: 'Aceite de menta en las sienes', for: ['cefalea'], evidence: 'preliminar',
    summary: 'Aplicado en la frente y las sienes alivió el dolor de cabeza tensional en ensayos pequeños.',
    how: 'Unas gotas diluidas (10% en aceite vegetal) en frente y sienes.',
    cautions: 'Lejos de los ojos. No en niños pequeños.',
    source: 'Göbel H et al., Cephalalgia 1994 / 2016.',
  },
  {
    id: 'acupuntura_cefalea', name: 'Acupuntura', for: ['cefalea'], evidence: 'respaldo',
    summary: 'Revisiones Cochrane encontraron que reduce la frecuencia de migraña y de cefalea tensional.',
    cautions: 'Solo con profesionales con agujas descartables.',
    source: 'Linde K et al., Revisiones Cochrane 2016.',
  },
  {
    id: 'jengibre', name: 'Jengibre (kion)', for: ['cefalea', 'colon'], evidence: 'preliminar',
    summary: 'Un ensayo pequeño mostró alivio de la migraña parecido a un medicamento; también ayuda con las náuseas.',
    how: 'Infusión de kion fresco al inicio del dolor.',
    cautions: 'Puede dar acidez. Precaución si tomas anticoagulantes.',
    source: 'Maghbooli M et al., Phytotherapy Research 2014.',
  },
];
