// Custom, theme-aware dropdown used instead of the native <select>, whose option list
// is drawn by the browser (white with a blue highlight) and can't be styled.
//
//   <Select value={v} onChange={setV} placeholder="Pick one"
//           options={[{ value: 'a', label: 'A' }, { label: 'Group', options: [...] }]} />
//
// The menu renders in a portal with fixed positioning, so modals with overflow
// don't clip it, and it flips above the trigger when there's no room below.
import { useState, useRef, useEffect, useLayoutEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { useT } from '../context/ThemeContext';

const PINK = '#E91E8C';
const MENU_MAX_HEIGHT = 280;

// Flatten options + groups into rows: { type: 'group', label } | { type: 'option', value, label }
function toRows(options) {
  const rows = [];
  for (const o of options) {
    if (o.options) {
      rows.push({ type: 'group', label: o.label });
      for (const c of o.options) rows.push({ type: 'option', value: c.value, label: c.label, indent: true });
    } else {
      rows.push({ type: 'option', value: o.value, label: o.label });
    }
  }
  return rows;
}

export default function Select({
  value, onChange, options, placeholder = 'Select…',
  style, size = 'md', ariaLabel, disabled,
}) {
  const { t, isDark } = useT();
  const id = useId();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);

  const rows = useMemo(() => toRows(options), [options]);
  const optionIdx = useMemo(() => rows.map((r, i) => (r.type === 'option' ? i : -1)).filter(i => i >= 0), [rows]);
  const selected = rows.find(r => r.type === 'option' && r.value === value);

  const menuBg = isDark ? '#150e24' : '#ffffff';
  const pad = size === 'sm' ? '9px 14px' : '11px 14px';
  const fontSize = size === 'sm' ? 13 : 14;

  // Position the menu under (or above) the trigger.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom;
      const up = below < MENU_MAX_HEIGHT + 16 && r.top > below;
      setPos({ left: r.left, width: Math.max(r.width, 180), top: up ? undefined : r.bottom + 6, bottom: up ? window.innerHeight - r.top + 6 : undefined });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = e => {
      if (!triggerRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open && active >= 0) menuRef.current?.querySelector(`[data-row="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openMenu = () => {
    if (disabled) return;
    const cur = rows.findIndex(r => r.type === 'option' && r.value === value);
    setActive(cur >= 0 ? cur : optionIdx[0] ?? -1);
    setOpen(true);
  };
  const choose = i => {
    onChange(rows[i].value);
    setOpen(false);
    triggerRef.current?.focus();
  };
  const step = dir => {
    const at = optionIdx.indexOf(active);
    const next = optionIdx[Math.min(optionIdx.length - 1, Math.max(0, at + dir))];
    if (next !== undefined) setActive(next);
  };

  const onKeyDown = e => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openMenu(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(optionIdx[0]); }
    else if (e.key === 'End') { e.preventDefault(); setActive(optionIdx[optionIdx.length - 1]); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (active >= 0) choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab') setOpen(false);
    else if (e.key.length === 1) {
      // Type-ahead: jump to the next option starting with the typed letter.
      const ch = e.key.toLowerCase();
      const start = optionIdx.indexOf(active);
      const order = [...optionIdx.slice(start + 1), ...optionIdx.slice(0, start + 1)];
      const hit = order.find(i => String(rows[i].label).toLowerCase().startsWith(ch));
      if (hit !== undefined) setActive(hit);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className="ll-select"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: pad, borderRadius: 10, fontSize, fontFamily: "'Inter',sans-serif",
          background: t.bgCard, color: selected ? t.text : t.textMuted,
          border: `1px solid ${open ? t.pillBorder : t.border}`,
          boxShadow: open ? `0 0 0 3px ${t.pillBg}` : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
          textAlign: 'left', outline: 'none', boxSizing: 'border-box',
          ...style,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} strokeWidth={2.2} color={open ? PINK : t.textMuted} style={{
          flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease',
        }} />
      </button>

      {open && pos && createPortal(
        <ul
          ref={menuRef}
          id={`${id}-list`}
          role="listbox"
          className="ll-hscroll"
          style={{
            position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width,
            maxHeight: MENU_MAX_HEIGHT, overflowY: 'auto', zIndex: 5000, listStyle: 'none',
            margin: 0, padding: 6, borderRadius: 14, background: menuBg,
            border: `1px solid ${t.bgNavBorder}`, boxShadow: t.shadowCard,
            fontFamily: "'Inter',sans-serif", animation: 'llSelectIn .14s ease-out',
          }}
        >
          {rows.map((r, i) => r.type === 'group' ? (
            <li key={`g-${r.label}`} role="presentation" style={{
              padding: '10px 10px 4px', fontSize: 11, fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', color: t.textMuted,
            }}>{r.label}</li>
          ) : (
            <li
              key={`o-${r.value}`}
              id={`${id}-opt-${i}`}
              data-row={i}
              role="option"
              aria-selected={r.value === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={e => e.preventDefault()}
              onClick={() => choose(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                padding: `9px 10px 9px ${r.indent ? 22 : 10}px`, borderRadius: 9, cursor: 'pointer',
                fontSize, fontWeight: r.value === value ? 700 : 500,
                color: r.value === value ? PINK : t.text,
                background: i === active ? t.pillBg : 'transparent',
              }}
            >
              <span>{r.label}</span>
              {r.value === value && <Check size={15} strokeWidth={2.6} color={PINK} />}
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </>
  );
}
