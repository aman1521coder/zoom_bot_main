import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import BotDashboard from './components/BotDashboard';
import LandingPage from './components/LandingPage';
import DebugPage from './components/DebugPage';
import api from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 App useEffect - checking authentication...');
    console.log('🌐 Current URL:', window.location.href);
    
    // Check for OAuth callback with token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    console.log('🔑 Token from URL:', token ? '***found***' : 'not found');
    console.log('👤 User from URL:', userParam ? '***found***' : 'not found');

    if (token && userParam) {
      // OAuth callback - save token and user data
      console.log('✅ Processing OAuth callback...');
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('👤 Parsed user:', user);
        localStorage.setItem('authToken', token);
        setUser(user);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('🧹 URL cleaned up');
      } catch (error) {
        console.error('❌ Error parsing OAuth callback:', error);
      }
      setLoading(false);
    } else {
      // Check if user is already logged in
      const storedToken = localStorage.getItem('authToken');
      console.log('💾 Stored token:', storedToken ? '***found***' : 'not found');
      
              if (storedToken) {
          console.log('🔄 Stored token found, but skipping verification for now...');
          console.log('💡 Note: Token verification will be enabled once backend /verify endpoint is working');
          // For now, just show landing page if token exists but we can't verify it
          // This prevents the app from getting stuck in loading state
          console.log('🧹 Removing token until verification endpoint works');
          localStorage.removeItem('authToken');
          setUser(null);
          setLoading(false);
        } else {
          console.log('🆕 No stored token, showing landing page');
          setLoading(false);
        }
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

  // Debug mode - check if URL contains /debug
  if (window.location.pathname.includes('/debug')) {
    return <DebugPage />;
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
