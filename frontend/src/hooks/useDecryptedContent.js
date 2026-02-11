import { useState, useEffect } from 'react';
import { isEncrypted, deriveChatKey, decryptMessage } from '../services/cryptoService';

/**
 * Hook that transparently decrypts encrypted message content.
 * Returns the original content if it's not encrypted or if hashes are missing.
 */
export default function useDecryptedContent(content, myHash, otherHash) {
  const [text, setText] = useState(() =>
    content && isEncrypted(content) ? '' : content || ''
  );

  useEffect(() => {
    if (!content) {
      setText('');
      return;
    }
    if (!isEncrypted(content) || !myHash || !otherHash) {
      setText(content);
      return;
    }
    let cancelled = false;
    deriveChatKey(myHash, otherHash)
      .then((key) => decryptMessage(key, content))
      .then((result) => {
        if (!cancelled) setText(result);
      })
      .catch(() => {
        if (!cancelled) setText(content);
      });
    return () => {
      cancelled = true;
    };
  }, [content, myHash, otherHash]);

  return text;
}
