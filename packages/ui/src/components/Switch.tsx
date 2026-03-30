// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: SwitchProps): React.JSX.Element {
  return (
    <label
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          position: 'relative',
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          background: checked ? 'rgba(0, 255, 136, 0.3)' : 'var(--bg-surface)',
          border: `1px solid ${checked ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
          transition: 'all 0.2s ease',
          ...(checked ? { boxShadow: '0 0 8px rgba(0, 255, 136, 0.2)' } : {}),
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '18px' : '2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: checked ? 'var(--accent-green)' : 'var(--text-muted)',
            transition: 'all 0.2s ease',
            ...(checked ? { boxShadow: 'var(--glow-green)' } : {}),
          }}
        />
      </div>
      {label && (
        <span
          style={{
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
}
