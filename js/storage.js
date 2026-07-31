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
          quantity: 1
        }));
        await this.saveCatalog(storeId, initial);
        return initial;
      }

      if (AuthManager.activeCryptoKey) {
        const payloadObj = JSON.parse(encryptedPayload);
        const decrypted = await SecurityModule.decryptData(payloadObj, AuthManager.activeCryptoKey);
        if (decrypted) return decrypted;
      }

      return defaultStoreItems.map(item => ({ ...item, selected: false, completed: false, quantity: 1 }));
    } catch (e) {
      console.error('Error loading encrypted store catalog:', e);
      const defaultStoreItems = MULTI_STORE_CATALOGS[storeId] || [];
      return defaultStoreItems.map(item => ({ ...item, selected: false, completed: false, quantity: 1 }));
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
      return { appName: 'SmartShop Multi', currency: '₡', defaultBudget: 35000 };
    } catch (e) {
      return { appName: 'SmartShop Multi', currency: '₡', defaultBudget: 35000 };
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
    text += '📱 _Generado desde Smart Shopping List PWA_';
    return text;
  }
};
