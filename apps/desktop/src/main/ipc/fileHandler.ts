// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain, dialog, BrowserWindow } from 'electron';
import { writeFile, mkdir } from 'node:fs/promises';
import { basename, join, dirname, normalize, resolve } from 'node:path';

interface IPCResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function wrapHandler<T>(fn: () => Promise<T> | T): Promise<IPCResult<T>> {
  return Promise.resolve()
    .then(() => fn())
    .then((data) => ({ success: true, data }))
    .catch((err: unknown) => ({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }));
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
  rust: '.rs',
  go: '.go',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  csharp: '.cs',
  'c#': '.cs',
  html: '.html',
  css: '.css',
  scss: '.scss',
  json: '.json',
  yaml: '.yaml',
  yml: '.yaml',
  toml: '.toml',
  xml: '.xml',
  markdown: '.md',
  md: '.md',
  sql: '.sql',
  bash: '.sh',
  shell: '.sh',
  sh: '.sh',
  zsh: '.sh',
  powershell: '.ps1',
  ps1: '.ps1',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile',
  ruby: '.rb',
  php: '.php',
  swift: '.swift',
  kotlin: '.kt',
  scala: '.scala',
  lua: '.lua',
  perl: '.pl',
  r: '.r',
  jsx: '.jsx',
  tsx: '.tsx',
  vue: '.vue',
  svelte: '.svelte',
  graphql: '.graphql',
  proto: '.proto',
  ini: '.ini',
  conf: '.conf',
  env: '.env',
  txt: '.txt',
  text: '.txt',
};

function getDefaultFilename(language: string): string {
  const ext = LANGUAGE_EXTENSIONS[language.toLowerCase()];
  if (ext === 'Dockerfile') return 'Dockerfile';
  return ext ? `code${ext}` : 'code.txt';
}

function getFilterForLanguage(language: string): Electron.FileFilter[] {
  const ext = LANGUAGE_EXTENSIONS[language.toLowerCase()];
  const filters: Electron.FileFilter[] = [];

  if (ext && ext !== 'Dockerfile') {
    const extNoDot = ext.slice(1);
    filters.push({ name: `${language} files`, extensions: [extNoDot] });
  }

  filters.push({ name: 'All files', extensions: ['*'] });
  return filters;
}

export function registerFileHandlers(): void {
  ipcMain.handle('file:save-dialog', (event, args: { content: string; language?: string; suggestedName?: string }) => {
    return wrapHandler(async () => {
      if (typeof args?.content !== 'string') throw new Error('Invalid content');
      if (args.content.length > 10 * 1024 * 1024) throw new Error('Content too large (max 10 MB)');

      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('No active window');

      const language = typeof args.language === 'string' ? args.language.slice(0, 50) : 'text';
      // Sanitize suggestedName: strip path separators to prevent directory traversal
      const rawName = (typeof args.suggestedName === 'string' && args.suggestedName.length > 0)
        ? args.suggestedName.slice(0, 255)
        : getDefaultFilename(language);
      const defaultName = basename(rawName);

      const result = await dialog.showSaveDialog(window, {
        title: 'Save File',
        defaultPath: defaultName,
        filters: getFilterForLanguage(language),
        properties: ['showOverwriteConfirmation'],
      });

      if (result.canceled || !result.filePath) {
        return { saved: false, filePath: null };
      }

      await writeFile(result.filePath, args.content, 'utf-8');
      return { saved: true, filePath: result.filePath };
    });
  });

  // Save multiple files to a chosen directory, preserving relative paths
  ipcMain.handle('file:save-all-dialog', (event, args: { files: Array<{ path: string; content: string }> }) => {
    return wrapHandler(async () => {
      if (!Array.isArray(args?.files) || args.files.length === 0) throw new Error('No files to save');
      if (args.files.length > 500) throw new Error('Too many files (max 500)');

      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('No active window');

      // Validate each file entry
      for (const file of args.files) {
        if (typeof file.path !== 'string' || typeof file.content !== 'string') {
          throw new Error('Invalid file entry');
        }
        if (file.content.length > 10 * 1024 * 1024) {
          throw new Error(`File too large: ${file.path} (max 10 MB per file)`);
        }
        if (file.path.length > 500) {
          throw new Error('File path too long (max 500 chars)');
        }
      }

      const result = await dialog.showOpenDialog(window, {
        title: 'Select folder to save files',
        properties: ['openDirectory', 'createDirectory'],
      });

      if (result.canceled || !result.filePaths[0]) {
        return { saved: false, count: 0 };
      }

      const baseDir = result.filePaths[0];
      let savedCount = 0;

      for (const file of args.files) {
        // Sanitize: normalize path, prevent directory traversal
        const normalized = normalize(file.path).replace(/^(\.\.(\/|\\))+/, '');
        const fullPath = resolve(join(baseDir, normalized));

        // Security: ensure the resolved path is within the chosen base directory
        if (!fullPath.startsWith(resolve(baseDir))) {
          continue; // Skip files that would escape the base directory
        }

        await mkdir(dirname(fullPath), { recursive: true });
        await writeFile(fullPath, file.content, 'utf-8');
        savedCount++;
      }

      return { saved: true, count: savedCount, directory: baseDir };
    });
  });
}
