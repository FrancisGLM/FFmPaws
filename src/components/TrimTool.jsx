import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Play, Pause } from 'lucide-react';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
}

function parseTime(str) {
  const parts = str.split(':');
  if (parts.length !== 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
}

export default function TrimTool({ file, trimStart, trimEnd, onTrimChange }) {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragging, setDragging] = useState(null); // 'start' | 'end' | null
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    if (file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [file]);

  const handleLoadedMetadata = () => {
    const dur = videoRef.current?.duration || 0;
    setDuration(dur);
    if (trimEnd === 0) {
      onTrimChange(trimStart, dur);
    }
  };

  const handleTimeUpdate = () => {
    const ct = videoRef.current?.currentTime || 0;
    setCurrentTime(ct);
    if (ct >= trimEnd && trimEnd > 0) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
      if (videoRef.current.currentTime < trimStart) {
        videoRef.current.currentTime = trimStart;
      }
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimelineMouseDown = (e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(handle);
  };

  const handleTimelineClick = (e) => {
    if (dragging || !timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.min(1, Math.max(0, pct));
    const targetTime = pct * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      if (!timelineRef.current || !duration) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let pct = (clientX - rect.left) / rect.width;
      pct = Math.min(1, Math.max(0, pct));
      const timeVal = pct * duration;

      if (dragging === 'start') {
        const newStart = Math.min(timeVal, trimEnd - 0.1);
        onTrimChange(Math.max(0, newStart), trimEnd);
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, newStart);
      } else if (dragging === 'end') {
        const newEnd = Math.max(timeVal, trimStart + 0.1);
        onTrimChange(trimStart, Math.min(duration, newEnd));
        if (videoRef.current) videoRef.current.currentTime = Math.min(duration, newEnd);
      }
    };

    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging, duration, trimStart, trimEnd, onTrimChange]);

  const startPct = duration > 0 ? (trimStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (trimEnd / duration) * 100 : 100;
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="tool-panel">
      <div className="section-label">
        <Scissors className="w-4 h-4" style={{ color: '#f59e0b' }} />
        Recortar Video
      </div>

      {videoUrl && (
        <div className="trim-preview">
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            playsInline
            muted
          />
          <button className="trim-play-btn" onClick={togglePlay}>
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
        </div>
      )}

      <div className="trim-timeline-wrapper">
        <div className="trim-timeline" ref={timelineRef} onClick={handleTimelineClick}>
          {/* Dimmed zones */}
          <div className="trim-dim" style={{ left: 0, width: `${startPct}%` }} />
          <div className="trim-dim" style={{ left: `${endPct}%`, width: `${100 - endPct}%` }} />

          {/* Selected range */}
          <div
            className="trim-range"
            style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
          />

          {/* Playhead */}
          <div className="trim-playhead" style={{ left: `${playheadPct}%` }} />

          {/* Large Hitbox Drag Handles */}
          <div
            className="trim-handle trim-handle-start"
            style={{ left: `${startPct}%` }}
            onMouseDown={(e) => handleTimelineMouseDown(e, 'start')}
            onTouchStart={(e) => handleTimelineMouseDown(e, 'start')}
          >
            <div className="trim-handle-grip" />
          </div>
          <div
            className="trim-handle trim-handle-end"
            style={{ left: `${endPct}%` }}
            onMouseDown={(e) => handleTimelineMouseDown(e, 'end')}
            onTouchStart={(e) => handleTimelineMouseDown(e, 'end')}
          >
            <div className="trim-handle-grip" />
          </div>
        </div>
      </div>

      <div className="trim-inputs">
        <div className="trim-input-group">
          <label>Inicio</label>
          <input
            type="text"
            value={formatTime(trimStart)}
            onChange={(e) => {
              const t = parseTime(e.target.value);
              if (!isNaN(t)) onTrimChange(t, trimEnd);
            }}
          />
        </div>
        <div className="trim-duration-badge">
          {formatTime(Math.max(0, trimEnd - trimStart))}
        </div>
        <div className="trim-input-group">
          <label>Final</label>
          <input
            type="text"
            value={formatTime(trimEnd)}
            onChange={(e) => {
              const t = parseTime(e.target.value);
              if (!isNaN(t)) onTrimChange(trimStart, t);
            }}
          />
        </div>
      </div>
    </div>
  );
}
