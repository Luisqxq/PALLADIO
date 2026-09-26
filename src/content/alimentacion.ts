// Alimentación económica en Perú para la próstata y el colon.

export type FoodGroup = { title: string; items: { name: string; why: string }[] };

export const FOOD_PREFER: FoodGroup[] = [
  {
    title: 'Proteína barata',
    items: [
      { name: 'Menestras (lentejas, frejol, garbanzo, pallares)', why: 'Proteína y fibra al precio más bajo. Remójalas la noche anterior y bota el agua para que den menos gases.' },
      { name: 'Huevo', why: 'Proteína completa y económica.' },
      { name: 'Pescado azul: jurel, caballa, bonito, anchoveta', why: 'Tienen omega-3, que es antiinflamatorio, y suelen ser más baratos que otros pescados.' },
      { name: 'Conservas de caballa o sardina', why: 'Omega-3 a buen precio. Prefiere las que vienen en agua o aceite vegetal.' },
      { name: 'Pollo sin piel e hígado de pollo', why: 'Opción económica. El hígado aporta hierro y zinc.' },
    ],
  },
  {
    title: 'Cereales y tubérculos',
    items: [
      { name: 'Avena', why: 'Fibra soluble: ayuda al colon y da saciedad.' },
      { name: 'Quinua, kiwicha, cañihua', why: 'Granos andinos con proteína y minerales.' },
      { name: 'Camote, papa, yuca, olluco', why: 'Energía barata. Mejor sancochados o al horno que fritos.' },
      { name: 'Arroz (mejor si es integral)', why: 'Suave para el estómago.' },
    ],
  },
  {
    title: 'Verduras y frutas de estación',
    items: [
      { name: 'Zapallo, zanahoria, vainita, brócoli, espinaca, acelga', why: 'Antioxidantes y fibra. En temporada salen más baratas.' },
      { name: 'Tomate', why: 'Tiene licopeno, que es bueno para la próstata. Cocido se absorbe mejor.' },
      { name: 'Papaya y plátano', why: 'Suaves para el colon y baratos casi todo el año.' },
      { name: 'Manzana, granadilla, sandía', why: 'Frutas suaves e hidratantes.' },
    ],
  },
  {
    title: 'Extras que ayudan',
    items: [
      { name: 'Pepitas de calabaza', why: 'Zinc. Un puñado al día.' },
      { name: 'Linaza molida', why: 'Fibra y omega-3 vegetal. Muélela en casa, sale más barato.' },
      { name: 'Agua (6–8 vasos al día)', why: 'Orina menos concentrada, menos irritación. La más barata de todas.' },
      { name: 'Infusiones: manzanilla, muña, hierba luisa', why: 'Reemplazan el café y las gaseosas.' },
    ],
  },
];

export const FOOD_LIMIT: { name: string; why: string }[] = [
  { name: 'Ají, rocoto y comidas muy picantes', why: 'Irritan la vejiga y la próstata en muchas personas con prostatitis.' },
  { name: 'Café y té negro en exceso', why: 'La cafeína irrita la vejiga. Prueba bajarlo por 2 semanas y compara en tu registro.' },
  { name: 'Alcohol (sobre todo cerveza)', why: 'Empeora los síntomas urinarios e inflama.' },
  { name: 'Gaseosas y bebidas energizantes', why: 'Gas, azúcar y cafeína.' },
  { name: 'Frituras y comida al paso muy grasosa', why: 'Inflaman y empeoran el colon irritable.' },
  { name: 'Embutidos y exceso de carne roja', why: 'Más caros y más inflamatorios que el pescado o las menestras.' },
];

export type MenuDay = { day: string; desayuno: string; almuerzo: string; cena: string };

// Menú de ejemplo, de bajo costo. Ajusta las porciones a tu hambre.
export const MENU_ECONOMICO: MenuDay[] = [
  { day: 'Lunes', desayuno: 'Avena con plátano y linaza', almuerzo: 'Lentejas con arroz y ensalada de zanahoria', cena: 'Sopa de verduras con huevo' },
  { day: 'Martes', desayuno: 'Pan con huevo sancochado y papaya', almuerzo: 'Sudado de jurel con yuca', cena: 'Quinua con verduras salteadas' },
  { day: 'Miércoles', desayuno: 'Quinua con manzana', almuerzo: 'Frejoles con arroz y ensalada de tomate', cena: 'Tortilla de verduras' },
  { day: 'Jueves', desayuno: 'Avena con granadilla', almuerzo: 'Caballa en conserva con camote y ensalada', cena: 'Sopa de quinua' },
  { day: 'Viernes', desayuno: 'Pan con palta y plátano', almuerzo: 'Estofado de pollo con papa y zanahoria', cena: 'Crema de zapallo con pepitas' },
  { day: 'Sábado', desayuno: 'Kiwicha con leche o bebida vegetal y fruta', almuerzo: 'Garbanzos con espinaca y arroz', cena: 'Huevo revuelto con tomate y pan' },
  { day: 'Domingo', desayuno: 'Avena con papaya', almuerzo: 'Pescado al horno con papas y ensalada', cena: 'Sopa de verduras con fideos' },
];

export const TIPS_AHORRO: string[] = [
  'Compra en el mercado y no en el supermercado: frutas, verduras y pescado suelen salir más baratos.',
  'Elige lo que está en temporada: es más barato y más fresco.',
  'Cocina menestras para 2 o 3 días y guárdalas en la refrigeradora.',
  'El pescado azul (jurel, caballa, bonito) es tan nutritivo como el caro, o más.',
  'Cambia gaseosas y jugos envasados por agua e infusiones: ahorras y tu vejiga lo agradece.',
];
