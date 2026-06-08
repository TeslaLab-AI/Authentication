import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LoginPage from './features/auth/LoginPage.jsx';
import ConnectRepoPage from './features/connect/ConnectRepoPage.jsx';
import TeslaDashboard from './features/dashboard/TeslaDashboard.jsx';
import Navbar from './ui/Navbar.jsx';
import { clearToken, getToken,saveToken } from './services/authService.js';
import { getProfile } from './services/userService.js';
import { GLOBAL_CSS, TOKENS as T } from './theme/tokens.js';

function RequireAuth({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  const token = getToken();
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  // Synchronously capture token from URL query parameter (e.g. from GitHub OAuth)
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  if (urlToken) {
    saveToken(urlToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const [user, setUser] = useState(null);
  const [globalError, setGlobalError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    document.body.style.background = T.bg0;
    document.body.style.color = T.tx1;
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    async function loadUser() {
      if (!getToken()) return;
      try {
        const response = await getProfile();
        setUser(response.user || response);
      } catch {
        clearToken();
        setUser(null);
      }
    }
    loadUser();
  }, []);

  function handleLogout() {
    clearToken();
    setUser(null);
    navigate('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg0 }}>
      <Navbar user={user} onLogout={handleLogout} />

      {globalError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{ position: 'fixed', top: 70, right: 20, zIndex: 1000, background: T.rl, border: `1px solid ${T.r}`, borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#FCA5A5', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,.4)', backdropFilter: 'blur(8px)', cursor: 'pointer' }}
          onClick={() => setGlobalError('')}
        >
          ⚠️ {globalError}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Navigate to={getToken() ? '/dashboard' : '/login'} replace />} />
          <Route
            path="/login"
            element={
              <GuestOnly>
                <LoginPage setUser={setUser} setGlobalError={setGlobalError} />
              </GuestOnly>
            }
          />
          <Route
            path="/connect"
            element={
              <RequireAuth>
                <ConnectRepoPage />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <TeslaDashboard user={user} setUser={setUser} setGlobalError={setGlobalError} onLogout={handleLogout} />
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
                <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 16, background: T.bg2, border: `1px solid ${T.brd}`, maxWidth: 400 }}>
                  <h1 style={{ color: T.tx1, margin: '0 0 8px' }}>404 — Page Not Found</h1>
                  <p style={{ color: T.tx3, margin: 0 }}>The page you&apos;re looking for doesn&apos;t exist.</p>
                </div>
              </div>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
