// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        void: '#000000',
        dark: '#0a0a0a',
        surface: '#111111',
        'accent-green': '#00ff88',
        'accent-cyan': '#00d4ff',
        'accent-red': '#ff3355',
        'accent-yellow': '#ffcc00',
        'accent-purple': '#9945ff',
        'text-primary': '#f0f0f0',
        'text-secondary': '#888888',
        'text-muted': '#444444',
      },
      fontFamily: {
        heading: ["'JetBrains Mono'", "'Space Mono'", 'monospace'],
        body: ["'Inter'", "'IBM Plex Sans'", 'sans-serif'],
        code: ["'Fira Code'", 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
      },
      backdropBlur: {
        glass: '20px',
      },
      boxShadow: {
        'glow-green': '0 0 8px #00ff88',
        'glow-cyan': '0 0 8px #00d4ff',
        'glow-red': '0 0 8px #ff3355',
        'glow-purple': '0 0 8px #9945ff',
      },
    },
  },
  plugins: [],
};
