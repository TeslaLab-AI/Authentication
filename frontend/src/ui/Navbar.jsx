import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge, Dot } from './primitives.jsx';
import { TOKENS as T } from '../theme/tokens.js';
import { getToken } from '../services/authService.js';

const NAV_ITEMS = [
  { key: 'login', label: 'Login', path: '/login', guestOnly: true },
  { key: 'connect', label: 'Connect repo', path: '/connect', authOnly: true },
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', authOnly: true },
];

export default function Navbar({ user, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(getToken());

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.guestOnly) return !isAuthenticated;
    if (item.authOnly) return isAuthenticated;
    return true;
  });

  const displayName = typeof user === 'string' ? user : user?.name;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${T.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect width="22" height="22" rx="6" fill={T.p} />
          <path d="M6 11L9.5 14.5L16 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: T.tx1, letterSpacing: '-0.01em' }}>TeslaLab</span>
        <Badge variant="purple" size="xs">AI</Badge>
      </div>

      {/* Desktop navigation */}
      <nav className="hidden md:flex gap-[3px] p-[3px] rounded-[12px]" style={{ background: T.bg2, border: `1px solid ${T.brd}` }}>
        {visibleItems.map((n) => {
          const active = location.pathname === n.path;
          return (
            <button
              key={n.key}
              type="button"
              onClick={() => navigate(n.path)}
              style={{ padding: '5px 14px', borderRadius: 9, border: 'none', background: active ? T.p : 'transparent', color: active ? '#fff' : T.tx3, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .15s', fontFamily: "'DM Sans', sans-serif" }}
            >
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* Desktop profile */}
      <div className="hidden md:flex items-center gap-[10px]">
        {isAuthenticated && displayName ? (
          <>
            <Dot color={T.g} pulse />
            <span style={{ fontSize: 12, color: T.tx3 }}>4 repos active</span>
            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${T.p}, ${T.pm})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', border: `2px solid ${T.brd2}` }}
            >
              {displayName[0]?.toUpperCase()}
            </button>
          </>
        ) : (
          <span style={{ fontSize: 13, color: T.tx3 }}>← Navigate above</span>
        )}
      </div>

      {/* Mobile hamburger menu button */}
      <div className="flex md:hidden items-center gap-2">
        {isAuthenticated && displayName && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${T.p}, ${T.pm})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', border: `2px solid ${T.brd2}` }}
          >
            {displayName[0]?.toUpperCase()}
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ background: 'none', border: 'none', color: T.tx1, cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isMobileMenuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="block md:hidden"
            style={{
              position: 'absolute',
              top: 56,
              left: 0,
              right: 0,
              background: 'rgba(9,9,11,0.96)',
              backdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${T.brd}`,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              zIndex: 99,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibleItems.map((n) => {
                const active = location.pathname === n.path;
                return (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() => {
                      navigate(n.path);
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: active ? T.p : T.bg2,
                      color: active ? '#fff' : T.tx2,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>

            {isAuthenticated && displayName && (
              <div style={{ borderTop: `1px solid ${T.brd}`, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: T.tx1 }}>{displayName}</span>
                    <span style={{ fontSize: 11, color: T.tx3 }}>4 repos active</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: `1px solid ${T.r}`,
                    background: T.rl,
                    color: '#FCA5A5',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
