import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import BotDashboard from './components/BotDashboard';
import LandingPage from './components/LandingPage';
import DebugPage from './components/DebugPage';
import TestPage from './components/TestPage';
import api from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
    console.log('🔍 App useEffect - starting...');
    
    // Simple check for debug mode first
    const urlParams = new URLSearchParams(window.location.search);
    const isDebugMode = urlParams.get('debug');
    
    if (isDebugMode) {
      console.log('🐛 Debug mode detected, skipping auth check');
      setLoading(false);
      return;
    }
    
    console.log('🌐 Current URL:', window.location.href);
    
    try {
      // Check for OAuth callback with token in URL
      const token = urlParams.get('token');
      const userParam = urlParams.get('user');
      
      console.log('🔑 Token from URL:', token ? '***found***' : 'not found');
      console.log('👤 User from URL:', userParam ? '***found***' : 'not found');

      if (token && userParam) {
        // OAuth callback - save token and user data
        console.log('✅ Processing OAuth callback...');
        console.log('📝 Raw user param:', userParam);
        
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          console.log('👤 Parsed user:', user);
          
          // Validate user object
          if (user && user.id && user.email) {
            localStorage.setItem('authToken', token);
            setUser(user);
            console.log('💾 User and token saved to localStorage');
            
            // Clean up URL after a short delay to ensure state is set
            setTimeout(() => {
              window.history.replaceState({}, document.title, window.location.pathname);
              console.log('🧹 URL cleaned up');
            }, 100);
          } else {
            throw new Error('Invalid user data structure');
          }
        } catch (parseError) {
          console.error('❌ Error parsing user data:', parseError);
          console.log('📝 Problematic user param:', userParam);
          setError(`Failed to parse user data: ${parseError.message}`);
        }
        setLoading(false);
      } else {
        // Check if user is already logged in
        const storedToken = localStorage.getItem('authToken');
        console.log('💾 Stored token:', storedToken ? '***found***' : 'not found');
        
        if (storedToken) {
          console.log('🔄 Verifying stored token...');
          // Verify token with backend
          api.verifyToken()
            .then(data => {
              console.log('✅ Token verified, user:', data.user);
              setUser(data.user);
            })
            .catch((error) => {
              console.log('❌ Token verification failed:', error);
              console.log('🧹 Removing invalid token from storage');
              localStorage.removeItem('authToken');
              setUser(null); // Ensure user is cleared
            })
            .finally(() => setLoading(false));
        } else {
          console.log('🆕 No stored token, showing landing page');
          setLoading(false);
        }
      }
    } catch (globalError) {
      console.error('❌ Critical error in useEffect:', globalError);
      setError(`Application error: ${globalError.message}`);
      setLoading(false);
    }
  }, []);

  const handleLogin = (data) => {
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const handleStartWithAI = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/zoom`;
  };

  // Debug mode - check if URL contains /debug or if there's a debug param
  if (window.location.pathname.includes('/debug') || new URLSearchParams(window.location.search).get('debug')) {
    return <TestPage />;
  }

  // Show error if any
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Authentication Error</h2>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              localStorage.clear();
              window.location.href = '/';
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If user is authenticated, show dashboard
  if (user) {
    return <BotDashboard user={user} onLogout={handleLogout} />;
  }

  // If not authenticated, show landing page
  return <LandingPage onStartWithAI={handleStartWithAI} />;
}
