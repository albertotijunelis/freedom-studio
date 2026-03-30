// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'transparent',
    border: '1px solid var(--accent-green)',
    color: 'var(--accent-green)',
  },
  secondary: {
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
  },
  danger: {
    background: 'transparent',
    border: '1px solid var(--accent-red)',
    color: 'var(--accent-red)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-secondary)',
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: '12px' },
  md: { padding: '8px 20px', fontSize: '14px' },
  lg: { padding: '12px 28px', fontSize: '16px' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  glow = false,
  style,
  children,
  ...props
}: ButtonProps): React.JSX.Element {
  const baseStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.2s ease',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(glow && variant === 'primary'
      ? { boxShadow: 'var(--glow-green)', textShadow: 'var(--glow-green)' }
      : {}),
    ...(glow && variant === 'danger'
      ? { boxShadow: 'var(--glow-red)', textShadow: 'var(--glow-red)' }
      : {}),
    ...style,
  };

  return (
    <button style={baseStyle} {...props}>
      {children}
    </button>
  );
}
