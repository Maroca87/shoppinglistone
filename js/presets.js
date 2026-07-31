const PRESETS = [
  {
    id: 'semanal',
    name: 'Compras Semanales',
    icon: '🛒',
    items: [
      { name: 'Leche', category: 'lacteos', quantity: 2, unit: 'L', price: 1100 },
      { name: 'Huevos', category: 'lacteos', quantity: 1, unit: 'caja', price: 2500 },
      { name: 'Arroz', category: 'despensa', quantity: 2, unit: 'kg', price: 1800 },
      { name: 'Frijoles negros', category: 'despensa', quantity: 2, unit: 'pqte', price: 1400 },
      { name: 'Pan cuadrado', category: 'panaderia', quantity: 1, unit: 'unidad', price: 1600 },
      { name: 'Pollo (pechuga)', category: 'carnes', quantity: 1, unit: 'kg', price: 3800 },
      { name: 'Bananos', category: 'frutas', quantity: 1, unit: 'mano', price: 800 },
      { name: 'Tomates', category: 'frutas', quantity: 1, unit: 'kg', price: 1200 }
    ]
  },
  {
    id: 'parrillada',
    name: 'Parrillada / BBQ',
    icon: '🔥',
    items: [
      { name: 'Carne para asar', category: 'carnes', quantity: 2, unit: 'kg', price: 7500 },
      { name: 'Salchichas parrolleras', category: 'carnes', quantity: 1, unit: 'pqte', price: 3200 },
      { name: 'Carbón', category: 'otros', quantity: 1, unit: 'bolsa', price: 2500 },
      { name: 'Cerveza pack', category: 'bebidas', quantity: 1, unit: 'pack', price: 6500 },
      { name: 'Pan de perro caliente', category: 'panaderia', quantity: 2, unit: 'pqte', price: 1500 },
      { name: 'Aguacates', category: 'frutas', quantity: 4, unit: 'unid', price: 2000 }
    ]
  },
  {
    id: 'tacos',
    name: 'Noche de Tacos',
    icon: '🌮',
    items: [
      { name: 'Tortillas de maíz', category: 'panaderia', quantity: 2, unit: 'pqte', price: 1200 },
      { name: 'Carne molida de res', category: 'carnes', quantity: 1, unit: 'kg', price: 4200 },
      { name: 'Queso rallado', category: 'lacteos', quantity: 1, unit: 'pqte', price: 2100 },
      { name: 'Natilla', category: 'lacteos', quantity: 1, unit: 'unidad', price: 950 },
      { name: 'Cebolla y Chile pimiento', category: 'frutas', quantity: 1, unit: 'kg', price: 1500 },
      { name: 'Salsa de tomate picante', category: 'despensa', quantity: 1, unit: 'frasco', price: 1300 }
    ]
  },
  {
    id: 'limpieza',
    name: 'Limpieza Básica',
    icon: '🧹',
    items: [
      { name: 'Detergente líquido', category: 'limpieza', quantity: 1, unit: 'galón', price: 5800 },
      { name: 'Suavizante de ropa', category: 'limpieza', quantity: 1, unit: 'L', price: 2400 },
      { name: 'Papel higiénico 12u', category: 'limpieza', quantity: 1, unit: 'pqte', price: 4500 },
      { name: 'Desinfectante multiusos', category: 'limpieza', quantity: 1, unit: 'botella', price: 1900 },
      { name: 'Esponjas de lavaplatos', category: 'limpieza', quantity: 1, unit: 'pqte', price: 1100 }
    ]
  }
];
