// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
  style?: React.CSSProperties;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '0',
  sm: '12px',
  md: '20px',
  lg: '32px',
};

export function Panel({
  children,
  accent = false,
  className,
  style,
  padding = 'md',
}: PanelProps): React.JSX.Element {
  return (
    <div
      className={className}
      style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'var(--blur-glass)',
        WebkitBackdropFilter: 'var(--blur-glass)',
        border: `1px solid ${accent ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        padding: paddingMap[padding],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
