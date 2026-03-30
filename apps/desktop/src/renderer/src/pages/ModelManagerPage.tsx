// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect, useState, useCallback } from 'react';
import { useModelsStore } from '../stores/modelsStore';
import { useInferenceStore } from '../stores/inferenceStore';
import type { ModelInfo, DownloadProgress } from '@freedom-studio/types';

/* ── Format helpers ── */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/* ── Model Card ── */
function ModelCard({
  model,
  isLoaded,
  onLoad,
  onDelete,
}: {
  model: ModelInfo;
  isLoaded: boolean;
  onLoad: () => void;
  onDelete: () => void;
}): React.JSX.Element {
  return (
    <div
      className="glass-panel p-4 flex flex-col gap-3"
      style={{
        border: isLoaded ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-bold truncate"
          style={{
            color: isLoaded ? 'var(--accent-green)' : 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {model.name}
        </h3>
        {isLoaded && (
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{
              background: 'rgba(0, 255, 136, 0.15)',
              color: 'var(--accent-green)',
              border: '1px solid var(--border-accent)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            LOADED
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-3">
        <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
          {formatBytes(model.size)}
        </span>
        {model.quantization && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{
            background: 'rgba(0, 212, 255, 0.1)',
            color: 'var(--accent-cyan)',
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {model.quantization}
          </span>
        )}
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {model.format}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={onLoad}
          disabled={isLoaded}
          className="flex-1 px-3 py-1.5 rounded text-xs font-bold uppercase cursor-pointer transition-all"
          style={{
            background: isLoaded ? 'var(--bg-surface)' : 'rgba(0, 255, 136, 0.12)',
            color: isLoaded ? 'var(--text-muted)' : 'var(--accent-green)',
            border: `1px solid ${isLoaded ? 'var(--border-subtle)' : 'var(--border-accent)'}`,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {isLoaded ? 'Active' : 'Load'}
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded text-xs cursor-pointer transition-all hover:bg-red-500/10"
          style={{
            color: 'var(--accent-red)',
            border: '1px solid rgba(255, 51, 85, 0.3)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/* ── Download Item ── */
function DownloadItem({ download }: { download: DownloadProgress }): React.JSX.Element {
  return (
    <div className="glass-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs truncate" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
          {download.modelId}
        </span>
        <span className="text-xs" style={{
          color: download.status === 'failed' ? 'var(--accent-red)' : 'var(--accent-cyan)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {download.status === 'downloading' ? `${download.percent.toFixed(0)}%` : download.status}
        </span>
      </div>
      {download.status === 'downloading' && (
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${download.percent}%`,
              background: 'var(--accent-green)',
              boxShadow: '0 0 6px var(--accent-green)',
            }}
          />
        </div>
      )}
      {download.speed && (
        <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
          {download.speed}
        </span>
      )}
    </div>
  );
}

/* ── Main Model Manager Page ── */
export function ModelManagerPage(): React.JSX.Element {
  const { localModels, downloadQueue, diskUsage, isLoading, error, importProgress, fetchLocalModels, fetchDiskUsage, deleteModel, importModel } = useModelsStore();
  const { loadedModelPath, loadModel, isLoading: modelLoading } = useInferenceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchLocalModels();
    fetchDiskUsage();
  }, [fetchLocalModels, fetchDiskUsage]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleImport = useCallback(async () => {
    try {
      const result = await importModel();
      if (result) {
        fetchDiskUsage();
        setToast({ message: `Imported "${result.name}" (SHA256 verified)`, type: 'success' });
      }
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Import failed', type: 'error' });
    }
  }, [importModel, fetchDiskUsage]);

  const handleLoad = useCallback(async (model: ModelInfo) => {
    try {
      await loadModel(model.filePath, model.name);
    } catch {
      // Error handled in store
    }
  }, [loadModel]);

  const handleDelete = useCallback(async (modelId: string) => {
    await deleteModel(modelId);
    fetchDiskUsage();
  }, [deleteModel, fetchDiskUsage]);

  const filteredModels = localModels.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDownloads = downloadQueue.filter((d) => d.status === 'downloading');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
            Model Manager
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            {localModels.length} model{localModels.length !== 1 ? 's' : ''} installed
            {diskUsage && ` · ${formatBytes(diskUsage.totalBytes)} used`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            disabled={!!importProgress}
            className="px-3 py-1.5 rounded text-xs cursor-pointer transition-all hover:bg-white/5"
            style={{
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              fontFamily: "'JetBrains Mono', monospace",
              opacity: importProgress ? 0.5 : 1,
            }}
          >
            Import Model
          </button>
          <button
            onClick={() => { fetchLocalModels(); fetchDiskUsage(); }}
            className="px-3 py-1.5 rounded text-xs cursor-pointer transition-all hover:bg-white/5"
            style={{
              color: 'var(--accent-green)',
              border: '1px solid var(--border-accent)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search models..."
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
        <div className="mx-6 px-3 py-2 rounded text-xs" style={{ background: 'rgba(255, 51, 85, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255, 51, 85, 0.3)' }}>
          {error}
        </div>
      )}

      {/* Import Progress */}
      {importProgress && (
        <div className="mx-6 mb-2 glass-panel p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs truncate" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
              Importing: {importProgress.fileName}
            </span>
            <span className="text-xs" style={{ color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>
              {importProgress.status === 'copying' ? `${importProgress.percent.toFixed(0)}%` : importProgress.status}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${importProgress.percent}%`,
                background: importProgress.status === 'verifying' ? 'var(--accent-cyan)' : 'var(--accent-green)',
                boxShadow: `0 0 6px ${importProgress.status === 'verifying' ? 'var(--accent-cyan)' : 'var(--accent-green)'}`,
              }}
            />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded text-xs shadow-lg transition-all"
          style={{
            background: toast.type === 'success' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 51, 85, 0.15)',
            color: toast.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
            border: `1px solid ${toast.type === 'success' ? 'var(--border-accent)' : 'rgba(255, 51, 85, 0.3)'}`,
            fontFamily: "'JetBrains Mono', monospace",
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Active Downloads */}
      {activeDownloads.length > 0 && (
        <div className="px-6 pb-3">
          <h3 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>
            Downloads
          </h3>
          <div className="flex flex-col gap-2">
            {activeDownloads.map((d) => (
              <DownloadItem key={d.modelId} download={d} />
            ))}
          </div>
        </div>
      )}

      {/* Model Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
        {isLoading || modelLoading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              Loading...
            </span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {searchQuery ? 'No models match your search' : 'No models found'}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              Add GGUF model files to your models directory
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isLoaded={model.filePath === loadedModelPath}
                onLoad={() => handleLoad(model)}
                onDelete={() => handleDelete(model.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
