import { useState, useEffect } from 'react';
import { itemsAPI } from '../../services/api';
import { TYPE_CONFIG } from '../../services/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../UI/Toast';
import Stars from '../UI/Stars';
import TagBadge from '../UI/TagBadge';
import ChecklistView from './ChecklistView';

export default function ItemDetail({ itemId, onBack, onNavigate, onEdit }) {
  const { isManager, isAdmin } = useAuth();
  const { notify } = useToast();
  const [item, setItem] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    itemsAPI.getById(itemId)
      .then(setItem)
      .catch((err) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [itemId, notify]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>⏳ Đang tải...</div>;
  if (!item) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Không tìm thấy bài viết</div>;

  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Policy;

  const handleRate = async (stars) => {
    try {
      const updated = await itemsAPI.rate(item.id, stars);
      setItem(updated);
      notify('Đã đánh giá ⭐');
    } catch (err) { notify(err.message, 'error'); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const updated = await itemsAPI.addComment(item.id, commentText);
      setItem(updated);
      setCommentText('');
      notify('Đã thêm bình luận 💬');
    } catch (err) { notify(err.message, 'error'); }
  };

  const handlePublish = async () => {
    try {
      const updated = await itemsAPI.publish(item.id);
      setItem(updated);
      notify('Đã publish ✅');
    } catch (err) { notify(err.message, 'error'); }
  };

  const handleArchive = async () => {
    try {
      const updated = await itemsAPI.archive(item.id);
      setItem(updated);
      notify('Đã archive 📦');
    } catch (err) { notify(err.message, 'error'); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Xóa "${item.id}"?`)) return;
    try {
      await itemsAPI.delete(item.id);
      notify('Đã xóa');
      onBack();
    } catch (err) { notify(err.message, 'error'); }
  };

  // Render content based on type
  const renderContent = () => {
    if (item.type === 'Checklist') return <ChecklistView content={item.content} />;

    return item.content.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
      const isSection = line.match(/^(MỤC TIÊU|PHẠM VI|QUY ĐỊNH CHÍNH|VÍ DỤ TÌNH HUỐNG|LIÊN HỆ|HỎI|ĐÁP):/);
      if (isSection) return (
        <div key={i} style={{ fontSize: 12, fontWeight: 900, color: cfg.accent, marginTop: i ? 18 : 0, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          {line}
        </div>
      );
      if (line.startsWith('•')) return (
        <div key={i} style={{ fontSize: 14, lineHeight: 1.8, color: '#cbd5e1', paddingLeft: 8 }}>
          <span style={{ color: cfg.accent, marginRight: 8 }}>●</span>{line.slice(2)}
        </div>
      );
      return <div key={i} style={{ fontSize: 14, lineHeight: 1.8, color: '#cbd5e1' }}>{line}</div>;
    });
  };

  return (
    <div className="slide-right">
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        ← Quay lại
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Main Content */}
        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ height: 4, background: `linear-gradient(90deg,${cfg.accent},${cfg.accent}60)` }} />

          {/* Header */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ padding: '5px 14px', borderRadius: 8, background: `${cfg.accent}15`, color: cfg.accent, fontSize: 12, fontWeight: 800 }}>
                {cfg.icon} {item.type}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'monospace' }}>{item.id}</span>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                background: item.status === 'Published' ? 'rgba(34,197,94,0.12)' : item.status === 'Archived' ? 'rgba(107,114,128,0.12)' : 'rgba(234,179,8,0.12)',
                color: item.status === 'Published' ? '#4ade80' : item.status === 'Archived' ? '#9ca3af' : '#facc15',
              }}>{item.status}</span>

              {/* Action buttons */}
              {isManager && item.status === 'Draft' && (
                <button className="btn-ghost btn-success" style={{ padding: '3px 12px', fontSize: 11 }} onClick={handlePublish}>Publish</button>
              )}
              {isManager && (
                <button className="btn-ghost" style={{ padding: '3px 12px', fontSize: 11 }} onClick={() => onEdit(item)}>✏ Sửa</button>
              )}
              {isAdmin && item.status !== 'Archived' && (
                <button className="btn-ghost" style={{ padding: '3px 12px', fontSize: 11, color: '#fb923c', borderColor: 'rgba(251,146,60,0.3)' }} onClick={handleArchive}>📦 Archive</button>
              )}
              {isManager && (
                <button className="btn-ghost btn-danger" style={{ padding: '3px 12px', fontSize: 11 }} onClick={handleDelete}>🗑 Xóa</button>
              )}
            </div>

            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)', lineHeight: 1.3 }}>
              {item.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {item.tags?.map((t) => <TagBadge key={t} tag={t} />)}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 28px' }}>
            {renderContent()}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Thông tin</h3>
            {[
              ['Tác giả', item.author],
              ['Version', 'v' + item.version],
              ['Đối tượng', item.audience],
              ['Ngày tạo', item.createdDate],
              ['Cập nhật', item.updatedDate],
            ].map(([k, v], i, arr) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Rating */}
          <div className="glass" style={{ borderRadius: 16, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#fbbf24', lineHeight: 1, filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.3))', fontFamily: 'var(--font-heading)' }}>
              {item.rating?.toFixed(1)}
            </div>
            <Stars rating={item.rating} size={22} />
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{item.ratingCount} đánh giá</div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Đánh giá của bạn</div>
              <Stars rating={0} onRate={handleRate} size={28} />
            </div>
          </div>

          {/* Related */}
          {item.relatedItems?.length > 0 && (
            <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Liên quan</h3>
              {item.relatedItems.map((rid) => (
                <div
                  key={rid}
                  className="glass-light"
                  onClick={() => onNavigate(rid)}
                  style={{ padding: '10px 12px', marginBottom: 6, borderRadius: 10, cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-indigo)' }}>{rid}</div>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Bình luận ({item.comments?.length || 0})
            </h3>
            {item.comments?.map((c, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < item.comments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
                    {c.userName?.split(' ').pop()?.[0] || '?'}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{c.userName}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{c.createdDate}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: 34 }}>{c.text}</div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                className="input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                placeholder="Viết bình luận..."
                style={{ flex: 1, padding: '10px 14px' }}
              />
              <button className="btn-primary" onClick={handleComment} style={{ padding: '10px 16px', fontSize: 13, borderRadius: 10 }}>
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
