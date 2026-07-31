const AUTH_USER_KEY = 'smart_shop_user_config_v1';

const AuthManager = {
  activeCryptoKey: null,
  activeUsername: null,
  inactivityTimer: null,

  isRegistered() {
    return localStorage.getItem(AUTH_USER_KEY) !== null;
  },

  getUserConfig() {
    const data = localStorage.getItem(AUTH_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async registerUser(username, password) {
    const salt = SecurityModule.generateSalt();
    const hash = await SecurityModule.hashPassword(password, salt);

    const userConfig = {
      username: SecurityModule.sanitizeInput(username),
      salt: salt,
      passwordHash: hash,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userConfig));

    // Derive active key for session
    this.activeCryptoKey = await SecurityModule.deriveKey(password, salt);
    this.activeUsername = userConfig.username;
    this.resetInactivityTimer();

    return true;
  },

  async loginUser(password) {
    const userConfig = this.getUserConfig();
    if (!userConfig) return false;

    const hashCheck = await SecurityModule.hashPassword(password, userConfig.salt);
    if (hashCheck === userConfig.passwordHash) {
      this.activeCryptoKey = await SecurityModule.deriveKey(password, userConfig.salt);
      this.activeUsername = userConfig.username;
      this.resetInactivityTimer();
      return true;
    }

    return false;
  },

  logout() {
    this.activeCryptoKey = null;
    this.activeUsername = null;
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    window.location.reload();
  },

  resetInactivityTimer() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    // Auto lock after 15 minutes of inactivity
    this.inactivityTimer = setTimeout(() => {
      alert('Sesión cerrada por inactividad por tu seguridad.');
      this.logout();
    }, 15 * 60 * 1000);
  }
};

// Activity listeners to reset idle timer
['click', 'touchstart', 'keypress', 'mousemove'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (AuthManager.activeCryptoKey) {
      AuthManager.resetInactivityTimer();
    }
  });
});
