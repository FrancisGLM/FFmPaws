import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import HeroDropzone from './components/HeroDropzone';
import QualityPresets from './components/QualityPresets';
import LedgerProgress from './components/LedgerProgress';
import ResultStats from './components/ResultStats';
import { getFFmpeg, compressVideo } from './services/ffmpegService';
import { AlertTriangle, Heart, Cpu } from 'lucide-react';

export default function App() {
  const [engineState, setEngineState] = useState({
    status: 'loading',
    text: 'Cargando motor...',
    pct: 0,
  });

  const [currentFile, setCurrentFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const [compressedBlob, setCompressedBlob] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [outputResolution, setOutputResolution] = useState(null);

  const workflowRef = useRef(null);
  const resultsRef = useRef(null);

  // Pre-load FFmpeg in background when app opens
  const initEngine = () => {
    setErrorMsg(null);
    getFFmpeg(
      (statusObj) => setEngineState(statusObj),
      (log) => {
        // Only keep last 60 lines for performance
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

  const handleFileSelect = (file) => {
    setErrorMsg(null);
    setCurrentFile(file);
    setCompressedBlob(null);
    setCompressedUrl(null);
    setTimeout(() => {
      workflowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleChangeFile = () => {
    setCurrentFile(null);
    setCompressedBlob(null);
    setCompressedUrl(null);
    setErrorMsg(null);
  };

  const handleStartCompress = async (settings) => {
    if (!currentFile) return;

    setErrorMsg(null);
    setIsProcessing(true);
    setLogLines([]);
    setProgressPct(0);
    setStatusText('Iniciando...');

    try {
      const blob = await compressVideo({
        file: currentFile,
        settings,
        onLog: (msg) => {
          setLogLines((prev) => [...prev.slice(-60), msg]);
        },
        onProgress: (pct) => setProgressPct(pct),
        onStatus: (st) => setStatusText(st),
      });

      if (compressedUrl) {
        URL.revokeObjectURL(compressedUrl);
      }

      const newUrl = URL.createObjectURL(blob);
      setCompressedBlob(blob);
      setCompressedUrl(newUrl);

      // Probe resolution from video object
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

  return (
    <>
      <div className="glow-bg glow-1" />
      <div className="glow-bg glow-2" />

      <div className="wrap">
        <Header engineState={engineState} onRetryEngine={initEngine} />

        <HeroDropzone
          currentFile={currentFile}
          onFileSelect={handleFileSelect}
          onChangeFile={handleChangeFile}
          onError={(msg) => setErrorMsg(msg)}
        />

        {errorMsg && (
          <div className="error-box">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {currentFile && (
          <div ref={workflowRef}>
            <QualityPresets
              onStartCompress={handleStartCompress}
              isProcessing={isProcessing}
              disabledEngine={engineState.status === 'error'}
            />

            {(isProcessing || logLines.length > 0) && (
              <LedgerProgress
                statusText={statusText}
                progressPct={progressPct}
                logLines={logLines}
              />
            )}
          </div>
        )}

        {compressedBlob && compressedUrl && (
          <div ref={resultsRef}>
            <ResultStats
              originalFile={currentFile}
              compressedBlob={compressedBlob}
              compressedUrl={compressedUrl}
              resolution={outputResolution}
              onReset={handleChangeFile}
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
