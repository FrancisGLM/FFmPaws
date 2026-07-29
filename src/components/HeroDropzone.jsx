import React, { useRef, useState } from 'react';
import { UploadCloud, Film, ShieldCheck, RefreshCw } from 'lucide-react';
import { formatBytes } from '../services/ffmpegService';

export default function HeroDropzone({ currentFile, onFileSelect, onChangeFile, onError }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file.type.startsWith('video/')) {
      onError('El archivo seleccionado no es un video válido (usá MP4, MOV, WEBM, AVI o MKV).');
      return;
    }
    onFileSelect(file);
  };

  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          100% Privado · 100% Local
        </div>
        <h1>
          Reducí el peso.<br />
          Conservá <span>la nitidez</span>.
        </h1>
        <p className="sub">
          Comprimí tus videos usando FFmpeg directamente en tu navegador. Nada se sube a ningún servidor externo.
        </p>
      </div>

      <div className="panel hero-panel">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept="video/*"
          style={{ display: 'none' }}
        />

        {!currentFile ? (
          <div
            className={`dropzone-box ${isDragging ? 'drag' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <button type="button" className="pill-btn">
              <UploadCloud className="w-5 h-5" />
              Seleccionar video
            </button>
            <div className="drop-hint">o arrastrá y soltá un archivo acá</div>
            <div className="drop-formats">
              <span className="format-tag">MP4</span>
              <span className="format-tag">MOV</span>
              <span className="format-tag">WEBM</span>
              <span className="format-tag">AVI</span>
              <span className="format-tag">MKV</span>
            </div>
          </div>
        ) : (
          <div className="file-row">
            <div className="file-info">
              <Film className="w-7 h-7 file-icon" />
              <div>
                <div className="file-name" title={currentFile.name}>
                  {currentFile.name}
                </div>
                <div className="file-meta">{formatBytes(currentFile.size)}</div>
              </div>
            </div>
            <button className="change-btn" onClick={onChangeFile}>
              Elegir otro
            </button>
          </div>
        )}

        <div className="privacy-note">
          <ShieldCheck className="w-4 h-4" />
          <span>
            Tus videos nunca salen de este dispositivo. Todo el código de compresión se ejecuta en la memoria de esta pestaña.
          </span>
        </div>
      </div>
    </section>
  );
}
