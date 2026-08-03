import { useState } from 'react';
import { Card, Btn, Badge, MiniSparkline } from '../../../ui/primitives.jsx';
import { TOKENS as T } from '../../../theme/tokens.js';
import { queueScan } from '../../../services/repoService.js';

export default function OverviewSection({ userName, repos, prs, metrics, showToast, setSection, setActiveRepo }) {
  const [scanningId, setScanningId] = useState(null);

  const handleScanNow = async (e, r) => {
    e.stopPropagation();
    if (scanningId) return;
    setScanningId(r.id);
    showToast(`Scanning ${r.name}…`);
    try {
      await queueScan(r.id, r.repoUrl);
      showToast(`Scan queued for ${r.name}. Refresh in a bit to see results.`);
    } catch (err) {
      showToast(err.message || 'Failed to start scan');
    } finally {
      setScanningId(null);
    }
  };

  const overviewMetrics = [
    { label: 'Repos monitored', value: String(metrics.reposCount || repos.length), change: '+1 this week', up: true, data: [2, 2, 3, 3, 3, 4, Math.max(4, metrics.reposCount || repos.length)] },
    { label: 'PRs raised (30d)', value: String(prs.length), change: '+5 vs last month', up: true, data: [2, 3, 4, 3, 5, 6, prs.length] },
    { label: 'Issues resolved', value: String(metrics.issuesResolved || 0), change: '+8 this week', up: true, data: [10, 14, 19, 22, 26, 29, metrics.issuesResolved || 0] },
    { label: 'Avg health score', value: String(metrics.avgHealth || 0), change: metrics.avgHealth >= 75 ? '+2 from last week' : '−2 from last week', up: metrics.avgHealth >= 75, data: [71, 73, 75, 72, 76, 76, metrics.avgHealth || 0] },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: T.tx1, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Good morning, {userName} 👋
        </h1>
        <p style={{ color: T.tx3, fontSize: 14 }}>
          Your AI engineering team is monitoring {repos.length} repositories.{' '}
          <span style={{ color: T.pm, fontWeight: 500 }}>{prs.filter((p) => p.status !== 'merged').length} PRs need your attention.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {overviewMetrics.map((m) => (
          <Card key={m.label}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 600, color: T.tx1, marginBottom: 6 }}>{m.value}</div>
            <MiniSparkline data={m.data} color={m.up ? T.g : T.r} />
            <div style={{ fontSize: 12, color: m.up ? T.g : T.r, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span>{m.up ? '↑' : '↓'}</span>
              {m.change}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: T.tx1, margin: 0 }}>Repositories</h2>
        <Btn variant="ghost" size="sm" onClick={() => setSection('health')}>View health details →</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 28 }}>
        {repos.map((r) => {
          const scoreClass = r.healthScore >= 75 ? { bg: T.gl, color: '#34D399' } : r.healthScore >= 50 ? { bg: T.al, color: '#FCD34D' } : { bg: T.rl, color: '#F87171' };
          return (
            <Card key={r.id || r._id} onClick={() => { setActiveRepo(r); setSection('health'); }} style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.tx1 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: T.tx4, marginTop: 2 }}>{r.language} · {r.defaultBranch}</div>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: scoreClass.bg, color: scoreClass.color }}>{r.healthScore}</span>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                {r.securityIssues > 0 && <Badge variant="red" size="xs">{r.securityIssues} CVEs</Badge>}
                {r.outdatedDependencies > 0 && <Badge variant="amber" size="xs">{r.outdatedDependencies} outdated</Badge>}
                {r.lintIssues > 0 && <Badge variant="blue" size="xs">{r.lintIssues} lint</Badge>}
                {!r.buildPassing && <Badge variant="critical" size="xs">Build failing</Badge>}
                {r.securityIssues === 0 && r.outdatedDependencies === 0 && r.lintIssues === 0 && r.buildPassing && <Badge variant="green" size="xs">All clear</Badge>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${T.brd}` }}>
                <span style={{ fontSize: 11, color: T.tx4 }}>Scanned {new Date(r.lastScannedAt).toLocaleString()}</span>
                <Btn variant="secondary" size="xs" onClick={(e) => handleScanNow(e, r)} disabled={scanningId === r.id}>{scanningId === r.id ? 'Scanning…' : 'Scan now'}</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: T.tx1, margin: 0 }}>Recent activity</h2>
        <Btn variant="ghost" size="sm" onClick={() => setSection('activity')}>See all →</Btn>
      </div>
      <Card noPad>
        {(metrics.recentActivity || []).slice(0, 5).map((a, i) => (
          <div key={a.id || i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ padding: '12px 18px', borderBottom: i < 4 ? `1px solid ${T.brd}` : 'none' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: T.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.tx1, wordBreak: 'break-all' }}>{a.title}</div>
                <div style={{ fontSize: 12, color: T.tx3, marginTop: 2, wordBreak: 'break-word' }}>{a.sub}</div>
              </div>
            </div>
            <div className="text-[11px] text-[#52525B] whitespace-nowrap self-start sm:self-auto pl-11 sm:pl-0">
              {new Date(a.time).toLocaleString()}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
