const HISTORY_KEY = 'smart_shop_history_v3';

const HistoryManager = {
  async loadHistory() {
    try {
      const encryptedPayload = localStorage.getItem(HISTORY_KEY);
      if (!encryptedPayload) return [];

      if (AuthManager.activeCryptoKey) {
        const payloadObj = JSON.parse(encryptedPayload);
        const decrypted = await SecurityModule.decryptData(payloadObj, AuthManager.activeCryptoKey);
        return decrypted || [];
      }
      return [];
    } catch (e) {
      console.error('Error loading encrypted history:', e);
      return [];
    }
  },

  async saveHistory(historyArray) {
    try {
      if (AuthManager.activeCryptoKey) {
        const encrypted = await SecurityModule.encryptData(historyArray, AuthManager.activeCryptoKey);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.error('Error saving encrypted history:', e);
    }
  },

  async addShoppingTrip(storeId, itemsBought, totalSpent) {
    const history = await this.loadHistory();
    const now = new Date();
    const storeInfo = STORES[storeId] || STORES.supermercado;

    const newTrip = {
      id: 'trip_' + Date.now().toString(36),
      storeId: storeId,
      storeName: storeInfo.name,
      storeIcon: storeInfo.icon,
      date: now.toISOString(),
      formattedDate: now.toLocaleDateString('es-CR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      totalSpent: totalSpent,
      itemCount: itemsBought.length,
      items: itemsBought.map(i => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        price: i.price,
        subtotal: (i.price || 0) * (i.quantity || 1)
      }))
    };

    history.unshift(newTrip);
    await this.saveHistory(history);
    return newTrip;
  },

  async deleteTrip(tripId) {
    const history = await this.loadHistory();
    const updated = history.filter(t => t.id !== tripId);
    await this.saveHistory(updated);
    return updated;
  },

  async clearAllHistory() {
    await this.saveHistory([]);
    return [];
  },

  // Calculate summary stats for history
  calculateStats(history) {
    if (!history || history.length === 0) {
      return { totalSpent: 0, totalTrips: 0, avgSpent: 0, topStore: 'N/A' };
    }

    const totalSpent = history.reduce((sum, t) => sum + (t.totalSpent || 0), 0);
    const totalTrips = history.length;
    const avgSpent = totalSpent / totalTrips;

    // Find top store by expenditure
    const storeTotals = {};
    history.forEach(t => {
      const s = t.storeName || 'Otro';
      storeTotals[s] = (storeTotals[s] || 0) + (t.totalSpent || 0);
    });

    let topStore = 'Supermercado';
    let maxVal = -1;
    for (const [sName, sVal] of Object.entries(storeTotals)) {
      if (sVal > maxVal) {
        maxVal = sVal;
        topStore = sName;
      }
    }

    return {
      totalSpent,
      totalTrips,
      avgSpent,
      topStore
    };
  },

  // Export history to CSV format for Excel/Download
  exportToCSV(history) {
    if (!history || history.length === 0) return '';
    let csv = 'ID,Fecha,Tienda,Total (CRC),Cant Productos,Productos\n';
    history.forEach(t => {
      const itemsStr = t.items.map(i => `${i.name} (${i.quantity} ${i.unit || ''})`).join('; ');
      csv += `"${t.id}","${t.formattedDate}","${t.storeName}",${t.totalSpent},${t.itemCount},"${itemsStr}"\n`;
    });
    return csv;
  }
};
