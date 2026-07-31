const ENCRYPTED_STORES_PREFIX = 'smart_shop_store_encrypted_v3_';
const ENCRYPTED_BUDGET_KEY = 'smart_shop_budget_encrypted_v3';

const StorageManager = {
  formatCurrency(amount) {
    const val = Number(amount) || 0;
    return '₡' + val.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  },

  // Load catalog for a specific store (encrypted with AES-256-GCM)
  async loadCatalog(storeId = 'supermercado') {
    try {
      const keyName = ENCRYPTED_STORES_PREFIX + storeId;
      const encryptedPayload = localStorage.getItem(keyName);
      
      const defaultStoreItems = MULTI_STORE_CATALOGS[storeId] || MULTI_STORE_CATALOGS.supermercado;

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
      const defaultStoreItems = MULTI_STORE_CATALOGS[storeId] || MULTI_STORE_CATALOGS.supermercado;
      return defaultStoreItems.map(item => ({ ...item, selected: false, completed: false, quantity: 1 }));
    }
  },

  // Save catalog for a specific store (encrypted with AES-256-GCM)
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

  async loadBudget() {
    try {
      const encryptedPayload = localStorage.getItem(ENCRYPTED_BUDGET_KEY);
      if (encryptedPayload && AuthManager.activeCryptoKey) {
        const payloadObj = JSON.parse(encryptedPayload);
        const decrypted = await SecurityModule.decryptData(payloadObj, AuthManager.activeCryptoKey);
        if (decrypted && decrypted.budget) return decrypted.budget;
      }
      return 35000;
    } catch (e) {
      return 35000;
    }
  },

  async saveBudget(amount) {
    try {
      if (AuthManager.activeCryptoKey) {
        const encrypted = await SecurityModule.encryptData({ budget: amount }, AuthManager.activeCryptoKey);
        localStorage.setItem(ENCRYPTED_BUDGET_KEY, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.error('Error saving budget:', e);
    }
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

    let text = `${storeInfo.icon} *LISTA DE COMPRAS - ${storeInfo.name.toUpperCase()} (COLONES ₡)*\n`;
    text += '───────────────\n\n';

    const grouped = {};
    selectedItems.forEach(item => {
      const cat = item.category || 'otros';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    for (const [catId, catItems] of Object.entries(grouped)) {
      const categoryData = CATEGORIES[catId] || CATEGORIES.otros;
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
