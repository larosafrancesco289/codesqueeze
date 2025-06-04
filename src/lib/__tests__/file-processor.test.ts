import { describe, it, expect } from 'vitest';
import { shouldIgnoreFile, isTextFile } from '../file-processor';

describe('shouldIgnoreFile', () => {
  it('should ignore default patterns', () => {
    expect(shouldIgnoreFile('node_modules/package.json')).toBe(true);
    expect(shouldIgnoreFile('.git/config')).toBe(true);
    expect(shouldIgnoreFile('.next/build-manifest.json')).toBe(true);
    expect(shouldIgnoreFile('dist/bundle.js')).toBe(true);
  });

  it('should ignore hidden files', () => {
    expect(shouldIgnoreFile('.env')).toBe(true);
    expect(shouldIgnoreFile('.gitignore')).toBe(true);
    expect(shouldIgnoreFile('.DS_Store')).toBe(true);
  });

  it('should not ignore regular files', () => {
    expect(shouldIgnoreFile('src/index.ts')).toBe(false);
    expect(shouldIgnoreFile('README.md')).toBe(false);
    expect(shouldIgnoreFile('package.json')).toBe(false);
  });

  it('should respect custom ignore patterns', () => {
    const customPatterns = ['test', 'spec'];
    expect(shouldIgnoreFile('src/test/utils.test.ts', customPatterns)).toBe(
      true
    );
    expect(shouldIgnoreFile('src/utils.spec.ts', customPatterns)).toBe(true);
    expect(shouldIgnoreFile('src/utils.ts', customPatterns)).toBe(false);
  });
});

describe('isTextFile', () => {
  it('should identify text files correctly', () => {
    const createMockFile = (name: string) =>
      new File(['content'], name, { type: 'text/plain' });

    expect(isTextFile(createMockFile('index.ts'))).toBe(true);
    expect(isTextFile(createMockFile('app.js'))).toBe(true);
    expect(isTextFile(createMockFile('component.jsx'))).toBe(true);
    expect(isTextFile(createMockFile('module.mjs'))).toBe(true);
    expect(isTextFile(createMockFile('script.cjs'))).toBe(true);
    expect(isTextFile(createMockFile('README.md'))).toBe(true);
    expect(isTextFile(createMockFile('package.json'))).toBe(true);
    expect(isTextFile(createMockFile('style.css'))).toBe(true);
    expect(isTextFile(createMockFile('config.yml'))).toBe(true);
  });

  it('should identify binary files correctly', () => {
    const createMockFile = (name: string) =>
      new File(['content'], name, { type: 'application/octet-stream' });

    expect(isTextFile(createMockFile('image.png'))).toBe(false);
    expect(isTextFile(createMockFile('video.mp4'))).toBe(false);
    expect(isTextFile(createMockFile('archive.zip'))).toBe(false);
    expect(isTextFile(createMockFile('font.woff2'))).toBe(false);
  });

  it('should reject large files', () => {
    const createMockFile = (name: string, size: number) => {
      const file = new File(['content'], name, { type: 'text/plain' });
      // Mock the size property since File constructor doesn't set it from content
      Object.defineProperty(file, 'size', { value: size, writable: false });
      return file;
    };

    const largeFile = createMockFile('large.txt', 2 * 1024 * 1024); // 2MB
    expect(isTextFile(largeFile)).toBe(false);

    const normalFile = createMockFile('normal.txt', 500 * 1024); // 500KB
    expect(isTextFile(normalFile)).toBe(true);
  });

  it('should reject files without extensions selectively', () => {
    const createMockFile = (name: string) =>
      new File(['content'], name, { type: 'application/octet-stream' });

    // Should reject unknown executables/binaries
    expect(isTextFile(createMockFile('WizardDoom'))).toBe(false);
    expect(isTextFile(createMockFile('executable'))).toBe(false);
    expect(isTextFile(createMockFile('binary'))).toBe(false);

    // Should accept common text files without extension
    expect(isTextFile(createMockFile('README'))).toBe(true);
    expect(isTextFile(createMockFile('LICENSE'))).toBe(true);
    expect(isTextFile(createMockFile('Dockerfile'))).toBe(true);
    expect(isTextFile(createMockFile('Makefile'))).toBe(true);
  });
});
