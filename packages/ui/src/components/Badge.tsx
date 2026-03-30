// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import React from 'react';

type BadgeVariant = 'success' | 'error' | 'warning' | 'tor' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glow?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  success: {
    bg: 'rgba(0, 255, 136, 0.1)',
    color: 'var(--accent-green)',
    border: 'rgba(0, 255, 136, 0.3)',
  },
  error: {
    bg: 'rgba(255, 51, 85, 0.1)',
    color: 'var(--accent-red)',
    border: 'rgba(255, 51, 85, 0.3)',
  },
  warning: {
    bg: 'rgba(255, 204, 0, 0.1)',
    color: 'var(--accent-yellow)',
    border: 'rgba(255, 204, 0, 0.3)',
  },
  tor: {
    bg: 'rgba(153, 69, 255, 0.1)',
    color: 'var(--accent-purple)',
    border: 'rgba(153, 69, 255, 0.3)',
  },
  info: {
    bg: 'rgba(0, 212, 255, 0.1)',
    color: 'var(--accent-cyan)',
    border: 'rgba(0, 212, 255, 0.3)',
  },
  neutral: {
    bg: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-secondary)',
    border: 'var(--border-subtle)',
  },
};

export function Badge({
  variant = 'neutral',
  children,
  className,
  style,
  glow = false,
}: BadgeProps): React.JSX.Element {
  const v = variantStyles[variant];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        fontSize: '11px',
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase' as const,
        color: v.color,
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: 'var(--radius-sm)',
        ...(glow ? { boxShadow: `0 0 8px ${v.color}`, textShadow: `0 0 8px ${v.color}` } : {}),
        ...style,
      }}
    >
      {children}
    </span>
  );
}
