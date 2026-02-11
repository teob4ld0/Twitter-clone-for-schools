// Simple deterministic encryption for chat messages
// Key: SHA-256(sorted(userHashA, userHashB)) → AES-256-GCM

const E2E_PREFIX = 'e2e:v1:';

export function isEncrypted(content) {
  return typeof content === 'string' && content.startsWith(E2E_PREFIX);
}

// Derive AES-256-GCM CryptoKey from two users' public key hashes.
// Sorting ensures both chat participants derive the same key.
export async function deriveChatKey(hashA, hashB) {
  if (!hashA || !hashB) return null;
  const sorted = hashA < hashB ? `${hashA}:${hashB}` : `${hashB}:${hashA}`;
  const encoded = new TextEncoder().encode(sorted);
  const rawKey = await crypto.subtle.digest('SHA-256', encoded);
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptMessage(aesKey, plaintext) {
  if (!aesKey || !plaintext) return plaintext;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuf)));
  return `${E2E_PREFIX}${ivB64}:${ctB64}`;
}

export async function decryptMessage(aesKey, content) {
  if (!aesKey || !content || !isEncrypted(content)) return content;
  try {
    const payload = content.slice(E2E_PREFIX.length);
    const sepIdx = payload.indexOf(':');
    const ivB64 = payload.slice(0, sepIdx);
    const ctB64 = payload.slice(sepIdx + 1);
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ctB64), (c) => c.charCodeAt(0));
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
    return new TextDecoder().decode(plainBuf);
  } catch (e) {
    console.warn('Decryption failed:', e.message);
    return content; // show raw content as fallback
  }
}
