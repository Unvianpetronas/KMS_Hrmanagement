import { useState, useEffect } from 'react';
import { statsAPI } from '../../services/api';

const CARDS = [
  { key: 'total', label: 'Tổng bài', icon: '📊', color: '#6366f1' },
  { key: 'policy', label: 'Policy', icon: '📋', color: '#3b82f6' },
  { key: 'faq', label: 'FAQ', icon: '❓', color: '#eab308' },
  { key: 'checklist', label: 'Checklist', icon: '✅', color: '#22c55e' },
];

export default function StatsBar() {
  const [stats, setStats] = useState({ total: 0, policy: 0, faq: 0, checklist: 0 });

  useEffect(() => {
    statsAPI.get().then(setStats).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
      {CARDS.map((s, i) => (
        <div
          key={s.key}
          className="glass"
          style={{
            borderRadius: 16, padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: 14,
            animation: `fadeIn 0.4s ease ${i * 0.08}s both`,
            transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'perspective(800px) rotateY(3deg) translateY(-4px)';
            e.currentTarget.style.boxShadow = `0 12px 40px ${s.color}25`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `${s.color}15`, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 24, boxShadow: `0 0 20px ${s.color}20`,
          }}>{s.icon}</div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1, fontFamily: 'var(--font-heading)' }}>
              {stats[s.key] ?? 0}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
