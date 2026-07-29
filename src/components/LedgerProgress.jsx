import React, { useEffect, useRef } from 'react';
import { Terminal, Activity } from 'lucide-react';

export default function LedgerProgress({ statusText, progressPct, logLines }) {
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logLines]);

  return (
    <div className="ledger">
      <div className="ledger-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity className="w-4 h-4 text-violet-400 animate-pulse" />
          <span>{statusText || 'Procesando...'}</span>
        </div>
        <span>{progressPct}%</span>
      </div>

      <div className="vu-bar">
        <div className="vu-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="ledger-log" ref={logContainerRef}>
        {logLines && logLines.length > 0 ? (
          logLines.map((line, idx) => <div key={idx}>{line}</div>)
        ) : (
          <div style={{ color: 'var(--ink-muted)' }}>Esperando salida de FFmpeg...</div>
        )}
      </div>
    </div>
  );
}
