const STORE_CATEGORIES = {
  supermercado: {
    lacteos: { id: 'lacteos', name: 'Lácteos y Huevos', icon: '🥛', color: 'var(--cat-lacteos)' },
    frutas: { id: 'frutas', name: 'Frutas y Verduras', icon: '🍎', color: 'var(--cat-frutas)' },
    carnes: { id: 'carnes', name: 'Carnes y Pescados', icon: '🥩', color: 'var(--cat-carnes)' },
    panaderia: { id: 'panaderia', name: 'Panadería', icon: '🍞', color: 'var(--cat-panaderia)' },
    despensa: { id: 'despensa', name: 'Despensa y Granos', icon: '🌾', color: 'var(--cat-despensa)' },
    bebidas: { id: 'bebidas', name: 'Bebidas y Jugos', icon: '🧃', color: 'var(--cat-bebidas)' },
    limpieza: { id: 'limpieza', name: 'Limpieza del Hogar', icon: '🧹', color: 'var(--cat-limpieza)' },
    cuidado: { id: 'cuidado', name: 'Cuidado Personal', icon: '🧴', color: 'var(--cat-cuidado)' },
    otros: { id: 'otros', name: 'Otros', icon: '📦', color: 'var(--cat-otros)' }
  },
  ferreteria: {
    herramientas: { id: 'herramientas', name: 'Herramientas', icon: '🔨', color: '#f59e0b' },
    fijaciones: { id: 'fijaciones', name: 'Fijaciones y Clavos', icon: '🔩', color: '#8b5cf6' },
    pintura: { id: 'pintura', name: 'Pintura y Acabados', icon: '🎨', color: '#ec4899' },
    electricidad: { id: 'electricidad', name: 'Electricidad', icon: '⚡', color: '#eab308' },
    fontaneria: { id: 'fontaneria', name: 'Fontanería y Tuberías', icon: '🚰', color: '#06b6d4' },
    materiales: { id: 'materiales', name: 'Materiales de Construcción', icon: '🧱', color: '#78350f' },
    otros: { id: 'otros', name: 'Otros Herrajes', icon: '📦', color: '#64748b' }
  },
  comercial: {
    electronica: { id: 'electronica', name: 'Electrónica y Cables', icon: '🔌', color: '#3b82f6' },
    tecnologia: { id: 'tecnologia', name: 'Tecnología y Gadgets', icon: '🎧', color: '#6366f1' },
    hogar: { id: 'hogar', name: 'Hogar y Decoración', icon: '🏠', color: '#10b981' },
    ropa: { id: 'ropa', name: 'Ropa y Accesorios', icon: '👕', color: '#ec4899' },
    otros: { id: 'otros', name: 'Otros Comerciales', icon: '📦', color: '#64748b' }
  },
  farmacia: {
    medicamentos: { id: 'medicamentos', name: 'Medicamentos', icon: '💊', color: '#ef4444' },
    botiquin: { id: 'botiquin', name: 'Botiquín y Primeros Auxilios', icon: '🩹', color: '#10b981' },
    cuidado: { id: 'cuidado', name: 'Cuidado e Higiene', icon: '🧴', color: '#06b6d4' },
    salud: { id: 'salud', name: 'Salud y Vitaminas', icon: '🧪', color: '#8b5cf6' },
    otros: { id: 'otros', name: 'Otros Farmacéuticos', icon: '📦', color: '#64748b' }
  }
};

// Global CATEGORIES fallback pointing to current store categories
let CATEGORIES = STORE_CATEGORIES.supermercado;

function getStoreCategories(storeId) {
  return STORE_CATEGORIES[storeId] || STORE_CATEGORIES.supermercado;
}

/**
 * Detects category automatically based on item name keywords
 */
function autoDetectCategory(itemName, storeId = 'supermercado') {
  if (!itemName) return 'otros';
  const cleanName = itemName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (storeId === 'ferreteria') {
    if (cleanName.includes('martillo') || cleanName.includes('brocha') || cleanName.includes('lija')) return 'herramientas';
    if (cleanName.includes('clavo') || cleanName.includes('tornillo')) return 'fijaciones';
    if (cleanName.includes('pintura') || cleanName.includes('silicona')) return 'pintura';
    if (cleanName.includes('tomacorriente') || cleanName.includes('interruptor') || cleanName.includes('cable')) return 'electricidad';
    if (cleanName.includes('tubo') || cleanName.includes('teflon') || cleanName.includes('pegamento')) return 'fontaneria';
    return 'otros';
  }

  if (storeId === 'farmacia') {
    if (cleanName.includes('acetaminofen') || cleanName.includes('ibuprofeno') || cleanName.includes('antiacido')) return 'medicamentos';
    if (cleanName.includes('curita') || cleanName.includes('gasa') || cleanName.includes('alcohol')) return 'botiquin';
    if (cleanName.includes('vitamina') || cleanName.includes('suero')) return 'salud';
    return 'otros';
  }

  if (storeId === 'comercial') {
    if (cleanName.includes('cable') || cleanName.includes('cargador') || cleanName.includes('extension')) return 'electronica';
    if (cleanName.includes('audifono') || cleanName.includes('bateria') || cleanName.includes('foco')) return 'tecnologia';
    if (cleanName.includes('almohada') || cleanName.includes('toalla') || cleanName.includes('sombrilla')) return 'hogar';
    return 'otros';
  }

  // Supermarket keywords
  if (cleanName.includes('leche') || cleanName.includes('queso') || cleanName.includes('huevo') || cleanName.includes('natilla') || cleanName.includes('yogurt')) return 'lacteos';
  if (cleanName.includes('manzana') || cleanName.includes('banano') || cleanName.includes('tomate') || cleanName.includes('cebolla') || cleanName.includes('aguacate') || cleanName.includes('limon')) return 'frutas';
  if (cleanName.includes('pollo') || cleanName.includes('carne') || cleanName.includes('atun') || cleanName.includes('cerdo')) return 'carnes';
  if (cleanName.includes('pan') || cleanName.includes('tortilla') || cleanName.includes('galleta')) return 'panaderia';
  if (cleanName.includes('arroz') || cleanName.includes('frijol') || cleanName.includes('aceite') || cleanName.includes('azucar') || cleanName.includes('sal') || cleanName.includes('cafe')) return 'despensa';
  if (cleanName.includes('jabon') || cleanName.includes('detergente') || cleanName.includes('papel') || cleanName.includes('cloro')) return 'limpieza';

  return 'otros';
}
