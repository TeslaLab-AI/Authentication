import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Btn, Input, Badge } from '../../ui/primitives.jsx';
import { TOKENS as T } from '../../theme/tokens.js';
import { getGithubUser, getGithubRepos, verifyGithubEmail, getAuthenticatedGithubRepos } from '../../services/githubService.js';
import { connectRepo } from '../../services/repoService.js';
import { getProfile } from '../../services/userService.js';
import { startGithubAuth } from '../../services/authService.js';

export default function ConnectRepoPage() {
  const [profile, setProfile] = useState(null);
  const [githubUsername, setGithubUsername] = useState('');
  const [githubEmail, setGithubEmail] = useState('');
  const [githubUser, setGithubUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [repoFilter, setRepoFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState('setup');
  const [scanStep, setScanStep] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function checkUserGithub() {
      try {
        setLoading(true);
        const profileResponse = await getProfile();
        const profileData = profileResponse.user || profileResponse;
        setProfile(profileData);

        if (profileData.githubToken || profileData.githubId) {
          const reposResult = await getAuthenticatedGithubRepos();
          const backendRepos = reposResult.repos || reposResult || [];
          setRepos(backendRepos);
          
          setGithubUser({
            login: profileData.name || 'Connected GitHub User',
            name: profileData.name,
            bio: 'Authenticated via GitHub OAuth',
            public_repos: backendRepos.length,
            followers: '-',
            email: profileData.email,
          });
          setPhase('select');
          setSelected(null);
          setRepoFilter('');
        }
      } catch (err) {
        console.error('Error fetching linked GitHub repos:', err);
      } finally {
        setLoading(false);
      }
    }
    checkUserGithub();
  }, []);

  const scanSteps = [
    { label: 'Cloning repository (shallow clone)…' },
    { label: 'Detecting framework & language…' },
    { label: 'Scanning dependencies (npm/pip)…' },
    { label: 'Running security scan (OSV + CVE)…' },
    { label: 'Indexing codebase into RAG (Qdrant)…' },
    { label: 'Calculating initial health score…' },
  ];

  const filteredRepos = repos.filter((repo) => {
    const query = repoFilter.toLowerCase().trim();
    return (
      repo.name.toLowerCase().includes(query) ||
      (repo.description && repo.description.toLowerCase().includes(query)) ||
      (repo.language && repo.language.toLowerCase().includes(query))
    );
  });

  const langColors = {
    TypeScript: { bg: T.bl, color: '#60A5FA' },
    Python: { bg: T.gl, color: '#34D399' },
    JavaScript: { bg: T.al, color: '#FCD34D' },
    HTML: { bg: T.bg3, color: '#E34F26' },
    CSS: { bg: T.bg3, color: '#2965f1' },
    Shell: { bg: T.bg3, color: '#89E051' },
  };

  const startScan = async () => {
    if (!selected) {
      setError('Please select a repository before continuing.');
      return;
    }

    setError('');
    setLoading(true);
    setPhase('scanning');

    try {
      await connectRepo({
        repoUrl: selected.clone_url || selected.html_url || selected.url,
      });

      let i = 0;
      const iv = setInterval(() => {
        setScanStep(i);
        i += 1;
        if (i >= scanSteps.length) {
          clearInterval(iv);
          setTimeout(() => setPhase('done'), 500);
          setTimeout(() => navigate('/dashboard', { replace: true }), 1400);
        }
      }, 850);
      return () => clearInterval(iv);
    } catch (err) {
      setError(err.message || 'Unable to connect repository');
      setPhase('select');
    } finally {
      setLoading(false);
    }
  };

  const fetchGithubData = async () => {
    setError('');
    setMessage('');

    if (!githubUsername.trim()) {
      setError('Enter your GitHub username.');
      return;
    }

    if (!githubEmail.trim()) {
      setError('Enter the Gmail address used for GitHub.');
      return;
    }

    if (!/@gmail\.com$/i.test(githubEmail.trim())) {
      setError('Please provide a valid Gmail address ending with @gmail.com.');
      return;
    }

    setLoading(true);

    try {
      const profileResult = await getGithubUser(githubUsername.trim());
      const verifyResult = await verifyGithubEmail({ username: githubUsername.trim(), email: githubEmail.trim() });
      const reposResult = await getGithubRepos(githubUsername.trim());

      setGithubUser(profileResult.user || profileResult);
      setMessage(verifyResult.note || 'GitHub details verified.');
      setRepos(reposResult.repos || reposResult);
      setPhase('select');
      setSelected(null);
      setRepoFilter('');
    } catch (err) {
      setError(err.message || 'Unable to fetch GitHub repos.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { n: 1, label: 'GitHub details', done: phase !== 'setup' },
    { n: 2, label: 'Select repo', active: phase === 'select' },
    { n: 3, label: 'Initial scan', active: phase === 'scanning' || phase === 'done' },
    { n: 4, label: 'Dashboard', pending: phase !== 'done' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: T.tx3, cursor: 'pointer', fontSize: 13, fontWeight: 500, padding: 0, marginBottom: 20, fontFamily: "'DM Sans', sans-serif", transition: 'color 0.15s' }}
        onMouseEnter={(e) => e.currentTarget.style.color = T.tx1}
        onMouseLeave={(e) => e.currentTarget.style.color = T.tx3}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back
      </button>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: T.tx1, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Connect your GitHub repository</h1>
      <p style={{ color: T.tx3, fontSize: 14, marginBottom: 24 }}>Fetch real repository data from GitHub, verify your Gmail, and choose the repo to connect with the dashboard.</p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 mb-[30px]">
        {steps.map((s, i) => (
          <div key={s.n} className={i < steps.length - 1 ? "flex-1 min-w-[120px] flex items-center" : "flex items-center"}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.done ? T.g : s.active ? T.p : T.bg3, border: `2px solid ${s.done ? T.g : s.active ? T.p : T.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: s.done || s.active ? '#fff' : T.tx4, flexShrink: 0 }}>
                {s.done ? '✓' : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: s.done ? T.g : s.active ? T.pm : T.tx4, whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="hidden sm:block flex-1 h-[2px] mx-3" style={{ background: s.done ? T.g : T.bg3, borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card style={{ padding: '24px 28px', border: `1px dashed ${T.pm}`, background: T.pl, marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.tx1, marginBottom: 8 }}>Automated Repository Connection</div>
              <p style={{ fontSize: 13, color: T.tx2, marginBottom: 18, maxWidth: 440, margin: '0 auto 18px' }}>
                Securely authenticate with GitHub via OAuth to list and scan all your public and private repositories instantly.
              </p>
              <Btn onClick={startGithubAuth} style={{ gap: 10, padding: '11px 20px', fontSize: 14 }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Connect GitHub via OAuth
              </Btn>
            </Card>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: T.brd }} />
              <span style={{ fontSize: 11, color: T.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or look up public username</span>
              <div style={{ flex: 1, height: 1, background: T.brd }} />
            </div>

            <Input
              label="GitHub username"
              placeholder="octocat"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 00-3.16 19.48c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.61.07-.61 1 .07 1.53 1.02 1.53 1.02.88 1.52 2.3 1.08 2.86.82.09-.64.35-1.08.64-1.33-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.98 1.02-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 015 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65.63.7 1.01 1.59 1.01 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0012 2z" /></svg>}
              style={{ marginBottom: 16 }}
            />
            <Input
              label="Gmail used on GitHub"
              placeholder="you@gmail.com"
              type="email"
              value={githubEmail}
              onChange={(e) => setGithubEmail(e.target.value)}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
              style={{ marginBottom: 16 }}
            />
            {error && <div style={{ color: T.rl, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <Btn onClick={fetchGithubData} loading={loading} style={{ gap: 8 }}>
              Fetch GitHub repositories
            </Btn>
          </motion.div>
        )}

        {phase === 'select' && (
          <motion.div key="select" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {githubUser && (
              <Card style={{ marginBottom: 20, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: T.tx1 }}>{githubUser.login?.[0]?.toUpperCase() || 'G'}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.tx1 }}>{githubUser.name || githubUser.login}</div>
                    <div style={{ fontSize: 13, color: T.tx3, marginTop: 3 }}>{githubUser.bio || githubUser.html_url}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                  <Badge size="sm">Public repos: {githubUser.public_repos}</Badge>
                  <Badge size="sm">Followers: {githubUser.followers}</Badge>
                  <Badge size="sm">Email: {githubUser.email || 'private'}</Badge>
                </div>
                {message && <div style={{ marginTop: 14, color: T.g, fontSize: 13 }}>{message}</div>}
              </Card>
            )}

            <Input
              placeholder="Filter repositories…"
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
              style={{ marginBottom: 12 }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 390, overflowY: 'auto' }}>
              {filteredRepos.length === 0 ? (
                <div style={{ padding: 18, borderRadius: 14, background: T.bg2, color: T.tx3 }}>No repositories found for this username.</div>
              ) : (
                filteredRepos.map((repo) => {
                  const lc = langColors[repo.language] || { bg: T.bg3, color: T.tx2 };
                  const isSel = selected?.id === repo.id;
                  return (
                    <motion.div key={repo.id} whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.997 }}>
                      <div onClick={() => setSelected(repo)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ padding: '14px 18px', borderRadius: 14, background: isSel ? T.pl : T.bg2, border: `1px solid ${isSel ? T.p : T.brd}`, cursor: 'pointer', transition: 'all .15s' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: isSel ? T.pm : T.tx1, wordBreak: 'break-all' }}>{repo.name}</span>
                            {repo.private && <Badge variant="red" size="xs">Private</Badge>}
                          </div>
                          <div style={{ fontSize: 12, color: T.tx3, marginTop: 4, wordBreak: 'break-word' }}>{repo.description || 'No description available'}</div>
                        </div>
                        <div className="flex items-center gap-[10px] self-start sm:self-auto">
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, fontWeight: 500, background: lc.bg, color: lc.color }}>{repo.language || 'Unknown'}</span>
                          <span style={{ fontSize: 11, color: T.tx4 }}>★ {repo.stargazers_count || 0}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {error && <div style={{ color: T.rl, marginTop: 16, fontSize: 13 }}>{error}</div>}
            <Btn onClick={startScan} disabled={!selected} style={{ marginTop: 20, gap: 8 }}>
              {selected ? `Connect "${selected.name}"` : 'Select a repository first'}
            </Btn>
          </motion.div>
        )}

        {(phase === 'scanning' || phase === 'done') && (
          <motion.div key="scan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card style={{ background: phase === 'done' ? T.gl : T.pl, borderColor: phase === 'done' ? T.g : T.p }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: phase === 'done' ? '#34D399' : T.pm }}>
                  {phase === 'done' ? '✓ AI engineer is ready!' : `Setting up for "${selected?.name}"…`}
                </span>
              </div>
              <p style={{ fontSize: 13, color: T.tx2, marginBottom: 20 }}>
                {phase === 'done' ? 'Redirecting to your dashboard…' : 'Cloning, scanning, and indexing your codebase. This takes about 30 seconds.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {scanSteps.map((s, i) => {
                  const done = i < scanStep;
                  const running = i === scanStep;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: done ? T.g : running ? T.p : T.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, animation: running ? 'spin .9s linear infinite' : 'none' }}>
                        {done ? '✓' : running ? '↻' : '·'}
                      </div>
                      <span style={{ fontSize: 13, color: done ? T.tx2 : running ? T.pm : T.tx4, fontWeight: running ? 500 : 400 }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
