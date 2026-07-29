import React, { useEffect } from 'react';
import { Download, RefreshCw, Sparkles, FileVideo, HardDrive, Percent, Maximize2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatBytes } from '../services/ffmpegService';
import VideoCompareViewer from './VideoCompareViewer';

export default function ResultStats({
  originalFile,
  compressedBlob,
  compressedUrl,
  resolution,
  onReset,
}) {
  const originalSize = originalFile?.size || 0;
  const compressedSize = compressedBlob?.size || 0;
  const savingsPct = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));

  useEffect(() => {
    // Trigger confetti on successful compression display
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#10b981', '#c4b5fd'],
      });
    } catch (e) {}
  }, []);

  const downloadFilename = originalFile
    ? originalFile.name.replace(/\.[a-zA-Z0-9]+$/, '') + '-comprimido.mp4'
    : 'video-comprimido.mp4';

  return (
    <section className="panel results">
      <div className="section-label">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        Resultado de Compresión
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="num">{formatBytes(originalSize)}</div>
          <div className="lbl">Tamaño Original</div>
        </div>
        <div className="stat-card">
          <div className="num">{formatBytes(compressedSize)}</div>
          <div className="lbl">Tamaño Comprimido</div>
        </div>
        <div className="stat-card savings">
          <div className="num">-{savingsPct}%</div>
          <div className="lbl">Ahorro Obtenido</div>
        </div>
        <div className="stat-card">
          <div className="num">{resolution || '1080p'}</div>
          <div className="lbl">Resolución Salida</div>
        </div>
      </div>

      <VideoCompareViewer
        originalUrl={URL.createObjectURL(originalFile)}
        compressedUrl={compressedUrl}
      />

      <div className="download-row">
        <a
          className="dl-btn"
          href={compressedUrl}
          download={downloadFilename}
        >
          <Download className="w-5 h-5" />
          Descargar Video Comprimido ({formatBytes(compressedSize)})
        </a>

        <button className="reset-btn" onClick={onReset}>
          <RefreshCw className="w-4 h-4" />
          Comprimir otro video
        </button>
      </div>
    </section>
  );
}
