// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import React from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxHeight?: string;
}

export function ScrollArea({
  children,
  className,
  style,
  maxHeight,
}: ScrollAreaProps): React.JSX.Element {
  return (
    <div
      className={className}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        maxHeight,
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--text-muted) transparent',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
