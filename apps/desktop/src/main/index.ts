// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { app, BrowserWindow, shell, session, nativeImage } from 'electron';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { is } from '@electron-toolkit/utils';
import { registerAllHandlers } from './ipc/index';
import { databaseManager } from './database/db';

const ALLOWED_EXTERNAL_HOSTS = ['github.com', 'huggingface.co', 'torproject.org', 'www.torproject.org'];

function createWindow(): void {
  // Try PNG first (cross-platform), then ICO (Windows), then fallback
  const pngPath = join(__dirname, '../../build/icon.png');
  const icoPath = join(__dirname, '../../build/icon.ico');
  const iconPath = process.platform === 'win32'
    ? (existsSync(icoPath) ? icoPath : pngPath)
    : pngPath;
  let appIcon: Electron.NativeImage | undefined;
  if (existsSync(iconPath)) {
    appIcon = nativeImage.createFromPath(iconPath);
    if (appIcon.isEmpty()) {
      console.warn('[FreedomStudio] Icon loaded but is empty:', iconPath);
      appIcon = undefined;
    } else {
      console.log('[FreedomStudio] Icon loaded:', iconPath, appIcon.getSize());
    }
  } else {
    console.warn('[FreedomStudio] Icon not found:', iconPath);
  }

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    title: 'Freedom Studio',
    icon: appIcon,
    backgroundColor: '#000000',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform === 'darwin' ? false : true,
    autoHideMenuBar: true,
    ...(process.platform === 'darwin' ? { vibrancy: 'under-window' as const } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Content Security Policy — strict in production, relaxed in dev for Vite HMR
  const cspPolicy = is.dev
    ? "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; " +
      "style-src 'self' 'unsafe-inline'; " +
      "font-src 'self' data:; " +
      "img-src 'self' data:; " +
      "connect-src 'self' http://localhost:* ws://localhost:*;"
    : "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "font-src 'self' data:; " +
      "img-src 'self' data:; " +
      "connect-src 'self';";

  session.defaultSession.webRequest.onHeadersReceived((_details, callback) => {
    callback({
      responseHeaders: {
        ...(_details.responseHeaders ?? {}),
        'Content-Security-Policy': [cspPolicy],
      },
    });
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Prevent navigation to external URLs — only allow whitelisted domains
  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const url = new URL(details.url);
      if (ALLOWED_EXTERNAL_HOSTS.includes(url.hostname)) {
        shell.openExternal(details.url).catch(() => {});
      }
    } catch {
      // Invalid URL, ignore
    }
    return { action: 'deny' };
  });

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  // Initialize database
  databaseManager.initialize();

  // Register IPC handlers
  registerAllHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  databaseManager.close();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
