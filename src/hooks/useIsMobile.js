import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [mob, setMob] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mob;
}
