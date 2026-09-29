// Alimentación económica en Perú: qué preferir, qué limitar según cada
// condición, y menús que cambian cada semana (rotan cada 4 semanas).

import type { ConditionId } from '../modules/types.ts';

export type FoodGroup = { title: string; items: { name: string; why: string }[] };

export const FOOD_PREFER: FoodGroup[] = [
  {
    title: 'Proteína barata',
    items: [
      { name: 'Huevo', why: 'Proteína completa y económica. Suave para el colon.' },
      { name: 'Pescado azul: jurel, caballa, bonito, anchoveta', why: 'Omega-3 antiinflamatorio, más barato que otros pescados.' },
      { name: 'Conservas de caballa o sardina (con espinas)', why: 'Omega-3 y calcio para el hueso a buen precio.' },
      { name: 'Pollo sin piel e hígado de pollo', why: 'Opción económica. El hígado aporta hierro y zinc.' },
      { name: 'Menestras (lentejas, garbanzo, pallares) y tarwi', why: 'Proteína y fibra baratas. Remójalas la noche anterior y bota el agua para que den menos gases.' },
    ],
  },
  {
    title: 'Cereales y tubérculos',
    items: [
      { name: 'Avena', why: 'Fibra soluble: ayuda al colon y a la glucosa.' },
      { name: 'Quinua, kiwicha, cañihua', why: 'Granos andinos con proteína y minerales, de índice glucémico más bajo que el arroz blanco.' },
      { name: 'Camote, papa, yuca, olluco', why: 'Energía barata. Mejor sancochados o al horno que fritos.' },
      { name: 'Arroz (mejor integral)', why: 'Suave para el estómago.' },
    ],
  },
  {
    title: 'Verduras y frutas de estación',
    items: [
      { name: 'Zapallo, zanahoria, vainita, espinaca, acelga, zucchini', why: 'Antioxidantes y fibra. En temporada salen más baratas.' },
      { name: 'Tomate cocido', why: 'Licopeno, bueno para la próstata. Cocido se absorbe mejor.' },
      { name: 'Papaya, plátano, granadilla, fresa', why: 'Suaves para el colon y baratas casi todo el año.' },
    ],
  },
  {
    title: 'Extras que ayudan',
    items: [
      { name: 'Pepitas de calabaza', why: 'Zinc y magnesio. Un puñado al día.' },
      { name: 'Linaza molida', why: 'Fibra y omega-3 vegetal. Muélela en casa, sale más barato.' },
      { name: 'Queso fresco y yogur natural', why: 'Calcio para el hueso. Si la leche te cae mal, el yogur y el queso fresco suelen tolerarse mejor.' },
      { name: 'Agua e infusiones (manzanilla, muña, hierba luisa)', why: 'Reemplazan el café y las gaseosas.' },
    ],
  },
];

export type Limit = { name: string; why: string; for: ConditionId[] };

export const FOOD_LIMIT: Limit[] = [
  { name: 'Ají, rocoto y comidas muy picantes', why: 'Irritan la vejiga, la próstata y el colon en muchas personas.', for: ['prostatitis', 'colon'] },
  { name: 'Café y té negro en exceso', why: 'La cafeína irrita la vejiga, acelera el colon y, en exceso o al dejarla de golpe, da dolor de cabeza.', for: ['prostatitis', 'colon', 'cefalea'] },
  { name: 'Alcohol (sobre todo cerveza)', why: 'Empeora los síntomas urinarios, el colon y el dolor de cabeza.', for: ['prostatitis', 'colon', 'cefalea'] },
  { name: 'Gaseosas y bebidas energizantes', why: 'Gas, azúcar y cafeína.', for: ['prostatitis', 'colon', 'sop', 'cefalea'] },
  { name: 'Frituras y comida al paso muy grasosa', why: 'Inflaman y empeoran el colon irritable.', for: ['colon', 'prostatitis', 'sop'] },
  { name: 'Cebolla, ajo y menestras en cantidad', why: 'Fermentan y dan gases en el colon irritable. En porciones pequeñas suelen tolerarse.', for: ['colon'] },
  { name: 'Dulces, pan blanco, galletas y jugos', why: 'Suben rápido el azúcar y empeoran la resistencia a la insulina del SOP.', for: ['sop'] },
  { name: 'Embutidos y quesos madurados', why: 'Pueden disparar el dolor de cabeza en personas sensibles.', for: ['cefalea'] },
  { name: 'Exceso de sal', why: 'Saca calcio del hueso y sube la presión.', for: ['fractura'] },
];

export const FOOD_TIPS: { for: ConditionId; text: string }[] = [
  { for: 'prostatitis', text: 'Próstata: evita lo picante, el café y el alcohol por 2 semanas y compara en tu registro.' },
  { for: 'colon', text: 'Colon: porciones pequeñas de menestras remojadas; si la cebolla te cae mal, usa solo la parte verde de la cebolla china para dar sabor.' },
  { for: 'fractura', text: 'Hueso: incluye cada día una fuente de calcio (queso fresco, yogur, sardinas con espinas) y una de proteína en cada comida.' },
  { for: 'sop', text: 'SOP: combina siempre carbohidrato con proteína o fibra (ej. camote con huevo) y prefiere quinua o arroz integral al arroz blanco.' },
  { for: 'cefalea', text: 'Dolor de cabeza: no te saltes el desayuno y toma agua durante el día.' },
];

export type MenuDay = { day: string; desayuno: string; almuerzo: string; cena: string };

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function week(rows: [string, string, string][]): MenuDay[] {
  return rows.map(([desayuno, almuerzo, cena], i) => ({ day: DIAS[i], desayuno, almuerzo, cena }));
}

// Menús suaves, sin picante y económicos, pensados para ser compatibles con
// todas las condiciones de la app. Ajusta las porciones a tu hambre.
export const MENUS: MenuDay[][] = [
  week([
    ['Avena con plátano y linaza', 'Sudado de jurel con yuca y ensalada de zanahoria', 'Sopa de verduras con huevo'],
    ['Pan integral con huevo sancochado y papaya', 'Pollo al horno con quinua y vainitas', 'Crema de zapallo con queso fresco'],
    ['Quinua con manzana y canela', 'Lentejas (porción chica) con arroz integral y espinaca', 'Tortilla de verduras con camote'],
    ['Yogur natural con granadilla y avena', 'Caballa en conserva con papa sancochada y ensalada de pepino', 'Sopa de quinua con zapallo'],
    ['Pan con palta y huevo', 'Estofado de pollo con papa y zanahoria', 'Crema de zapallo con pepitas'],
    ['Kiwicha con leche o bebida vegetal y fresa', 'Pescado a la plancha con arroz integral y ensalada', 'Huevo revuelto con tomate y pan'],
    ['Avena con papaya', 'Garbanzos (porción chica) con espinaca y arroz', 'Sopa de verduras con fideos'],
  ]),
  week([
    ['Quinua con leche o bebida vegetal y plátano', 'Bonito al horno con camote y ensalada de vainita', 'Caldo de pollo con verduras'],
    ['Pan integral con queso fresco y papaya', 'Tallarines con pollo y salsa de tomate casera (sin picante)', 'Omelette de espinaca'],
    ['Avena con manzana y linaza', 'Ají de gallina suave (sin ají, con zapallo loche) y arroz', 'Crema de zanahoria'],
    ['Huevo sancochado, camote y fruta', 'Pescado sudado con yuca', 'Quinua atamalada suave con queso fresco'],
    ['Yogur con avena y fresa', 'Lomo de pollo saltado sin picante con papas sancochadas', 'Sopa de sémola con verduras'],
    ['Pan con palta y tomate', 'Pallares (porción chica) con arroz y huevo frito en poco aceite', 'Ensalada tibia de quinua y verduras'],
    ['Kiwicha con plátano', 'Pollo a la olla con papa amarilla y zanahoria', 'Tortilla de zapallito'],
  ]),
  week([
    ['Avena con granadilla', 'Jurel frito en poco aceite con arroz integral y ensalada', 'Sopa de quinua con verduras'],
    ['Pan con huevo y tomate', 'Estofado de pescado con papa', 'Crema de brócoli con queso fresco'],
    ['Quinua con fresa', 'Seco de pollo suave (culantro, sin ají) con frejol canario (porción chica)', 'Huevos a la plancha con camote'],
    ['Yogur con plátano y linaza', 'Caballa en conserva con quinua y pepino', 'Sopa de pollo con fideos'],
    ['Pan integral con palta', 'Tortilla de verduras con arroz y ensalada', 'Crema de zapallo'],
    ['Avena con papaya', 'Pescado al vapor con yuca y vainitas', 'Solterito suave (queso fresco, tomate, habas, sin rocoto)'],
    ['Kiwicha con manzana', 'Pollo al horno con puré de papa y ensalada', 'Caldo de verduras con huevo'],
  ]),
  week([
    ['Quinua con plátano y canela', 'Sudado de caballa con yuca', 'Tortilla de espinaca'],
    ['Avena con fresa', 'Pollo guisado con arroz integral y zanahoria', 'Sopa de verduras con quinua'],
    ['Pan con queso fresco y tomate', 'Lentejas (porción chica) con arroz y ensalada de pepino', 'Crema de zapallo con huevo'],
    ['Yogur con granadilla', 'Bonito a la plancha con camote y ensalada', 'Sopa de sémola'],
    ['Huevo revuelto con pan integral', 'Tallarín verde suave (espinaca y albahaca, sin mucho ajo) con pollo', 'Crema de zanahoria con pepitas'],
    ['Avena con plátano', 'Pescado sudado con papa y ensalada', 'Quinua con verduras salteadas'],
    ['Kiwicha con papaya', 'Pollo a la olla con verduras', 'Tortilla de papa y zapallito'],
  ]),
];

// Número de semana del año (ISO 8601) de una fecha YYYY-MM-DD.
export function isoWeek(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

// Menú de la semana de esa fecha (cambia cada lunes, rota cada 4 semanas).
export function menuIndexFor(iso: string): number {
  return isoWeek(iso) % MENUS.length;
}

export function limitsFor(profile: ConditionId[]): Limit[] {
  return FOOD_LIMIT.filter((l) => l.for.some((c) => profile.includes(c)));
}

export const TIPS_AHORRO: string[] = [
  'Compra en el mercado y no en el supermercado: frutas, verduras y pescado suelen salir más baratos.',
  'Elige lo que está en temporada: es más barato y más fresco.',
  'Cocina menestras o quinua para 2 o 3 días y guárdalas en la refrigeradora.',
  'El pescado azul (jurel, caballa, bonito) es tan nutritivo como el caro, o más.',
  'Cambia gaseosas y jugos envasados por agua e infusiones: ahorras y tu cuerpo lo agradece.',
];
