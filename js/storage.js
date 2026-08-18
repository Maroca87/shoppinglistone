/**
 * ShoppinglistOne - Gestor de Almacenamiento, Respaldo y Reportes
 * Gestiona catálogos cifrados en reposo, tiendas personalizadas, ajustes de usuario,
 * historial de compras, lista rápida To-Do y respaldos completos en XML (.xml) y JSON.
 */
const ENCRYPTED_STORES_PREFIX = 'smart_shop_store_encrypted_v3_';
const ENCRYPTED_CUSTOM_STORES_KEY = 'smart_shop_custom_stores_v1';
const ENCRYPTED_APP_SETTINGS_KEY = 'smart_shop_app_settings_v1';
const ENCRYPTED_TODO_LIST_KEY = 'smart_shop_todo_list_v1';

const StorageManager = {
  activeCurrency: '₡',

  /**
   * Formatea un monto numérico con la moneda activa (₡ para Colones CRC o $ para Dólares USD).
   * @param {number} amount - Monto numérico a formatear.
   * @returns {string} Monto con el símbolo y formato correspondiente.
   */
  formatCurrency(amount) {
    const val = Number(amount) || 0;
    const curr = this.activeCurrency === '$' ? '$' : '₡';
    if (curr === '$') {
      return '$ ' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '₡ ' + Math.round(val).toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  },

  /**
   * Escapa caracteres especiales para inclusión segura en XML.
   * @param {*} unsafe - Valor sin sanitizar.
   * @returns {string} Cadena sanitizada para XML.
   */
  escapeXml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe).replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  },

  /**
   * Carga y descifra las tiendas personalizadas del usuario.
   * @returns {Promise<Object>} Mapa de tiendas personalizadas.
   */
  async loadCustomStores() {
    try {
      const encrypted = localStorage.getItem(ENCRYPTED_CUSTOM_STORES_KEY);
      if (encrypted && AuthManager.activeCryptoKey) {
        const payloadObj = JSON.parse(encrypted);
        const decrypted = await SecurityModule.decryptData(payloadObj, AuthManager.activeCryptoKey);
        return decrypted || {};
      }
      return {};
    } catch (e) {
      return {};
    }
  },

  /**
   * Cifra y guarda las tiendas personalizadas del usuario.
   * @param {Object} customStoresMap - Mapa de tiendas personalizadas.
   */
  async saveCustomStores(customStoresMap) {
    try {
      if (AuthManager.activeCryptoKey) {
        const encrypted = await SecurityModule.encryptData(customStoresMap, AuthManager.activeCryptoKey);
        localStorage.setItem(ENCRYPTED_CUSTOM_STORES_KEY, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.error('Error al guardar tiendas personalizadas:', e);
    }
  },

  /**
   * Carga y descifra el catálogo de una tienda específica.
   * @param {string} storeId - Identificador de la tienda.
   * @returns {Promise<Array>} Lista de productos del catálogo.
   */
  async loadCatalog(storeId = 'supermercado') {
    try {
      const keyName = ENCRYPTED_STORES_PREFIX + storeId;
      const encryptedPayload = localStorage.getItem(keyName);

      const defaultStoreItems = MULTI_STORE_CATALOGS[storeId] || [];

      if (!encryptedPayload) {
        const initial = defaultStoreItems.map(item => ({
          ...item,
          selected: false,
          completed: false,
          quantity: item.quantity || 1
        }));
        await this.saveCatalog(storeId, initial);
        return initial;
      }

      if (AuthManager.activeCryptoKey) {
        const payloadObj = JSON.parse(encryptedPayload);
        const decrypted = await SecurityModule.decryptData(payloadObj, AuthManager.activeCryptoKey);
        if (decrypted && Array.isArray(decrypted)) return decrypted;
      }

      return defaultStoreItems.map(item => ({ ...item, selected: false, completed: false, quantity: item.quantity || 1 }));
    } catch (e) {
      console.error('Error al cargar catálogo de tienda:', e);
      const defaultStoreItems = MULTI_STORE_CATALOGS[storeId] || [];
      return defaultStoreItems.map(item => ({ ...item, selected: false, completed: false, quantity: item.quantity || 1 }));
    }
  },

  /**
   * Cifra y guarda el catálogo de una tienda específica.
   * @param {string} storeId - Identificador de la tienda.
   * @param {Array} catalog - Lista de productos.
   */
  async saveCatalog(storeId, catalog) {
    try {
      if (AuthManager.activeCryptoKey) {
        const keyName = ENCRYPTED_STORES_PREFIX + storeId;
        const encrypted = await SecurityModule.encryptData(catalog, AuthManager.activeCryptoKey);
        localStorage.setItem(keyName, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.error('Error al guardar catálogo cifrado:', e);
    }
  },

  /**
   * Actualiza o inserta un producto en el catálogo de una tienda.
   * @param {string} storeId - Identificador de la tienda.
   * @param {Object} updatedItem - Producto a actualizar.
   * @returns {Promise<Array>} Catálogo actualizado.
   */
  async updateItemInCatalog(storeId, updatedItem) {
    const catalog = await this.loadCatalog(storeId);
    const index = catalog.findIndex(i => String(i.id) === String(updatedItem.id));
    if (index !== -1) {
      catalog[index] = { ...catalog[index], ...updatedItem };
    } else {
      catalog.unshift(updatedItem);
    }
    await this.saveCatalog(storeId, catalog);
    return catalog;
  },

  /**
   * Elimina un producto del catálogo de una tienda.
   * @param {string} storeId - Identificador de la tienda.
   * @param {string} itemId - ID del producto a eliminar.
   * @returns {Promise<Array>} Catálogo actualizado.
   */
  async deleteItemFromCatalog(storeId, itemId) {
    const catalog = await this.loadCatalog(storeId);
    const updated = catalog.filter(i => String(i.id) !== String(itemId));
    await this.saveCatalog(storeId, updated);
    return updated;
  },

  /**
   * Carga y descifra la configuración y preferencias de la aplicación.
   * @returns {Promise<Object>} Objeto de configuración.
   */
  async loadSettings() {
    try {
      const encrypted = localStorage.getItem(ENCRYPTED_APP_SETTINGS_KEY);
      if (encrypted && AuthManager.activeCryptoKey) {
        const payloadObj = JSON.parse(encrypted);
        const decrypted = await SecurityModule.decryptData(payloadObj, AuthManager.activeCryptoKey);
        if (decrypted) {
          if (decrypted.currency) this.activeCurrency = (decrypted.currency === '$' ? '$' : '₡');
          return decrypted;
        }
      }
      return { appName: 'ShoppinglistOne', currency: '₡', defaultBudget: 35000 };
    } catch (e) {
      return { appName: 'ShoppinglistOne', currency: '₡', defaultBudget: 35000 };
    }
  },

  /**
   * Cifra y guarda la configuración de la aplicación.
   * @param {Object} settingsObj - Objeto de configuración.
   */
  async saveSettings(settingsObj) {
    try {
      if (settingsObj && settingsObj.currency) {
        this.activeCurrency = (settingsObj.currency === '$' ? '$' : '₡');
      }
      if (AuthManager.activeCryptoKey) {
        const encrypted = await SecurityModule.encryptData(settingsObj, AuthManager.activeCryptoKey);
        localStorage.setItem(ENCRYPTED_APP_SETTINGS_KEY, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.error('Error al guardar ajustes:', e);
    }
  },

  /**
   * Carga el presupuesto por defecto.
   * @returns {Promise<number>} Presupuesto.
   */
  async loadBudget() {
    const settings = await this.loadSettings();
    return settings.defaultBudget || 35000;
  },

  /**
   * Guarda el presupuesto por defecto.
   * @param {number} amount - Monto del presupuesto.
   */
  async saveBudget(amount) {
    const settings = await this.loadSettings();
    settings.defaultBudget = amount;
    await this.saveSettings(settings);
  },

  /**
   * Reinicia una sesión de compra para una tienda.
   * @param {string} storeId - Identificador de tienda.
   * @param {Array} catalog - Catálogo actual.
   * @param {boolean} keepSelected - Si se mantienen seleccionados los productos.
   * @returns {Promise<Array>} Catálogo reiniciado.
   */
  async resetShoppingTrip(storeId, catalog, keepSelected = false) {
    const updated = catalog.map(item => ({
      ...item,
      completed: false,
      selected: keepSelected ? item.selected : false
    }));
    await this.saveCatalog(storeId, updated);
    return updated;
  },

  // ==========================================
  // MÓDULO TO-DO (LISTAS RÁPIDAS E INESPERADAS)
  // ==========================================

  /**
   * Carga y descifra la lista de tareas/compras rápidas To-Do.
   * @returns {Promise<Array>} Lista de elementos To-Do.
   */
  async loadTodoList() {
    try {
      const encrypted = localStorage.getItem(ENCRYPTED_TODO_LIST_KEY);
      if (encrypted && AuthManager.activeCryptoKey) {
        const payloadObj = JSON.parse(encrypted);
        const decrypted = await SecurityModule.decryptData(payloadObj, AuthManager.activeCryptoKey);
        if (decrypted && Array.isArray(decrypted)) return decrypted;
      }
      return [];
    } catch (e) {
      console.error('Error al cargar lista To-Do:', e);
      return [];
    }
  },

  /**
   * Cifra y guarda la lista To-Do en el almacenamiento local.
   * @param {Array} todoList - Lista de tareas/notas.
   */
  async saveTodoList(todoList) {
    try {
      if (AuthManager.activeCryptoKey) {
        const encrypted = await SecurityModule.encryptData(todoList, AuthManager.activeCryptoKey);
        localStorage.setItem(ENCRYPTED_TODO_LIST_KEY, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.error('Error al guardar lista To-Do:', e);
    }
  },

  // ==========================================
  // XML BACKUP & RESTORE MODULE (MÓDULO DE RESPALDOS XML)
  // ==========================================

  /**
   * Genera un archivo de respaldo XML con todas las tiendas, catálogos, historial, To-Do y ajustes.
   * @returns {Promise<string>} Contenido del documento XML generado.
   */
  async createBackup() {
    if (!AuthManager.activeCryptoKey) {
      throw new Error('Debes iniciar sesión para generar un respaldo.');
    }

    const customStores = await this.loadCustomStores();
    const allStores = { ...DEFAULT_STORES, ...customStores };
    const settings = await this.loadSettings();
    const history = await HistoryManager.loadHistory();
    const todoList = await this.loadTodoList();
    const userConfig = AuthManager.getUserConfig();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<ShoppinglistOneBackup version="2.1" exportedAt="${new Date().toISOString()}">\n`;

    // Sección de usuario
    xml += `  <User>\n`;
    xml += `    <Username>${this.escapeXml(userConfig?.username || 'Usuario')}</Username>\n`;
    xml += `    <SecurityQuestion>${this.escapeXml(userConfig?.securityQuestion || '¿Cuál es el nombre de tu primera mascota?')}</SecurityQuestion>\n`;
    xml += `  </User>\n`;

    // Sección de configuración
    xml += `  <Settings>\n`;
    xml += `    <AppName>${this.escapeXml(settings?.appName || 'ShoppinglistOne')}</AppName>\n`;
    xml += `    <Currency>${this.escapeXml(settings?.currency === '$' ? '$' : '₡')}</Currency>\n`;
    xml += `    <DefaultBudget>${Number(settings?.defaultBudget) || 35000}</DefaultBudget>\n`;
    xml += `  </Settings>\n`;

    // Tiendas personalizadas
    xml += `  <CustomStores>\n`;
    for (const [storeId, s] of Object.entries(customStores)) {
      xml += `    <Store id="${this.escapeXml(storeId)}" name="${this.escapeXml(s.name)}" icon="${this.escapeXml(s.icon)}" color="${this.escapeXml(s.color || '#3b82f6')}" isCustom="true" />\n`;
    }
    xml += `  </CustomStores>\n`;

    // Catálogos de todas las tiendas
    xml += `  <StoresCatalogs>\n`;
    for (const storeId of Object.keys(allStores)) {
      const catalog = await this.loadCatalog(storeId);
      xml += `    <Store id="${this.escapeXml(storeId)}">\n`;
      for (const item of catalog) {
        xml += `      <Item id="${this.escapeXml(item.id)}" name="${this.escapeXml(item.name)}" category="${this.escapeXml(item.category || 'otros')}" price="${Number(item.price) || 0}" quantity="${Number(item.quantity) || 1}" unit="${this.escapeXml(item.unit || 'unidad')}" selected="${Boolean(item.selected)}" completed="${Boolean(item.completed)}" />\n`;
      }
      xml += `    </Store>\n`;
    }
    xml += `  </StoresCatalogs>\n`;

    // Historial de compras
    xml += `  <History>\n`;
    for (const trip of history) {
      xml += `    <Trip id="${this.escapeXml(trip.id)}" storeId="${this.escapeXml(trip.storeId)}" storeName="${this.escapeXml(trip.storeName)}" storeIcon="${this.escapeXml(trip.storeIcon)}" date="${this.escapeXml(trip.date)}" formattedDate="${this.escapeXml(trip.formattedDate)}" totalSpent="${Number(trip.totalSpent) || 0}" itemCount="${Number(trip.itemCount) || 0}">\n`;
      xml += `      <Items>\n`;
      if (Array.isArray(trip.items)) {
        for (const i of trip.items) {
          xml += `        <Item name="${this.escapeXml(i.name)}" category="${this.escapeXml(i.category)}" quantity="${Number(i.quantity) || 1}" unit="${this.escapeXml(i.unit)}" price="${Number(i.price) || 0}" subtotal="${Number(i.subtotal) || 0}" />\n`;
        }
      }
      xml += `      </Items>\n`;
      xml += `    </Trip>\n`;
    }
    xml += `  </History>\n`;

    // Lista rápida To-Do
    xml += `  <TodoList>\n`;
    for (const todo of todoList) {
      xml += `    <Todo id="${this.escapeXml(todo.id)}" text="${this.escapeXml(todo.text)}" completed="${Boolean(todo.completed)}" createdAt="${this.escapeXml(todo.createdAt || '')}" />\n`;
    }
    xml += `  </TodoList>\n`;

    xml += `</ShoppinglistOneBackup>\n`;
    return xml;
  },

  /**
   * Restaura un respaldo desde una cadena XML o JSON.
   * @param {string} backupString - Contenido del respaldo.
   * @returns {Promise<Object>} Resumen de la restauración.
   */
  async restoreBackup(backupString) {
    if (!AuthManager.activeCryptoKey) {
      throw new Error('Debes iniciar sesión para restaurar un respaldo.');
    }

    const trimmed = String(backupString).trim();
    if (!trimmed) {
      throw new Error('El archivo o texto de respaldo está vacío.');
    }

    if (trimmed.startsWith('<')) {
      return await this.restoreBackupXML(trimmed);
    } else if (trimmed.startsWith('{')) {
      return await this.restoreBackupJSON(trimmed);
    } else {
      throw new Error('Formato de respaldo no reconocido. Debe ser un archivo XML (.xml) válido.');
    }
  },

  /**
   * Procesa y restaura una copia de seguridad en formato XML.
   * @param {string} xmlString - Texto XML del respaldo.
   * @returns {Promise<Object>} Resumen detallado.
   */
  async restoreBackupXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error('Error al procesar el archivo XML del respaldo. Verifica el contenido.');
    }

    const root = xmlDoc.documentElement;
    if (!root || (root.nodeName !== 'ShoppinglistOneBackup' && root.nodeName !== 'ShoppingListBackup')) {
      throw new Error('El archivo XML no corresponde a un respaldo válido de ShoppinglistOne.');
    }

    const exportedAt = root.getAttribute('exportedAt') || new Date().toISOString();
    let totalRestoredItems = 0;
    let totalStores = 0;

    // 1. Restaurar Tiendas Personalizadas
    const customStoresMap = {};
    const customStoreEls = xmlDoc.querySelectorAll("CustomStores > Store");
    customStoreEls.forEach(el => {
      const id = el.getAttribute('id');
      if (id) {
        customStoresMap[id] = {
          id: id,
          name: el.getAttribute('name') || 'Tienda',
          icon: el.getAttribute('icon') || '🛍️',
          color: el.getAttribute('color') || '#3b82f6',
          isCustom: true
        };
      }
    });
    if (Object.keys(customStoresMap).length > 0) {
      await this.saveCustomStores(customStoresMap);
    }

    // 2. Restaurar Catálogos de Tiendas
    const storeEls = xmlDoc.querySelectorAll("StoresCatalogs > Store");
    for (const sEl of storeEls) {
      const storeId = sEl.getAttribute('id');
      if (!storeId) continue;
      const items = [];
      const itemEls = sEl.querySelectorAll("Item");
      itemEls.forEach(iEl => {
        items.push({
          id: iEl.getAttribute('id') || ('item_' + Math.random().toString(36).slice(2)),
          name: iEl.getAttribute('name') || '',
          category: iEl.getAttribute('category') || 'otros',
          price: parseFloat(iEl.getAttribute('price')) || 0,
          quantity: parseFloat(iEl.getAttribute('quantity')) || 1,
          unit: iEl.getAttribute('unit') || 'unidad',
          selected: iEl.getAttribute('selected') === 'true',
          completed: iEl.getAttribute('completed') === 'true'
        });
      });
      await this.saveCatalog(storeId, items);
      totalRestoredItems += items.length;
      totalStores++;
    }

    // 3. Restaurar Ajustes
    const settingsEl = xmlDoc.querySelector("Settings");
    if (settingsEl) {
      const rawCurr = settingsEl.querySelector("Currency")?.textContent || '₡';
      const currency = rawCurr === '$' ? '$' : '₡';
      const defaultBudget = parseFloat(settingsEl.querySelector("DefaultBudget")?.textContent) || 35000;
      await this.saveSettings({ appName: 'ShoppinglistOne', currency, defaultBudget });
    }

    // 4. Restaurar Historial de Compras
    const historyList = [];
    const tripEls = xmlDoc.querySelectorAll("History > Trip");
    tripEls.forEach(tEl => {
      const tripItems = [];
      const tripItemEls = tEl.querySelectorAll("Items > Item");
      tripItemEls.forEach(tiEl => {
        tripItems.push({
          name: tiEl.getAttribute('name') || '',
          category: tiEl.getAttribute('category') || 'otros',
          quantity: parseFloat(tiEl.getAttribute('quantity')) || 1,
          unit: tiEl.getAttribute('unit') || 'unidad',
          price: parseFloat(tiEl.getAttribute('price')) || 0,
          subtotal: parseFloat(tiEl.getAttribute('subtotal')) || 0
        });
      });

      historyList.push({
        id: tEl.getAttribute('id') || ('trip_' + Date.now().toString(36)),
        storeId: tEl.getAttribute('storeId') || 'supermercado',
        storeName: tEl.getAttribute('storeName') || 'Comercio',
        storeIcon: tEl.getAttribute('storeIcon') || '🏬',
        date: tEl.getAttribute('date') || new Date().toISOString(),
        formattedDate: tEl.getAttribute('formattedDate') || '',
        totalSpent: parseFloat(tEl.getAttribute('totalSpent')) || 0,
        itemCount: parseInt(tEl.getAttribute('itemCount')) || tripItems.length,
        items: tripItems
      });
    });

    if (historyList.length > 0) {
      await HistoryManager.saveHistory(historyList);
    }

    // 5. Restaurar Lista To-Do
    const todoList = [];
    const todoEls = xmlDoc.querySelectorAll("TodoList > Todo");
    todoEls.forEach(tEl => {
      todoList.push({
        id: tEl.getAttribute('id') || ('todo_' + Date.now().toString(36) + Math.random().toString(36).slice(2)),
        text: tEl.getAttribute('text') || '',
        completed: tEl.getAttribute('completed') === 'true',
        createdAt: tEl.getAttribute('createdAt') || new Date().toISOString()
      });
    });

    if (todoList.length > 0) {
      await this.saveTodoList(todoList);
    }

    return {
      success: true,
      totalStores,
      totalItems: totalRestoredItems,
      historyTrips: historyList.length,
      todoItems: todoList.length,
      exportedAt: exportedAt
    };
  },

  /**
   * Procesa y restaura una copia de seguridad en formato JSON.
   * @param {string} jsonString - Texto JSON del respaldo.
   * @returns {Promise<Object>} Resumen de la restauración.
   */
  async restoreBackupJSON(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Formato JSON inválido.');
    }

    let totalRestoredItems = 0;
    let totalStores = 0;

    if (parsed.customStores && typeof parsed.customStores === 'object') {
      await this.saveCustomStores(parsed.customStores);
    }

    const catalogsToRestore = parsed.storesCatalogs || parsed.stores || {};
    for (const [storeId, catalogArray] of Object.entries(catalogsToRestore)) {
      if (Array.isArray(catalogArray)) {
        await this.saveCatalog(storeId, catalogArray);
        totalRestoredItems += catalogArray.length;
        totalStores++;
      }
    }

    if (parsed.settings) {
      if (parsed.settings.currency) {
        parsed.settings.currency = parsed.settings.currency === '$' ? '$' : '₡';
      }
      await this.saveSettings(parsed.settings);
    }

    let historyCount = 0;
    if (Array.isArray(parsed.history)) {
      await HistoryManager.saveHistory(parsed.history);
      historyCount = parsed.history.length;
    }

    let todoCount = 0;
    if (Array.isArray(parsed.todoList)) {
      await this.saveTodoList(parsed.todoList);
      todoCount = parsed.todoList.length;
    }

    return {
      success: true,
      totalStores,
      totalItems: totalRestoredItems,
      historyTrips: historyCount,
      todoItems: todoCount,
      exportedAt: parsed.exportedAt || 'Desconocida'
    };
  },

  /**
   * Exporta la lista de compras seleccionadas a formato de texto enriquecido (WhatsApp / Telegram).
   * @param {string} storeId - Identificador de la tienda.
   * @param {Array} catalog - Catálogo actual.
   * @returns {string} Texto formateado.
   */
  exportToText(storeId, catalog) {
    const storeInfo = STORES[storeId] || STORES.supermercado;
    const selectedItems = catalog.filter(i => i.selected);
    if (selectedItems.length === 0) return `No tienes productos seleccionados en ${storeInfo.name}.`;

    let text = `${storeInfo.icon} *LISTA DE COMPRAS - ${storeInfo.name.toUpperCase()}*\n`;
    text += '───────────────\n\n';

    const grouped = {};
    selectedItems.forEach(item => {
      const cat = item.category || 'otros';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    const storeCats = getStoreCategories(storeId);
    for (const [catId, catItems] of Object.entries(grouped)) {
      const categoryData = storeCats[catId] || storeCats.otros || { icon: '📦', name: 'Otros' };
      text += `${categoryData.icon} *${categoryData.name}*\n`;
      catItems.forEach(item => {
        const check = item.completed ? '✅' : '◻️';
        const qty = item.quantity ? ` (${item.quantity} ${item.unit || ''})` : '';
        const price = item.price ? ` - ${StorageManager.formatCurrency(item.price * item.quantity)}` : '';
        text += `${check} ${item.name}${qty}${price}\n`;
      });
      text += '\n';
    }

    const total = selectedItems.reduce((acc, i) => acc + ((i.price || 0) * (i.quantity || 1)), 0);
    text += `💰 *Total Estimado:* ${StorageManager.formatCurrency(total)}\n`;
    text += '📱 _Generado desde ShoppinglistOne PWA_';
    return text;
  },

  /**
   * Exporta la lista rápida To-Do a formato de texto para compartir.
   * @param {Array} todoList - Lista To-Do actual.
   * @returns {string} Texto formateado.
   */
  exportTodoToText(todoList) {
    if (!todoList || todoList.length === 0) return 'La lista To-Do está vacía.';
    let text = '📝 *LISTA RÁPIDA / TO-DO - SHOPPINGLISTONE*\n';
    text += '───────────────\n\n';
    todoList.forEach(t => {
      const icon = t.completed ? '✅' : '◻️';
      text += `${icon} ${t.text}\n`;
    });
    text += '\n📱 _Generado desde ShoppinglistOne_';
    return text;
  }
};
