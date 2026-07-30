import React, { useState } from 'react';
import { Sliders, ChevronDown, ChevronRight, Zap, Play } from 'lucide-react';

const PRESETS = [
  {
    id: 'high',
    name: 'Alta Calidad',
    desc: 'Mínima pérdida visual. Excelente para videos importantes.',
    crf: 19,
    width: 0,
    audioBitrate: '160k',
    badge: 'Recomendado',
  },
  {
    id: 'balanced',
    name: 'Equilibrado',
    desc: 'Gran reducción de tamaño conservando buena nitidez.',
    crf: 24,
    width: 1920,
    audioBitrate: '128k',
  },
  {
    id: 'small',
    name: 'Archivo Chico',
    desc: 'Máxima compresión ideal para enviar por chat o email.',
    crf: 30,
    width: 1280,
    audioBitrate: '96k',
  },
];

export default function QualityPresets({ onStartCompress, isProcessing, disabledEngine, buttonLabel }) {
  const [activePreset, setActivePreset] = useState('high');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced settings state
  const [customCrf, setCustomCrf] = useState(21);
  const [customWidth, setCustomWidth] = useState(0);
  const [presetSpeed, setPresetSpeed] = useState('veryfast');
  const [targetFps, setTargetFps] = useState(0);
  const [audioBitrate, setAudioBitrate] = useState('128k');
  const [muteAudio, setMuteAudio] = useState(false);

  const handleRun = () => {
    let settings;
    if (showAdvanced) {
      settings = {
        crf: customCrf,
        width: customWidth,
        presetSpeed,
        fps: targetFps,
        audioBitrate,
        muteAudio,
      };
    } else {
      const selected = PRESETS.find((p) => p.id === activePreset) || PRESETS[0];
      settings = {
        crf: selected.crf,
        width: selected.width,
        presetSpeed: 'veryfast',
        fps: 0,
        audioBitrate: selected.audioBitrate,
        muteAudio: false,
      };
    }
    onStartCompress(settings);
  };

  return (
    <section className="panel workflow">
      <div className="section-label">
        <Zap className="w-4 h-4 text-violet-400" />
        Configuración de Compresión
      </div>

      <div className="quality-grid">
        {PRESETS.map((p) => (
          <div
            key={p.id}
            className={`quality-opt ${activePreset === p.id && !showAdvanced ? 'active' : ''}`}
            onClick={() => {
              setActivePreset(p.id);
            }}
          >
            {p.badge && <span className="badge">{p.badge}</span>}
            <div className="qname">{p.name}</div>
            <div className="qdesc">{p.desc}</div>
          </div>
        ))}
      </div>

      <div
        className="advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <Sliders className="w-3.5 h-3.5 text-violet-400" />
        {showAdvanced ? '▾ Ocultar ajustes avanzados' : '▸ Controles avanzados (CRF, resolución, audio)'}
      </div>

      {showAdvanced && (
        <div className="advanced-panel">
          <div className="adv-row">
            <label>Factor de Calidad (CRF: 18 = Casi sin pérdida, 35 = Muy liviano):</label>
            <span className="val">{customCrf}</span>
          </div>
          <input
            type="range"
            min="18"
            max="36"
            value={customCrf}
            onChange={(e) => setCustomCrf(parseInt(e.target.value, 10))}
          />

          <div className="adv-row" style={{ marginTop: '8px' }}>
            <label>Ancho Máximo (Escala):</label>
            <select
              value={customWidth}
              onChange={(e) => setCustomWidth(parseInt(e.target.value, 10))}
            >
              <option value="0">Original (Sin escalar)</option>
              <option value="1920">1920px (Full HD)</option>
              <option value="1280">1280px (HD 720p)</option>
              <option value="854">854px (FWVGA 480p)</option>
              <option value="640">640px (SD 360p)</option>
            </select>
          </div>

          <div className="adv-row">
            <label>Velocidad de Encoder (Preset H.264):</label>
            <select
              value={presetSpeed}
              onChange={(e) => setPresetSpeed(e.target.value)}
            >
              <option value="ultrafast">Ultrafast (Más rápido, archivo más grande)</option>
              <option value="superfast">Superfast</option>
              <option value="veryfast">Veryfast (Balance recomendado)</option>
              <option value="faster">Faster</option>
              <option value="fast">Fast</option>
              <option value="medium">Medium (Mayor compresión, procesa más lento)</option>
            </select>
          </div>

          <div className="adv-row">
            <label>Cuadros por segundo (FPS):</label>
            <select
              value={targetFps}
              onChange={(e) => setTargetFps(parseInt(e.target.value, 10))}
            >
              <option value="0">Conservar FPS original</option>
              <option value="60">60 FPS</option>
              <option value="30">30 FPS</option>
              <option value="24">24 FPS (Cine)</option>
            </select>
          </div>

          <div className="adv-row">
            <label>Calidad de Audio (AAC):</label>
            <select
              disabled={muteAudio}
              value={audioBitrate}
              onChange={(e) => setAudioBitrate(e.target.value)}
            >
              <option value="192k">192 kbps (Estudio)</option>
              <option value="160k">160 kbps (Alta)</option>
              <option value="128k">128 kbps (Estándar)</option>
              <option value="96k">96 kbps (Economía)</option>
            </select>
          </div>

          <div className="adv-row" style={{ justifyContent: 'flex-start', gap: '10px' }}>
            <input
              type="checkbox"
              id="muteAudio"
              checked={muteAudio}
              onChange={(e) => setMuteAudio(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--violet-primary)' }}
            />
            <label htmlFor="muteAudio" style={{ cursor: 'pointer' }}>
              Silenciar pista de audio (Eliminar audio para reducir peso extra)
            </label>
          </div>
        </div>
      )}

      <button
        className="run-btn"
        onClick={handleRun}
        disabled={isProcessing || disabledEngine}
      >
        <Play className="w-5 h-5 fill-current" />
        {isProcessing ? 'Comprimiendo video...' : (buttonLabel || 'Comprimir Video Ahora')}
      </button>
    </section>
  );
}
