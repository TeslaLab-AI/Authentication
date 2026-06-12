import { Card, Btn, Badge, ScoreRing } from '../../../ui/primitives.jsx';
import { TOKENS as T } from '../../../theme/tokens.js';

export default function HealthSection({ repos, repo, setRepo, showToast }) {
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
          <Btn variant="secondary" size="sm" onClick={() => showToast(`Scanning ${repo.name}…`)}>Scan now</Btn>
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
            <span>Security vulnerabilities ({repo.sec})</span>
            {repo.sec > 0 && <Badge variant="red" size="xs">Action required</Badge>}
          </div>
          {repo.sec === 0 ? (
            <div style={{ color: T.g, fontSize: 13, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓</span> No vulnerabilities detected
            </div>
          ) : (
            <>
              <div style={{ padding: '10px 0', borderBottom: `1px solid ${T.brd}` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <Badge variant="red" size="xs">HIGH</Badge>
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>lodash 4.17.20</span>
                </div>
                <div style={{ fontSize: 12, color: T.tx3, marginBottom: 8 }}>Prototype pollution via zipObjectDeep. Fix: upgrade to 4.17.21.</div>
                <Btn variant="secondary" size="xs" onClick={() => showToast('Fix PR raised for lodash')}>Fix with AI</Btn>
              </div>
              {repo.sec > 1 && (
                <div style={{ padding: '10px 0' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <Badge variant="amber" size="xs">MEDIUM</Badge>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>axios 1.4.0</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.tx3, marginBottom: 8 }}>SSRF — Server-Side Request Forgery in HTTP adapter. Fix: upgrade to ≥1.6.0.</div>
                  <Btn variant="secondary" size="xs" onClick={() => showToast('Fix PR raised for axios')}>Fix with AI</Btn>
                </div>
              )}
            </>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tx2, marginBottom: 12 }}>Outdated dependencies ({repo.deps})</div>
          {repo.deps === 0 ? (
            <div style={{ color: T.g, fontSize: 13, padding: '12px 0' }}>✓ All dependencies up to date</div>
          ) : (
            <>
              {[
                { pkg: 'react-query', cur: '4.29.0', new: '5.28.0', type: 'Major' },
                { pkg: 'tailwindcss', cur: '3.3.0', new: '3.4.1', type: 'Minor' },
                { pkg: 'typescript', cur: '5.0.4', new: '5.4.5', type: 'Patch' },
              ]
                .slice(0, Math.min(3, repo.deps))
                .map((d) => (
                  <div key={d.pkg} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.brd}` }}>
                    <div>
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: T.tx1 }}>{d.pkg}</span>
                      <div style={{ fontSize: 11, color: T.tx3, marginTop: 2 }}>{d.cur} → {d.new}</div>
                    </div>
                    <Badge variant={d.type === 'Major' ? 'amber' : d.type === 'Minor' ? 'blue' : 'default'} size="xs">{d.type}</Badge>
                  </div>
                ))}
              <Btn variant="success" size="sm" onClick={() => showToast('Dependency upgrade PRs raised')} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                Fix all with AI
              </Btn>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tx2, marginBottom: 12 }}>Lint issues ({repo.lint})</div>
          {repo.lint > 0 ? (
            <>
              {[
                { file: 'src/components/Auth.tsx', line: 34, rule: 'no-unused-vars', msg: "'userRole' is defined but never used" },
                { file: 'src/pages/dashboard.tsx', line: 12, rule: 'react-hooks/exhaustive-deps', msg: 'useEffect missing dependency array' },
                { file: 'src/utils/api.ts', line: 89, rule: 'no-console', msg: 'Unexpected console.log statement' },
              ]
                .slice(0, Math.min(3, repo.lint))
                .map((l, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${T.brd}` }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.tx4 }}>{l.file}:{l.line}</div>
                    <div style={{ fontSize: 12, color: T.tx1, fontWeight: 500, marginTop: 2 }}>{l.msg}</div>
                    <div style={{ fontSize: 11, color: T.tx4 }}>{l.rule}</div>
                  </div>
                ))}
              {repo.lint > 3 && <div style={{ fontSize: 12, color: T.tx3, marginTop: 8 }}>+{repo.lint - 3} more lint issues…</div>}
            </>
          ) : (
            <div style={{ color: T.g, fontSize: 13, padding: '12px 0' }}>✓ No lint issues</div>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tx2, marginBottom: 12 }}>Build & test status</div>
          {[
            ['Build status', repo.build ? 'Passing' : 'Failing', repo.build],
            ['Test coverage', '74%', true],
            ['Tests run', '47/47 passed', repo.build],
            ['Last build', '3 min ago', true],
            ['CI pipeline', 'GitHub Actions', true],
            ['Branch', repo.branch, true],
          ].map(([l, v, ok]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.brd}`, fontSize: 13 }}>
              <span style={{ color: T.tx3 }}>{l}</span>
              <span style={{ fontWeight: 600, color: ok ? T.g : T.r, fontFamily: l === 'Branch' || l === 'CI pipeline' ? "'JetBrains Mono', monospace" : 'inherit', fontSize: l === 'Branch' || l === 'CI pipeline' ? 12 : 13 }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
