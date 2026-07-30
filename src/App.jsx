import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import HeroDropzone from './components/HeroDropzone';
import Sidebar from './components/Sidebar';
import QualityPresets from './components/QualityPresets';
import TrimTool from './components/TrimTool';
import CropTool from './components/CropTool';
import WatermarkTool from './components/WatermarkTool';
import BulkQueue from './components/BulkQueue';
import LedgerProgress from './components/LedgerProgress';
import ResultStats from './components/ResultStats';
import { getFFmpeg, compressVideo } from './services/ffmpegService';
import { AlertTriangle, Heart, Cpu, UploadCloud } from 'lucide-react';

export default function App() {
  const [engineState, setEngineState] = useState({
    status: 'loading',
    text: 'Cargando motor...',
    pct: 0,
  });

  const [currentFile, setCurrentFile] = useState(null);
  const [activeTool, setActiveTool] = useState('compress');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const [compressedBlob, setCompressedBlob] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [outputResolution, setOutputResolution] = useState(null);

  // Trim state
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  // Crop state
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, w: 100, h: 100 });

  // Watermark state
  const [watermark, setWatermark] = useState(null);

  // Bulk state
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkCurrentIndex, setBulkCurrentIndex] = useState(-1);

  const workflowRef = useRef(null);
  const resultsRef = useRef(null);
  const fileInputRef = useRef(null);

  // Pre-load FFmpeg in background when app opens
  const initEngine = () => {
    setErrorMsg(null);
    getFFmpeg(
      (statusObj) => setEngineState(statusObj),
      (log) => {
        setLogLines((prev) => [...prev.slice(-60), log]);
      },
      (pct) => setProgressPct(pct)
    ).catch((err) => {
      console.error('Failed to load engine:', err);
    });
  };

  useEffect(() => {
    initEngine();
  }, []);

  const handleFilesSelect = (files) => {
    setErrorMsg(null);
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      // Single file mode
      setCurrentFile(files[0]);
      setCompressedBlob(null);
      setCompressedUrl(null);
      setTrimStart(0);
      setTrimEnd(0);
      setCropRect({ x: 0, y: 0, w: 100, h: 100 });
      setWatermark(null);
      if (activeTool === 'bulk') setActiveTool('compress');
    } else {
      // Multiple files -> Bulk mode
      setBulkFiles(files);
      setBulkResults([]);
      setActiveTool('bulk');
    }

    setTimeout(() => {
      workflowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleChangeFile = () => {
    setCurrentFile(null);
    setCompressedBlob(null);
    setCompressedUrl(null);
    setErrorMsg(null);
    setTrimStart(0);
    setTrimEnd(0);
    setCropRect({ x: 0, y: 0, w: 100, h: 100 });
    setWatermark(null);
  };

  // Use compressed video as new input
  const handleUseCompressed = () => {
    if (!compressedBlob) return;
    const newFile = new File([compressedBlob], 'video-comprimido.mp4', { type: 'video/mp4' });
    setCurrentFile(newFile);
    setCompressedBlob(null);
    setCompressedUrl(null);
    setTrimStart(0);
    setTrimEnd(0);
    setCropRect({ x: 0, y: 0, w: 100, h: 100 });
    setWatermark(null);
    setLogLines([]);
    setProgressPct(0);
    setErrorMsg(null);
    setTimeout(() => {
      workflowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const buildExtras = () => {
    const extras = {};
    if (trimStart > 0 || (trimEnd > 0 && trimEnd !== 0)) {
      extras.trimStart = trimStart;
      extras.trimEnd = trimEnd;
    }
    if (cropRect.x !== 0 || cropRect.y !== 0 || cropRect.w !== 100 || cropRect.h !== 100) {
      extras.cropRect = cropRect;
    }
    if (watermark) {
      extras.watermark = watermark;
    }
    return extras;
  };

  const handleStartCompress = async (settings) => {
    if (!currentFile) return;

    setErrorMsg(null);
    setIsProcessing(true);
    setLogLines([]);
    setProgressPct(0);
    setStatusText('Iniciando...');

    try {
      const extras = buildExtras();
      const blob = await compressVideo({
        file: currentFile,
        settings,
        extras,
        onLog: (msg) => setLogLines((prev) => [...prev.slice(-60), msg]),
        onProgress: (pct) => setProgressPct(pct),
        onStatus: (st) => setStatusText(st),
      });

      if (compressedUrl) {
        URL.revokeObjectURL(compressedUrl);
      }

      const newUrl = URL.createObjectURL(blob);
      setCompressedBlob(blob);
      setCompressedUrl(newUrl);

      const v = document.createElement('video');
      v.src = newUrl;
      v.onloadedmetadata = () => {
        setOutputResolution(`${v.videoWidth}×${v.videoHeight}`);
      };

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      console.error('Error durante la compresión:', err);
      setErrorMsg(
        `Hubo un inconveniente durante el procesamiento: ${err?.message || 'Error desconocido'
        }. Intentá con un preset distinto o reduciendo las opciones.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk processing
  const handleBulkStart = async (settings) => {
    if (bulkFiles.length === 0) return;

    setIsProcessing(true);
    setErrorMsg(null);
    const results = new Array(bulkFiles.length).fill(null);
    setBulkResults([...results]);

    for (let i = 0; i < bulkFiles.length; i++) {
      setBulkCurrentIndex(i);
      setLogLines([]);
      setProgressPct(0);
      setStatusText(`Procesando ${i + 1} de ${bulkFiles.length}: ${bulkFiles[i].name}`);

      try {
        const blob = await compressVideo({
          file: bulkFiles[i],
          settings,
          extras: buildExtras(),
          onLog: (msg) => setLogLines((prev) => [...prev.slice(-60), msg]),
          onProgress: (pct) => setProgressPct(pct),
          onStatus: (st) => setStatusText(`[${i + 1}/${bulkFiles.length}] ${st}`),
        });

        const savingsPct = Math.max(0, Math.round((1 - blob.size / bulkFiles[i].size) * 100));
        results[i] = { status: 'done', blob, savingsPct };

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = bulkFiles[i].name.replace(/\.[a-zA-Z0-9]+$/, '') + '-comprimido.mp4';
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        results[i] = { status: 'error', error: err.message };
      }
      setBulkResults([...results]);
    }

    setBulkCurrentIndex(-1);
    setIsProcessing(false);
    setStatusText('¡Bulk completado!');
  };

  const renderNoFilePrompt = () => (
    <div className="tool-panel no-file-prompt">
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files).filter((f) => f.type.startsWith('video/'));
          if (files.length > 0) handleFilesSelect(files);
        }}
      />
      <div className="no-file-box" onClick={() => fileInputRef.current?.click()}>
        <UploadCloud className="w-10 h-10 text-violet-400" />
        <h3>Seleccioná un video para comenzar</h3>
        <p>Hacé clic acá o arrastrá un archivo para usar esta herramienta</p>
      </div>
    </div>
  );

  const renderToolPanel = () => {
    if (activeTool === 'bulk') {
      return (
        <BulkQueue
          files={bulkFiles}
          onAddFiles={(newFiles) => setBulkFiles((prev) => [...prev, ...newFiles])}
          onRemoveFile={(idx) => {
            setBulkFiles((prev) => prev.filter((_, i) => i !== idx));
            setBulkResults((prev) => prev.filter((_, i) => i !== idx));
          }}
          onClearAll={() => { setBulkFiles([]); setBulkResults([]); }}
          currentIndex={bulkCurrentIndex}
          results={bulkResults}
          isProcessing={isProcessing}
        />
      );
    }

    if (!currentFile) {
      return renderNoFilePrompt();
    }

    switch (activeTool) {
      case 'compress':
        return (
          <QualityPresets
            onStartCompress={handleStartCompress}
            isProcessing={isProcessing}
            disabledEngine={engineState.status === 'error'}
          />
        );
      case 'trim':
        return (
          <TrimTool
            file={currentFile}
            trimStart={trimStart}
            trimEnd={trimEnd}
            onTrimChange={(start, end) => { setTrimStart(start); setTrimEnd(end); }}
          />
        );
      case 'crop':
        return (
          <CropTool
            file={currentFile}
            cropRect={cropRect}
            onCropChange={setCropRect}
          />
        );
      case 'watermark':
        return (
          <WatermarkTool
            file={currentFile}
            watermark={watermark}
            onWatermarkChange={setWatermark}
          />
        );
      default:
        return null;
    }
  };

  const hasExtras = (trimStart > 0 || trimEnd > 0)
    || (cropRect.x !== 0 || cropRect.y !== 0 || cropRect.w !== 100 || cropRect.h !== 100)
    || watermark !== null;

  const getActiveTags = () => {
    const tags = [];
    if (trimStart > 0 || (trimEnd > 0 && trimEnd !== trimStart)) tags.push('Recortado');
    if (cropRect.x !== 0 || cropRect.y !== 0 || cropRect.w !== 100 || cropRect.h !== 100) tags.push('Reencuadrado');
    if (watermark) tags.push('Marca de Agua');
    return tags;
  };

  return (
    <>
      <div className="glow-bg glow-1" />
      <div className="glow-bg glow-2" />

      <div className="wrap">
        <Header engineState={engineState} onRetryEngine={initEngine} />

        <HeroDropzone
          currentFile={currentFile}
          onFilesSelect={handleFilesSelect}
          onChangeFile={handleChangeFile}
          onError={(msg) => setErrorMsg(msg)}
        />

        {errorMsg && (
          <div className="error-box">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Workspace Layout is ALWAYS visible */}
        <div ref={workflowRef} className="workspace-layout">
          <Sidebar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            hasBulk={true}
          />

          <div className="workspace-main">
            {hasExtras && activeTool === 'compress' && currentFile && (
              <div className="extras-tags">
                {getActiveTags().map((tag) => (
                  <span key={tag} className="extra-tag">{tag}</span>
                ))}
                <span className="extra-tag-hint">
                  Estas opciones se aplicarán al comprimir
                </span>
              </div>
            )}

            {renderToolPanel()}

            {currentFile && activeTool !== 'compress' && activeTool !== 'bulk' && (
              <div className="tool-actions">
                <button
                  className="run-btn"
                  onClick={() => setActiveTool('compress')}
                >
                  ← Ir a Comprimir con estos ajustes
                </button>
              </div>
            )}

            {activeTool === 'bulk' && bulkFiles.length > 0 && (
              <QualityPresets
                onStartCompress={handleBulkStart}
                isProcessing={isProcessing}
                disabledEngine={engineState.status === 'error'}
                buttonLabel={isProcessing ? `Procesando... (${bulkCurrentIndex + 1}/${bulkFiles.length})` : `Comprimir ${bulkFiles.length} videos`}
              />
            )}

            {(isProcessing || logLines.length > 0) && (
              <LedgerProgress
                statusText={statusText}
                progressPct={progressPct}
                logLines={logLines}
              />
            )}
          </div>
        </div>

        {compressedBlob && compressedUrl && (
          <div ref={resultsRef}>
            <ResultStats
              originalFile={currentFile}
              compressedBlob={compressedBlob}
              compressedUrl={compressedUrl}
              resolution={outputResolution}
              onReset={handleChangeFile}
              onUseCompressed={handleUseCompressed}
            />
          </div>
        )}

        <footer>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>FFmpeg WebAssembly (Core v0.12) · Sin servidor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Heart className="w-4 h-4 text-emerald-400" />
            <span>
              By{" "}
              <a
                href="https://github.com/MManuZa"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#d334b3ff",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                ManuZa
              </a>
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
