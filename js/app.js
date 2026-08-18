/**
 * ShoppinglistOne - Main Application Controller
 * Handles Multi-Store Catalogs, Real-Time Budgeting, Purchase History,
 * Product Editing & Deletion, Backup & Restore Module, and AES-256 Auth & Recovery.
 */
class ShoppinglistOneApp {
  constructor() {
    this.appName = 'ShoppinglistOne';
    this.currentStoreId = 'supermercado';
    this.customStores = {};
    this.catalog = [];
    this.budget = 35000;
    this.history = [];
    this.todoList = [];
    this.currentMode = 'catalog'; // 'catalog', 'shopping', 'history', 'todo'
    this.selectedCatFilter = 'all';
    this.selectedHistoryStoreFilter = 'all';
    this.searchTerm = '';
    this.editingItemId = null;
    this.expandedTripId = null;

    this.initElements();
    this.initEvents();
    this.initTheme();
    this.initSplash();
    this.initAuth();
  }

  initElements() {
    // Splash Screen
    this.splashScreen = document.getElementById('splashScreen');

    // Header Elements
    this.brandTitleText = document.getElementById('brandTitleText');
    this.backupBtn = document.getElementById('backupBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.logoutBtn = document.getElementById('logoutBtn');

    // Navigation Tabs (4 pestañas)
    this.tabCatalog = document.getElementById('tabCatalog');
    this.tabShopping = document.getElementById('tabShopping');
    this.tabHistory = document.getElementById('tabHistory');
    this.tabTodo = document.getElementById('tabTodo');
    this.shoppingBadge = document.getElementById('shoppingBadge');
    this.todoBadge = document.getElementById('todoBadge');

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

    // Dynamic Containers
    this.contentContainer = document.getElementById('contentContainer');
    this.bottomBarContent = document.getElementById('bottomBarContent');

    // Auth Elements
    this.authOverlay = document.getElementById('authOverlay');
    this.authTabs = document.getElementById('authTabs');
    this.authTabLogin = document.getElementById('authTabLogin');
    this.authTabRegister = document.getElementById('authTabRegister');
    this.loginForm = document.getElementById('loginForm');
    this.loginGreeting = document.getElementById('loginGreeting');
    this.loginPasswordInput = document.getElementById('loginPassword');
    this.openRecoverBtn = document.getElementById('openRecoverBtn');

    this.registerForm = document.getElementById('registerForm');
    this.regUsernameInput = document.getElementById('regUsername');
    this.regPasswordInput = document.getElementById('regPassword');
    this.regConfirmPasswordInput = document.getElementById('regConfirmPassword');
    this.regSecurityQuestionSelect = document.getElementById('regSecurityQuestion');
    this.regSecurityAnswerInput = document.getElementById('regSecurityAnswer');

    this.recoverForm = document.getElementById('recoverForm');
    this.recoverQuestionDisplay = document.getElementById('recoverQuestionDisplay');
    this.recoverAnswerInput = document.getElementById('recoverAnswerInput');
    this.recoverNewPwdInput = document.getElementById('recoverNewPwdInput');
    this.recoverConfirmPwdInput = document.getElementById('recoverConfirmPwdInput');
    this.recoverCancelBtn = document.getElementById('recoverCancelBtn');

    // Product Edit & Delete Modal
    this.editItemModal = document.getElementById('editItemModal');
    this.editItemForm = document.getElementById('editItemForm');
    this.editItemNameInput = document.getElementById('editItemName');
    this.editItemCategorySelect = document.getElementById('editItemCategory');
    this.editItemPriceInput = document.getElementById('editItemPrice');
    this.editItemQtyInput = document.getElementById('editItemQty');
    this.editItemUnitSelect = document.getElementById('editItemUnit');
    this.deleteItemBtn = document.getElementById('deleteItemBtn');

    // Backup & Restore Module Modal
    this.backupModal = document.getElementById('backupModal');
    this.downloadBackupBtn = document.getElementById('downloadBackupBtn');
    this.copyBackupBtn = document.getElementById('copyBackupBtn');
    this.backupFileInput = document.getElementById('backupFileInput');
    this.backupXmlInput = document.getElementById('backupXmlInput');
    this.restoreBackupBtn = document.getElementById('restoreBackupBtn');

    // Custom Item Modal
    this.customItemModal = document.getElementById('customItemModal');
    this.customItemForm = document.getElementById('customItemForm');
    this.customNameInput = document.getElementById('customItemName');
    this.customCategorySelect = document.getElementById('customItemCategory');
    this.customPriceInput = document.getElementById('customItemPrice');
    this.customQtyInput = document.getElementById('customItemQty');
    this.customUnitSelect = document.getElementById('customItemUnit');

    // Custom Store Modal
    this.newStoreModal = document.getElementById('newStoreModal');
    this.newStoreForm = document.getElementById('newStoreForm');
    this.newStoreNameInput = document.getElementById('newStoreName');
    this.newStoreIconInput = document.getElementById('newStoreIcon');

    // Settings Modal
    this.settingsModal = document.getElementById('settingsModal');
    this.currencySelect = document.getElementById('settingCurrency');
    this.defaultBudgetInput = document.getElementById('settingDefaultBudget');
    this.changePwdForm = document.getElementById('changePwdForm');
    this.currentPwdInput = document.getElementById('pwdCurrent');
    this.newPwdInput = document.getElementById('pwdNew');
    this.confirmPwdInput = document.getElementById('pwdConfirm');

    // Budget Modal
    this.budgetModal = document.getElementById('budgetModal');
    this.budgetInput = document.getElementById('modalBudgetInput');

    // Export Modal
    this.exportModal = document.getElementById('exportModal');
    this.exportTextArea = document.getElementById('exportTextArea');

    this.renderStorePills();
    this.updateStoreCategories();
  }

  initSplash() {
    // Professional splash screen delay & smooth transition
    setTimeout(() => {
      if (this.splashScreen) {
        this.splashScreen.classList.add('fade-out');
      }
    }, 1100);
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

    const categoryOptions = Object.values(CATEGORIES).map(cat => 
      `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
    ).join('');

    this.customCategorySelect.innerHTML = categoryOptions;
    this.editItemCategorySelect.innerHTML = categoryOptions;

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
    // Store pills selector
    this.storeSelectorBar.addEventListener('click', async (e) => {
      const pill = e.target.closest('.store-pill');
      if (!pill || pill.classList.contains('add-store-btn')) return;
      const targetStoreId = pill.dataset.store;
      if (targetStoreId !== this.currentStoreId) {
        await this.switchStore(targetStoreId);
      }
    });

    // Navigation Tabs
    this.tabCatalog.addEventListener('click', () => this.switchMode('catalog'));
    this.tabShopping.addEventListener('click', () => this.switchMode('shopping'));
    this.tabHistory.addEventListener('click', () => this.switchMode('history'));
    if (this.tabTodo) this.tabTodo.addEventListener('click', () => this.switchMode('todo'));

    // Search input
    this.searchInput.addEventListener('input', (e) => {
      this.searchTerm = SecurityModule.sanitizeInput(e.target.value.toLowerCase().trim());
      this.render();
    });

    // Category pills filter
    this.categoryFilterPills.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      this.categoryFilterPills.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      this.selectedCatFilter = btn.dataset.cat;
      this.render();
    });

    // Header buttons
    this.backupBtn.addEventListener('click', () => this.openBackupModal());
    this.exportBtn.addEventListener('click', () => this.openExportModal());
    this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
    this.logoutBtn.addEventListener('click', () => AuthManager.logout());
    this.budgetBadge.addEventListener('click', () => this.openBudgetModal());

    // Close modals
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeAllModals();
      });
    });

    // Forms
    this.customItemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addCustomItem();
    });

    this.newStoreForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createNewCustomStore();
    });

    // Product Edit Form
    this.editItemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveEditedItem();
    });

    this.deleteItemBtn.addEventListener('click', () => {
      this.deleteCurrentEditingItem();
    });

    // Budget Form
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

    // Settings Form
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });

    this.changePwdForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePasswordChange();
    });

    // Auth Tabs & Forms
    this.authTabLogin.addEventListener('click', () => this.switchAuthView('login'));
    this.authTabRegister.addEventListener('click', () => this.switchAuthView('register'));
    this.openRecoverBtn.addEventListener('click', () => this.switchAuthView('recover'));
    this.recoverCancelBtn.addEventListener('click', () => this.switchAuthView('login'));

    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLoginSubmit();
    });

    this.registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegisterSubmit();
    });

    this.recoverForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRecoverSubmit();
    });

    // Backup Buttons
    this.downloadBackupBtn.addEventListener('click', () => this.handleDownloadBackup());
    this.copyBackupBtn.addEventListener('click', () => this.handleCopyBackup());
    this.restoreBackupBtn.addEventListener('click', () => this.handleRestoreBackup());

    document.getElementById('copyTextBtn').addEventListener('click', () => {
      this.exportTextArea.select();
      navigator.clipboard.writeText(this.exportTextArea.value).then(() => {
        alert('¡Lista copiada al portapapeles! Lista para pegar en WhatsApp.');
      });
    });
  }

  // ==========================================
  // AUTH & SESSION MANAGEMENT
  // ==========================================

  /**
   * Inicializa el estado de autenticación de la aplicación.
   * Si existe una sesión activa guardada, desbloquea la app automáticamente
   * sin mostrar el portal de inicio de sesión.
   */
  async initAuth() {
    if (!AuthManager.isRegistered()) {
      this.switchAuthView('register');
      this.authTabs.style.display = 'none'; // Mostrar registro solo en configuración inicial
      this.authOverlay.style.display = 'flex';
      return;
    }

    // Intentar restaurar sesión activa continua
    const sessionRestored = await AuthManager.restoreSession();
    if (sessionRestored) {
      // Sesión activa válida: ingresar directamente sin pedir contraseña
      await this.postAuthUnlock();
    } else {
      // No hay sesión activa (usuario cerró sesión explícitamente): mostrar portal de login
      const user = AuthManager.getUserConfig();
      this.loginGreeting.textContent = `¡Hola, ${user ? user.username : 'Usuario'}! Ingresa tu contraseña para acceder a ShoppinglistOne.`;
      this.authTabs.style.display = 'flex';
      this.switchAuthView('login');
      this.authOverlay.style.display = 'flex';
    }
  }

  switchAuthView(viewName) {
    this.loginForm.classList.toggle('active', viewName === 'login');
    this.registerForm.classList.toggle('active', viewName === 'register');
    this.recoverForm.classList.toggle('active', viewName === 'recover');

    this.authTabLogin.classList.toggle('active', viewName === 'login');
    this.authTabRegister.classList.toggle('active', viewName === 'register');

    if (viewName === 'recover') {
      this.recoverQuestionDisplay.textContent = AuthManager.getSecurityQuestion();
      this.recoverAnswerInput.value = '';
      this.recoverNewPwdInput.value = '';
      this.recoverConfirmPwdInput.value = '';
    }
  }

  async handleLoginSubmit() {
    const pwd = this.loginPasswordInput.value;
    if (!pwd) return;

    const success = await AuthManager.loginUser(pwd);
    if (success) {
      this.loginPasswordInput.value = '';
      await this.postAuthUnlock();
    } else {
      alert('Contraseña incorrecta. Intenta nuevamente.');
      this.loginPasswordInput.value = '';
      this.loginPasswordInput.focus();
    }
  }

  async handleRegisterSubmit() {
    const username = this.regUsernameInput.value.trim() || 'Usuario';
    const pwd = this.regPasswordInput.value;
    const confirmPwd = this.regConfirmPasswordInput.value;
    const question = this.regSecurityQuestionSelect.value;
    const answer = this.regSecurityAnswerInput.value.trim();

    if (!pwd || !confirmPwd) {
      alert('Ingresa una contraseña y confírmala.');
      return;
    }

    if (pwd !== confirmPwd) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    if (!answer) {
      alert('Por favor escribe tu respuesta secreta de recuperación.');
      return;
    }

    if (AuthManager.isRegistered()) {
      if (!confirm(`¿Deseas registrar un nuevo usuario (${username})? Esto configurará una nueva bóveda local.`)) {
        return;
      }
    }

    await AuthManager.registerUser(username, pwd, question, answer);
    this.regPasswordInput.value = '';
    this.regConfirmPasswordInput.value = '';
    this.regSecurityAnswerInput.value = '';
    this.authTabs.style.display = 'flex';
    await this.postAuthUnlock();
  }

  async handleRecoverSubmit() {
    const answer = this.recoverAnswerInput.value.trim();
    const newPwd = this.recoverNewPwdInput.value;
    const confirmPwd = this.recoverConfirmPwdInput.value;

    if (!answer) {
      alert('Ingresa tu respuesta secreta.');
      return;
    }

    if (!newPwd || !confirmPwd) {
      alert('Ingresa la nueva contraseña y confírmala.');
      return;
    }

    if (newPwd !== confirmPwd) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    const res = await AuthManager.recoverPassword(answer, newPwd);
    if (res.success) {
      alert(res.message);
      this.recoverAnswerInput.value = '';
      this.recoverNewPwdInput.value = '';
      this.recoverConfirmPwdInput.value = '';
      await this.postAuthUnlock();
    } else {
      alert(res.message);
    }
  }

  // Instant session lock callback
  handleLockSession() {
    this.catalog = [];
    this.history = [];
    this.todoList = [];
    this.contentContainer.innerHTML = '';
    this.loginPasswordInput.value = '';
    this.switchAuthView('login');
    const user = AuthManager.getUserConfig();
    if (user) {
      this.loginGreeting.textContent = `¡Hola, ${user.username}! Ingresa tu contraseña para desbloquear ShoppinglistOne.`;
    }
    this.authOverlay.style.display = 'flex';
  }

  async postAuthUnlock() {
    this.authOverlay.style.display = 'none';
    const settings = await StorageManager.loadSettings();
    this.appName = 'ShoppinglistOne';
    this.brandTitleText.textContent = this.appName;

    this.customStores = await StorageManager.loadCustomStores();
    STORES = { ...DEFAULT_STORES, ...this.customStores };

    this.budget = settings.defaultBudget || 35000;
    this.history = await HistoryManager.loadHistory();
    this.todoList = await StorageManager.loadTodoList();
    await this.switchStore(this.currentStoreId);
  }

  // ==========================================
  // STORE SWITCHING & CREATION
  // ==========================================

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
      color: '#2563eb',
      isCustom: true
    };

    this.customStores[storeId] = newStoreObj;
    STORES[storeId] = newStoreObj;
    MULTI_STORE_CATALOGS[storeId] = [];

    await StorageManager.saveCustomStores(this.customStores);
    this.closeAllModals();
    await this.switchStore(storeId);
  }

  // ==========================================
  // THEME & NAVIGATION
  // ==========================================

  initTheme() {
    // Modo Dark permanente
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }

  toggleTheme() {
    // Modo Dark permanente
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }

  switchMode(mode) {
    this.currentMode = mode;
    this.tabCatalog.classList.toggle('active', mode === 'catalog');
    this.tabShopping.classList.toggle('active', mode === 'shopping');
    this.tabHistory.classList.toggle('active', mode === 'history');
    if (this.tabTodo) this.tabTodo.classList.toggle('active', mode === 'todo');
    this.render();
  }

  // ==========================================
  // PRODUCT EDITING & DELETION
  // ==========================================

  openEditItemModal(itemId) {
    const item = this.catalog.find(i => String(i.id) === String(itemId));
    if (!item) return;

    this.editingItemId = itemId;
    this.editItemNameInput.value = item.name || '';
    this.editItemCategorySelect.value = item.category || 'otros';
    this.editItemPriceInput.value = item.price || 0;
    this.editItemQtyInput.value = item.quantity || 1;
    this.editItemUnitSelect.value = item.unit || 'unidad';

    this.editItemModal.classList.add('active');
  }

  async saveEditedItem() {
    if (!this.editingItemId) return;
    const item = this.catalog.find(i => String(i.id) === String(this.editingItemId));
    if (item) {
      item.name = SecurityModule.sanitizeInput(this.editItemNameInput.value.trim()) || item.name;
      item.category = this.editItemCategorySelect.value || item.category;
      item.price = parseFloat(this.editItemPriceInput.value) || 0;
      item.quantity = Math.max(1, parseFloat(this.editItemQtyInput.value) || 1);
      item.unit = this.editItemUnitSelect.value || item.unit;

      await this.saveAndRender();
    }
    this.closeAllModals();
  }

  async deleteCurrentEditingItem() {
    if (!this.editingItemId) return;
    const item = this.catalog.find(i => String(i.id) === String(this.editingItemId));
    const itemName = item ? item.name : 'este producto';

    if (confirm(`¿Estás seguro de eliminar "${itemName}" del catálogo de esta tienda?`)) {
      this.catalog = this.catalog.filter(i => String(i.id) !== String(this.editingItemId));
      await this.saveAndRender();
      this.closeAllModals();
    }
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

  // ==========================================
  // BACKUP & RESTORE MODULE
  // ==========================================

  openBackupModal() {
    this.backupFileInput.value = '';
    if (this.backupXmlInput) this.backupXmlInput.value = '';
    this.backupModal.classList.add('active');
  }

  async handleDownloadBackup() {
    try {
      const backupXml = await StorageManager.createBackup();
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      const filename = `ShoppinglistOne_backup_${dateStr}_${timeStr}.xml`;

      const blob = new Blob([backupXml], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al generar respaldo XML: ' + e.message);
    }
  }

  async handleCopyBackup() {
    try {
      const backupXml = await StorageManager.createBackup();
      await navigator.clipboard.writeText(backupXml);
      alert('¡Copia de seguridad XML copiada al portapapeles! Puedes guardarla o enviarla.');
    } catch (e) {
      alert('Error al copiar respaldo: ' + e.message);
    }
  }

  async handleRestoreBackup() {
    let xmlContent = this.backupXmlInput ? this.backupXmlInput.value.trim() : '';

    // If file input has a file selected, read from file
    if (this.backupFileInput.files && this.backupFileInput.files.length > 0) {
      const file = this.backupFileInput.files[0];
      try {
        xmlContent = await file.text();
      } catch (err) {
        alert('Error al leer el archivo XML de respaldo seleccionado.');
        return;
      }
    }

    if (!xmlContent) {
      alert('Por favor selecciona un archivo .xml o pega el texto XML de respaldo.');
      return;
    }

    if (!confirm('⚠️ RESTAURAR RESPALDO:\nEsta acción actualizará tus catálogos, listas e historial con la copia de seguridad XML.\n\n¿Deseas continuar?')) {
      return;
    }

    try {
      const result = await StorageManager.restoreBackup(xmlContent);
      if (result.success) {
        alert(`✅ ¡Respaldo XML restaurado con éxito!\n\n• Tiendas actualizadas: ${result.totalStores}\n• Productos restaurados: ${result.totalItems}\n• Viajes en historial: ${result.historyTrips}`);
        this.closeAllModals();
        await this.postAuthUnlock();
      }
    } catch (e) {
      alert('❌ Error al restaurar respaldo XML: ' + e.message);
    }
  }

  // ==========================================
  // BUDGET & SETTINGS
  // ==========================================

  openBudgetModal() {
    this.budgetInput.value = this.budget;
    this.budgetModal.classList.add('active');
  }

  async openSettingsModal() {
    const settings = await StorageManager.loadSettings();
    this.currencySelect.value = (settings.currency === '$' ? '$' : '₡');
    this.defaultBudgetInput.value = settings.defaultBudget || 35000;
    this.settingsModal.classList.add('active');
  }

  async saveSettings() {
    const currency = this.currencySelect.value === '$' ? '$' : '₡';
    const val = parseFloat(this.defaultBudgetInput.value) || 35000;

    this.budget = val;

    await StorageManager.saveSettings({ appName: 'ShoppinglistOne', currency, defaultBudget: val });
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
    this.editingItemId = null;
  }

  async handlePasswordChange() {
    const current = this.currentPwdInput.value;
    const newPwd = this.newPwdInput.value;
    const confirmPwd = this.confirmPwdInput.value;

    if (!current || !newPwd) {
      alert('Ingresa tu contraseña actual y la nueva.');
      return;
    }

    if (newPwd !== confirmPwd) {
      alert('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    const res = await AuthManager.changePassword(current, newPwd);
    if (res.success) {
      alert(res.message);
      this.currentPwdInput.value = '';
      this.newPwdInput.value = '';
      this.confirmPwdInput.value = '';
      this.closeAllModals();
    } else {
      alert(res.message);
    }
  }

  // ==========================================
  // SHOPPING TRIP COMPLETION & HISTORY
  // ==========================================

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
          title: 'Reporte de Compras - ShoppinglistOne',
          text: `📊 Mi Reporte de Compras en ShoppinglistOne:\n• Total Gastado: ${StorageManager.formatCurrency(stats.totalSpent)}\n• Compras Realizadas: ${stats.totalTrips}\n• Promedio por viaje: ${StorageManager.formatCurrency(stats.avgSpent)}`
        });
      } catch (err) {
        console.log('Share canceled or not supported:', err);
      }
    } else {
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
    this.budgetBadge.textContent = `✏️ Presupuesto: ${StorageManager.formatCurrency(this.budget)}`;

    this.shoppingBadge.textContent = selectedItems.length;
    this.updateTodoBadge();

    const percentage = this.budget > 0 ? Math.min((spent / this.budget) * 100, 100) : 0;
    this.progressBarFill.style.width = `${percentage}%`;
    this.progressBarFill.classList.toggle('exceeded', spent > this.budget && this.budget > 0);
  }

  // ==========================================
  // MAIN RENDER ENGINE
  // ==========================================

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
    } else if (this.currentMode === 'todo') {
      this.storeSelectorBar.style.display = 'none';
      this.searchRow.style.display = 'none';
      this.statsCard.style.display = 'none';
      this.renderTodoMode();
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
            <span>${formattedPrice} / ${item.unit || 'unid'}</span>
            <span class="edit-product-btn" onclick="app.openEditItemModal('${item.id}')" title="Editar o eliminar producto">
              ✏️ Editar
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
        <button class="btn-small" onclick="event.stopPropagation(); app.openEditItemModal('${item.id}')" title="Editar producto">✏️</button>
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

  // ==========================================
  // MÓDULO TO-DO (LISTAS RÁPIDAS E INESPERADAS)
  // ==========================================

  renderTodoMode() {
    const pendingCount = this.todoList.filter(t => !t.completed).length;

    this.bottomBarContent.innerHTML = `
      <button class="btn-primary" onclick="document.getElementById('newTodoInput')?.focus()">
        <span>➕</span>
        <span>Escribir Pendiente</span>
      </button>
      ${this.todoList.length > 0 ? `
        <button class="btn-secondary" onclick="app.copyTodoListToClipboard()">
          <span>📋 Copiar Lista</span>
        </button>
      ` : ''}
    `;

    let html = `
      <div class="todo-card">
        <div class="todo-header-row">
          <div class="todo-header-title">
            <span>📝</span>
            <span>Lista Rápida / To-Do</span>
          </div>
          <span style="font-size: 0.82rem; color: var(--primary); font-weight: 700;">
            ${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}
          </span>
        </div>

        <p style="font-size: 0.84rem; color: var(--text-muted); margin: -4px 0 6px 0;">
          Anota compras inesperadas, encargos o cosas por recordar.
        </p>

        <form id="newTodoForm" onsubmit="event.preventDefault(); app.handleAddTodoSubmit();" class="todo-input-group">
          <input type="text" id="newTodoInput" class="form-control" placeholder="¿Qué necesitas comprar o recordar?" required autocomplete="off">
          <button type="submit" class="btn-primary" style="flex: 0 0 auto; padding: 0 18px; height: 42px;">
            <span>➕ Agregar</span>
          </button>
        </form>

        ${this.todoList.length === 0 ? `
          <div class="empty-state" style="padding: 28px 10px;">
            <span class="empty-icon">📝</span>
            <span class="empty-title">Sin pendientes en la lista</span>
            <span class="empty-desc">Escribe tus compras o tareas rápidas arriba para recordarlas fácilmente.</span>
          </div>
        ` : `
          <ul class="todo-items-list">
            ${this.todoList.map(item => `
              <li class="todo-item-row ${item.completed ? 'completed' : ''}">
                <div class="todo-item-left" onclick="app.toggleTodoItem('${item.id}')">
                  <div class="todo-checkbox">
                    ${item.completed ? '✓' : ''}
                  </div>
                  <span class="todo-item-text">${SecurityModule.sanitizeInput(item.text)}</span>
                </div>
                <div class="todo-item-actions">
                  <button class="btn-small" style="color: var(--primary);" onclick="app.transferTodoToShopping('${item.id}')" title="Pasar a lista de compras de la tienda actual">
                    🛒
                  </button>
                  <button class="btn-small" style="color: var(--danger);" onclick="app.deleteTodoItem('${item.id}')" title="Eliminar de la lista">
                    🗑️
                  </button>
                </div>
              </li>
            `).join('')}
          </ul>

          <div class="todo-tools-bar">
            <button class="pill-btn" onclick="app.clearCompletedTodos()" title="Eliminar las tareas marcadas como listas">
              🧹 Limpiar Completadas
            </button>
            <button class="pill-btn" onclick="app.copyTodoListToClipboard()" title="Copiar toda la lista para WhatsApp">
              📋 Copiar Lista
            </button>
            <button class="pill-btn" style="color: var(--danger);" onclick="app.clearAllTodos()" title="Borrar toda la lista">
              🗑️ Vaciar Lista
            </button>
          </div>
        `}
      </div>
    `;

    this.contentContainer.innerHTML = html;
  }

  async handleAddTodoSubmit() {
    const input = document.getElementById('newTodoInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    await this.addTodoItem(text);
    input.value = '';
    input.focus();
  }

  async addTodoItem(text) {
    const cleanText = SecurityModule.sanitizeInput(text.trim());
    if (!cleanText) return;

    const newTodo = {
      id: 'todo_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
      text: cleanText,
      completed: false,
      createdAt: new Date().toISOString()
    };

    this.todoList.unshift(newTodo);
    await StorageManager.saveTodoList(this.todoList);
    this.render();
  }

  async toggleTodoItem(id) {
    const item = this.todoList.find(t => t.id === id);
    if (item) {
      item.completed = !item.completed;
      await StorageManager.saveTodoList(this.todoList);
      this.render();
    }
  }

  async deleteTodoItem(id) {
    this.todoList = this.todoList.filter(t => t.id !== id);
    await StorageManager.saveTodoList(this.todoList);
    this.render();
  }

  async clearCompletedTodos() {
    const prevCount = this.todoList.length;
    this.todoList = this.todoList.filter(t => !t.completed);
    if (this.todoList.length !== prevCount) {
      await StorageManager.saveTodoList(this.todoList);
      this.render();
    }
  }

  async clearAllTodos() {
    if (this.todoList.length === 0) return;
    if (confirm('¿Estás seguro de que deseas vaciar toda la lista To-Do?')) {
      this.todoList = [];
      await StorageManager.saveTodoList(this.todoList);
      this.render();
    }
  }

  async copyTodoListToClipboard() {
    const text = StorageManager.exportTodoToText(this.todoList);
    try {
      await navigator.clipboard.writeText(text);
      alert('¡Lista To-Do copiada al portapapeles! Lista para pegar en WhatsApp o notas.');
    } catch (e) {
      alert('Contenido:\n\n' + text);
    }
  }

  async transferTodoToShopping(id) {
    const item = this.todoList.find(t => t.id === id);
    if (!item) return;

    // Agregar como producto seleccionado a la tienda activa
    const detectedCat = autoDetectCategory(item.text, this.currentStoreId);
    const newProduct = {
      id: 'item_from_todo_' + Date.now().toString(36),
      name: item.text,
      category: detectedCat,
      price: 0,
      quantity: 1,
      unit: 'unidad',
      selected: true,
      completed: false
    };

    this.catalog.unshift(newProduct);
    await StorageManager.saveCatalog(this.currentStoreId, this.catalog);

    // Marcar como completado en To-Do
    item.completed = true;
    await StorageManager.saveTodoList(this.todoList);

    const storeInfo = STORES[this.currentStoreId] || STORES.supermercado;
    alert(`"${item.text}" se ha agregado a tu lista de compras en ${storeInfo.name}.`);
    this.render();
  }

  updateTodoBadge() {
    if (!this.todoBadge) return;
    const pendingCount = this.todoList.filter(t => !t.completed).length;
    if (pendingCount > 0) {
      this.todoBadge.textContent = pendingCount;
      this.todoBadge.style.display = 'inline-block';
    } else {
      this.todoBadge.style.display = 'none';
    }
  }
}

// Global App Instance
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new ShoppinglistOneApp();
});
