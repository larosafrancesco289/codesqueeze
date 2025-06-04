import { describe, it, expect } from 'vitest';
import { formatBytes, estimateTokenCount, cn } from '../utils';

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    expect(formatBytes(1536)).toBe('1.50 KB');
  });

  it('should handle decimal places', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB');
    expect(formatBytes(1536, 1)).toBe('1.5 KB');
    expect(formatBytes(1536, 3)).toBe('1.500 KB');
  });
});

describe('estimateTokenCount', () => {
  it('should estimate token count correctly', () => {
    expect(estimateTokenCount('')).toBe(0);
    expect(estimateTokenCount('hello')).toBe(2); // 5 chars / 4 = 1.25, ceil = 2
    expect(estimateTokenCount('hello world')).toBe(3); // 11 chars / 4 = 2.75, ceil = 3
    expect(estimateTokenCount('a'.repeat(100))).toBe(25); // 100 chars / 4 = 25
  });
});

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
  });

  it('should handle Tailwind merge conflicts', () => {
    expect(cn('px-2 px-4')).toBe('px-4');
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
  });
}); 