// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import React from 'react';

interface SpinnerProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Spinner({ size = 20, className, style }: SpinnerProps): React.JSX.Element {
  const borderWidth = Math.max(2, Math.round(size / 10));

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        border: `${borderWidth}px solid var(--border-subtle)`,
        borderTopColor: 'var(--accent-green)',
        borderRadius: '50%',
        animation: 'fs-spin 0.8s linear infinite',
        ...style,
      }}
    >
      <style>{`
        @keyframes fs-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
