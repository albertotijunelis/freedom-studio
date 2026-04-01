// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { is } from '@electron-toolkit/utils';

let updateCheckInProgress = false;

export function initializeAutoUpdater(): void {
  // Disable auto-download — let user decide when to install
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Disable in dev mode
  if (is.dev) {
    autoUpdater.forceDevUpdateConfig = false;
  }

  // Forward events to renderer
  autoUpdater.on('checking-for-update', () => {
    sendToAllWindows('update:status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    sendToAllWindows('update:status', {
      status: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
    });
    updateCheckInProgress = false;
  });

  autoUpdater.on('update-not-available', () => {
    sendToAllWindows('update:status', { status: 'up-to-date' });
    updateCheckInProgress = false;
  });

  autoUpdater.on('download-progress', (progress) => {
    sendToAllWindows('update:status', {
      status: 'downloading',
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendToAllWindows('update:status', {
      status: 'ready',
      version: info.version,
    });
  });

  autoUpdater.on('error', (err) => {
    // Don't leak stack traces to renderer — just the message
    sendToAllWindows('update:status', {
      status: 'error',
      message: err.message || 'Update check failed',
    });
    updateCheckInProgress = false;
  });
}

function sendToAllWindows(channel: string, data: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }
}

export function registerUpdateHandlers(): void {
  ipcMain.handle('update:check', () => {
    if (is.dev) {
      return { status: 'dev', message: 'Auto-update disabled in development' };
    }
    if (updateCheckInProgress) {
      return { status: 'busy', message: 'Already checking for updates' };
    }
    updateCheckInProgress = true;
    autoUpdater.checkForUpdates().catch(() => {
      updateCheckInProgress = false;
    });
    return { status: 'checking' };
  });

  ipcMain.handle('update:download', () => {
    if (is.dev) return { status: 'dev' };
    autoUpdater.downloadUpdate().catch(() => {});
    return { status: 'downloading' };
  });

  ipcMain.handle('update:install', () => {
    if (is.dev) return { status: 'dev' };
    // Quit and install the update
    autoUpdater.quitAndInstall(false, true);
    return { status: 'installing' };
  });

  ipcMain.handle('update:get-version', () => {
    return { version: autoUpdater.currentVersion.version };
  });
}
