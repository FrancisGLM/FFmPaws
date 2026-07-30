import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Image, Move, Upload, X } from 'lucide-react';

export default function WatermarkTool({ file, watermark, onWatermarkChange }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const imgInputRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [displayDims, setDisplayDims] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // watermark = { file, previewUrl, x, y, scale, opacity } or null

  useEffect(() => {
    if (file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [file]);

  const updateDisplayDims = useCallback(() => {
    if (!containerRef.current || !videoRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const vw = videoRef.current.videoWidth;
    const vh = videoRef.current.videoHeight;
    if (!vw || !vh) return;

    const containerAR = container.width / container.height;
    const videoAR = vw / vh;
    let dw, dh;
    if (videoAR > containerAR) {
      dw = container.width;
      dh = container.width / videoAR;
    } else {
      dh = container.height;
      dw = container.height * videoAR;
    }
    setDisplayDims({ w: dw, h: dh });
  }, []);

  const handleLoadedMetadata = () => {
    updateDisplayDims();
  };

  useEffect(() => {
    window.addEventListener('resize', updateDisplayDims);
    return () => window.removeEventListener('resize', updateDisplayDims);
  }, [updateDisplayDims]);

  const handleImageUpload = (e) => {
    const imgFile = e.target.files[0];
    if (!imgFile) return;
    const url = URL.createObjectURL(imgFile);
    onWatermarkChange({
      file: imgFile,
      previewUrl: url,
      x: 5,
      y: 5,
      scale: 20,
      opacity: 0.7,
    });
  };

  const removeWatermark = () => {
    if (watermark?.previewUrl) URL.revokeObjectURL(watermark.previewUrl);
    onWatermarkChange(null);
  };

  const handleWatermarkMouseDown = (e) => {
    e.preventDefault();
    if (!containerRef.current || !displayDims.w) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const offsetX = (containerRect.width - displayDims.w) / 2;
    const offsetY = (containerRect.height - displayDims.h) / 2;
    const px = ((e.clientX - containerRect.left - offsetX) / displayDims.w) * 100;
    const py = ((e.clientY - containerRect.top - offsetY) / displayDims.h) * 100;
    setDragOffset({ x: px - watermark.x, y: py - watermark.y });
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging || !watermark) return;
    const handleMove = (e) => {
      if (!containerRef.current || !displayDims.w) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const offsetX = (containerRect.width - displayDims.w) / 2;
      const offsetY = (containerRect.height - displayDims.h) / 2;
      let px = ((e.clientX - containerRect.left - offsetX) / displayDims.w) * 100;
      let py = ((e.clientY - containerRect.top - offsetY) / displayDims.h) * 100;
      let nx = px - dragOffset.x;
      let ny = py - dragOffset.y;
      nx = Math.max(0, Math.min(100 - watermark.scale, nx));
      ny = Math.max(0, Math.min(100 - watermark.scale, ny));
      onWatermarkChange({ ...watermark, x: nx, y: ny });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, dragOffset, watermark, displayDims, onWatermarkChange]);

  return (
    <div className="tool-panel">
      <div className="section-label">
        <Image className="w-4 h-4" style={{ color: '#ec4899' }} />
        Marca de Agua
      </div>

      <input
        type="file"
        ref={imgInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {!watermark ? (
        <button className="wm-upload-btn" onClick={() => imgInputRef.current?.click()}>
          <Upload className="w-5 h-5" />
          Subir imagen de marca de agua
        </button>
      ) : (
        <div className="wm-controls">
          <div className="wm-file-row">
            <img src={watermark.previewUrl} alt="Watermark" className="wm-thumb" />
            <span className="wm-filename">{watermark.file.name}</span>
            <button className="wm-remove-btn" onClick={removeWatermark}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="wm-slider-row">
            <label>Opacidad</label>
            <input
              type="range"
              min="5"
              max="100"
              value={Math.round(watermark.opacity * 100)}
              onChange={(e) => onWatermarkChange({
                ...watermark,
                opacity: parseInt(e.target.value, 10) / 100
              })}
            />
            <span className="wm-val">{Math.round(watermark.opacity * 100)}%</span>
          </div>

          <div className="wm-slider-row">
            <label>Tamaño</label>
            <input
              type="range"
              min="5"
              max="60"
              value={watermark.scale}
              onChange={(e) => onWatermarkChange({
                ...watermark,
                scale: parseInt(e.target.value, 10)
              })}
            />
            <span className="wm-val">{watermark.scale}%</span>
          </div>
        </div>
      )}

      {videoUrl && (
        <div className="wm-video-container" ref={containerRef}>
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            playsInline
            muted
          />
          {watermark && displayDims.w > 0 && (
            <div
              className="wm-overlay"
              style={{
                width: `${displayDims.w}px`,
                height: `${displayDims.h}px`,
              }}
            >
              <div
                className="wm-draggable"
                style={{
                  left: `${watermark.x}%`,
                  top: `${watermark.y}%`,
                  width: `${watermark.scale}%`,
                  opacity: watermark.opacity,
                }}
                onMouseDown={handleWatermarkMouseDown}
              >
                <img src={watermark.previewUrl} alt="Watermark" draggable={false} />
                <div className="wm-drag-hint">
                  <Move className="w-3 h-3" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
