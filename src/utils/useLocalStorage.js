import { useEffect, useRef, useState } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const keyRef = useRef(key);
  const skipNextWrite = useRef(false);

  // Re-read from storage when the key itself changes (e.g. a per-user key
  // switching accounts), instead of carrying the previous key's in-memory
  // value over and writing it under the new key.
  useEffect(() => {
    if (keyRef.current === key) return;
    keyRef.current = key;
    skipNextWrite.current = true;
    try {
      const stored = window.localStorage.getItem(key);
      setValue(stored !== null ? JSON.parse(stored) : initialValue);
    } catch {
      setValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable (private mode, quota) — fail silently
    }
  }, [key, value]);

  return [value, setValue];
}
