import { Card } from '../../../ui/primitives.jsx';
import { TOKENS as T } from '../../../theme/tokens.js';

export default function ActivitySection({ activities }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: T.tx1, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Activity log</h1>
        <p style={{ color: T.tx3, fontSize: 14 }}>Complete record of everything your AI engineering team has done.</p>
      </div>
      <Card noPad>
        {activities.map((a, i) => (
          <div key={a.id || i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ padding: '14px 20px', borderBottom: i < activities.length - 1 ? `1px solid ${T.brd}` : 'none' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.tx1, wordBreak: 'break-all' }}>{a.title}</div>
                <div style={{ fontSize: 12, color: T.tx3, marginTop: 3, lineHeight: 1.5, wordBreak: 'break-word' }}>{a.sub}</div>
              </div>
            </div>
            <div className="text-[11px] text-[#52525B] whitespace-nowrap self-start sm:self-auto pl-[50px] sm:pl-0">
              {new Date(a.time).toLocaleString()}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
