import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import BotDashboard from './components/BotDashboard';
import LandingPage from './components/LandingPage';
import api from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for OAuth callback with token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');

    if (token && userParam) {
      // OAuth callback - save token and user data
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('authToken', token);
        setUser(user);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error parsing OAuth callback:', error);
      }
      setLoading(false);
    } else {
      // Check if user is already logged in
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        // Verify token with backend
        api.verifyToken()
          .then(data => setUser(data.user))
          .catch(() => {
            localStorage.removeItem('authToken');
          })
          .finally(() => setLoading(false));
      } else {
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
