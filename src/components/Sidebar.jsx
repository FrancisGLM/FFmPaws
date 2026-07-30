import React from 'react';
import {
  Zap, Scissors, Crop, Image, Layers,
} from 'lucide-react';

const TOOLS = [
  { id: 'compress', label: 'Comprimir', icon: Zap, color: '#8b5cf6' },
  { id: 'trim', label: 'Recortar', icon: Scissors, color: '#f59e0b' },
  { id: 'crop', label: 'Reencuadrar', icon: Crop, color: '#10b981' },
  { id: 'watermark', label: 'Marca de Agua', icon: Image, color: '#ec4899' },
  { id: 'bulk', label: 'Bulk', icon: Layers, color: '#06b6d4' },
];

export default function Sidebar({ activeTool, onToolChange, hasBulk }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-title">Herramientas</div>
      {TOOLS.map((t) => {
        // Hide bulk if not in bulk mode context
        if (t.id === 'bulk' && !hasBulk) return null;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            className={`sidebar-btn ${activeTool === t.id ? 'active' : ''}`}
            onClick={() => onToolChange(t.id)}
            style={{ '--tool-accent': t.color }}
          >
            <Icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
