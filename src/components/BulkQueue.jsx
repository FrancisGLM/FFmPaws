import React, { useRef } from 'react';
import {
  Layers, UploadCloud, X, Film,
  CheckCircle2, Loader, AlertCircle,
} from 'lucide-react';
import { formatBytes } from '../services/ffmpegService';

export default function BulkQueue({
  files,
  onAddFiles,
  onRemoveFile,
  onClearAll,
  currentIndex,
  results,
  isProcessing,
}) {
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    const fileList = Array.from(e.target.files).filter((f) => f.type.startsWith('video/'));
    if (fileList.length > 0) onAddFiles(fileList);
    e.target.value = '';
  };

  return (
    <div className="tool-panel">
      <div className="section-label">
        <Layers className="w-4 h-4" style={{ color: '#06b6d4' }} />
        Compresión en Bulk
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      <div className="bulk-actions">
        <button
          className="bulk-add-btn"
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
        >
          <UploadCloud className="w-4 h-4" />
          Agregar videos
        </button>
        {files.length > 0 && (
          <button
            className="bulk-clear-btn"
            onClick={onClearAll}
            disabled={isProcessing}
          >
            Limpiar cola
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="bulk-empty">
          No hay videos en la cola. Agregá archivos para procesarlos en lote.
        </div>
      ) : (
        <div className="bulk-list">
          {files.map((f, idx) => {
            const result = results[idx];
            const isCurrent = currentIndex === idx && isProcessing;
            let statusIcon = null;
            let statusClass = '';
            if (result?.status === 'done') {
              statusIcon = <CheckCircle2 className="w-4 h-4" />;
              statusClass = 'done';
            } else if (result?.status === 'error') {
              statusIcon = <AlertCircle className="w-4 h-4" />;
              statusClass = 'error';
            } else if (isCurrent) {
              statusIcon = <Loader className="w-4 h-4 animate-spin" />;
              statusClass = 'processing';
            }

            return (
              <div key={idx} className={`bulk-item ${statusClass}`}>
                <div className="bulk-item-info">
                  <Film className="w-4 h-4" style={{ color: 'var(--violet-light)', flexShrink: 0 }} />
                  <div className="bulk-item-name" title={f.name}>{f.name}</div>
                  <div className="bulk-item-size">{formatBytes(f.size)}</div>
                </div>
                <div className="bulk-item-status">
                  {result?.status === 'done' && (
                    <span className="bulk-savings">-{result.savingsPct}%</span>
                  )}
                  {statusIcon}
                  {!isProcessing && !result && (
                    <button
                      className="bulk-remove-btn"
                      onClick={() => onRemoveFile(idx)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results.filter((r) => r?.status === 'done').length > 0 && (
        <div className="bulk-summary">
          <span>
            {results.filter((r) => r?.status === 'done').length} de {files.length} completados
          </span>
        </div>
      )}
    </div>
  );
}
