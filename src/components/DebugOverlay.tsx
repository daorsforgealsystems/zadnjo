import { useState, useEffect } from 'react';
import { getLogs } from '@/lib/debug';

interface DebugOverlayProps {
  enabled?: boolean;
}

const DebugOverlay = ({ enabled = true }: DebugOverlayProps) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Update logs every second
    const interval = setInterval(() => {
      setLogs(getLogs());
    }, 1000);

    // Add keyboard shortcut to toggle visibility (Ctrl+Shift+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  if (!enabled || !isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '10px',
        maxHeight: '300px',
        overflowY: 'auto',
        zIndex: 9999,
        borderTop: '1px solid #333'
      }}
    >
      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Debug Logs (Press Ctrl+Shift+D to hide)</span>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: '1px solid #666',
            color: '#fff',
            padding: '2px 6px',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Close
        </button>
      </div>
      <div>
        {logs.length === 0 ? (
          <div>No logs recorded yet</div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: '4px',
                color: log.includes('[ERROR]') || log.includes('[CRITICAL]') 
                  ? '#ff5555' 
                  : log.includes('[WARN]') 
                    ? '#ffff55' 
                    : '#00ff00'
              }}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugOverlay;