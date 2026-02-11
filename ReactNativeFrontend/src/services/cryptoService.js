// Simple deterministic encryption for chat messages (React Native)
// Key: SHA-256(sorted(userHashA, userHashB)) → AES-256-GCM
// Uses @noble/hashes (SHA-256) and @noble/ciphers (AES-GCM) — both synchronous.

import { sha256 } from '@noble/hashes/sha2.js';
import { gcm } from '@noble/ciphers/aes.js';

const E2E_PREFIX = 'e2e:v1:';

export function isEncrypted(content) {
  return typeof content === 'string' && content.startsWith(E2E_PREFIX);
}

// Derive 32-byte AES key from two users' public key hashes (synchronous).
export function deriveChatKey(hashA, hashB) {
  if (!hashA || !hashB) return null;
  const sorted = hashA < hashB ? `${hashA}:${hashB}` : `${hashB}:${hashA}`;
  return sha256(new TextEncoder().encode(sorted)); // Uint8Array(32)
}

function getRandomBytes(n) {
  const buf = new Uint8Array(n);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    // Fallback for environments without Web Crypto
    for (let i = 0; i < n; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  return buf;
}

function uint8ToBase64(arr) {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function base64ToUint8(b64) {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

export function encryptMessage(keyBytes, plaintext) {
  if (!keyBytes || !plaintext) return plaintext;
  const iv = getRandomBytes(12);
  const aes = gcm(keyBytes, iv);
  const ciphertext = aes.encrypt(new TextEncoder().encode(plaintext));
  return `${E2E_PREFIX}${uint8ToBase64(iv)}:${uint8ToBase64(ciphertext)}`;
}

export function decryptMessage(keyBytes, content) {
  if (!keyBytes || !content || !isEncrypted(content)) return content;
  try {
    const payload = content.slice(E2E_PREFIX.length);
    const sepIdx = payload.indexOf(':');
    const iv = base64ToUint8(payload.slice(0, sepIdx));
    const ct = base64ToUint8(payload.slice(sepIdx + 1));
    const aes = gcm(keyBytes, iv);
    const plaintext = aes.decrypt(ct);
    return new TextDecoder().decode(plaintext);
  } catch (e) {
    console.warn('Decryption failed:', e.message);
    return content;
  }
}
