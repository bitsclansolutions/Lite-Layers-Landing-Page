import { useEffect, useRef } from 'react';

/**
 * Runs `onRestore` when the browser brings this page back from its
 * back/forward cache (e.g. the user leaves for Stripe Checkout and presses
 * Back). The page is restored exactly as it was left, so any "redirecting…"
 * loading state would otherwise stay stuck.
 */
export function useBfcacheRestore(onRestore) {
  const cb = useRef(onRestore);
  cb.current = onRestore;

  useEffect(() => {
    const handler = (e) => { if (e.persisted) cb.current(); };
    window.addEventListener('pageshow', handler);
    return () => window.removeEventListener('pageshow', handler);
  }, []);
}
