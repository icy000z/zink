import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  createEmptyVault,
  loadVault,
  saveVault,
  vaultExists,
  encryptEnvironment,
  decryptEnvironment,
  listEnvironments,
  getEnvironmentMeta,
  removeEnvironment,
} from '../src/core/vault.js';

describe('Vault Manager', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zink-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('createEmptyVault', () => {
    it('should create a valid vault structure', () => {
      const vault = createEmptyVault();
      expect(vault.version).toBe(1);
      expect(vault.tool).toBe('zink');
      expect(vault.algorithm).toBe('aes-256-gcm');
      expect(vault.environments).toEqual({});
      expect(vault.createdAt).toBeDefined();
    });
  });

  describe('saveVault / loadVault', () => {
    it('should save and load a vault', async () => {
      const vault = createEmptyVault();
      await saveVault(tempDir, vault);

      const loaded = await loadVault(tempDir);
      expect(loaded.version).toBe(vault.version);
      expect(loaded.tool).toBe('zink');
    });

    it('should return null for missing vault', async () => {
      const result = await loadVault(tempDir);
      expect(result).toBeNull();
    });
  });

  describe('vaultExists', () => {
    it('should return false when no vault exists', async () => {
      expect(await vaultExists(tempDir)).toBe(false);
    });

    it('should return true after saving a vault', async () => {
      await saveVault(tempDir, createEmptyVault());
      expect(await vaultExists(tempDir)).toBe(true);
    });
  });

  describe('encrypt / decrypt environment', () => {
    it('should encrypt and decrypt an environment', async () => {
      const vault = createEmptyVault();
      const envContent = 'FOO=bar\nBAZ=qux\n';
      const password = 'test-password-123';

      await encryptEnvironment(vault, 'development', envContent, password);

      expect(vault.environments.development).toBeDefined();
      expect(vault.environments.development.variableCount).toBe(2);

      const decrypted = await decryptEnvironment(vault, 'development', password);
      expect(decrypted).toBe(envContent);
    });

    it('should fail with wrong password', async () => {
      const vault = createEmptyVault();
      await encryptEnvironment(vault, 'development', 'FOO=bar', 'correct-password');

      await expect(
        decryptEnvironment(vault, 'development', 'wrong-password')
      ).rejects.toThrow('Wrong password');
    });

    it('should throw for missing environment', async () => {
      const vault = createEmptyVault();
      await expect(
        decryptEnvironment(vault, 'nonexistent', 'password')
      ).rejects.toThrow('not found');
    });
  });

  describe('listEnvironments', () => {
    it('should list all environments', async () => {
      const vault = createEmptyVault();
      await encryptEnvironment(vault, 'development', 'A=1', 'pass12345678');
      await encryptEnvironment(vault, 'production', 'B=2', 'pass12345678');

      const envs = listEnvironments(vault);
      expect(envs).toContain('development');
      expect(envs).toContain('production');
    });
  });

  describe('getEnvironmentMeta', () => {
    it('should return metadata', async () => {
      const vault = createEmptyVault();
      await encryptEnvironment(vault, 'development', 'A=1\nB=2', 'pass12345678');

      const meta = getEnvironmentMeta(vault, 'development');
      expect(meta.variableCount).toBe(2);
      expect(meta.fingerprint).toBeDefined();
      expect(meta.encryptedAt).toBeDefined();
    });

    it('should return null for missing environment', () => {
      const vault = createEmptyVault();
      expect(getEnvironmentMeta(vault, 'nope')).toBeNull();
    });
  });

  describe('removeEnvironment', () => {
    it('should remove an environment', async () => {
      const vault = createEmptyVault();
      await encryptEnvironment(vault, 'development', 'A=1', 'pass12345678');

      removeEnvironment(vault, 'development');
      expect(vault.environments.development).toBeUndefined();
    });
  });
});
