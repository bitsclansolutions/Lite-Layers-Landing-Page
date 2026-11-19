// On client-side navigation: jump to the #hash target if there is one, otherwise to the top.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait a frame so the new page has rendered its sections.
      const id = decodeURIComponent(hash.slice(1));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
