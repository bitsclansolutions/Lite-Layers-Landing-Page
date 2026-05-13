import { Moon, Sun } from 'lucide-react';
import { useT } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggle } = useT();
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        position: 'relative', flexShrink: 0, padding: 0,
        background: isDark ? 'rgba(255,255,255,.13)' : 'rgba(120,80,200,.15)',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
        background: 'linear-gradient(135deg,#FF6B35,#E91E8C)',
        left: isDark ? 3 : 23, transition: 'left .22s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isDark
          ? <Moon size={11} color="#fff" strokeWidth={2.5} />
          : <Sun size={11} color="#fff" strokeWidth={2.5} />
        }
      </div>
    </button>
  );
}
