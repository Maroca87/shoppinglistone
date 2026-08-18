/**
 * ShoppinglistOne - Storage & Backup Manager
 * Handles local encrypted catalogs, user preferences, multi-store data,
 * and complete XML Backup & Restore module (.xml import/export).
 */
const ENCRYPTED_STORES_PREFIX = 'smart_shop_store_encrypted_v3_';
const ENCRYPTED_CUSTOM_STORES_KEY = 'smart_shop_custom_stores_v1';
const ENCRYPTED_APP_SETTINGS_KEY = 'smart_shop_app_settings_v1';

const StorageManager = {
  activeCurrency: '₡',

  formatCurrency(amount) {
    const val = Number(amount) || 0;
    const curr = this.activeCurrency || '₡';
    return curr + ' ' + val.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  },

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

  async saveCustomStores(customStoresMap) {
    try {
      if (AuthManager.activeCryptoKey) {
        const encrypted = await SecurityModule.encryptData(customStoresMap, AuthManager.activeCryptoKey);
        localStorage.setItem(ENCRYPTED_CUSTOM_STORES_KEY, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.error('Error saving custom stores:', e);
    }
  },

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
      console.error('Error loading encrypted store catalog:', e);
      const defaultStoreItems = MULTI_STORE_CATALOGS[storeId] || [];
      return defaultStoreItems.map(item => ({ ...item, selected: false, completed: false, quantity: item.quantity || 1 }));
    }
  },

  async saveCatalog(storeId, catalog) {
    try {
      if (AuthManager.activeCryptoKey) {
        const keyName = ENCRYPTED_STORES_PREFIX + storeId;
        const encrypted = await SecurityModule.encryptData(catalog, AuthManager.activeCryptoKey);
        localStorage.setItem(keyName, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.error('Error saving encrypted store catalog:', e);
    }
  },

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

  async deleteItemFromCatalog(storeId, itemId) {
    const catalog = await this.loadCatalog(storeId);
    const updated = catalog.filter(i => String(i.id) !== String(itemId));
    await this.saveCatalog(storeId, updated);
    return updated;
  },

  async loadSettings() {
    try {
      const encrypted = localStorage.getItem(ENCRYPTED_APP_SETTINGS_KEY);
      if (encrypted && AuthManager.activeCryptoKey) {
        const payloadObj = JSON.parse(encrypted);
        const decrypted = await SecurityModule.decryptData(payloadObj, AuthManager.activeCryptoKey);
        if (decrypted) {
          if (decrypted.currency) this.activeCurrency = decrypted.currency;
          return decrypted;
        }
      }
      return { appName: 'ShoppinglistOne', currency: '₡', defaultBudget: 35000 };
    } catch (e) {
      return { appName: 'ShoppinglistOne', currency: '₡', defaultBudget: 35000 };
    }
  },

  async saveSettings(settingsObj) {
    try {
      if (settingsObj && settingsObj.currency) {
        this.activeCurrency = settingsObj.currency;
      }
      if (AuthManager.activeCryptoKey) {
        const encrypted = await SecurityModule.encryptData(settingsObj, AuthManager.activeCryptoKey);
        localStorage.setItem(ENCRYPTED_APP_SETTINGS_KEY, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  async loadBudget() {
    const settings = await this.loadSettings();
    return settings.defaultBudget || 35000;
  },

  async saveBudget(amount) {
    const settings = await this.loadSettings();
    settings.defaultBudget = amount;
    await this.saveSettings(settings);
  },

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
  // XML BACKUP & RESTORE MODULE (MÓDULO DE RESPALDOS XML)
  // ==========================================

  async createBackup() {
    if (!AuthManager.activeCryptoKey) {
      throw new Error('Debes iniciar sesión para generar un respaldo.');
    }

    const customStores = await this.loadCustomStores();
    const allStores = { ...DEFAULT_STORES, ...customStores };
    const settings = await this.loadSettings();
    const history = await HistoryManager.loadHistory();
    const userConfig = AuthManager.getUserConfig();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<ShoppinglistOneBackup version="2.0" exportedAt="${new Date().toISOString()}">\n`;

    // User section
    xml += `  <User>\n`;
    xml += `    <Username>${this.escapeXml(userConfig?.username || 'Usuario')}</Username>\n`;
    xml += `    <SecurityQuestion>${this.escapeXml(userConfig?.securityQuestion || '¿Cuál es el nombre de tu primera mascota?')}</SecurityQuestion>\n`;
    xml += `  </User>\n`;

    // Settings section
    xml += `  <Settings>\n`;
    xml += `    <AppName>${this.escapeXml(settings?.appName || 'ShoppinglistOne')}</AppName>\n`;
    xml += `    <Currency>${this.escapeXml(settings?.currency || '₡')}</Currency>\n`;
    xml += `    <DefaultBudget>${Number(settings?.defaultBudget) || 35000}</DefaultBudget>\n`;
    xml += `  </Settings>\n`;

    // Custom Stores
    xml += `  <CustomStores>\n`;
    for (const [storeId, s] of Object.entries(customStores)) {
      xml += `    <Store id="${this.escapeXml(storeId)}" name="${this.escapeXml(s.name)}" icon="${this.escapeXml(s.icon)}" color="${this.escapeXml(s.color || '#2563eb')}" isCustom="true" />\n`;
    }
    xml += `  </CustomStores>\n`;

    // Stores Catalogs
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

    // Purchase History
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

    xml += `</ShoppinglistOneBackup>\n`;
    return xml;
  },

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

    // 1. Restore Custom Stores
    const customStoresMap = {};
    const customStoreEls = xmlDoc.querySelectorAll("CustomStores > Store");
    customStoreEls.forEach(el => {
      const id = el.getAttribute('id');
      if (id) {
        customStoresMap[id] = {
          id: id,
          name: el.getAttribute('name') || 'Tienda',
          icon: el.getAttribute('icon') || '🛍️',
          color: el.getAttribute('color') || '#2563eb',
          isCustom: true
        };
      }
    });
    if (Object.keys(customStoresMap).length > 0) {
      await this.saveCustomStores(customStoresMap);
    }

    // 2. Restore Store Catalogs
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

    // 3. Restore Settings
    const settingsEl = xmlDoc.querySelector("Settings");
    if (settingsEl) {
      const currency = settingsEl.querySelector("Currency")?.textContent || '₡';
      const defaultBudget = parseFloat(settingsEl.querySelector("DefaultBudget")?.textContent) || 35000;
      await this.saveSettings({ appName: 'ShoppinglistOne', currency, defaultBudget });
    }

    // 4. Restore History
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

    return {
      success: true,
      totalStores,
      totalItems: totalRestoredItems,
      historyTrips: historyList.length,
      exportedAt: exportedAt
    };
  },

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
      await this.saveSettings(parsed.settings);
    }

    let historyCount = 0;
    if (Array.isArray(parsed.history)) {
      await HistoryManager.saveHistory(parsed.history);
      historyCount = parsed.history.length;
    }

    return {
      success: true,
      totalStores,
      totalItems: totalRestoredItems,
      historyTrips: historyCount,
      exportedAt: parsed.exportedAt || 'Desconocida'
    };
  },

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
  }
};
