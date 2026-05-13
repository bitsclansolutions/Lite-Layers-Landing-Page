import { useT } from '../context/ThemeContext';

export default function Logo({ size = 36 }) {
  const { t } = useT();
  return (
    <img
      src={t.logo}
      alt="Lite Layers"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}
    />
  );
}
