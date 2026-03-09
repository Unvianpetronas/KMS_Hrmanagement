import { useState, useEffect } from 'react';
import { statsAPI } from '../../services/api';
import { TYPE_CONFIG } from '../../services/constants';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COUNT_CARDS = [
  { key: 'total', label: 'Tổng bài', icon: '📊', color: '#6366f1' },
  { key: 'policy', label: 'Policy', icon: '📋', color: '#3b82f6' },
  { key: 'faq', label: 'FAQ', icon: '❓', color: '#eab308' },
  { key: 'checklist', label: 'Checklist', icon: '✅', color: '#22c55e' },
  { key: 'lesson', label: 'Lesson', icon: '💡', color: '#f97316' },
  { key: 'staleCount', label: 'Cần cập nhật', icon: '⚠', color: '#fb923c' },
];

const PIE_COLORS = ['#3b82f6', '#eab308', '#22c55e', '#f97316'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{payload[0].name || payload[0].payload?.id}</div>
      <div style={{ color: payload[0].color || '#fbbf24' }}>{payload[0].value}</div>
    </div>
  );
};

export default function StatsBar({ onSelectItem }) {
  const [stats, setStats] = useState({ total: 0, policy: 0, faq: 0, checklist: 0, lesson: 0, staleCount: 0, topRated: [], recentlyUpdated: [] });

  useEffect(() => {
    statsAPI.get().then(setStats).catch(() => {});
  }, []);

  const pieData = [
    { name: 'Policy', value: stats.policy ?? 0 },
    { name: 'FAQ', value: stats.faq ?? 0 },
    { name: 'Checklist', value: stats.checklist ?? 0 },
    { name: 'Lesson', value: stats.lesson ?? 0 },
  ];

  const statusData = [
    { name: 'Published', value: stats.published ?? 0, color: '#22c55e' },
    { name: 'Draft', value: stats.draft ?? 0, color: '#eab308' },
    { name: 'Archived', value: stats.archived ?? 0, color: '#64748b' },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Count cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 16, marginBottom: 20 }}>
        {COUNT_CARDS.map((s, i) => (
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
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: `0 0 20px ${s.color}20` }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1, fontFamily: 'var(--font-heading)' }}>
                {stats[s.key] ?? 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', gap: 16 }}>

        {/* Donut: Type distribution */}
        <div className="glass" style={{ borderRadius: 16, padding: '20px 16px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Phân bố loại</h4>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            {pieData.map((d, i) => (
              <span key={d.name} style={{ fontSize: 11, color: PIE_COLORS[i], fontWeight: 700 }}>
                ● {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Bar: Top rated */}
        <div className="glass" style={{ borderRadius: 16, padding: '20px 16px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Top 5 đánh giá cao</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.topRated} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="id" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rating" fill="#fbbf24" radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status + Recent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status breakdown */}
          <div className="glass" style={{ borderRadius: 16, padding: '16px 18px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Trạng thái</h4>
            {statusData.map((s) => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <span style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>● {s.name}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Recently updated */}
          <div className="glass" style={{ borderRadius: 16, padding: '16px 18px', flex: 1 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Cập nhật gần đây</h4>
            {(stats.recentlyUpdated || []).map((item) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Policy;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem?.(item.id)}
                  style={{ padding: '5px 0', cursor: onSelectItem ? 'pointer' : 'default', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={(e) => onSelectItem && (e.currentTarget.style.opacity = '0.7')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: cfg.accent, fontWeight: 700, fontFamily: 'monospace' }}>{item.id}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{item.updatedDate}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
