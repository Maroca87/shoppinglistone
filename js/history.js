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

  // Export history as a beautiful standalone HTML Web Report
  exportToHTML(history) {
    if (!history || history.length === 0) return '';
    const stats = this.calculateStats(history);
    const generatedDate = new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Compras | SmartShop PWA</title>
  <style>
    :root {
      --primary: #6366f1;
      --bg: #0f172a;
      --card: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --success: #10b981;
      --border: #334155;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 1.6rem;
      font-weight: 700;
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
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
    }
    .stat-title {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .stat-val {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--success);
      margin-top: 4px;
    }
    .trip-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .trip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .trip-store {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .trip-total {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--success);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 0.88rem;
    }
    th, td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      color: var(--text-muted);
      font-weight: 600;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    @media print {
      body { background: #fff; color: #000; }
      .stat-card, .trip-card { border-color: #ccc; background: #fff; }
      .stat-val, .trip-total { color: #000; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">🛒 SmartShop - Reporte de Compras</div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">Generado el: ${generatedDate}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Acumulado Total</div>
        <div class="stat-val">${StorageManager.formatCurrency(stats.totalSpent)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Compras Realizadas</div>
        <div class="stat-val" style="color: var(--primary);">${stats.totalTrips}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Promedio por Viaje</div>
        <div class="stat-val" style="color: var(--primary);">${StorageManager.formatCurrency(stats.avgSpent)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Comercio Principal</div>
        <div class="stat-val" style="font-size: 1rem; color: var(--text);">${stats.topStore}</div>
      </div>
    </div>

    <h2 style="font-size: 1.1rem; margin-bottom: 14px;">Detalle de Viajes al Súper y Comercios</h2>
`;

    history.forEach(t => {
      html += `
      <div class="trip-card">
        <div class="trip-header">
          <div class="trip-store">${t.storeIcon || '🏬'} ${t.storeName}</div>
          <div class="trip-total">${StorageManager.formatCurrency(t.totalSpent)}</div>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">📅 ${t.formattedDate} • ${t.itemCount} productos</div>
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
              <td>${i.name}</td>
              <td>${i.quantity} ${i.unit || ''}</td>
              <td>${StorageManager.formatCurrency(i.price)}</td>
              <td><b>${StorageManager.formatCurrency(i.subtotal)}</b></td>
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
      Smart Shopping List PWA • Reporte de Compras Cifrado
    </div>
  </div>
</body>
</html>`;

    return html;
  }
};
