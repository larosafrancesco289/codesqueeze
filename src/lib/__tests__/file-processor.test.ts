import { describe, it, expect } from 'vitest';
import { shouldIgnoreFile, isTextFile } from '../file-processor';

describe('shouldIgnoreFile', () => {
  it('should ignore default directory patterns', () => {
    expect(shouldIgnoreFile('node_modules/package.json')).toBe(true);
    expect(shouldIgnoreFile('src/node_modules/lib.js')).toBe(true);
    expect(shouldIgnoreFile('.git/config')).toBe(true);
    expect(shouldIgnoreFile('.next/build-manifest.json')).toBe(true);
    expect(shouldIgnoreFile('dist/bundle.js')).toBe(true);
    expect(shouldIgnoreFile('build/output.js')).toBe(true);
    expect(shouldIgnoreFile('coverage/lcov.info')).toBe(true);
  });

  it('should ignore hidden files by default, but allow specific config files', () => {
    // Should ignore these hidden files
    expect(shouldIgnoreFile('.env')).toBe(true);
    expect(shouldIgnoreFile('.env.local')).toBe(true);
    expect(shouldIgnoreFile('.DS_Store')).toBe(true);
    expect(shouldIgnoreFile('.vscode/settings.json')).toBe(true);
    expect(shouldIgnoreFile('.idea/workspace.xml')).toBe(true);
    
    // Should allow these config files
    expect(shouldIgnoreFile('.gitignore')).toBe(false);
    expect(shouldIgnoreFile('.eslintrc.js')).toBe(false);
    expect(shouldIgnoreFile('.prettierrc')).toBe(false);
    expect(shouldIgnoreFile('.npmrc')).toBe(false);
    expect(shouldIgnoreFile('.editorconfig')).toBe(false);
  });

  it('should not ignore regular files', () => {
    expect(shouldIgnoreFile('src/index.ts')).toBe(false);
    expect(shouldIgnoreFile('README.md')).toBe(false);
    expect(shouldIgnoreFile('package.json')).toBe(false);
    expect(shouldIgnoreFile('components/Button.tsx')).toBe(false);
    expect(shouldIgnoreFile('lib/utils.js')).toBe(false);
  });

  it('should respect custom ignore patterns for directories', () => {
    const customPatterns = ['temp', 'logs'];
    expect(shouldIgnoreFile('temp/cache.json', customPatterns)).toBe(true);
    expect(shouldIgnoreFile('src/temp/file.js', customPatterns)).toBe(true);
    expect(shouldIgnoreFile('logs/error.log', customPatterns)).toBe(true);
    expect(shouldIgnoreFile('src/utils.ts', customPatterns)).toBe(false);
  });

  it('should respect custom ignore patterns for filenames', () => {
    const customPatterns = ['test', 'spec'];
    expect(shouldIgnoreFile('src/utils.test.ts', customPatterns)).toBe(true);
    expect(shouldIgnoreFile('src/utils.spec.ts', customPatterns)).toBe(true);
    expect(shouldIgnoreFile('components/Button.test.tsx', customPatterns)).toBe(true);
    expect(shouldIgnoreFile('src/utils.ts', customPatterns)).toBe(false);
    expect(shouldIgnoreFile('src/testing-library.ts', customPatterns)).toBe(true); // contains 'test'
  });

  it('should handle complex path structures', () => {
    expect(shouldIgnoreFile('src/components/node_modules/lib.js')).toBe(true);
    expect(shouldIgnoreFile('packages/app/.next/static/chunks/main.js')).toBe(true);
    expect(shouldIgnoreFile('apps/web/dist/bundle.js')).toBe(true);
  });

  it('should handle edge cases', () => {
    expect(shouldIgnoreFile('')).toBe(false);
    expect(shouldIgnoreFile('.')).toBe(true); // hidden file, not in allowed list
    expect(shouldIgnoreFile('..')).toBe(true); // hidden file, not in allowed list
    expect(shouldIgnoreFile('normal-file')).toBe(false);
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

  it('should handle files without extensions correctly', () => {
    const createMockFile = (name: string) =>
      new File(['content'], name, { type: 'application/octet-stream' });

    // Should accept common text files without extension
    expect(isTextFile(createMockFile('README'))).toBe(true);
    expect(isTextFile(createMockFile('LICENSE'))).toBe(true);
    expect(isTextFile(createMockFile('Dockerfile'))).toBe(true);
    expect(isTextFile(createMockFile('Makefile'))).toBe(true);
    
    // Should handle case variations
    expect(isTextFile(createMockFile('readme'))).toBe(true);
    expect(isTextFile(createMockFile('license'))).toBe(true);
  });

  it('should handle edge cases for file identification', () => {
    const createMockFile = (name: string) =>
      new File(['content'], name, { type: 'text/plain' });

    // Empty filename
    expect(isTextFile(createMockFile(''))).toBe(false);
    
    // Only extension
    expect(isTextFile(createMockFile('.js'))).toBe(true);
    expect(isTextFile(createMockFile('.png'))).toBe(false);
    
    // Multiple extensions
    expect(isTextFile(createMockFile('config.test.js'))).toBe(true);
    expect(isTextFile(createMockFile('image.backup.png'))).toBe(false);
  });
});
