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

  async changePassword(currentPassword, newPassword) {
    const userConfig = this.getUserConfig();
    if (!userConfig) return false;

    // Verify current password first
    const hashCheck = await SecurityModule.hashPassword(currentPassword, userConfig.salt);
    if (hashCheck !== userConfig.passwordHash) {
      return { success: false, message: 'La contraseña actual es incorrecta.' };
    }

    // Generate new salt & hash for new password
    const newSalt = SecurityModule.generateSalt();
    const newHash = await SecurityModule.hashPassword(newPassword, newSalt);
    const newKey = await SecurityModule.deriveKey(newPassword, newSalt);

    userConfig.salt = newSalt;
    userConfig.passwordHash = newHash;

    // Update state
    this.activeCryptoKey = newKey;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userConfig));

    return { success: true, message: '¡Contraseña actualizada con éxito!' };
  },

  // Secure Factory Reset to reset password
  resetAccount() {
    localStorage.clear();
    this.activeCryptoKey = null;
    this.activeUsername = null;
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    window.location.reload();
  },

  logout() {
    this.activeCryptoKey = null;
    this.activeUsername = null;
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    window.location.reload();
  },

  resetInactivityTimer() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      alert('Sesión cerrada por inactividad.');
      this.logout();
    }, 15 * 60 * 1000);
  }
};

// Reset inactivity on user interaction
['click', 'touchstart', 'keypress'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (AuthManager.activeCryptoKey) {
      AuthManager.resetInactivityTimer();
    }
  });
});
