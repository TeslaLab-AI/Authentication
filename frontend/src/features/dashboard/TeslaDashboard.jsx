import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clearToken, getToken } from '../../services/authService.js';
import { getProfile } from '../../services/userService.js';
import { getDashboard } from '../../services/dashboardService.js';
import { approvePR as approvePRApi } from '../../services/prService.js';
import { Btn, Dot } from '../../ui/primitives.jsx';
import { TOKENS as T } from '../../theme/tokens.js';
import OverviewSection from './sections/OverviewSection.jsx';
import PRsSection from './sections/PRsSection.jsx';
import HealthSection from './sections/HealthSection.jsx';
import ActivitySection from './sections/ActivitySection.jsx';
import SettingsSection from './sections/SettingsSection.jsx';

// Turn a backend repository (with its latest scan + agentResult) into the
// shape the dashboard UI consumes. All values are derived from real scan
// data; when the agent hasn't produced detailed findings yet, we fall back
// to safe "no data" values instead of fabricated numbers.
function normalizeRepo(repo, dashboardResponse) {
  const repoName = repo.repoUrl?.split('/').slice(-1)[0] || repo.name || `repo-${repo.id}`;

  const latestScan = (repo.scans && repo.scans[0]) || null;
  const result = latestScan?.result || {};
  const agent = result.agentResult || null;

  const scanAt =
    latestScan?.createdAt ||
    dashboardResponse.latestScan?.createdAt ||
    repo.createdAt ||
    new Date().toISOString();

  // Dependencies: worker stores them under result.dependencies; the simple
  // connect scan stores them under result.packages.
  const depObj = result.dependencies || result.packages || {};
  const totalPackages =
    result.metadata?.totalPackages ??
    result.totalPackages ??
    Object.keys(depObj).length;

  const security = agent?.security || {};
  const testResults = agent?.test_results || {};
  const packagesUpgraded = agent?.packages_upgraded || [];

  const securityIssues =
    (security.cve_count || 0) +
    (security.secret_count || 0) +
    (security.pattern_count || 0);
  const outdatedDependencies = packagesUpgraded.length;
  const testsFailed = testResults.failed || 0;

  // Build passing: derive from agent test results / status when available.
  let buildPassing;
  if (agent && Object.keys(testResults).length) {
    buildPassing = testResults.status === 'pass' && testsFailed === 0;
  } else if (agent) {
    buildPassing = agent.status === 'success';
  } else {
    buildPassing = (latestScan?.status || repo.status) === 'COMPLETED';
  }

  // Health score derived from real signals.
  let healthScore = 100;
  healthScore -= securityIssues * 15;
  healthScore -= outdatedDependencies * 5;
  healthScore -= testsFailed * 10;
  if (!buildPassing) healthScore -= 25;
  if ((latestScan?.status || repo.status) === 'SCANNING') healthScore = 60;
  if (!latestScan) healthScore = repo.status === 'COMPLETED' ? 90 : 65;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const language = repo.language || repo.framework || result.repository?.language || 'Unknown';

  return {
    id: repo.id,
    name: repoName,
    repoUrl: repo.repoUrl,
    framework: repo.framework || 'Unknown',
    language,
    defaultBranch: 'main',
    branch: 'main',
    health: healthScore,
    healthScore,
    scan: latestScan?.status || repo.status || 'Pending',
    lastScannedAt: scanAt,

    // real derived metrics (used by Overview badges + Health rings)
    securityIssues,
    outdatedDependencies,
    lintIssues: 0, // no lint data source in the current pipeline
    buildPassing,
    build: buildPassing,
    sec: securityIssues,
    deps: outdatedDependencies,
    lint: 0,

    // raw real data for the Health detail view
    totalPackages,
    dependencies: depObj,
    hasAgentData: !!agent,
    agentStatus: agent?.status || null,
    agentMessage: agent?.message || null,
    security: {
      cveCount: security.cve_count || 0,
      secretCount: security.secret_count || 0,
      patternCount: security.pattern_count || 0,
      risk: security.risk || null,
      summary: security.summary || null,
      approved: security.approved,
    },
    testResults: {
      status: testResults.status || null,
      total: testResults.total || 0,
      passed: testResults.passed || 0,
      failed: testResults.failed || 0,
    },
    packagesUpgraded,
    prUrl: agent?.pr_url || null,
    reviewReasoning: agent?.review?.reasoning || null,
  };
}

export default function TeslaDashboard({ user, setUser, setGlobalError, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('overview');
  const [repos, setRepos] = useState([]);
  const [prs, setPrs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [metrics, setMetrics] = useState({ reposCount: 0, openPRs: 0, mergedPRs: 0, avgHealth: 0, issuesResolved: 0, recentActivity: [], activityFeed: [] });
  const [activeRepo, setActiveRepo] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const showToast = useCallback((msg) => {
    setToast({ msg });
    setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      setGlobalError('');
      setLoading(true);

      try {
        const profileResponse = await getProfile();
        const profileData = profileResponse.user || profileResponse;
        setProfile(profileData);
        if (!user) setUser(profileData);

        const dashboardResponse = await getDashboard();
        const backendRepos = dashboardResponse.recentRepos || [];
        if (backendRepos.length === 0) {
          navigate('/connect');
          return;
        }
        const normalizedRepos = backendRepos.map((repo) => normalizeRepo(repo, dashboardResponse));

        const iconFor = (t) => (t === 'pr' ? '🔀' : t === 'error' ? '⚠️' : '🔍');
        const activities = (dashboardResponse.recentActivity || []).map((a) => ({
          ...a,
          icon: iconFor(a.type),
        }));
        const pullRequests = dashboardResponse.pullRequests || [];

        setRepos(normalizedRepos);
        setPrs(pullRequests);
        setActivities(activities);
        setMetrics({
          reposCount: dashboardResponse.totalRepos || normalizedRepos.length,
          openPRs: pullRequests.filter((p) => p.status === 'open').length,
          mergedPRs: pullRequests.filter((p) => p.status === 'merged').length,
          avgHealth: normalizedRepos.length ? Math.round(normalizedRepos.reduce((sum, r) => sum + r.healthScore, 0) / normalizedRepos.length) : 0,
          issuesResolved: normalizedRepos.reduce((sum, r) => sum + r.outdatedDependencies + r.securityIssues, 0),
          recentActivity: activities,
          activityFeed: activities,
        });
        setActiveRepo(normalizedRepos[0] || null);
      } catch (error) {
        setGlobalError(error.message);
        if (error.message.toLowerCase().includes('token')) {
          clearToken();
          setUser(null);
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [navigate, setGlobalError, setUser, user]);

  const approvePR = async (id) => {
    try {
      const response = await approvePRApi(id);
      const mergedId = response.pr?._id || response.pr?.id || id;
      setPrs((prev) => prev.map((p) => (String(p._id || p.id) === String(mergedId) ? { ...p, status: 'merged' } : p)));
      showToast('PR approved and merged to main branch');
    } catch (error) {
      setGlobalError(error.message);
    }
  };

  const displayName = profile?.name || user?.name || user || 'User';
  const openPRCount = prs.filter((p) => p.status === 'open').length;

  const navItems = [
    { key: 'overview', label: 'Overview', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    { key: 'prs', label: 'Pull requests', icon: 'M18 15V9a6 6 0 00-6-6H9M3 9l3-3 3 3M18 18a3 3 0 100-6 3 3 0 000 6zM6 6a3 3 0 100 6 3 3 0 000-6z' },
    { key: 'health', label: 'Health details', icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z' },
    { key: 'activity', label: 'Activity log', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { key: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, margin: '0 auto 16px', border: `3px solid ${T.bg3}`, borderTop: `3px solid ${T.p}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: T.tx3 }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)' }} className="flex flex-col lg:flex-row relative">
      {/* Sidebar drawer */}
      <aside
        className={`fixed lg:sticky top-[56px] left-0 z-40 w-[220px] bg-[#0F0F12] border-r border-[#27272A] flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ height: 'calc(100vh - 56px)', padding: '16px 8px', overflowY: 'auto' }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((n) => {
            const isActive = section === n.key;
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => { setSection(n.key); setIsSidebarOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 9, background: isActive ? T.pl : 'transparent', border: 'none', cursor: 'pointer', color: isActive ? T.pm : T.tx3, fontSize: 13, fontWeight: 500, transition: 'all .12s', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = T.bg2; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon} /></svg>
                <span>{n.label}</span>
                {n.key === 'prs' && openPRCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: T.r, color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>{openPRCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${T.brd}` }}>
          <div style={{ padding: '4px 12px 6px', fontSize: 10, fontWeight: 600, color: T.tx4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Repositories</div>
          {repos.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => { setActiveRepo(r); setSection('health'); setIsSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: 'none', background: activeRepo?.id === r.id && section === 'health' ? T.bg2 : 'transparent', cursor: 'pointer', width: '100%', fontFamily: "'DM Sans', sans-serif", transition: 'background .12s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.bg2; }}
              onMouseLeave={(e) => { if (!(activeRepo?.id === r.id && section === 'health')) e.currentTarget.style.background = 'transparent'; }}
            >
              <Dot color={r.health >= 75 ? T.g : r.health >= 50 ? T.a : T.r} />
              <span style={{ fontSize: 12, fontWeight: 500, color: T.tx2, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              <span style={{ fontSize: 11, color: T.tx4, fontFamily: "'JetBrains Mono', monospace" }}>{r.health}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => { navigate('/connect'); setIsSidebarOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: `1px dashed ${T.pm}`, background: 'transparent', cursor: 'pointer', width: '100%', fontFamily: "'DM Sans', sans-serif", transition: 'background .12s', marginTop: 12, justifyContent: 'center' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.pl; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: T.pm }}>+ Connect Repository</span>
          </button>
          <Btn variant="danger" size="sm" onClick={onLogout} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
            Logout
          </Btn>
        </div>
      </aside>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 top-[56px] bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Sub-Header */}
        <div className="flex lg:hidden items-center justify-between px-4 py-3 border-b border-[#27272A] bg-[#0F0F12] sticky top-[56px] z-20">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            className="flex items-center gap-2 text-[13px] font-medium text-[#A1A1AA] hover:text-[#FAFAF9]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span>Dashboard Menu</span>
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.pm, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section}</span>
        </div>

        <main className="p-4 sm:p-7" style={{ flex: 1, overflowY: 'auto', background: T.bg0 }}>
          {section !== 'overview' && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: T.tx3, cursor: 'pointer', fontSize: 13, fontWeight: 500, padding: 0, marginBottom: 16, fontFamily: "'DM Sans', sans-serif", transition: 'color 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.tx1}
              onMouseLeave={(e) => e.currentTarget.style.color = T.tx3}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
          )}
          {profile && !profile.isVerified && profile.email && (
            <div style={{ background: T.al, border: `1px solid ${T.a}`, borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontSize: 13, color: T.tx2 }}>Your email address is unverified. Verify it to unlock all features.</span>
              </div>
              <button onClick={() => setSection('settings')} style={{ background: T.a, border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 600, padding: '5px 12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Verify now
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {section === 'overview' && <OverviewSection userName={displayName} repos={repos} prs={prs} metrics={metrics} showToast={showToast} setSection={setSection} setActiveRepo={setActiveRepo} />}
              {section === 'prs' && <PRsSection prs={prs} approvePR={approvePR} />}
              {section === 'health' && <HealthSection repos={repos} repo={activeRepo} setRepo={setActiveRepo} showToast={showToast} />}
              {section === 'activity' && <ActivitySection activities={activities} />}
              {section === 'settings' && <SettingsSection showToast={showToast} profile={profile} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999, background: T.bg3, border: `1px solid ${T.brd2}`, borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 500, color: T.tx1, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,.4)', backdropFilter: 'blur(8px)' }}
          >
            <span style={{ fontSize: 14 }}>✓</span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
