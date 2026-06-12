import { useState } from 'react';
import { Card, Btn, Badge } from '../../../ui/primitives.jsx';
import { TOKENS as T } from '../../../theme/tokens.js';

export default function PRsSection({ prs, approvePR }) {
  const [filter, setFilter] = useState('all');
  const filtered = prs.filter(
    (p) => filter === 'all' || p.status === filter || (filter === 'open' && p.status === 'pending')
  );

  const typeColors = {
    security: { bg: T.rl, color: '#F87171' },
    deps: { bg: T.al, color: '#FCD34D' },
    lint: { bg: T.bl, color: '#60A5FA' },
    perf: { bg: T.pl, color: T.pm },
  };
  const riskColor = { low: T.g, medium: T.a, high: T.r, none: T.g };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: T.tx1, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Pull requests</h1>
        <p style={{ color: T.tx3, fontSize: 14 }}>AI-raised PRs awaiting your review. Check the diff on GitHub, then approve here.</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all', 'All'], ['open', 'Open'], ['pending', 'Pending'], ['merged', 'Merged']].map(([k, l]) => (
          <Btn key={k} variant={filter === k ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(k)}>
            {l}{' '}
            {k === 'open' ? `(${prs.filter((p) => p.status === 'open').length})` : k === 'merged' ? `(${prs.filter((p) => p.status === 'merged').length})` : ''}
          </Btn>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((pr) => {
          const tc = typeColors[pr.type] || typeColors.deps;
          const merged = pr.status === 'merged';
          return (
            <Card key={pr._id} style={{ padding: '14px 18px', opacity: merged ? 0.65 : 1 }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: merged ? T.p : pr.status === 'open' ? T.g : T.a, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: T.tx1, marginBottom: 4, wordBreak: 'break-all' }}>{pr.title}</div>
                    <div style={{ fontSize: 12, color: T.tx3, marginBottom: 8, wordBreak: 'break-word' }}>{pr.desc}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Badge variant="default" size="xs">{pr.repo}</Badge>
                      <Badge variant="default" size="xs">{pr.pr}</Badge>
                      <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 5, fontWeight: 600, background: tc.bg, color: tc.color }}>{pr.type}</span>
                      <span style={{ fontSize: 11, color: riskColor[pr.risk] }}>Risk: {pr.risk}</span>
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 self-stretch sm:self-auto pl-[22px] sm:pl-0 border-t border-[#27272A]/50 sm:border-t-0 pt-3 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#71717A] sm:hidden">Confidence:</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: pr.conf >= 90 ? T.gl : T.al, color: pr.conf >= 90 ? '#34D399' : '#FCD34D' }}>{pr.conf}%</span>
                  </div>
                  {!merged ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant="secondary" size="xs">View diff</Btn>
                      <Btn variant="success" size="xs" onClick={() => approvePR(pr.id)}>Approve</Btn>
                    </div>
                  ) : (
                    <Badge variant="purple" size="xs">Merged ✓</Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
