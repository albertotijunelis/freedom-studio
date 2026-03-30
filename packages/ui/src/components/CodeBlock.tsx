// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import React, { useState, useCallback } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CodeBlock({
  code,
  language,
  className,
  style,
}: CodeBlockProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [code]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: 'var(--bg-dark)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-muted)',
            textTransform: 'uppercase' as const,
          }}
        >
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? 'var(--accent-green)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            transition: 'color 0.2s ease',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Code content */}
      <pre
        style={{
          margin: 0,
          padding: '12px',
          overflowX: 'auto',
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          fontSize: '13px',
          lineHeight: 1.6,
          color: 'var(--text-code)',
          tabSize: 2,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
