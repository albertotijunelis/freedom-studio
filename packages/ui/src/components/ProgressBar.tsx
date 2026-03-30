// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  variant?: 'green' | 'cyan' | 'red' | 'yellow';
  height?: number;
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const variantColors: Record<string, string> = {
  green: 'var(--accent-green)',
  cyan: 'var(--accent-cyan)',
  red: 'var(--accent-red)',
  yellow: 'var(--accent-yellow)',
};

export function ProgressBar({
  value,
  label,
  showPercent = true,
  variant = 'green',
  height = 6,
  animated = true,
  className,
  style,
}: ProgressBarProps): React.JSX.Element {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color = variantColors[variant];

  return (
    <div className={className} style={{ ...style }}>
      {(label || showPercent) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          {label && (
            <span style={{
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-secondary)',
            }}>
              {label}
            </span>
          )}
          {showPercent && (
            <span style={{
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              color,
            }}>
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}
      <div
        style={{
          width: '100%',
          height,
          background: 'var(--bg-surface)',
          borderRadius: height / 2,
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            width: `${clampedValue}%`,
            height: '100%',
            background: color,
            borderRadius: height / 2,
            transition: animated ? 'width 0.3s ease' : 'none',
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  );
}
