import React, { useState, useEffect } from 'react';
import { loadLeafletComponents } from './mapUtils';

const MapTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testMapComponents = async () => {
      try {
        console.log('Testing map components...');
        console.log('React available:', typeof React !== 'undefined');
        console.log('React.createContext available:', typeof React.createContext !== 'undefined');
        console.log('Global React available:', typeof (globalThis as any).React !== 'undefined');
        
        const components = await loadLeafletComponents();
        console.log('Map components loaded successfully:', components);
        setStatus('success');
      } catch (err) {
        console.error('Map components failed to load:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    };

    testMapComponents();
  }, []);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Map Components Test</h3>
      <div className="text-sm">
        <p>Status: <span className={`font-medium ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 'text-yellow-600'
        }`}>{status}</span></p>
        {error && (
          <p className="text-red-600 mt-1">Error: {error}</p>
        )}
        <div className="mt-2 text-xs text-gray-600">
          <p>React: {typeof React !== 'undefined' ? '✓' : '✗'}</p>
          <p>React.createContext: {typeof React.createContext !== 'undefined' ? '✓' : '✗'}</p>
          <p>Global React: {typeof (globalThis as any).React !== 'undefined' ? '✓' : '✗'}</p>
        </div>
      </div>
    </div>
  );
};

export default MapTest;