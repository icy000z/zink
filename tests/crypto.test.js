import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey, fingerprint, generatePassword } from '../src/core/crypto.js';

describe('Crypto Engine', () => {
  const testPassword = 'super-secret-password-123';
  const testData = 'DATABASE_URL=postgres://user:pass@localhost:5432/mydb\nAPI_KEY=sk_live_abc123';

  describe('encrypt / decrypt', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const encrypted = await encrypt(testData, testPassword);

      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('data');

      // All values should be hex strings
      expect(encrypted.salt).toMatch(/^[0-9a-f]+$/);
      expect(encrypted.iv).toMatch(/^[0-9a-f]+$/);
      expect(encrypted.authTag).toMatch(/^[0-9a-f]+$/);
      expect(encrypted.data).toMatch(/^[0-9a-f]+$/);

      const decrypted = await decrypt(encrypted, testPassword);
      expect(decrypted).toBe(testData);
    });

    it('should fail decryption with wrong password', async () => {
      const encrypted = await encrypt(testData, testPassword);

      await expect(decrypt(encrypted, 'wrong-password')).rejects.toThrow();
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const enc1 = await encrypt(testData, testPassword);
      const enc2 = await encrypt(testData, testPassword);

      // Different salt and IV means different output
      expect(enc1.salt).not.toBe(enc2.salt);
      expect(enc1.iv).not.toBe(enc2.iv);
      expect(enc1.data).not.toBe(enc2.data);
    });

    it('should handle empty string', async () => {
      const encrypted = await encrypt('', testPassword);
      const decrypted = await decrypt(encrypted, testPassword);
      expect(decrypted).toBe('');
    });

    it('should handle unicode content', async () => {
      const unicode = 'APP_NAME=こんにちは世界\nEMOJI=🔐🔑';
      const encrypted = await encrypt(unicode, testPassword);
      const decrypted = await decrypt(encrypted, testPassword);
      expect(decrypted).toBe(unicode);
    });

    it('should handle very long content', async () => {
      const longContent = 'KEY=' + 'x'.repeat(100000);
      const encrypted = await encrypt(longContent, testPassword);
      const decrypted = await decrypt(encrypted, testPassword);
      expect(decrypted).toBe(longContent);
    });
  });

  describe('deriveKey', () => {
    it('should derive consistent keys from same password + salt', async () => {
      const salt = Buffer.from('a'.repeat(64), 'hex');
      const key1 = await deriveKey(testPassword, salt);
      const key2 = await deriveKey(testPassword, salt);
      expect(key1.toString('hex')).toBe(key2.toString('hex'));
    });

    it('should derive different keys from different salts', async () => {
      const salt1 = Buffer.from('a'.repeat(64), 'hex');
      const salt2 = Buffer.from('b'.repeat(64), 'hex');
      const key1 = await deriveKey(testPassword, salt1);
      const key2 = await deriveKey(testPassword, salt2);
      expect(key1.toString('hex')).not.toBe(key2.toString('hex'));
    });
  });

  describe('fingerprint', () => {
    it('should produce consistent hashes', () => {
      const fp1 = fingerprint('test-data');
      const fp2 = fingerprint('test-data');
      expect(fp1).toBe(fp2);
    });

    it('should produce different hashes for different data', () => {
      const fp1 = fingerprint('data-1');
      const fp2 = fingerprint('data-2');
      expect(fp1).not.toBe(fp2);
    });

    it('should return a 12-character hex string', () => {
      const fp = fingerprint('test');
      expect(fp).toMatch(/^[0-9a-f]{12}$/);
    });
  });

  describe('generatePassword', () => {
    it('should generate a password of specified length', () => {
      const pw = generatePassword(32);
      expect(pw.length).toBe(32);
    });

    it('should generate unique passwords', () => {
      const pw1 = generatePassword(32);
      const pw2 = generatePassword(32);
      expect(pw1).not.toBe(pw2);
    });
  });
});
