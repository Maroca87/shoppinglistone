/**
 * ShoppinglistOne - Auth & Security Manager
 * Implements AES-256-GCM encrypted local vault, PBKDF2 key derivation,
 * password recovery via security question, and instant session locking.
 */
const AUTH_USER_KEY = 'shoppinglistone_user_config_v2';
const LEGACY_AUTH_USER_KEY = 'smart_shop_user_config_v1';

const AuthManager = {
  activeCryptoKey: null,
  activeUsername: null,
  inactivityTimer: null,

  isRegistered() {
    return localStorage.getItem(AUTH_USER_KEY) !== null || localStorage.getItem(LEGACY_AUTH_USER_KEY) !== null;
  },

  getUserConfig() {
    const data = localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(LEGACY_AUTH_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  normalizeAnswer(answer) {
    if (!answer) return '';
    return answer.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  },

  async registerUser(username, password, securityQuestion = '¿Cuál es el nombre de tu primera mascota?', securityAnswer = 'shopping') {
    const cleanUsername = SecurityModule.sanitizeInput(username.trim()) || 'Usuario';
    const cleanQuestion = SecurityModule.sanitizeInput(securityQuestion.trim()) || '¿Cuál es el nombre de tu primera mascota?';
    const cleanAnswer = this.normalizeAnswer(securityAnswer);

    // 1. Generate master vault raw key (256-bit)
    const masterRawKey = SecurityModule.generateRandomRawKey();

    // 2. Generate salts
    const pwdSalt = SecurityModule.generateSalt();
    const recoverySalt = SecurityModule.generateSalt();

    // 3. Compute password and recovery hashes
    const passwordHash = await SecurityModule.hashPassword(password, pwdSalt);
    const recoveryHash = await SecurityModule.hashPassword(cleanAnswer, recoverySalt);

    // 4. Derive keys for encryption of the master vault key
    const passwordKey = await SecurityModule.deriveKey(password, pwdSalt);
    const recoveryKey = await SecurityModule.deriveKey(cleanAnswer, recoverySalt);

    // 5. Encrypt master key with password key and recovery key
    const encMasterWithPwd = await SecurityModule.encryptData({ key: masterRawKey }, passwordKey);
    const encMasterWithRecovery = await SecurityModule.encryptData({ key: masterRawKey }, recoveryKey);

    const userConfig = {
      username: cleanUsername,
      salt: pwdSalt,
      passwordHash: passwordHash,
      securityQuestion: cleanQuestion,
      recoverySalt: recoverySalt,
      recoveryHash: recoveryHash,
      encMasterWithPwd: encMasterWithPwd,
      encMasterWithRecovery: encMasterWithRecovery,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userConfig));

    // 6. Set active crypto key
    this.activeCryptoKey = await SecurityModule.importRawKey(masterRawKey);
    this.activeUsername = userConfig.username;
    this.resetInactivityTimer();

    return true;
  },

  async loginUser(password) {
    const userConfig = this.getUserConfig();
    if (!userConfig) return false;

    const hashCheck = await SecurityModule.hashPassword(password, userConfig.salt);
    if (hashCheck !== userConfig.passwordHash) {
      return false;
    }

    const passwordKey = await SecurityModule.deriveKey(password, userConfig.salt);

    // If modern vault wrapper exists, decrypt master raw key
    if (userConfig.encMasterWithPwd) {
      const decryptedPayload = await SecurityModule.decryptData(userConfig.encMasterWithPwd, passwordKey);
      if (decryptedPayload && decryptedPayload.key) {
        this.activeCryptoKey = await SecurityModule.importRawKey(decryptedPayload.key);
      } else {
        this.activeCryptoKey = passwordKey;
      }
    } else {
      // Legacy user upgrade to master vault wrapper
      this.activeCryptoKey = passwordKey;
      const rawKeyHex = await SecurityModule.exportRawKey(passwordKey) || SecurityModule.generateRandomRawKey();
      const recoverySalt = SecurityModule.generateSalt();
      const recoveryHash = await SecurityModule.hashPassword('shopping', recoverySalt);
      const recoveryKey = await SecurityModule.deriveKey('shopping', recoverySalt);

      userConfig.encMasterWithPwd = await SecurityModule.encryptData({ key: rawKeyHex }, passwordKey);
      userConfig.encMasterWithRecovery = await SecurityModule.encryptData({ key: rawKeyHex }, recoveryKey);
      userConfig.securityQuestion = userConfig.securityQuestion || '¿Cuál es el nombre de tu primera mascota?';
      userConfig.recoverySalt = recoverySalt;
      userConfig.recoveryHash = recoveryHash;
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userConfig));
    }

    this.activeUsername = userConfig.username;
    this.resetInactivityTimer();
    return true;
  },

  getSecurityQuestion() {
    const userConfig = this.getUserConfig();
    return userConfig?.securityQuestion || '¿Cuál es el nombre de tu primera mascota?';
  },

  async recoverPassword(securityAnswer, newPassword) {
    const userConfig = this.getUserConfig();
    if (!userConfig) return { success: false, message: 'No hay usuario registrado en este dispositivo.' };

    const cleanAnswer = this.normalizeAnswer(securityAnswer);
    const recSalt = userConfig.recoverySalt || userConfig.salt;
    const answerCheck = await SecurityModule.hashPassword(cleanAnswer, recSalt);

    if (answerCheck !== userConfig.recoveryHash) {
      return { success: false, message: 'La respuesta de seguridad es incorrecta.' };
    }

    // Retrieve master raw key using recovery key
    let masterRawKey = null;
    if (userConfig.encMasterWithRecovery) {
      const recoveryKey = await SecurityModule.deriveKey(cleanAnswer, userConfig.recoverySalt);
      const payload = await SecurityModule.decryptData(userConfig.encMasterWithRecovery, recoveryKey);
      if (payload && payload.key) {
        masterRawKey = payload.key;
      }
    }

    if (!masterRawKey) {
      masterRawKey = SecurityModule.generateRandomRawKey();
    }

    // Generate new salt and hash for new password
    const newSalt = SecurityModule.generateSalt();
    const newPasswordHash = await SecurityModule.hashPassword(newPassword, newSalt);
    const newPasswordKey = await SecurityModule.deriveKey(newPassword, newSalt);

    // Re-encrypt master vault key with new password key
    const newEncMasterWithPwd = await SecurityModule.encryptData({ key: masterRawKey }, newPasswordKey);

    userConfig.salt = newSalt;
    userConfig.passwordHash = newPasswordHash;
    userConfig.encMasterWithPwd = newEncMasterWithPwd;

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userConfig));

    this.activeCryptoKey = await SecurityModule.importRawKey(masterRawKey);
    this.activeUsername = userConfig.username;
    this.resetInactivityTimer();

    return { success: true, message: '¡Contraseña restablecida exitosamente! Has iniciado sesión.' };
  },

  async changePassword(currentPassword, newPassword) {
    const userConfig = this.getUserConfig();
    if (!userConfig) return { success: false, message: 'Usuario no encontrado.' };

    const hashCheck = await SecurityModule.hashPassword(currentPassword, userConfig.salt);
    if (hashCheck !== userConfig.passwordHash) {
      return { success: false, message: 'La contraseña actual es incorrecta.' };
    }

    let masterRawKey = null;
    const currentKey = await SecurityModule.deriveKey(currentPassword, userConfig.salt);
    if (userConfig.encMasterWithPwd) {
      const payload = await SecurityModule.decryptData(userConfig.encMasterWithPwd, currentKey);
      if (payload && payload.key) masterRawKey = payload.key;
    }

    if (!masterRawKey && this.activeCryptoKey) {
      masterRawKey = await SecurityModule.exportRawKey(this.activeCryptoKey) || SecurityModule.generateRandomRawKey();
    }

    const newSalt = SecurityModule.generateSalt();
    const newHash = await SecurityModule.hashPassword(newPassword, newSalt);
    const newPasswordKey = await SecurityModule.deriveKey(newPassword, newSalt);

    userConfig.salt = newSalt;
    userConfig.passwordHash = newHash;
    if (masterRawKey) {
      userConfig.encMasterWithPwd = await SecurityModule.encryptData({ key: masterRawKey }, newPasswordKey);
      this.activeCryptoKey = await SecurityModule.importRawKey(masterRawKey);
    } else {
      this.activeCryptoKey = newPasswordKey;
    }

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userConfig));
    return { success: true, message: '¡Contraseña actualizada con éxito!' };
  },

  // Instant session lock (clears keys and sensitive data immediately)
  lockSession() {
    this.activeCryptoKey = null;
    this.activeUsername = null;
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);

    if (window.app && typeof window.app.handleLockSession === 'function') {
      window.app.handleLockSession();
    } else {
      const authOverlay = document.getElementById('authOverlay');
      if (authOverlay) authOverlay.style.display = 'flex';
    }
  },

  logout() {
    this.lockSession();
  },

  resetInactivityTimer() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      this.lockSession();
    }, 15 * 60 * 1000);
  }
};

// Activity listeners to refresh inactivity timer
['click', 'touchstart', 'keypress'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (AuthManager.activeCryptoKey) {
      AuthManager.resetInactivityTimer();
    }
  });
});
