const DEFAULT_CATALOG = [
  // Lácteos y Huevos
  { id: 'cat_leche', name: 'Leche Enterprise / Pinos 1L', category: 'lacteos', price: 1050, unit: 'L' },
  { id: 'cat_huevos', name: 'Huevos de Gallina (cartón 15u)', category: 'lacteos', price: 2400, unit: 'caja' },
  { id: 'cat_queso_turrialba', name: 'Queso Turrialba 500g', category: 'lacteos', price: 2900, unit: 'unidad' },
  { id: 'cat_natilla', name: 'Natilla 400g', category: 'lacteos', price: 1100, unit: 'unidad' },
  { id: 'cat_mantequilla', name: 'Mantequilla con sal 200g', category: 'lacteos', price: 1450, unit: 'unidad' },
  { id: 'cat_yogurt', name: 'Yogurt Batido 1L', category: 'lacteos', price: 1800, unit: 'unidad' },

  // Frutas y Verduras
  { id: 'cat_bananos', name: 'Bananos (mano)', category: 'frutas', price: 750, unit: 'mano' },
  { id: 'cat_tomates', name: 'Tomates para ensalada', category: 'frutas', price: 1200, unit: 'kg' },
  { id: 'cat_papas', name: 'Papas lavadas', category: 'frutas', price: 1350, unit: 'kg' },
  { id: 'cat_cebollas', name: 'Cebollas amarillas', category: 'frutas', price: 1100, unit: 'kg' },
  { id: 'cat_aguacates', name: 'Aguacates Has', category: 'frutas', price: 2200, unit: 'kg' },
  { id: 'cat_chile_dulce', name: 'Chile dulce pimiento', category: 'frutas', price: 400, unit: 'unid' },
  { id: 'cat_limones', name: 'Limón Mandarina', category: 'frutas', price: 950, unit: 'kg' },
  { id: 'cat_zanahorias', name: 'Zanahorias', category: 'frutas', price: 800, unit: 'kg' },
  { id: 'cat_lechuga', name: 'Lechuga americana', category: 'frutas', price: 600, unit: 'unid' },

  // Carnes y Pescados
  { id: 'cat_pollo_pechuga', name: 'Pechuga de Pollo deshuesada', category: 'carnes', price: 3900, unit: 'kg' },
  { id: 'cat_carne_molida', name: 'Carne molida de res especial', category: 'carnes', price: 4300, unit: 'kg' },
  { id: 'cat_bistec_res', name: 'Bistec de res Cecina/Posta', category: 'carnes', price: 6200, unit: 'kg' },
  { id: 'cat_chuleta_cerdo', name: 'Chuleta de cerdo fresca', category: 'carnes', price: 3800, unit: 'kg' },
  { id: 'cat_atun_lata', name: 'Lata de Atún en agua', category: 'carnes', price: 1150, unit: 'lata' },
  { id: 'cat_tocino', name: 'Tocino ahumado 200g', category: 'carnes', price: 2100, unit: 'pqte' },

  // Panadería y Repostería
  { id: 'cat_pan_cuadrado', name: 'Pan Cuadrado Blanco', category: 'panaderia', price: 1650, unit: 'unidad' },
  { id: 'cat_tortillas_maiz', name: 'Tortillas de maíz 20u', category: 'panaderia', price: 950, unit: 'pqte' },
  { id: 'cat_baguette', name: 'Pan Baguette recién horneado', category: 'panaderia', price: 700, unit: 'unidad' },
  { id: 'cat_galletas_maria', name: 'Galletas María / Soda', category: 'panaderia', price: 1200, unit: 'pqte' },

  // Despensa y Granos
  { id: 'cat_arroz', name: 'Arroz 99% granos enteros 1kg', category: 'despensa', price: 980, unit: 'kg' },
  { id: 'cat_frijoles_negros', name: 'Frijoles Negros 800g', category: 'despensa', price: 1350, unit: 'pqte' },
  { id: 'cat_aceite_vegetal', name: 'Aceite Vegetal 1L', category: 'despensa', price: 1950, unit: 'L' },
  { id: 'cat_azucar', name: 'Azúcar blanco 1kg', category: 'despensa', price: 920, unit: 'kg' },
  { id: 'cat_sal', name: 'Sal refinada 500g', category: 'despensa', price: 450, unit: 'pqte' },
  { id: 'cat_pasta_spaghetti', name: 'Spaghetti / Spaghetti 500g', category: 'despensa', price: 750, unit: 'pqte' },
  { id: 'cat_salsa_tomate', name: 'Salsa de Tomate / Ketchup', category: 'despensa', price: 1100, unit: 'unidad' },
  { id: 'cat_cafe', name: 'Café molido 250g', category: 'despensa', price: 2100, unit: 'pqte' },

  // Bebidas
  { id: 'cat_agua_embotellada', name: 'Agua purificada 2.5L', category: 'bebidas', price: 1100, unit: 'botella' },
  { id: 'cat_jugo_naranja', name: 'Jugo de Naranja 1L', category: 'bebidas', price: 1400, unit: 'envase' },
  { id: 'cat_gaseosa', name: 'Refresco Gaseoso 2L', category: 'bebidas', price: 1650, unit: 'botella' },
  { id: 'cat_cerveza_pack', name: 'Pack de Cervezas (6u)', category: 'bebidas', price: 5800, unit: 'pack' },

  // Limpieza del Hogar
  { id: 'cat_detergente_ropa', name: 'Detergente para ropa 2kg', category: 'limpieza', price: 4200, unit: 'pqte' },
  { id: 'cat_suavizante', name: 'Suavizante de telas 1L', category: 'limpieza', price: 2100, unit: 'botella' },
  { id: 'cat_papel_higienico', name: 'Papel Higiénico (8 rollos)', category: 'limpieza', price: 3400, unit: 'pqte' },
  { id: 'cat_jabon_trastes', name: 'Jabón arrancagrasa para platos', category: 'limpieza', price: 1250, unit: 'unidad' },
  { id: 'cat_cloro', name: 'Cloro / Desinfectante 1L', category: 'limpieza', price: 950, unit: 'botella' },
  { id: 'cat_bolsas_basura', name: 'Bolsas para basura grandes', category: 'limpieza', price: 1800, unit: 'pqte' },

  // Cuidado Personal
  { id: 'cat_jabon_bano', name: 'Jabón de baño en barra', category: 'cuidado', price: 850, unit: 'unidad' },
  { id: 'cat_shampoo', name: 'Champú para cabello 400ml', category: 'cuidado', price: 3200, unit: 'botella' },
  { id: 'cat_desodorante', name: 'Desodorante', category: 'cuidado', price: 2600, unit: 'unidad' },
  { id: 'cat_crema_dental', name: 'Crema dental 100ml', category: 'cuidado', price: 1400, unit: 'tubo' }
];
