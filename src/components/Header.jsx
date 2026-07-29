import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import logoUrl from '../FFmpawslogo.svg';

export default function Header({ engineState, onRetryEngine }) {
  const getStatusIcon = () => {
    switch (engineState.status) {
      case 'ready':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />;
    }
  };

  return (
    <header>
      <div className="brand">
        <div className="brand-mark" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <img src={logoUrl} alt="FFmPaws Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="brand-title">FFmPaws</span>
          <span className="brand-badge">VideoCompressor</span>
        </div>
      </div>

      <div
        className={`engine-pill ${engineState.status} ${engineState.status === 'error' ? 'clickable' : ''}`}
        onClick={() => {
          if (engineState.status === 'error' && onRetryEngine) {
            onRetryEngine();
          }
        }}
        title={engineState.status === 'error' ? 'Clic para reintentar carga' : ''}
      >
        <span className="engine-dot" />
        <span>{engineState.text}</span>
      </div>
    </header>
  );
}
