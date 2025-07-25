import { useState, useEffect } from 'react';
import api from '../services/api.js';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState({});
  const [apiTest, setApiTest] = useState('');

  useEffect(() => {
    // Collect debug information
    const urlParams = new URLSearchParams(window.location.search);
    const info = {
      currentURL: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      tokenInURL: urlParams.get('token'),
      userInURL: urlParams.get('user'),
      storedToken: localStorage.getItem('authToken'),
      apiBaseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      allParams: Object.fromEntries(urlParams.entries())
    };
    setDebugInfo(info);
  }, []);

  const testAPI = async () => {
    try {
      setApiTest('Testing...');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/health`);
      const data = await response.json();
      setApiTest(`✅ API Connected: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setApiTest(`❌ API Error: ${error.message}`);
    }
  };

  const testOAuth = () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('🚀 Starting OAuth flow to:', `${backendUrl}/api/auth/zoom`);
    window.location.href = `${backendUrl}/api/auth/zoom`;
  };

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    setDebugInfo(prev => ({ ...prev, storedToken: null }));
    alert('Storage cleared!');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Debug Page</h1>
        
        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* API Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Test</h2>
          <button 
            onClick={testAPI}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
          >
            Test Backend Connection
          </button>
          <pre className="bg-gray-100 p-4 rounded text-sm mt-4">
            {apiTest || 'Click "Test Backend Connection" to check API'}
          </pre>
        </div>

        {/* OAuth Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">OAuth Test</h2>
          <button 
            onClick={testOAuth}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-4"
          >
            Start OAuth Flow
          </button>
          <button 
            onClick={clearStorage}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Clear Storage
          </button>
        </div>

        {/* Console Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Open browser DevTools (F12)</li>
            <li>Go to Console tab</li>
            <li>Test backend connection</li>
            <li>Try OAuth flow</li>
            <li>Check console logs for detailed debug info</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 