// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon, style, className, ...props },
  ref
) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label
          style={{
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-secondary)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase' as const,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{
            position: 'absolute',
            left: '12px',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
            display: 'flex',
          }}>
            {icon}
          </span>
        )}
        <input
          ref={ref}
          style={{
            width: '100%',
            padding: icon ? '8px 12px 8px 36px' : '8px 12px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            color: 'var(--text-primary)',
            background: 'var(--bg-dark)',
            border: `1px solid ${error ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--accent-red)' : 'var(--accent-green)';
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 1px var(--accent-red)'
              : '0 0 0 1px var(--accent-green)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--accent-red)' : 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
            props.onBlur?.(e);
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{
          fontSize: '11px',
          fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--accent-red)',
        }}>
          {error}
        </span>
      )}
    </div>
  );
});
