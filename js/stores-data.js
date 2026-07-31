const STORES = {
  supermercado: {
    id: 'supermercado',
    name: 'Supermercado',
    icon: '🛒',
    color: '#6366f1'
  },
  ferreteria: {
    id: 'ferreteria',
    name: 'Ferretería',
    icon: '🔨',
    color: '#f59e0b'
  },
  comercial: {
    id: 'comercial',
    name: 'Tienda Comercial',
    icon: '🛍️',
    color: '#ec4899'
  },
  farmacia: {
    id: 'farmacia',
    name: 'Farmacia',
    icon: '💊',
    color: '#10b981'
  }
};

const MULTI_STORE_CATALOGS = {
  supermercado: DEFAULT_CATALOG, // Loaded from catalog.js

  ferreteria: [
    { id: 'fer_martillo', name: 'Martillo de mango de fibra 16oz', category: 'otros', price: 4500, unit: 'unidad' },
    { id: 'fer_cinta_aislante', name: 'Cinta aislante negra 3M', category: 'otros', price: 950, unit: 'rollo' },
    { id: 'fer_cinta_teflon', name: 'Cinta teflón para tuberías', category: 'otros', price: 500, unit: 'rollo' },
    { id: 'fer_clavos_2in', name: 'Clavos con cabeza 2 pulgadas (500g)', category: 'otros', price: 1200, unit: 'pqte' },
    { id: 'fer_tornillos_madera', name: 'Tornillos para madera 1.5in (100u)', category: 'otros', price: 1800, unit: 'caja' },
    { id: 'fer_pintura_blanca', name: 'Cubeta Pintura Látex Blanca 1 galón', category: 'otros', price: 14500, unit: 'galón' },
    { id: 'fer_brocha_3in', name: 'Brocha para pintar 3 pulgadas', category: 'otros', price: 1600, unit: 'unidad' },
    { id: 'fer_lija_agua', name: 'Lija de agua #220 (hoja)', category: 'otros', price: 450, unit: 'hoja' },
    { id: 'fer_tubo_pvc', name: 'Tubo PVC 1/2 pulgada agua fría (6m)', category: 'otros', price: 3200, unit: 'unidad' },
    { id: 'fer_pegamento_pvc', name: 'Pegamento para PVC 1/4L', category: 'otros', price: 2100, unit: 'lata' },
    { id: 'fer_tomacorriente', name: 'Tomacorriente doble polarizado', category: 'otros', price: 1750, unit: 'unidad' },
    { id: 'fer_interruptor', name: 'Interruptor de luz sencillo', category: 'otros', price: 1350, unit: 'unidad' },
    { id: 'fer_silicona', name: 'Tubo de Silicona transparente', category: 'otros', price: 2400, unit: 'tubo' }
  ],

  comercial: [
    { id: 'com_cable_usb_c', name: 'Cable USB-C Carga Rápida 2m', category: 'otros', price: 3800, unit: 'unidad' },
    { id: 'com_cargador_pared', name: 'Cargador de pared 20W USB-C', category: 'otros', price: 6500, unit: 'unidad' },
    { id: 'com_audifonos_bluetooth', name: 'Audífonos Inalámbricos Bluetooth', category: 'otros', price: 12500, unit: 'unidad' },
    { id: 'com_baterias_aa', name: 'Baterías Alcalinas AA (pack 4u)', category: 'otros', price: 2400, unit: 'pack' },
    { id: 'com_baterias_aaa', name: 'Baterías Alcalinas AAA (pack 4u)', category: 'otros', price: 2400, unit: 'pack' },
    { id: 'com_extension_electrica', name: 'Extensión eléctrica 3 metros', category: 'otros', price: 4200, unit: 'unidad' },
    { id: 'com_foco_led', name: 'Foco LED 10W luz blanca', category: 'otros', price: 1200, unit: 'unidad' },
    { id: 'com_toalla_bano', name: 'Toalla de baño grande 100% algodón', category: 'otros', price: 5900, unit: 'unidad' },
    { id: 'com_almohada', name: 'Almohada ergonómica suave', category: 'otros', price: 7800, unit: 'unidad' },
    { id: 'com_sombrilla', name: 'Sombrilla reforzada para lluvia', category: 'otros', price: 3500, unit: 'unidad' }
  ],

  farmacia: [
    { id: 'far_acetaminofen', name: 'Acetaminofén / Paracetamol 500mg (20u)', category: 'cuidado', price: 1800, unit: 'caja' },
    { id: 'far_ibuprofeno', name: 'Ibuprofeno 400mg (10u)', category: 'cuidado', price: 2100, unit: 'caja' },
    { id: 'far_alcohol_90', name: 'Alcohol Antiséptico 70% 500ml', category: 'cuidado', price: 1400, unit: 'botella' },
    { id: 'far_curitas', name: 'Curitas adhesivas impermeables (20u)', category: 'cuidado', price: 950, unit: 'caja' },
    { id: 'far_gasas', name: 'Gasas estériles 10x10cm (5u)', category: 'cuidado', price: 850, unit: 'pqte' },
    { id: 'far_suero_oral', name: 'Suero Oral Rehidratante 500ml', category: 'cuidado', price: 1200, unit: 'botella' },
    { id: 'far_vitaminac', name: 'Vitamina C efervescente 1000mg', category: 'cuidado', price: 3400, unit: 'tubo' },
    { id: 'far_antiacido', name: 'Antiácido masticable sabor menta', category: 'cuidado', price: 2600, unit: 'caja' }
  ]
};
