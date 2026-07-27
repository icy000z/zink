import { describe, it, expect } from 'vitest';
import { parse, serialize, toTemplate, toJSON, toYAML, toDockerEnv, fromJSON, fromYAML } from '../src/core/parser.js';

describe('Parser', () => {
  describe('parse', () => {
    it('should parse simple key=value pairs', () => {
      const result = parse('FOO=bar\nBAZ=qux');
      expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
    });

    it('should handle quoted values (double quotes)', () => {
      const result = parse('FOO="hello world"');
      expect(result).toEqual({ FOO: 'hello world' });
    });

    it('should handle quoted values (single quotes)', () => {
      const result = parse("FOO='hello world'");
      expect(result).toEqual({ FOO: 'hello world' });
    });

    it('should skip comments', () => {
      const result = parse('# This is a comment\nFOO=bar\n# Another comment');
      expect(result).toEqual({ FOO: 'bar' });
    });

    it('should skip empty lines', () => {
      const result = parse('\n\nFOO=bar\n\nBAZ=qux\n');
      expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
    });

    it('should handle export prefix', () => {
      const result = parse('export FOO=bar\nexport BAZ=qux');
      expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
    });

    it('should handle inline comments', () => {
      const result = parse('FOO=bar # this is a comment');
      expect(result).toEqual({ FOO: 'bar' });
    });

    it('should handle values with equals signs', () => {
      const result = parse('DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=require');
      expect(result).toEqual({
        DATABASE_URL: 'postgres://user:pass@host:5432/db?sslmode=require',
      });
    });

    it('should handle empty values', () => {
      const result = parse('FOO=\nBAR=');
      expect(result).toEqual({ FOO: '', BAR: '' });
    });

    it('should handle escape sequences in double quotes', () => {
      const result = parse('FOO="line1\\nline2"');
      expect(result).toEqual({ FOO: 'line1\nline2' });
    });

    it('should handle whitespace around keys and values', () => {
      const result = parse('  FOO  =  bar  ');
      expect(result).toEqual({ FOO: 'bar' });
    });
  });

  describe('serialize', () => {
    it('should serialize key-value pairs', () => {
      const result = serialize({ FOO: 'bar', BAZ: 'qux' });
      expect(result).toContain('FOO="bar"');
      expect(result).toContain('BAZ="qux"');
    });

    it('should handle values with special characters', () => {
      const result = serialize({ URL: 'https://example.com?a=1&b=2' });
      expect(result).toContain('URL="https://example.com?a=1&b=2"');
    });

    it('should escape double quotes in values', () => {
      const result = serialize({ FOO: 'say "hello"' });
      expect(result).toContain('FOO="say \\"hello\\""');
    });

    it('should roundtrip parse → serialize → parse', () => {
      const original = 'FOO=bar\nBAZ="hello world"\nNUM=42';
      const parsed = parse(original);
      const serialized = serialize(parsed);
      const reparsed = parse(serialized);
      expect(reparsed).toEqual(parsed);
    });
  });

  describe('toTemplate', () => {
    it('should generate template with empty values', () => {
      const template = toTemplate({ DATABASE_URL: 'postgres://localhost', API_KEY: 'sk_live_123' });
      expect(template).toContain('DATABASE_URL=');
      expect(template).toContain('API_KEY=');
      expect(template).not.toContain('postgres');
      expect(template).not.toContain('sk_live');
    });

    it('should include description comments', () => {
      const template = toTemplate({ DATABASE_URL: 'test' });
      expect(template).toContain('# Database connection string');
    });

    it('should skip descriptions when bare', () => {
      const template = toTemplate({ DATABASE_URL: 'test' }, { withDescriptions: false });
      expect(template).not.toContain('# Database');
    });
  });

  describe('format converters', () => {
    const testEnv = { FOO: 'bar', BAZ: '42' };

    it('should convert to JSON', () => {
      const json = toJSON(testEnv);
      expect(JSON.parse(json)).toEqual(testEnv);
    });

    it('should convert to YAML', () => {
      const yaml = toYAML(testEnv);
      expect(yaml).toContain('FOO: bar');
      expect(yaml).toContain('BAZ: "42"'); // Numbers should be quoted in YAML
    });

    it('should convert to Docker env format', () => {
      const docker = toDockerEnv(testEnv);
      expect(docker).toContain('FOO=bar');
      expect(docker).toContain('BAZ=42');
    });

    it('should roundtrip JSON', () => {
      const json = toJSON(testEnv);
      const parsed = fromJSON(json);
      expect(parsed).toEqual(testEnv);
    });

    it('should roundtrip YAML', () => {
      const yaml = toYAML(testEnv);
      const parsed = fromYAML(yaml);
      expect(parsed).toEqual(testEnv);
    });

    it('should convert non-string values from JSON', () => {
      const result = fromJSON('{"port": 3000, "debug": true}');
      expect(result).toEqual({ port: '3000', debug: 'true' });
    });
  });
});
