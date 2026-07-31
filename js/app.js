class SmartShoppingApp {
  constructor() {
    this.appName = 'ShoppingListOne';
    this.currentStoreId = 'supermercado';
    this.customStores = {};
    this.catalog = [];
    this.budget = 35000;
    this.history = [];
    this.currentMode = 'catalog'; // 'catalog', 'shopping', 'history'
    this.selectedCatFilter = 'all';
    this.selectedHistoryStoreFilter = 'all';
    this.searchTerm = '';
    this.editingPriceItemId = null;
    this.expandedTripId = null;

    this.initElements();
    this.initEvents();
    this.initTheme();
    this.initAuth();
  }

  initElements() {
    // Header Elements
    this.brandTitleText = document.getElementById('brandTitleText');
    this.themeBtn = document.getElementById('themeToggleBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.logoutBtn = document.getElementById('logoutBtn');

    // Navigation Tabs
    this.tabCatalog = document.getElementById('tabCatalog');
    this.tabShopping = document.getElementById('tabShopping');
    this.tabHistory = document.getElementById('tabHistory');
    this.shoppingBadge = document.getElementById('shoppingBadge');

    // Store Selector Container
    this.storeSelectorBar = document.getElementById('storeSelectorBar');

    // Stats & Budget
    this.statsCard = document.getElementById('statsCard');
    this.spentEl = document.getElementById('spentAmount');
    this.totalEl = document.getElementById('totalAmount');
    this.budgetBadge = document.getElementById('budgetBadge');
    this.progressBarFill = document.getElementById('progressBarFill');

    // Search and Filters
    this.searchRow = document.getElementById('searchRow');
    this.searchInput = document.getElementById('searchInput');
    this.categoryFilterPills = document.getElementById('categoryFilterPills');

    // Containers
    this.contentContainer = document.getElementById('contentContainer');
    this.bottomBarContent = document.getElementById('bottomBarContent');

    // Modals
    this.customItemModal = document.getElementById('customItemModal');
    this.customItemForm = document.getElementById('customItemForm');
    this.customNameInput = document.getElementById('customItemName');
    this.customCategorySelect = document.getElementById('customItemCategory');
    this.customPriceInput = document.getElementById('customItemPrice');
    this.customQtyInput = document.getElementById('customItemQty');
    this.customUnitSelect = document.getElementById('customItemUnit');

    this.newStoreModal = document.getElementById('newStoreModal');
    this.newStoreForm = document.getElementById('newStoreForm');
    this.newStoreNameInput = document.getElementById('newStoreName');
    this.newStoreIconInput = document.getElementById('newStoreIcon');

    this.priceModal = document.getElementById('priceModal');
    this.priceForm = document.getElementById('priceForm');
    this.modalPriceInput = document.getElementById('modalPriceInput');
    this.priceModalItemName = document.getElementById('priceModalItemName');

    this.budgetModal = document.getElementById('budgetModal');
    this.budgetInput = document.getElementById('modalBudgetInput');

    this.settingsModal = document.getElementById('settingsModal');
    this.currencySelect = document.getElementById('settingCurrency');
    this.defaultBudgetInput = document.getElementById('settingDefaultBudget');

    this.exportModal = document.getElementById('exportModal');
    this.exportTextArea = document.getElementById('exportTextArea');

    // Auth Screen
    this.authOverlay = document.getElementById('authOverlay');
    this.authForm = document.getElementById('authForm');
    this.authTitle = document.getElementById('authTitle');
    this.authDesc = document.getElementById('authDesc');
    this.usernameGroup = document.getElementById('usernameGroup');
    this.authUsernameInput = document.getElementById('authUsername');
    this.authPasswordInput = document.getElementById('authPassword');
    this.authSubmitBtn = document.getElementById('authSubmitBtn');

    this.renderStorePills();
    this.updateStoreCategories();
  }

  renderStorePills() {
    let html = '';
    for (const [sId, sData] of Object.entries(STORES)) {
      const activeClass = sId === this.currentStoreId ? 'active' : '';
      html += `
        <button class="store-pill ${activeClass}" data-store="${sId}">
          <span>${sData.icon}</span>
          <span>${sData.name}</span>
        </button>
      `;
    }
    html += `
      <button class="store-pill add-store-btn" onclick="app.openNewStoreModal()">
        <span>+</span>
        <span>Nueva Tienda</span>
      </button>
    `;
    this.storeSelectorBar.innerHTML = html;
  }

  updateStoreCategories() {
    CATEGORIES = getStoreCategories(this.currentStoreId);
    this.selectedCatFilter = 'all';

    this.customCategorySelect.innerHTML = Object.values(CATEGORIES).map(cat => 
      `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
    ).join('');

    this.renderCategoryPills();
  }

  renderCategoryPills() {
    let pillsHTML = `<button class="pill-btn active" data-cat="all">Todas</button>`;
    for (const [catId, catData] of Object.entries(CATEGORIES)) {
      pillsHTML += `<button class="pill-btn" data-cat="${catId}">${catData.icon} ${catData.name}</button>`;
    }
    this.categoryFilterPills.innerHTML = pillsHTML;
  }

  initEvents() {
    this.storeSelectorBar.addEventListener('click', async (e) => {
      const pill = e.target.closest('.store-pill');
      if (!pill || pill.classList.contains('add-store-btn')) return;
      const targetStoreId = pill.dataset.store;
      if (targetStoreId !== this.currentStoreId) {
        await this.switchStore(targetStoreId);
      }
    });

    this.tabCatalog.addEventListener('click', () => this.switchMode('catalog'));
    this.tabShopping.addEventListener('click', () => this.switchMode('shopping'));
    this.tabHistory.addEventListener('click', () => this.switchMode('history'));

    this.searchInput.addEventListener('input', (e) => {
      this.searchTerm = SecurityModule.sanitizeInput(e.target.value.toLowerCase().trim());
      this.render();
    });

    this.categoryFilterPills.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      this.categoryFilterPills.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      this.selectedCatFilter = btn.dataset.cat;
      this.render();
    });

    this.themeBtn.addEventListener('click', () => this.toggleTheme());
    this.exportBtn.addEventListener('click', () => this.openExportModal());
    this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
    this.logoutBtn.addEventListener('click', () => AuthManager.logout());
    this.budgetBadge.addEventListener('click', () => this.openBudgetModal());

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeAllModals();
      });
    });

    this.customItemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addCustomItem();
    });

    this.newStoreForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createNewCustomStore();
    });

    this.priceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePriceEdit();
    });

    document.getElementById('budgetForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const val = parseFloat(this.budgetInput.value);
      if (!isNaN(val) && val >= 0) {
        this.budget = val;
        StorageManager.saveBudget(val);
        this.closeAllModals();
        this.render();
      }
    });

    document.getElementById('settingsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });

    this.authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAuthSubmit();
    });

    document.getElementById('copyTextBtn').addEventListener('click', () => {
      this.exportTextArea.select();
      navigator.clipboard.writeText(this.exportTextArea.value).then(() => {
        alert('¡Lista copiada al portapapeles! Lista para pegar en WhatsApp.');
      });
    });
  }

  async initAuth() {
    if (!AuthManager.isRegistered()) {
      this.authTitle.textContent = 'Crear Cuenta Segura';
      this.authDesc.textContent = 'Establece tu usuario y contraseña para cifrar localmente tus compras.';
      this.usernameGroup.style.display = 'flex';
      this.authSubmitBtn.textContent = 'Registrar y Cifrar App';
      this.authOverlay.style.display = 'flex';
    } else {
      const user = AuthManager.getUserConfig();
      this.authTitle.textContent = `Bienvenido, ${user ? user.username : 'Usuario'}`;
      this.authDesc.textContent = 'Ingresa tu contraseña para acceder a ShoppingListOne.';
      this.usernameGroup.style.display = 'none';
      this.authSubmitBtn.textContent = 'Desbloquear App';
      this.authOverlay.style.display = 'flex';
    }
  }

  async handleAuthSubmit() {
    const pwd = this.authPasswordInput.value;
    if (!pwd) return;

    if (!AuthManager.isRegistered()) {
      const username = this.authUsernameInput.value.trim() || 'Usuario';
      await AuthManager.registerUser(username, pwd);
      await this.postAuthUnlock();
    } else {
      const success = await AuthManager.loginUser(pwd);
      if (success) {
        await this.postAuthUnlock();
      } else {
        alert('Contraseña incorrecta. Intenta nuevamente.');
        this.authPasswordInput.value = '';
      }
    }
  }

  async postAuthUnlock() {
    this.authOverlay.style.display = 'none';
    const settings = await StorageManager.loadSettings();
    this.appName = 'ShoppingListOne';
    this.brandTitleText.textContent = this.appName;

    this.customStores = await StorageManager.loadCustomStores();
    STORES = { ...DEFAULT_STORES, ...this.customStores };

    this.budget = settings.defaultBudget || 35000;
    this.history = await HistoryManager.loadHistory();
    await this.switchStore(this.currentStoreId);
  }

  async switchStore(storeId) {
    this.currentStoreId = storeId;
    this.renderStorePills();
    this.updateStoreCategories();
    this.catalog = await StorageManager.loadCatalog(this.currentStoreId);
    this.render();
  }

  openNewStoreModal() {
    this.newStoreNameInput.value = '';
    this.newStoreIconInput.value = '🛍️';
    this.newStoreModal.classList.add('active');
  }

  async createNewCustomStore() {
    const name = SecurityModule.sanitizeInput(this.newStoreNameInput.value.trim());
    const icon = this.newStoreIconInput.value.trim() || '🛍️';
    if (!name) return;

    const storeId = 'custom_store_' + Date.now().toString(36);
    const newStoreObj = {
      id: storeId,
      name: name,
      icon: icon,
      color: '#6366f1',
      isCustom: true
    };

    this.customStores[storeId] = newStoreObj;
    STORES[storeId] = newStoreObj;
    MULTI_STORE_CATALOGS[storeId] = [];

    await StorageManager.saveCustomStores(this.customStores);
    this.closeAllModals();
    await this.switchStore(storeId);
  }

  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.themeBtn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.themeBtn.innerHTML = next === 'dark' ? '☀️' : '🌙';
  }

  switchMode(mode) {
    this.currentMode = mode;
    this.tabCatalog.classList.toggle('active', mode === 'catalog');
    this.tabShopping.classList.toggle('active', mode === 'shopping');
    this.tabHistory.classList.toggle('active', mode === 'history');
    this.render();
  }

  async toggleItemSelection(id) {
    const item = this.catalog.find(i => i.id === id);
    if (item) {
      item.selected = !item.selected;
      if (!item.selected) item.completed = false;
      await this.saveAndRender();
    }
  }

  async changeQuantity(id, delta) {
    const item = this.catalog.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(1, (item.quantity || 1) + delta);
      await this.saveAndRender();
    }
  }

  async toggleItemBought(id) {
    const item = this.catalog.find(i => i.id === id);
    if (item) {
      item.completed = !item.completed;
      await this.saveAndRender();
    }
  }

  openPriceModal(id) {
    const item = this.catalog.find(i => i.id === id);
    if (!item) return;

    this.editingPriceItemId = id;
    this.priceModalItemName.textContent = item.name;
    this.modalPriceInput.value = item.price || 0;
    this.priceModal.classList.add('active');
  }

  async savePriceEdit() {
    if (!this.editingPriceItemId) return;
    const item = this.catalog.find(i => i.id === this.editingPriceItemId);
    if (item) {
      item.price = parseFloat(this.modalPriceInput.value) || 0;
      await this.saveAndRender();
    }
    this.closeAllModals();
  }

  openCustomItemModal() {
    this.customNameInput.value = '';
    this.customPriceInput.value = '';
    this.customQtyInput.value = 1;
    this.customItemModal.classList.add('active');
  }

  async addCustomItem() {
    const name = SecurityModule.sanitizeInput(this.customNameInput.value.trim());
    if (!name) return;

    const detectedCat = this.customCategorySelect.value || autoDetectCategory(name, this.currentStoreId);
    const newItem = {
      id: 'custom_' + Date.now().toString(36),
      name: name,
      category: detectedCat,
      price: parseFloat(this.customPriceInput.value) || 0,
      quantity: parseFloat(this.customQtyInput.value) || 1,
      unit: this.customUnitSelect.value || 'unidad',
      selected: true,
      completed: false
    };

    this.catalog.unshift(newItem);
    this.closeAllModals();
    await this.saveAndRender();
  }

  openBudgetModal() {
    this.budgetInput.value = this.budget;
    this.budgetModal.classList.add('active');
  }

  async openSettingsModal() {
    const settings = await StorageManager.loadSettings();
    this.currencySelect.value = settings.currency || '₡';
    this.defaultBudgetInput.value = settings.defaultBudget || 35000;
    this.settingsModal.classList.add('active');
  }

  async saveSettings() {
    const currency = this.currencySelect.value || '₡';
    const val = parseFloat(this.defaultBudgetInput.value) || 35000;

    this.budget = val;

    await StorageManager.saveSettings({ appName: 'ShoppingListOne', currency, defaultBudget: val });
    this.closeAllModals();
    this.render();
  }

  openExportModal() {
    this.exportTextArea.value = StorageManager.exportToText(this.currentStoreId, this.catalog);
    this.exportModal.classList.add('active');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });
    this.editingPriceItemId = null;
  }

  async finishShoppingTrip() {
    const selectedItems = this.catalog.filter(i => i.selected);
    if (selectedItems.length === 0) return;

    const storeInfo = STORES[this.currentStoreId] || STORES.supermercado;
    const totalSpent = selectedItems.filter(i => i.completed).reduce((acc, i) => acc + ((i.price || 0) * (i.quantity || 1)), 0);

    if (confirm(`¿Deseas finalizar la compra en ${storeInfo.name} y registrar este viaje (${StorageManager.formatCurrency(totalSpent)}) en tu Historial?`)) {
      await HistoryManager.addShoppingTrip(this.currentStoreId, selectedItems.filter(i => i.completed), totalSpent);
      this.history = await HistoryManager.loadHistory();

      this.catalog = await StorageManager.resetShoppingTrip(this.currentStoreId, this.catalog, false);
      await this.saveAndRender();
      this.switchMode('history');
    }
  }

  async deleteHistoryTrip(tripId) {
    if (confirm('¿Eliminar esta compra del historial?')) {
      this.history = await HistoryManager.deleteTrip(tripId);
      this.render();
    }
  }

  toggleTripExpand(tripId) {
    this.expandedTripId = this.expandedTripId === tripId ? null : tripId;
    this.render();
  }

  // Web Share Sheet Export for PDF / Report
  async shareReport() {
    if (!this.history || this.history.length === 0) {
      alert('El historial está vacío.');
      return;
    }

    const htmlReport = HistoryManager.exportToHTML(this.history);

    if (navigator.share) {
      try {
        const stats = HistoryManager.calculateStats(this.history);
        await navigator.share({
          title: 'Reporte de Compras - ShoppingListOne',
          text: `📊 Mi Reporte de Compras en ShoppingListOne:\n• Total Gastado: ${StorageManager.formatCurrency(stats.totalSpent)}\n• Compras Realizadas: ${stats.totalTrips}\n• Promedio por viaje: ${StorageManager.formatCurrency(stats.avgSpent)}`
        });
      } catch (err) {
        console.log('Share canceled or not supported:', err);
      }
    } else {
      // Fallback: Download formatted HTML file
      const blob = new Blob([htmlReport], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_compras_${new Date().toISOString().slice(0,10)}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  async clearAllHistory() {
    if (confirm('¿Seguro que deseas borrar TODO tu historial de compras? Esta acción no se puede deshacer.')) {
      this.history = await HistoryManager.clearAllHistory();
      this.render();
    }
  }

  async saveAndRender() {
    await StorageManager.saveCatalog(this.currentStoreId, this.catalog);
    this.render();
  }

  renderStats() {
    const selectedItems = this.catalog.filter(i => i.selected);
    let spent = 0;
    let total = 0;

    selectedItems.forEach(item => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      total += itemTotal;
      if (item.completed) {
        spent += itemTotal;
      }
    });

    this.spentEl.textContent = StorageManager.formatCurrency(spent);
    this.totalEl.textContent = StorageManager.formatCurrency(total);
    this.budgetBadge.textContent = `Presupuesto: ${StorageManager.formatCurrency(this.budget)}`;

    this.shoppingBadge.textContent = selectedItems.length;

    const percentage = this.budget > 0 ? Math.min((spent / this.budget) * 100, 100) : 0;
    this.progressBarFill.style.width = `${percentage}%`;
    this.progressBarFill.classList.toggle('exceeded', spent > this.budget && this.budget > 0);
  }

  render() {
    if (!AuthManager.activeCryptoKey) return;

    this.renderStats();

    if (this.currentMode === 'catalog') {
      this.storeSelectorBar.style.display = 'flex';
      this.searchRow.style.display = 'flex';
      this.statsCard.style.display = 'flex';
      this.renderCatalogMode();
    } else if (this.currentMode === 'shopping') {
      this.storeSelectorBar.style.display = 'flex';
      this.searchRow.style.display = 'flex';
      this.statsCard.style.display = 'flex';
      this.renderShoppingMode();
    } else if (this.currentMode === 'history') {
      this.storeSelectorBar.style.display = 'none';
      this.searchRow.style.display = 'none';
      this.statsCard.style.display = 'none';
      this.renderHistoryMode();
    }
  }

  renderCatalogMode() {
    const storeInfo = STORES[this.currentStoreId] || STORES.supermercado;
    const selectedCount = this.catalog.filter(i => i.selected).length;

    this.bottomBarContent.innerHTML = `
      <button class="btn-primary" onclick="app.openCustomItemModal()">
        <span>+</span>
        <span>Añadir Producto a ${storeInfo.name}</span>
      </button>
      ${selectedCount > 0 ? `
        <button class="btn-secondary" onclick="app.switchMode('shopping')">
          <span>🛒 Ir a Comprar (${selectedCount})</span>
        </button>
      ` : ''}
    `;

    let list = this.catalog;
    if (this.selectedCatFilter !== 'all') {
      list = list.filter(i => i.category === this.selectedCatFilter);
    }
    if (this.searchTerm) {
      list = list.filter(i => i.name.toLowerCase().includes(this.searchTerm));
    }

    if (list.length === 0) {
      this.contentContainer.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">${storeInfo.icon}</span>
          <span class="empty-title">Catálogo de ${storeInfo.name}</span>
          <span class="empty-desc">No se encontraron productos. Crea un producto nuevo con el botón inferior.</span>
        </div>
      `;
      return;
    }

    const grouped = {};
    list.forEach(item => {
      const cat = item.category || 'otros';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    let html = '';
    for (const catId of Object.keys(CATEGORIES)) {
      if (!grouped[catId] || grouped[catId].length === 0) continue;
      const catData = CATEGORIES[catId];
      const catItems = grouped[catId];

      html += `
        <div class="category-group">
          <div class="category-header">
            <div class="category-title">
              <span class="category-badge-dot" style="background-color: ${catData.color}"></span>
              <span>${catData.icon} ${catData.name}</span>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${catItems.length} productos</span>
          </div>
          <ul class="items-list">
            ${catItems.map(item => this.renderCatalogItemRow(item)).join('')}
          </ul>
        </div>
      `;
    }
    this.contentContainer.innerHTML = html;
  }

  renderCatalogItemRow(item) {
    const isSelected = item.selected;
    const formattedPrice = StorageManager.formatCurrency(item.price);

    return `
      <li class="catalog-item-row ${isSelected ? 'is-selected' : ''}">
        <div class="item-info">
          <span class="item-name">${item.name}</span>
          <div class="item-subtext">
            <span class="edit-price-tag" onclick="app.openPriceModal('${item.id}')" title="Toca para editar precio">
              ✏️ ${formattedPrice} / ${item.unit || 'unid'}
            </span>
          </div>
        </div>

        ${isSelected ? `
          <div class="qty-stepper">
            <button class="stepper-btn" onclick="app.changeQuantity('${item.id}', -1)">-</button>
            <span class="stepper-val">${item.quantity || 1}</span>
            <button class="stepper-btn" onclick="app.changeQuantity('${item.id}', 1)">+</button>
          </div>
          <button class="select-btn" onclick="app.toggleItemSelection('${item.id}')">
            ✓ Agregado
          </button>
        ` : `
          <button class="select-btn" onclick="app.toggleItemSelection('${item.id}')">
            + Añadir
          </button>
        `}
      </li>
    `;
  }

  renderShoppingMode() {
    const storeInfo = STORES[this.currentStoreId] || STORES.supermercado;
    const selectedItems = this.catalog.filter(i => i.selected);

    if (selectedItems.length > 0) {
      this.bottomBarContent.innerHTML = `
        <button class="btn-primary btn-success" onclick="app.finishShoppingTrip()">
          <span>✨</span>
          <span>Finalizar Compra en ${storeInfo.name}</span>
        </button>
      `;
    } else {
      this.bottomBarContent.innerHTML = `
        <button class="btn-primary" onclick="app.switchMode('catalog')">
          <span>📋</span>
          <span>Ir al Catálogo de ${storeInfo.name}</span>
        </button>
      `;
    }

    let list = selectedItems;
    if (this.selectedCatFilter !== 'all') list = list.filter(i => i.category === this.selectedCatFilter);
    if (this.searchTerm) list = list.filter(i => i.name.toLowerCase().includes(this.searchTerm));

    if (selectedItems.length === 0) {
      this.contentContainer.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">${storeInfo.icon}</span>
          <span class="empty-title">Lista de ${storeInfo.name} vacía</span>
          <span class="empty-desc">Ve al <b>Catálogo de ${storeInfo.name}</b> y toca <b>"+ Añadir"</b> en lo que necesites comprar hoy.</span>
          <button class="pill-btn active" style="margin-top: 10px;" onclick="app.switchMode('catalog')">Ir al Catálogo de ${storeInfo.name}</button>
        </div>
      `;
      return;
    }

    const grouped = {};
    list.forEach(item => {
      const cat = item.category || 'otros';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    let html = '';
    for (const catId of Object.keys(CATEGORIES)) {
      if (!grouped[catId] || grouped[catId].length === 0) continue;
      const catData = CATEGORIES[catId];
      const catItems = grouped[catId];
      const completedCount = catItems.filter(i => i.completed).length;

      html += `
        <div class="category-group">
          <div class="category-header">
            <div class="category-title">
              <span class="category-badge-dot" style="background-color: ${catData.color}"></span>
              <span>${catData.icon} ${catData.name}</span>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${completedCount}/${catItems.length} listos</span>
          </div>
          <ul class="items-list">
            ${catItems.map(item => this.renderShoppingItemRow(item)).join('')}
          </ul>
        </div>
      `;
    }
    this.contentContainer.innerHTML = html;
  }

  renderShoppingItemRow(item) {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    const subtext = `${item.quantity} ${item.unit || ''} • ${StorageManager.formatCurrency(itemTotal)}`;

    return `
      <li class="shopping-item-row ${item.completed ? 'completed' : ''}" onclick="app.toggleItemBought('${item.id}')">
        <div class="shopping-checkbox">
          ${item.completed ? '✓' : ''}
        </div>
        <div class="item-info">
          <span class="item-name">${item.name}</span>
          <span class="item-subtext">${subtext}</span>
        </div>
        <button class="btn-small" onclick="event.stopPropagation(); app.openPriceModal('${item.id}')" title="Editar precio">✏️</button>
      </li>
    `;
  }

  renderHistoryMode() {
    this.bottomBarContent.innerHTML = `
      <button class="btn-primary" style="flex: 1;" onclick="app.shareReport()">
        <span>📤 Compartir Reporte</span>
      </button>
      <button class="btn-secondary" onclick="app.clearAllHistory()" title="Borrar historial">
        <span>🗑️</span>
      </button>
    `;

    if (!this.history || this.history.length === 0) {
      this.contentContainer.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📜</span>
          <span class="empty-title">Sin historial de compras</span>
          <span class="empty-desc">Tus compras terminadas en cualquier comercio se guardarán aquí con su desglose y total.</span>
        </div>
      `;
      return;
    }

    const stats = HistoryManager.calculateStats(this.history);

    let filteredHistory = this.history;
    if (this.selectedHistoryStoreFilter !== 'all') {
      filteredHistory = this.history.filter(t => t.storeId === this.selectedHistoryStoreFilter);
    }

    let html = `
      <!-- Analytics Summary Card -->
      <div class="history-analytics-grid">
        <div class="analytics-card">
          <span class="analytics-label">Acumulado Total</span>
          <span class="analytics-num">${StorageManager.formatCurrency(stats.totalSpent)}</span>
        </div>
        <div class="analytics-card">
          <span class="analytics-label">Viajes Realizados</span>
          <span class="analytics-num">${stats.totalTrips} compras</span>
        </div>
        <div class="analytics-card">
          <span class="analytics-label">Promedio por Viaje</span>
          <span class="analytics-num">${StorageManager.formatCurrency(stats.avgSpent)}</span>
        </div>
        <div class="analytics-card">
          <span class="analytics-label">Comercio Principal</span>
          <span class="analytics-num" style="font-size: 0.95rem;">${stats.topStore}</span>
        </div>
      </div>

      <!-- History Filter Pills -->
      <div class="category-filter-pills" style="margin-bottom: 14px;">
        <button class="pill-btn ${this.selectedHistoryStoreFilter === 'all' ? 'active' : ''}" onclick="app.setHistoryStoreFilter('all')">Todas</button>
        ${Object.values(STORES).map(s => `
          <button class="pill-btn ${this.selectedHistoryStoreFilter === s.id ? 'active' : ''}" onclick="app.setHistoryStoreFilter('${s.id}')">${s.icon} ${s.name}</button>
        `).join('')}
      </div>

      <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 10px; color: var(--text-secondary);">
        Viajes Registrados (${filteredHistory.length})
      </div>
    `;

    filteredHistory.forEach(trip => {
      const isExpanded = this.expandedTripId === trip.id;

      html += `
        <div class="history-card">
          <div class="history-header">
            <span class="history-store-tag">${trip.storeIcon || '🏬'} ${trip.storeName || 'Comercio'}</span>
            <span class="history-total">${StorageManager.formatCurrency(trip.totalSpent)}</span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
            <span>📅 ${trip.formattedDate}</span>
            <span>${trip.itemCount} productos</span>
          </div>

          ${isExpanded ? `
            <div class="history-items-breakdown">
              ${trip.items.map(i => `
                <div class="history-item-row">
                  <span>• ${i.name} (${i.quantity} ${i.unit || ''})</span>
                  <span style="font-weight: 600;">${StorageManager.formatCurrency(i.subtotal)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; border-top: 1px dashed var(--border-color); padding-top: 6px;">
            <button class="pill-btn" style="font-size: 0.75rem; padding: 4px 10px;" onclick="app.toggleTripExpand('${trip.id}')">
              ${isExpanded ? '▲ Ocultar Desglose' : '▼ Ver Desglose Completo'}
            </button>
            <button class="btn-small" style="color: var(--danger);" onclick="app.deleteHistoryTrip('${trip.id}')" title="Eliminar del historial">🗑️</button>
          </div>
        </div>
      `;
    });

    this.contentContainer.innerHTML = html;
  }

  setHistoryStoreFilter(filterId) {
    this.selectedHistoryStoreFilter = filterId;
    this.render();
  }
}

// Global App Instance
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new SmartShoppingApp();
});
