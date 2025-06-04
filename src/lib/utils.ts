import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(dm) + ' ' + sizes[i];
}

export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

export function generateSHA256(data: string): Promise<string> {
  // Fallback if crypto.subtle is not available
  if (!crypto || !crypto.subtle) {
    return Promise.resolve(generateSimpleHash(data));
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  return crypto.subtle.digest('SHA-256', dataBuffer).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }).catch((error) => {
    console.warn('crypto.subtle failed, using fallback hash:', error);
    return generateSimpleHash(data);
  });
}

function generateSimpleHash(content: string): string {
  // Simple hash implementation for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex and pad to simulate SHA-256 format
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
  return hashHex.repeat(8); // Simulate 64-character hash
} 