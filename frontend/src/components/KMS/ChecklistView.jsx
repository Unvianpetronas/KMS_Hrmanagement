import { useState } from 'react';

/**
 * Interactive checklist renderer.
 * Handles both ☐ prefix AND lines without prefix (treats non-header lines as items).
 * Progress bar tracks checked items.
 */
export default function ChecklistView({ content }) {
  const [checked, setChecked] = useState({});
  const lines = content.split('\n').filter((l) => l.trim());

  // Detect checklist items: lines starting with ☐, ☑, - , or numbered (1. 2. etc)
  const isCheckItem = (line) => {
    const t = line.trim();
    return t.startsWith('☐') || t.startsWith('☑') || t.startsWith('- ') || /^\d+[\.\)]\s/.test(t);
  };

  const isHeader = (line) => {
    const t = line.trim();
    return t === t.toUpperCase() && t.length > 3 && !isCheckItem(line);
  };

  const checkItems = lines.filter(isCheckItem);
  const total = checkItems.length;
  const done = Object.values(checked).filter(Boolean).length;
  const pct = total ? (done / total) * 100 : 0;

  let itemIdx = 0;

  return (
    <div>
      {/* Progress bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        padding: '12px 16px', background: 'rgba(34,197,94,0.08)',
        borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)',
      }}>
        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg,#22c55e,#4ade80)',
            borderRadius: 99, transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 0 12px rgba(34,197,94,0.4)',
          }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#4ade80', whiteSpace: 'nowrap' }}>
          {done}/{total} hoàn thành
        </span>
      </div>

      {/* Items */}
      {lines.map((line, i) => {
        if (isCheckItem(line)) {
          const ci = itemIdx++;
          const text = line.trim()
            .replace(/^☐\s*/, '')
            .replace(/^☑\s*/, '')
            .replace(/^-\s*/, '')
            .replace(/^\d+[\.\)]\s*/, '');

          return (
            <label key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 14px', marginBottom: 4, borderRadius: 10,
              cursor: 'pointer', transition: 'all 0.3s',
              background: checked[ci] ? 'rgba(34,197,94,0.06)' : 'transparent',
              border: checked[ci] ? '1px solid rgba(34,197,94,0.15)' : '1px solid transparent',
            }}>
              <input
                type="checkbox" checked={!!checked[ci]}
                onChange={() => setChecked((p) => ({ ...p, [ci]: !p[ci] }))}
                style={{ marginTop: 3, accentColor: '#22c55e', width: 18, height: 18 }}
              />
              <span style={{
                fontSize: 14, lineHeight: 1.7,
                textDecoration: checked[ci] ? 'line-through' : 'none',
                color: checked[ci] ? '#6b7280' : '#e5e7eb',
                transition: 'all 0.3s',
              }}>{text}</span>
            </label>
          );
        }

        // Header lines
        if (isHeader(line)) {
          return (
            <div key={i} style={{
              fontSize: 15, fontWeight: 800, color: '#4ade80',
              marginTop: i ? 18 : 0, marginBottom: 8,
              paddingBottom: 8, borderBottom: '1px solid rgba(34,197,94,0.2)',
            }}>
              {line.trim()}
            </div>
          );
        }

        // Sub-item or description
        if (line.trim()) {
          return (
            <div key={i} style={{ fontSize: 13, color: '#94a3b8', paddingLeft: 42, lineHeight: 1.6 }}>
              {line.trim()}
            </div>
          );
        }

        return null;
      })}

      {total === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Không tìm thấy checklist items. Nội dung nên bắt đầu mỗi dòng bằng ☐, hoặc -, hoặc 1.
        </div>
      )}
    </div>
  );
}
