// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { useState, useCallback, useRef } from 'react';
import { useHuggingFaceStore } from '../stores/huggingfaceStore';
import { useModelsStore } from '../stores/modelsStore';
import type { HuggingFaceModel, HuggingFaceFile } from '@freedom-studio/types';

/* ── Format helpers ── */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ── Model Result Card ── */
function HFModelCard({ model, onSelect }: { model: HuggingFaceModel; onSelect: () => void }): React.JSX.Element {
  return (
    <button
      onClick={onSelect}
      className="glass-panel p-4 text-left w-full cursor-pointer transition-all hover:border-green-500/30"
      style={{ border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold truncate" style={{ color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}>
            {model.name}
          </h3>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
            {model.author}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs" style={{ color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>
          ↓ {formatNumber(model.downloads)}
        </span>
        <span className="text-xs" style={{ color: 'var(--accent-yellow)', fontFamily: "'JetBrains Mono', monospace" }}>
          ♥ {formatNumber(model.likes)}
        </span>
      </div>
    </button>
  );
}

/* ── File Row ── */
function FileRow({
  file,
  isDownloading,
  progress,
  onDownload,
}: {
  file: HuggingFaceFile;
  isDownloading: boolean;
  progress: number;
  onDownload: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
          {file.filename}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
            {formatBytes(file.size)}
          </span>
          {file.quantization !== 'Unknown' && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{
              background: 'rgba(0, 212, 255, 0.1)',
              color: 'var(--accent-cyan)',
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {file.quantization}
            </span>
          )}
        </div>
        {isDownloading && (
          <div className="w-full h-1 rounded-full overflow-hidden mt-1.5" style={{ background: 'var(--bg-surface)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: 'var(--accent-green)',
                boxShadow: '0 0 6px var(--accent-green)',
              }}
            />
          </div>
        )}
      </div>
      <button
        onClick={onDownload}
        disabled={isDownloading}
        className="px-3 py-1.5 rounded text-xs font-bold uppercase cursor-pointer transition-all flex-shrink-0"
        style={{
          background: isDownloading ? 'var(--bg-surface)' : 'rgba(0, 255, 136, 0.12)',
          color: isDownloading ? 'var(--text-muted)' : 'var(--accent-green)',
          border: `1px solid ${isDownloading ? 'var(--border-subtle)' : 'var(--border-accent)'}`,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {isDownloading ? `${progress.toFixed(0)}%` : 'Download'}
      </button>
    </div>
  );
}

/* ── Main HuggingFace Browser ── */
export function HuggingFaceBrowser(): React.JSX.Element {
  const {
    searchQuery, searchResults, selectedModel, modelFiles,
    isSearching, isLoadingFiles, downloadQueue, error,
    setSearchQuery, searchModels, selectModel, clearSelection, downloadFile,
  } = useHuggingFaceStore();
  const { fetchLocalModels, fetchDiskUsage } = useModelsStore();
  const [toast, setToast] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchModels(value);
    }, 500);
  }, [setSearchQuery, searchModels]);

  const handleDownload = useCallback(async (file: HuggingFaceFile) => {
    if (!selectedModel) return;
    await downloadFile(selectedModel.id, file);
    // Refresh local models after download completes
    await fetchLocalModels();
    await fetchDiskUsage();
    setToast(`Downloaded "${file.filename}"`);
    setTimeout(() => setToast(null), 4000);
  }, [selectedModel, downloadFile, fetchLocalModels, fetchDiskUsage]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
          HuggingFace Browser
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          Search and download GGUF models from HuggingFace
        </p>
      </div>

      {/* Search */}
      <div className="px-6 py-3">
        <input
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search models (e.g., llama, mistral, phi, qwen)..."
          className="w-full px-3 py-2 rounded text-sm outline-none"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 px-3 py-2 rounded text-xs mb-2" style={{ background: 'rgba(255, 51, 85, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255, 51, 85, 0.3)' }}>
          {error}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded text-xs shadow-lg"
          style={{
            background: 'rgba(0, 255, 136, 0.15)',
            color: 'var(--accent-green)',
            border: '1px solid var(--border-accent)',
            fontFamily: "'JetBrains Mono', monospace",
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
        {selectedModel ? (
          /* File List for selected model */
          <div>
            <button
              onClick={clearSelection}
              className="text-xs mb-3 cursor-pointer hover:underline"
              style={{ color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              ← Back to search results
            </button>

            <div className="glass-panel mb-4 p-4">
              <h3 className="text-sm font-bold" style={{ color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}>
                {selectedModel.id}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs" style={{ color: 'var(--accent-cyan)' }}>↓ {formatNumber(selectedModel.downloads)}</span>
                <span className="text-xs" style={{ color: 'var(--accent-yellow)' }}>♥ {formatNumber(selectedModel.likes)}</span>
              </div>
            </div>

            {isLoadingFiles ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Loading GGUF files...
                </span>
              </div>
            ) : modelFiles.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  No GGUF files found in this repository
                </span>
              </div>
            ) : (
              <div className="glass-panel overflow-hidden">
                <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {modelFiles.length} GGUF file{modelFiles.length !== 1 ? 's' : ''} available
                  </span>
                </div>
                {modelFiles.map((file) => {
                  const dl = downloadQueue.find((d) => d.fileName === file.filename);
                  return (
                    <FileRow
                      key={file.filename}
                      file={file}
                      isDownloading={dl?.status === 'downloading' || dl?.status === 'queued'}
                      progress={dl?.percent || 0}
                      onDownload={() => handleDownload(file)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : isSearching ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              Searching HuggingFace...
            </span>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {searchResults.map((model) => (
              <HFModelCard key={model.id} model={model} onSelect={() => selectModel(model)} />
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              No results found
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              Search for GGUF models on HuggingFace
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              Try: llama, mistral, phi, qwen, gemma
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
