const CATEGORIES = {
  frutas: {
    id: 'frutas',
    name: 'Frutas y Verduras',
    icon: '🍎',
    color: 'var(--cat-frutas)',
    keywords: ['manzana', 'platano', 'banano', 'fruta', 'tomate', 'cebolla', 'papa', 'zanahoria', 'lechuga', 'aguacate', 'limon', 'naranja', 'fresa', 'uva', 'ajo', 'pimiento', 'chile', 'pepino', 'brócoli', 'espinaca']
  },
  lacteos: {
    id: 'lacteos',
    name: 'Lácteos y Huevos',
    icon: '🥛',
    color: 'var(--cat-lacteos)',
    keywords: ['leche', 'queso', 'yogu', 'yogurt', 'mantequilla', 'huevo', 'crema', 'natilla', 'margarina', 'quesillo']
  },
  carnes: {
    id: 'carnes',
    name: 'Carnes y Pescados',
    icon: '🥩',
    color: 'var(--cat-carnes)',
    keywords: ['carne', 'pollo', 'cerdo', 'pescado', 'atun', 'salmon', 'jamon', 'tocino', 'salchicha', 'molida', 'bistec', 'chuleta', 'camarón', 'camaron']
  },
  panaderia: {
    id: 'panaderia',
    name: 'Panadería y Repostería',
    icon: '🍞',
    color: 'var(--cat-panaderia)',
    keywords: ['pan', 'tortilla', 'galleta', 'queque', 'pastel', 'bollo', 'baguette', 'donas', 'croissant']
  },
  despensa: {
    id: 'despensa',
    name: 'Despensa y Granos',
    icon: '🌾',
    color: 'var(--cat-despensa)',
    keywords: ['arroz', 'frijol', 'frijoles', 'aceite', 'azucar', 'sal', 'pasta', 'tallarines', 'harina', 'salsa', 'ketchup', 'mayonesa', 'mostaza', 'atún', 'cereal', 'avena', 'cafe', 'té', 'especias']
  },
  bebidas: {
    id: 'bebidas',
    name: 'Bebidas y Jugos',
    icon: '🧃',
    color: 'var(--cat-bebidas)',
    keywords: ['agua', 'jugo', 'gaseosa', 'coca', 'refresco', 'cerveza', 'vino', 'licor', 'energizante', 'soda']
  },
  limpieza: {
    id: 'limpieza',
    name: 'Limpieza del Hogar',
    icon: '🧹',
    color: 'var(--cat-limpieza)',
    keywords: ['jabón', 'jabon', 'detergente', 'desinfectante', 'cloro', 'suavizante', 'esponja', 'papel higienico', 'servilleta', 'bolsa', 'escoba', 'limpiador']
  },
  cuidado: {
    id: 'cuidado',
    name: 'Cuidado Personal',
    icon: '🧴',
    color: 'var(--cat-cuidado)',
    keywords: ['champú', 'shampoo', 'acondicionador', 'crema', 'desodorante', 'pasta de dientes', 'cepillo', 'toalla', 'rasurada', 'maquillaje', 'higiene']
  },
  congelados: {
    id: 'congelados',
    name: 'Congelados',
    icon: '🧊',
    color: 'var(--cat-congelados)',
    keywords: ['helado', 'hielo', 'papas congeladas', 'pizza', 'nuggets', 'verduras congeladas']
  },
  otros: {
    id: 'otros',
    name: 'Otros',
    icon: '📦',
    color: 'var(--cat-otros)',
    keywords: []
  }
};

/**
 * Detects category automatically based on item name keywords
 */
function autoDetectCategory(itemName) {
  if (!itemName) return 'otros';
  const cleanName = itemName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const [catId, catData] of Object.entries(CATEGORIES)) {
    if (catId === 'otros') continue;
    for (const keyword of catData.keywords) {
      const cleanKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (cleanName.includes(cleanKeyword)) {
        return catId;
      }
    }
  }
  return 'otros';
}
