// Remedios y medidas de apoyo, con su nivel de evidencia.
// Esta información es orientativa. Antes de tomar cualquier planta o
// suplemento, consúltalo con tu médico, sobre todo si tomas medicamentos.

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
  for: ('prostata' | 'colon')[];
  evidence: Evidence;
  summary: string;
  how?: string;
  cautions: string;
  source: string;
};

export const REMEDIES: Remedy[] = [
  // ---------- Próstata (prostatitis crónica / dolor pélvico crónico) ----------
  {
    id: 'bano_asiento', name: 'Baño de asiento con agua tibia', for: ['prostata'], evidence: 'preliminar',
    summary: 'El agua tibia relaja los músculos del piso pélvico y suele aliviar el dolor. Los urólogos la recomiendan como medida de apoyo: hay pocos estudios formales, pero es segura y barata.',
    how: 'Siéntate en una tina o recipiente con agua tibia (no caliente) que cubra caderas y glúteos, 15–20 minutos, 1 o 2 veces al día.',
    cautions: 'Prueba la temperatura con el codo antes de sentarte. Evítalo si tienes heridas abiertas en la zona.',
    source: 'Recomendación habitual en urología como medida de apoyo (terapia de calor local).',
  },
  {
    id: 'piso_pelvico', name: 'Fisioterapia de piso pélvico', for: ['prostata'], evidence: 'respaldo',
    summary: 'La terapia manual y los ejercicios de relajación del piso pélvico mejoraron los síntomas en ensayos clínicos. Muchas veces el dolor viene de músculos tensos, no de infección.',
    how: 'Lo ideal es con un fisioterapeuta especializado en piso pélvico. En casa: respiración abdominal lenta y estiramientos suaves de cadera (postura del niño, mariposa).',
    cautions: 'Evita los ejercicios de "apretar" (Kegel) si tu problema es tensión: pueden empeorar el dolor. Pregúntale al fisioterapeuta.',
    source: 'FitzGerald MP et al., J Urol 2009 y 2012 (ensayos clínicos).',
  },
  {
    id: 'acupuntura', name: 'Acupuntura', for: ['prostata'], evidence: 'respaldo',
    summary: 'Un ensayo clínico grande mostró mejoría de los síntomas frente a acupuntura simulada, que se mantuvo meses después.',
    cautions: 'Solo con profesionales con agujas descartables y estériles.',
    source: 'Sun Y et al., Annals of Internal Medicine 2021.',
  },
  {
    id: 'polen', name: 'Extracto de polen (Cernilton)', for: ['prostata'], evidence: 'respaldo',
    summary: 'Una revisión Cochrane encontró que probablemente reduce los síntomas de prostatitis crónica, con muy pocos efectos adversos.',
    cautions: 'Evítalo si eres alérgico al polen. Consulta a tu médico.',
    source: 'Franco JVA et al., Revisión Cochrane 2019 (tratamientos farmacológicos y fitoterapia).',
  },
  {
    id: 'quercetina', name: 'Quercetina', for: ['prostata'], evidence: 'preliminar',
    summary: 'Es un antioxidante presente en la cebolla, la manzana y el té. Un ensayo pequeño mostró mejoría del dolor en prostatitis crónica.',
    how: 'En estudios se usó en cápsulas (500 mg dos veces al día). Consulta la dosis con tu médico.',
    cautions: 'Puede interactuar con algunos antibióticos (quinolonas) y anticoagulantes.',
    source: 'Shoskes DA et al., Urology 1999.',
  },
  {
    id: 'geranio', name: 'Baños con geranio', for: ['prostata', 'colon'], evidence: 'tradicional',
    summary: 'Muy usado en la medicina tradicional peruana para desinflamar. No hay estudios clínicos en prostatitis. Parte de su alivio probablemente viene del agua tibia, que relaja el piso pélvico.',
    how: 'Hierve un puñado de hojas y flores de geranio en 2–3 litros de agua por 5–10 minutos, cuela y deja entibiar. Úsalo como baño de asiento de 15–20 minutos.',
    cautions: 'Usa el agua tibia, nunca caliente. Solo uso externo. Suspende si notas irritación o picazón en la piel.',
    source: 'Uso tradicional andino. Sin ensayos clínicos publicados.',
  },
  {
    id: 'calabaza', name: 'Semillas de calabaza (pepitas)', for: ['prostata'], evidence: 'preliminar',
    summary: 'Son ricas en zinc. Hay estudios en próstata agrandada (hiperplasia), no en prostatitis. Son un alimento sano y barato.',
    how: 'Un puñado (unos 30 g) al día, tostadas sin sal.',
    cautions: 'Son muy calóricas: no más de un puñado al día.',
    source: 'Vahlensieck W et al., Urologia Internationalis 2015 (hiperplasia).',
  },
  {
    id: 'cola_caballo', name: 'Cola de caballo (infusión)', for: ['prostata'], evidence: 'tradicional',
    summary: 'Se usa tradicionalmente como diurético (hace orinar más).',
    cautions: 'No la tomes por más de 2 semanas seguidas. Evítala si tienes problemas de riñón o corazón, o si tomas diuréticos o litio. Puede bajar la vitamina B1.',
    source: 'NCCIH (Institutos Nacionales de Salud de EE. UU.).',
  },
  {
    id: 'saw_palmetto', name: 'Saw palmetto (palma enana)', for: ['prostata'], evidence: 'sin_beneficio',
    summary: 'Se vende mucho "para la próstata", pero en un estudio de un año en prostatitis crónica no produjo una mejoría duradera. Para este problema, mejor no gastar en él.',
    cautions: 'Puede interactuar con anticoagulantes.',
    source: 'Kaplan SA et al., J Urol 2004.',
  },
  {
    id: 'una_gato', name: 'Uña de gato', for: ['prostata', 'colon'], evidence: 'preliminar',
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
    id: 'manzanilla', name: 'Manzanilla (infusión)', for: ['colon', 'prostata'], evidence: 'tradicional',
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
    id: 'curcuma', name: 'Cúrcuma (palillo)', for: ['colon', 'prostata'], evidence: 'preliminar',
    summary: 'Tiene efecto antiinflamatorio en estudios de laboratorio. En personas, la evidencia es limitada y se absorbe poco (mejora con pimienta negra y grasa).',
    how: 'Como condimento en las comidas.',
    cautions: 'En cápsulas, puede interactuar con anticoagulantes. Evítala si tienes cálculos en la vesícula.',
    source: 'NCCIH.',
  },
];
