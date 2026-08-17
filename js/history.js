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

  calculateStats(history) {
    if (!history || history.length === 0) {
      return { totalSpent: 0, totalTrips: 0, avgSpent: 0, topStore: 'N/A' };
    }

    const totalSpent = history.reduce((sum, t) => sum + (t.totalSpent || 0), 0);
    const totalTrips = history.length;
    const avgSpent = totalSpent / totalTrips;

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

    return { totalSpent, totalTrips, avgSpent, topStore };
  },

  // Export history as a ultra-legible high-contrast report
  exportToHTML(history) {
    if (!history || history.length === 0) return '';
    const stats = this.calculateStats(history);
    const generatedDate = new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Compras | ShoppinglistOne</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 1.6rem;
      font-weight: 800;
      color: #1e1b4b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
    }
    .stat-title {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
    }
    .stat-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: #059669;
      margin-top: 4px;
    }
    .trip-card {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .trip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .trip-store {
      font-size: 1.15rem;
      font-weight: 800;
      color: #1e293b;
    }
    .trip-total {
      font-size: 1.25rem;
      font-weight: 800;
      color: #059669;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 0.9rem;
    }
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
    }
    .footer {
      text-align: center;
      margin-top: 36px;
      font-size: 0.85rem;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">🛍️ ShoppinglistOne - Reporte de Compras</div>
      <div style="font-size: 0.85rem; color: #64748b;">${generatedDate}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Acumulado Total</div>
        <div class="stat-val">${StorageManager.formatCurrency(stats.totalSpent)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Compras Realizadas</div>
        <div class="stat-val" style="color: #4f46e5;">${stats.totalTrips}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Promedio por Viaje</div>
        <div class="stat-val" style="color: #4f46e5;">${StorageManager.formatCurrency(stats.avgSpent)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Comercio Principal</div>
        <div class="stat-val" style="font-size: 1.05rem; color: #1e293b;">${stats.topStore}</div>
      </div>
    </div>

    <h2 style="font-size: 1.15rem; margin-bottom: 16px; color: #1e293b;">Detalle de Viajes al Súper y Comercios</h2>
`;

    history.forEach(t => {
      html += `
      <div class="trip-card">
        <div class="trip-header">
          <div class="trip-store">${t.storeIcon || '🏬'} ${t.storeName}</div>
          <div class="trip-total">${StorageManager.formatCurrency(t.totalSpent)}</div>
        </div>
        <div style="font-size: 0.82rem; color: #64748b; margin-bottom: 12px;">📅 ${t.formattedDate} • ${t.itemCount} productos</div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
`;
      t.items.forEach(i => {
        html += `
            <tr>
              <td style="font-weight: 500;">${i.name}</td>
              <td>${i.quantity} ${i.unit || ''}</td>
              <td>${StorageManager.formatCurrency(i.price)}</td>
              <td><b style="color: #0f172a;">${StorageManager.formatCurrency(i.subtotal)}</b></td>
            </tr>
`;
      });
      html += `
          </tbody>
        </table>
      </div>
`;
    });

    html += `
    <div class="footer">
      ShoppinglistOne • Reporte de Compras
    </div>
  </div>
</body>
</html>`;

    return html;
  }
};
