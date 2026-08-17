/**
 * ShoppinglistOne - Storage & Backup Manager
 * Handles local encrypted catalogs, user preferences, multi-store data,
 * and complete Backup & Restore module (.json import/export).
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
    const index = catalog.findIndex(i => i.id === updatedItem.id);
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
    const updated = catalog.filter(i => i.id !== itemId);
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
  // BACKUP & RESTORE MODULE (MÓDULO DE RESPALDOS)
  // ==========================================

  async createBackup() {
    if (!AuthManager.activeCryptoKey) {
      throw new Error('Debes iniciar sesión para generar un respaldo.');
    }

    const customStores = await this.loadCustomStores();
    const allStores = { ...DEFAULT_STORES, ...customStores };
    const storesCatalogs = {};

    for (const storeId of Object.keys(allStores)) {
      storesCatalogs[storeId] = await this.loadCatalog(storeId);
    }

    const settings = await this.loadSettings();
    const history = await HistoryManager.loadHistory();
    const userConfig = AuthManager.getUserConfig();

    const backupPayload = {
      app: 'ShoppinglistOne',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      user: {
        username: userConfig?.username || 'Usuario',
        securityQuestion: userConfig?.securityQuestion || '¿Cuál es el nombre de tu primera mascota?'
      },
      settings: settings,
      customStores: customStores,
      storesCatalogs: storesCatalogs,
      history: history
    };

    return JSON.stringify(backupPayload, null, 2);
  },

  async restoreBackup(backupJsonString) {
    if (!AuthManager.activeCryptoKey) {
      throw new Error('Debes iniciar sesión para restaurar un respaldo.');
    }

    let parsed;
    try {
      parsed = typeof backupJsonString === 'string' ? JSON.parse(backupJsonString) : backupJsonString;
    } catch (e) {
      throw new Error('El archivo o texto no es un JSON válido.');
    }

    if (!parsed || (!parsed.storesCatalogs && !parsed.stores && !parsed.app)) {
      throw new Error('Formato de respaldo incompatible o dañado.');
    }

    let totalRestoredItems = 0;
    let totalStores = 0;

    // 1. Restore Custom Stores
    if (parsed.customStores && typeof parsed.customStores === 'object') {
      await this.saveCustomStores(parsed.customStores);
    }

    // 2. Restore Store Catalogs
    const catalogsToRestore = parsed.storesCatalogs || parsed.stores || {};
    for (const [storeId, catalogArray] of Object.entries(catalogsToRestore)) {
      if (Array.isArray(catalogArray)) {
        await this.saveCatalog(storeId, catalogArray);
        totalRestoredItems += catalogArray.length;
        totalStores++;
      }
    }

    // 3. Restore Settings
    if (parsed.settings) {
      await this.saveSettings(parsed.settings);
    }

    // 4. Restore History
    let historyCount = 0;
    if (Array.isArray(parsed.history)) {
      await HistoryManager.saveHistory(parsed.history);
      historyCount = parsed.history.length;
    }

    return {
      success: true,
      totalStores: totalStores,
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
