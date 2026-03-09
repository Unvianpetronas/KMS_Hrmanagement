import { TYPE_CONFIG } from '../../services/constants';
import { useAuth } from '../../contexts/AuthContext';
import Stars from '../UI/Stars';
import TagBadge from '../UI/TagBadge';
import { estimateReadingTime } from '../../utils/readingTime';

export default function ItemCard({ item, index, onClick, onPublish, onEdit, onDelete, onAccept, selected, onSelect }) {
  const { isManager, isAdmin } = useAuth();
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Policy;
  const readingTime = estimateReadingTime(item.content);

  return (
    <div
      className="glass"
      onClick={() => onClick(item)}
      style={{
        borderRadius: 16, padding: '20px 22px', cursor: 'pointer',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative', overflow: 'hidden',
        animation: `fadeIn 0.4s ease ${index * 0.04}s both`,
        transformStyle: 'preserve-3d',
        outline: selected ? `2px solid ${cfg.accent}` : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'perspective(800px) rotateY(2deg) rotateX(1deg) translateY(-6px) scale(1.02)';
        e.currentTarget.style.boxShadow = cfg.glow;
        e.currentTarget.style.borderColor = cfg.accent + '30';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${cfg.accent},${cfg.accent}40)` }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {onSelect && isAdmin && (
            <input
              type="checkbox"
              checked={selected || false}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { e.stopPropagation(); onSelect(item.id, e.target.checked); }}
              style={{ cursor: 'pointer', accentColor: cfg.accent }}
            />
          )}
          <span style={{ padding: '3px 10px', borderRadius: 8, background: `${cfg.accent}12`, color: cfg.accent, fontSize: 11, fontWeight: 800 }}>
            {cfg.icon} {item.type}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, fontFamily: 'monospace' }}>{item.id}</span>
          {item.status === 'Draft' && (
            <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(234,179,8,0.1)', color: '#facc15', fontSize: 9, fontWeight: 800 }}>DRAFT</span>
          )}
          {item.status === 'Archived' && (
            <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(107,114,128,0.15)', color: '#9ca3af', fontSize: 9, fontWeight: 800 }}>ARCHIVED</span>
          )}
          {item.status === 'Suggested' && (
            <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(168,85,247,0.12)', color: '#c084fc', fontSize: 9, fontWeight: 800 }}>SUGGESTED</span>
          )}
          {item.isStale && item.status !== 'Archived' && (
            <span title="Chưa cập nhật hơn 12 tháng" style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(234,179,8,0.1)', color: '#fb923c', fontSize: 9, fontWeight: 800 }}>⚠ STALE</span>
          )}
        </div>
        <Stars rating={item.rating} size={13} />
      </div>

      {/* Title */}
      <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: '#f1f5f9' }}>
        {item.title}
      </h3>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {item.tags?.map((t) => <TagBadge key={t} tag={t} small />)}
      </div>

      {/* Footer meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)' }}>
        <span>✏️ {item.author}</span>
        <span>📅 {item.updatedDate || item.updated}</span>
        <span style={{ color: cfg.accent, fontWeight: 600 }}>📖 {readingTime}</span>
        {item.viewCount > 0 && <span>👁 {item.viewCount}</span>}
        {item.comments?.length > 0 && <span>💬 {item.comments.length}</span>}
      </div>

      {/* Manager actions */}
      {isManager && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
          {item.status === 'Draft' && (
            <button className="btn-ghost btn-success" style={{ padding: '4px 10px', fontSize: 10 }}
              onClick={() => onPublish(item.id)}>Publish</button>
          )}
          {item.status === 'Suggested' && onAccept && (
            <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 10, color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }}
              onClick={() => onAccept(item.id)}>✓ Chấp nhận</button>
          )}
          <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 10 }}
            onClick={() => onEdit(item)}>✏ Sửa</button>
          <button className="btn-ghost btn-danger" style={{ padding: '4px 10px', fontSize: 10 }}
            onClick={() => onDelete(item.id)}>🗑 Xóa</button>
        </div>
      )}
    </div>
  );
}
