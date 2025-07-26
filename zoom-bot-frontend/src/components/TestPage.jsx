import { useState, useEffect } from 'react';

export default function TestPage() {
  const [urlInfo, setUrlInfo] = useState({});
  const [parsedData, setParsedData] = useState({});

  useEffect(() => {
    // Get all URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }

    setUrlInfo({
      href: window.location.href,
      search: window.location.search,
      pathname: window.location.pathname,
      params: params
    });

    // Try to parse user data if it exists
    const userParam = urlParams.get('user');
    if (userParam) {
      try {
        const decoded = decodeURIComponent(userParam);
        const parsed = JSON.parse(decoded);
        setParsedData({
          raw: userParam,
          decoded: decoded,
          parsed: parsed,
          isValid: parsed && parsed.id && parsed.email
        });
      } catch (error) {
        setParsedData({
          raw: userParam,
          error: error.message
        });
      }
    }
  }, []);

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    alert('Storage cleared!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 OAuth Debug Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📋 URL Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(urlInfo, null, 2)}
          </pre>
        </div>

        {Object.keys(parsedData).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">👤 User Data Parsing</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Actions</h2>
          <div className="space-y-4">
            <button 
              onClick={clearStorage}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Local Storage
            </button>
            
            <div className="text-sm text-gray-600">
              <p><strong>Current localStorage:</strong></p>
              <pre className="bg-gray-100 p-2 rounded mt-2">
                {JSON.stringify({
                  authToken: localStorage.getItem('authToken'),
                  user: localStorage.getItem('user')
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">🔗 Test URLs:</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><code>http://localhost:5173?debug=1</code> - This debug page</p>
            <p><code>http://localhost:5173/?token=test&user=%7B%22id%22%3A%22test123%22%2C%22email%22%3A%22test%40test.com%22%2C%22firstName%22%3A%22Test%22%7D&debug=1</code> - Test OAuth callback</p>
            <p><code>http://localhost:5173</code> - Normal landing page</p>
          </div>
        </div>
      </div>
    </div>
  );
} 