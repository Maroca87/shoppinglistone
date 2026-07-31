/**
 * Web Crypto API Security Module (AES-256-GCM + PBKDF2 + SHA-256)
 * Provides industry standard client-side encryption and password hashing.
 */
const SecurityModule = {
  // Convert ArrayBuffer to Hex String
  buf2hex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  // Convert Hex String to Uint8Array
  hex2buf(hexString) {
    if (!hexString || hexString.length % 2 !== 0) return new Uint8Array();
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
    }
    return bytes;
  },

  // Generate 16-byte cryptographically random salt
  generateSalt() {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    return this.buf2hex(salt);
  },

  // Generate 12-byte IV for AES-GCM
  generateIV() {
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    return this.buf2hex(iv);
  },

  // Derive CryptoKey from password using PBKDF2 (100,000 iterations)
  async deriveKey(password, saltHex) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: this.hex2buf(saltHex),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  },

  // Hash password for authentication check
  async hashPassword(password, saltHex) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: this.hex2buf(saltHex),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );

    return this.buf2hex(hashBuffer);
  },

  // Encrypt JSON object using AES-256-GCM
  async encryptData(dataObj, cryptoKey) {
    try {
      const enc = new TextEncoder();
      const plainText = JSON.stringify(dataObj);
      const iv = new Uint8Array(12);
      crypto.getRandomValues(iv);

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        enc.encode(plainText)
      );

      return {
        ciphertext: this.buf2hex(encryptedBuffer),
        iv: this.buf2hex(iv)
      };
    } catch (e) {
      console.error('Encryption failed:', e);
      return null;
    }
  },

  // Decrypt JSON object using AES-256-GCM
  async decryptData(encryptedPayload, cryptoKey) {
    try {
      if (!encryptedPayload || !encryptedPayload.ciphertext || !encryptedPayload.iv) return null;
      const dec = new TextDecoder();

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: this.hex2buf(encryptedPayload.iv) },
        cryptoKey,
        this.hex2buf(encryptedPayload.ciphertext)
      );

      return JSON.parse(dec.decode(decryptedBuffer));
    } catch (e) {
      console.error('Decryption failed:', e);
      return null;
    }
  },

  // Sanitize text for XSS protection
  sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function(m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m];
    });
  }
};
