import { useState, useEffect } from 'react';
import { statsAPI } from '../../services/api';
import { TYPE_CONFIG } from '../../services/constants';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// Monochromatic emerald palette for charts
const PIE_COLORS = ['#064e3b', '#047857', '#059669', '#34d399'];

const COUNT_CARDS = [
  { key: 'total',      label: 'Tổng bài',     icon: '📊', color: '#047857' },
  { key: 'policy',     label: 'Policy',        icon: '📋', color: '#1d4ed8' },
  { key: 'faq',        label: 'FAQ',           icon: '❓', color: '#b45309' },
  { key: 'checklist',  label: 'Checklist',     icon: '✅', color: '#047857' },
  { key: 'lesson',     label: 'Lesson',        icon: '💡', color: '#6d28d9' },
  { key: 'staleCount', label: 'Cần cập nhật',  icon: '⚠',  color: '#b45309' },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs">
      <div className="font-semibold text-slate-700">{payload[0].name || payload[0].payload?.id}</div>
      <div className="text-slate-500">{payload[0].value}</div>
    </div>
  );
};

export default function StatsBar({ onSelectItem }) {
  const [stats, setStats] = useState({
    total: 0, policy: 0, faq: 0, checklist: 0, lesson: 0, staleCount: 0,
    topRated: [], recentlyUpdated: [],
  });

  useEffect(() => {
    statsAPI.get().then(setStats).catch(() => {});
  }, []);

  const pieData = [
    { name: 'Policy',    value: stats.policy    ?? 0 },
    { name: 'FAQ',       value: stats.faq       ?? 0 },
    { name: 'Checklist', value: stats.checklist ?? 0 },
    { name: 'Lesson',    value: stats.lesson    ?? 0 },
  ];

  const statusData = [
    { name: 'Published', value: stats.published ?? 0, color: '#047857' },
    { name: 'Draft',     value: stats.draft     ?? 0, color: '#b45309' },
    { name: 'Archived',  value: stats.archived  ?? 0, color: '#6b7280' },
  ];

  return (
    <div className="mb-6 space-y-4 fade-in">
      {/* Stat cards row */}
      <div className="grid grid-cols-6 gap-3">
        {COUNT_CARDS.map((s) => (
          <div key={s.key} className="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: `${s.color}12` }}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-xl font-bold leading-tight" style={{ color: s.color }}>
                {stats[s.key] ?? 0}
              </div>
              <div className="text-xs text-slate-500 leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-3" style={{ gridTemplateColumns: '1fr 1.6fr 1fr' }}>

        {/* Donut — type distribution */}
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Phân bố loại</h4>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={38} outerRadius={58}
                paddingAngle={2} dataKey="value"
              >
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
            {pieData.map((d, i) => (
              <span key={d.name} className="text-xs font-medium" style={{ color: PIE_COLORS[i] }}>
                ● {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Bar — top rated */}
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Top 5 đánh giá cao</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.topRated} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number" domain={[0, 5]}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickLine={false} axisLine={false}
              />
              <YAxis
                type="category" dataKey="id"
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false} axisLine={false} width={56}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rating" fill="#047857" radius={[0, 3, 3, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status + Recently updated */}
        <div className="flex flex-col gap-3">
          {/* Status breakdown */}
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Trạng thái</h4>
            {statusData.map((s) => (
              <div key={s.name} className="flex justify-between items-center py-1">
                <span className="text-xs font-medium" style={{ color: s.color }}>● {s.name}</span>
                <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Recently updated */}
          <div className="bg-white border border-gray-200 rounded-md p-4 flex-1">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Cập nhật gần đây</h4>
            {(stats.recentlyUpdated || []).map((item, i, arr) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Policy;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem?.(item.id)}
                  className={`py-1.5 cursor-pointer hover:opacity-70 transition-opacity ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-bold font-mono"
                      style={{ color: cfg.accent }}
                    >
                      {item.id}
                    </span>
                    <span className="text-xs text-slate-600 truncate">{item.title}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.updatedDate}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
