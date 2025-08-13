import { useState, useEffect } from 'react';
import './DebugPanel.css';

const DebugPanel = () => {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      const logMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev.slice(-49), { // Keep last 50 logs
        type: 'log',
        message: logMessage,
        time: new Date().toLocaleTimeString()
      }]);
    };

    console.error = (...args) => {
      originalError(...args);
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev.slice(-49), {
        type: 'error',
        message: errorMessage,
        time: new Date().toLocaleTimeString()
      }]);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const warnMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev.slice(-49), {
        type: 'warn',
        message: warnMessage,
        time: new Date().toLocaleTimeString()
      }]);
    };

    // Cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <>
      {/* Debug Toggle Button */}
      <button 
        className="debug-toggle"
        onClick={() => setIsVisible(!isVisible)}
        title="Toggle Debug Panel"
      >
        🐛 Debug {logs.length > 0 && `(${logs.length})`}
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="debug-panel">
          <div className="debug-header">
            <h3>🔍 Debug Logs</h3>
            <div className="debug-controls">
              <button onClick={clearLogs} className="debug-clear">Clear</button>
              <button onClick={() => setIsVisible(false)} className="debug-close">✕</button>
            </div>
          </div>
          
          <div className="debug-content">
            {logs.length === 0 ? (
              <div className="debug-empty">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`debug-log debug-${log.type}`}>
                  <span className="debug-time">[{log.time}]</span>
                  <span className="debug-type">{log.type.toUpperCase()}</span>
                  <pre className="debug-message">{log.message}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;
