import { TYPE_CONFIG } from '../../services/constants';
import { useAuth } from '../../contexts/AuthContext';
import Stars from '../UI/Stars';
import TagBadge from '../UI/TagBadge';
import { estimateReadingTime } from '../../utils/readingTime';

// Flat status badge
function StatusBadge({ status }) {
  const map = {
    Published: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'Published' },
    Draft:     { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: 'Draft' },
    Archived:  { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: 'Archived' },
    Suggested: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', label: 'Suggested' },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span
      className="text-xs font-semibold rounded px-1.5 py-0.5"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

export default function ItemCard({ item, index, onClick, onPublish, onEdit, onDelete, onAccept, selected, onSelect }) {
  const { isManager, isAdmin } = useAuth();
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Policy;
  const readingTime = estimateReadingTime(item.content);

  return (
    <div
      onClick={() => onClick(item)}
      className="bg-white border border-gray-200 rounded-md hover:border-emerald-300 cursor-pointer transition-colors fade-in"
      style={{
        animationDelay: `${index * 0.03}s`,
        outline: selected ? `2px solid ${cfg.accent}` : 'none',
        outlineOffset: selected ? '1px' : 0,
      }}
    >
      {/* Type accent line — 3px top border */}
      <div className="h-[3px] rounded-t-md" style={{ background: cfg.accent }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onSelect && isAdmin && (
              <input
                type="checkbox"
                checked={selected || false}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { e.stopPropagation(); onSelect(item.id, e.target.checked); }}
                className="cursor-pointer"
                style={{ accentColor: cfg.accent }}
              />
            )}
            {/* Type badge */}
            <span
              className="text-xs font-semibold rounded px-1.5 py-0.5"
              style={{ background: `${cfg.accent}12`, color: cfg.accent, border: `1px solid ${cfg.accent}25` }}
            >
              {cfg.icon} {item.type}
            </span>
            {/* ID */}
            <span className="text-xs text-slate-400 font-mono">{item.id}</span>
            {/* Status */}
            <StatusBadge status={item.status} />
            {/* Stale */}
            {item.isStale && item.status !== 'Archived' && (
              <span className="text-xs font-semibold rounded px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                ⚠ Stale
              </span>
            )}
          </div>
          <Stars rating={item.rating} size={12} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-2.5">
          {item.title}
        </h3>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.map((t) => <TagBadge key={t} tag={t} small />)}
          </div>
        )}

        {/* Footer meta */}
        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
          <span>{item.author}</span>
          <span>{item.updatedDate || item.updated}</span>
          <span style={{ color: cfg.accent }} className="font-medium">{readingTime}</span>
          {item.viewCount > 0 && <span>👁 {item.viewCount}</span>}
          {item.comments?.length > 0 && <span>💬 {item.comments.length}</span>}
        </div>

        {/* Manager actions */}
        {isManager && (
          <div
            className="flex gap-1.5 mt-3 pt-3 border-t border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {item.status === 'Draft' && (
              <button
                className="btn-ghost btn-success px-2 py-0.5 text-xs"
                onClick={() => onPublish(item.id)}
              >
                Publish
              </button>
            )}
            {item.status === 'Suggested' && onAccept && (
              <button
                className="btn-ghost px-2 py-0.5 text-xs"
                style={{ color: '#6d28d9', borderColor: '#ddd6fe' }}
                onClick={() => onAccept(item.id)}
              >
                ✓ Chấp nhận
              </button>
            )}
            <button
              className="btn-ghost px-2 py-0.5 text-xs"
              onClick={() => onEdit(item)}
            >
              ✏ Sửa
            </button>
            <button
              className="btn-ghost btn-danger px-2 py-0.5 text-xs"
              onClick={() => onDelete(item.id)}
            >
              Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
