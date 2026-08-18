/**
 * ShoppinglistOne - Gestor de Autenticación y Seguridad
 * Implementa cifrado AES-256-GCM, derivación de claves PBKDF2, recuperación
 * por pregunta secreta y persistencia continua de sesión (manteniendo la sesión
 * abierta incluso al cerrar la app, saliendo el portal de login solo si el
 * usuario cierra la sesión de forma explícita).
 */
const AUTH_USER_KEY = 'shoppinglistone_user_config_v2';
const LEGACY_AUTH_USER_KEY = 'smart_shop_user_config_v1';
const AUTH_SESSION_KEY = 'shoppinglistone_active_session_v1';

const AuthManager = {
  activeCryptoKey: null,
  activeUsername: null,

  /**
   * Verifica si existe un usuario registrado en el dispositivo.
   * @returns {boolean} True si existe una configuración de usuario registrada.
   */
  isRegistered() {
    return localStorage.getItem(AUTH_USER_KEY) !== null || localStorage.getItem(LEGACY_AUTH_USER_KEY) !== null;
  },

  /**
   * Obtiene la configuración del usuario almacenada en el almacenamiento local.
   * @returns {Object|null} Objeto de configuración del usuario o null.
   */
  getUserConfig() {
    const data = localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(LEGACY_AUTH_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Normaliza una cadena de texto (sin acentos, en minúsculas y sin espacios extra)
   * para validar respuestas de seguridad de forma flexible.
   * @param {string} answer - Respuesta a normalizar.
   * @returns {string} Texto normalizado.
   */
  normalizeAnswer(answer) {
    if (!answer) return '';
    return answer.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  },

  /**
   * Guarda la clave de sesión en el almacenamiento local para mantener
   * la sesión activa indefinidamente hasta que el usuario cierre sesión.
   * @param {string} rawKeyHex - Clave maestra en formato hexadecimal.
   * @param {string} username - Nombre del usuario activo.
   */
  saveSession(rawKeyHex, username) {
    try {
      const sessionData = {
        key: rawKeyHex,
        username: username,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Error al guardar la sesión persistente:', e);
    }
  },

  /**
   * Elimina la sesión persistente almacenada.
   */
  clearSession() {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {
      console.error('Error al limpiar la sesión:', e);
    }
  },

  /**
   * Restaura la sesión activa guardada al abrir o recargar la aplicación.
   * @returns {Promise<boolean>} True si la sesión fue restaurada con éxito, false en caso contrario.
   */
  async restoreSession() {
    try {
      if (!this.isRegistered()) return false;

      const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
      if (!rawSession) return false;

      const sessionObj = JSON.parse(rawSession);
      if (!sessionObj || !sessionObj.key) {
        this.clearSession();
        return false;
      }

      // Reimportar la clave CryptoKey maestra para operaciones criptográficas
      this.activeCryptoKey = await SecurityModule.importRawKey(sessionObj.key);
      this.activeUsername = sessionObj.username || 'Usuario';
      return true;
    } catch (e) {
      console.error('Error al restaurar sesión activa:', e);
      this.clearSession();
      return false;
    }
  },

  /**
   * Registra un nuevo usuario generando una clave maestra aleatoria de 256 bits
   * y cifrándola tanto con la clave derivada de la contraseña como con la clave de recuperación.
   * @param {string} username - Nombre de usuario.
   * @param {string} password - Contraseña maestra.
   * @param {string} securityQuestion - Pregunta de seguridad elegida.
   * @param {string} securityAnswer - Respuesta a la pregunta de seguridad.
   * @returns {Promise<boolean>} True si el registro fue exitoso.
   */
  async registerUser(username, password, securityQuestion = '¿Cuál es el nombre de tu primera mascota?', securityAnswer = 'shopping') {
    const cleanUsername = SecurityModule.sanitizeInput(username.trim()) || 'Usuario';
    const cleanQuestion = SecurityModule.sanitizeInput(securityQuestion.trim()) || '¿Cuál es el nombre de tu primera mascota?';
    const cleanAnswer = this.normalizeAnswer(securityAnswer);

    // 1. Generar clave maestra de bóveda (256-bit)
    const masterRawKey = SecurityModule.generateRandomRawKey();

    // 2. Generar sales criptográficas independientes
    const pwdSalt = SecurityModule.generateSalt();
    const recoverySalt = SecurityModule.generateSalt();

    // 3. Generar hashes de verificación
    const passwordHash = await SecurityModule.hashPassword(password, pwdSalt);
    const recoveryHash = await SecurityModule.hashPassword(cleanAnswer, recoverySalt);

    // 4. Derivar claves para cifrar la clave maestra
    const passwordKey = await SecurityModule.deriveKey(password, pwdSalt);
    const recoveryKey = await SecurityModule.deriveKey(cleanAnswer, recoverySalt);

    // 5. Cifrar la clave maestra con ambas claves derivadas
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

    // 6. Activar clave en memoria y persistir sesión continua
    this.activeCryptoKey = await SecurityModule.importRawKey(masterRawKey);
    this.activeUsername = userConfig.username;
    this.saveSession(masterRawKey, userConfig.username);

    return true;
  },

  /**
   * Inicia sesión validando la contraseña y descifrando la clave maestra.
   * @param {string} password - Contraseña ingresada por el usuario.
   * @returns {Promise<boolean>} True si la autenticación fue correcta.
   */
  async loginUser(password) {
    const userConfig = this.getUserConfig();
    if (!userConfig) return false;

    const hashCheck = await SecurityModule.hashPassword(password, userConfig.salt);
    if (hashCheck !== userConfig.passwordHash) {
      return false;
    }

    const passwordKey = await SecurityModule.deriveKey(password, userConfig.salt);
    let masterRawKeyHex = null;

    // Si existe la clave maestra cifrada, descifrarla
    if (userConfig.encMasterWithPwd) {
      const decryptedPayload = await SecurityModule.decryptData(userConfig.encMasterWithPwd, passwordKey);
      if (decryptedPayload && decryptedPayload.key) {
        masterRawKeyHex = decryptedPayload.key;
        this.activeCryptoKey = await SecurityModule.importRawKey(masterRawKeyHex);
      } else {
        this.activeCryptoKey = passwordKey;
        masterRawKeyHex = await SecurityModule.exportRawKey(passwordKey);
      }
    } else {
      // Migración para usuarios heredados
      this.activeCryptoKey = passwordKey;
      masterRawKeyHex = await SecurityModule.exportRawKey(passwordKey) || SecurityModule.generateRandomRawKey();
      const recoverySalt = SecurityModule.generateSalt();
      const recoveryHash = await SecurityModule.hashPassword('shopping', recoverySalt);
      const recoveryKey = await SecurityModule.deriveKey('shopping', recoverySalt);

      userConfig.encMasterWithPwd = await SecurityModule.encryptData({ key: masterRawKeyHex }, passwordKey);
      userConfig.encMasterWithRecovery = await SecurityModule.encryptData({ key: masterRawKeyHex }, recoveryKey);
      userConfig.securityQuestion = userConfig.securityQuestion || '¿Cuál es el nombre de tu primera mascota?';
      userConfig.recoverySalt = recoverySalt;
      userConfig.recoveryHash = recoveryHash;
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userConfig));
    }

    this.activeUsername = userConfig.username;
    
    // Guardar sesión persistente
    if (masterRawKeyHex) {
      this.saveSession(masterRawKeyHex, userConfig.username);
    }

    return true;
  },

  /**
   * Obtiene la pregunta de seguridad registrada.
   * @returns {string} Pregunta de seguridad.
   */
  getSecurityQuestion() {
    const userConfig = this.getUserConfig();
    return userConfig?.securityQuestion || '¿Cuál es el nombre de tu primera mascota?';
  },

  /**
   * Recupera y restablece la contraseña mediante la respuesta de seguridad.
   * @param {string} securityAnswer - Respuesta de seguridad ingresada.
   * @param {string} newPassword - Nueva contraseña deseada.
   * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación.
   */
  async recoverPassword(securityAnswer, newPassword) {
    const userConfig = this.getUserConfig();
    if (!userConfig) return { success: false, message: 'No hay usuario registrado en este dispositivo.' };

    const cleanAnswer = this.normalizeAnswer(securityAnswer);
    const recSalt = userConfig.recoverySalt || userConfig.salt;
    const answerCheck = await SecurityModule.hashPassword(cleanAnswer, recSalt);

    if (answerCheck !== userConfig.recoveryHash) {
      return { success: false, message: 'La respuesta de seguridad es incorrecta.' };
    }

    // Recuperar la clave maestra usando la clave derivada de la respuesta
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

    // Generar nueva sal y hash para la nueva contraseña
    const newSalt = SecurityModule.generateSalt();
    const newPasswordHash = await SecurityModule.hashPassword(newPassword, newSalt);
    const newPasswordKey = await SecurityModule.deriveKey(newPassword, newSalt);

    // Re-cifrar la clave maestra con la nueva clave de contraseña
    const newEncMasterWithPwd = await SecurityModule.encryptData({ key: masterRawKey }, newPasswordKey);

    userConfig.salt = newSalt;
    userConfig.passwordHash = newPasswordHash;
    userConfig.encMasterWithPwd = newEncMasterWithPwd;

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userConfig));

    this.activeCryptoKey = await SecurityModule.importRawKey(masterRawKey);
    this.activeUsername = userConfig.username;
    this.saveSession(masterRawKey, userConfig.username);

    return { success: true, message: '¡Contraseña restablecida exitosamente! Has iniciado sesión.' };
  },

  /**
   * Cambia la contraseña actual verificando la clave anterior.
   * @param {string} currentPassword - Contraseña actual.
   * @param {string} newPassword - Nueva contraseña.
   * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación.
   */
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
      this.saveSession(masterRawKey, userConfig.username);
    } else {
      this.activeCryptoKey = newPasswordKey;
      const rawHex = await SecurityModule.exportRawKey(newPasswordKey);
      if (rawHex) this.saveSession(rawHex, userConfig.username);
    }

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userConfig));
    return { success: true, message: '¡Contraseña actualizada con éxito!' };
  },

  /**
   * Cierra la sesión activa explícitamente:
   * Limpia las claves en memoria, borra la sesión persistente y muestra el portal de inicio de sesión.
   */
  logout() {
    this.clearSession();
    this.activeCryptoKey = null;
    this.activeUsername = null;

    if (window.app && typeof window.app.handleLockSession === 'function') {
      window.app.handleLockSession();
    } else {
      const authOverlay = document.getElementById('authOverlay');
      if (authOverlay) authOverlay.style.display = 'flex';
    }
  },

  /**
   * Alias de logout para compatibilidad con llamadas existentes.
   */
  lockSession() {
    this.logout();
  }
};
