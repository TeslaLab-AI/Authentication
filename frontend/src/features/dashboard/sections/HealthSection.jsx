import { useState } from 'react';
import { Card, Btn, Badge, ScoreRing } from '../../../ui/primitives.jsx';
import { TOKENS as T } from '../../../theme/tokens.js';
import { queueScan } from '../../../services/repoService.js';

export default function HealthSection({ repos, repo, setRepo, showToast }) {
  const [scanning, setScanning] = useState(false);

  const handleScanNow = async () => {
    if (!repo || scanning) return;
    setScanning(true);
    showToast(`Scanning ${repo.name}…`);
    try {
      await queueScan(repo.id, repo.repoUrl);
      showToast(`Scan queued for ${repo.name}. Refresh in a bit to see results.`);
    } catch (err) {
      showToast(err.message || 'Failed to start scan');
    } finally {
      setScanning(false);
    }
  };

  if (!repo) {
    return (
      <div style={{ padding: '24px', color: T.tx3 }}>
        No repository selected yet. Choose a repo from the overview or connect one to view health details.
      </div>
    );
  }

  const secScore = Math.max(20, 100 - repo.securityIssues * 20);
  const depScore = Math.max(20, 100 - repo.outdatedDependencies * 8);
  const lintScore = Math.max(30, 100 - repo.lintIssues * 2);
  const buildScore = repo.buildPassing ? 100 : 35;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: T.tx1, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Health score — <span style={{ color: T.pm }}>{repo.name}</span>
        </h1>
        <p style={{ color: T.tx3, fontSize: 14 }}>Full maintenance health breakdown across security, dependencies, code quality, and build status.</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {repos.map((r) => (
          <Btn key={r.id || r._id} variant={String(repo?.id || repo?._id) === String(r.id || r._id) ? 'primary' : 'secondary'} size="sm" onClick={() => setRepo(r)}>
            {r.name}
          </Btn>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3.5 mb-3.5">
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '28px 20px' }}>
          <ScoreRing score={repo.health} size={130} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: T.tx2, fontWeight: 500 }}>
              {repo.health >= 75 ? '🟢 Healthy' : repo.health >= 50 ? '🟡 Needs attention' : '🔴 Critical issues'}
            </div>
            <div style={{ fontSize: 12, color: T.tx3, marginTop: 4 }}>Scanned {repo.scan}</div>
          </div>
          <Btn variant="secondary" size="sm" onClick={handleScanNow} disabled={scanning}>{scanning ? 'Scanning…' : 'Scan now'}</Btn>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tx2, marginBottom: 16 }}>Score breakdown</div>
          {[['Security', secScore, T.g], ['Dependencies', depScore, T.p], ['Code quality', lintScore, T.b], ['Build health', buildScore, T.g]].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: T.tx3, width: 110, flexShrink: 0 }}>{l}</span>
              <div style={{ flex: 1, height: 7, background: T.bg3, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${v}%`, background: c, borderRadius: 4, transition: 'width .7s ease' }} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: c, width: 28, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tx2, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Security ({repo.sec})</span>
            {repo.sec > 0 && <Badge variant="red" size="xs">Action required</Badge>}
            {repo.security?.risk && repo.sec === 0 && <Badge variant="green" size="xs">{String(repo.security.risk).toUpperCase()} risk</Badge>}
          </div>
          {!repo.hasAgentData ? (
            <div style={{ color: T.tx3, fontSize: 13, padding: '12px 0' }}>No security scan data yet. Run a scan to analyze this repo.</div>
          ) : repo.sec === 0 ? (
            <div style={{ color: T.g, fontSize: 13, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓</span> {repo.security?.summary || 'No vulnerabilities detected'}
            </div>
          ) : (
            <div style={{ padding: '4px 0' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {repo.security.cveCount > 0 && <Badge variant="red" size="xs">{repo.security.cveCount} CVE{repo.security.cveCount > 1 ? 's' : ''}</Badge>}
                {repo.security.secretCount > 0 && <Badge variant="red" size="xs">{repo.security.secretCount} secret{repo.security.secretCount > 1 ? 's' : ''}</Badge>}
                {repo.security.patternCount > 0 && <Badge variant="amber" size="xs">{repo.security.patternCount} risky pattern{repo.security.patternCount > 1 ? 's' : ''}</Badge>}
              </div>
              {repo.security.summary && (
                <div style={{ fontSize: 12, color: T.tx3 }}>{repo.security.summary}</div>
              )}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tx2, marginBottom: 12 }}>Dependency upgrades ({repo.deps})</div>
          {!repo.hasAgentData ? (
            <div style={{ color: T.tx3, fontSize: 13, padding: '12px 0' }}>No dependency data yet. Detected {repo.totalPackages} package{repo.totalPackages === 1 ? '' : 's'} in this repo.</div>
          ) : repo.deps === 0 ? (
            <div style={{ color: T.g, fontSize: 13, padding: '12px 0' }}>✓ {repo.agentMessage || 'All dependencies up to date'}</div>
          ) : (
            <>
              {repo.packagesUpgraded.map((pkg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.brd}` }}>
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: T.tx1 }}>{typeof pkg === 'string' ? pkg : pkg.package || JSON.stringify(pkg)}</span>
                  <Badge variant="green" size="xs">upgraded</Badge>
                </div>
              ))}
              {repo.prUrl && (
                <a href={repo.prUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 12 }}>
                  <Btn variant="success" size="sm" style={{ width: '100%', justifyContent: 'center' }}>View pull request →</Btn>
                </a>
              )}
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tx2, marginBottom: 12 }}>Project details</div>
          {[
            ['Language', repo.language || 'Unknown', true],
            ['Framework', repo.framework || 'Unknown', true],
            ['Dependencies detected', String(repo.totalPackages ?? 0), true],
            ['Repository', repo.name, true],
            ['Branch', repo.branch, true],
          ].map(([l, v, ok]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.brd}`, fontSize: 13 }}>
              <span style={{ color: T.tx3 }}>{l}</span>
              <span style={{ fontWeight: 600, color: ok ? T.tx1 : T.r, fontFamily: (l === 'Branch' || l === 'Language' || l === 'Framework') ? "'JetBrains Mono', monospace" : 'inherit', fontSize: 12 }}>{v}</span>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tx2, marginBottom: 12 }}>Build & test status</div>
          {!repo.hasAgentData ? (
            <div style={{ color: T.tx3, fontSize: 13, padding: '12px 0' }}>No test run recorded yet. The AI agent runs tests when it applies changes.</div>
          ) : (
            [
              ['Agent status', repo.agentStatus || 'unknown', repo.agentStatus === 'success'],
              ['Build / tests', repo.testResults.total > 0 ? (repo.testResults.status === 'pass' ? 'Passing' : 'Failing') : (repo.buildPassing ? 'Passing' : 'Failing'), repo.buildPassing],
              ['Tests run', repo.testResults.total > 0 ? `${repo.testResults.passed}/${repo.testResults.total} passed` : 'No tests run', repo.testResults.failed === 0],
              ['Packages upgraded', String(repo.outdatedDependencies), true],
              ['Branch', repo.branch, true],
            ].map(([l, v, ok]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.brd}`, fontSize: 13 }}>
                <span style={{ color: T.tx3 }}>{l}</span>
                <span style={{ fontWeight: 600, color: ok ? T.g : T.r, fontFamily: l === 'Branch' ? "'JetBrains Mono', monospace" : 'inherit', fontSize: l === 'Branch' ? 12 : 13 }}>{v}</span>
              </div>
            ))
          )}
          {repo.reviewReasoning && (
            <div style={{ marginTop: 12, padding: '10px', background: T.bg3, borderRadius: 8, fontSize: 12, color: T.tx3 }}>
              <span style={{ fontWeight: 600, color: T.tx2 }}>AI review: </span>{repo.reviewReasoning}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
