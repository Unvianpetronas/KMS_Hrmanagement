import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { itemsAPI } from '../../services/api';
import { TYPE_CONFIG } from '../../services/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../UI/Toast';
import Stars from '../UI/Stars';
import TagBadge from '../UI/TagBadge';
import ChecklistView from './ChecklistView';
import { estimateReadingTime } from '../../utils/readingTime';

function TableOfContents({ content }) {
  const headings = content.split('\n')
    .filter(line => /^#{2,3}\s/.test(line))
    .map(line => {
      const level = line.startsWith('###') ? 3 : 2;
      const text = line.replace(/^#{2,3}\s+/, '').trim();
      return { level, text };
    });

  if (headings.length < 3) return null;

  const scrollTo = (text) => {
    const els = document.querySelectorAll('h1, h2, h3');
    const target = Array.from(els).find(el => el.textContent.trim() === text);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Mục lục</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {headings.map((h, i) => (
          <button
            key={i}
            onClick={() => scrollTo(h.text)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: `5px 0 5px ${h.level === 3 ? '20px' : '10px'}`,
              fontSize: h.level === 2 ? 12 : 11,
              fontWeight: h.level === 2 ? 700 : 500,
              color: 'var(--text-muted)',
              background: 'none', border: 'none',
              borderLeft: '2px solid rgba(255,255,255,0.06)',
              cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#a78bfa';
              e.currentTarget.style.borderLeftColor = '#a78bfa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderLeftColor = 'rgba(255,255,255,0.06)';
            }}
          >
            {h.text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ItemDetail({ itemId, onBack, onNavigate, onEdit }) {
  const { isManager, isAdmin } = useAuth();
  const { notify } = useToast();
  const [item, setItem] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    itemsAPI.getById(itemId)
      .then((data) => { setItem(data); itemsAPI.recordView(itemId); })
      .catch((err) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [itemId, notify]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>⏳ Đang tải...</div>;
  if (!item) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Không tìm thấy bài viết</div>;

  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Policy;
  const readingTime = estimateReadingTime(item.content);

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

  const handleAccept = async () => {
    try {
      const updated = await itemsAPI.accept(item.id);
      setItem(updated);
      notify('Đã chấp nhận đề xuất ✅');
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

  const mdComponents = {
    h1: ({ children }) => (
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#e2e8f0', borderBottom: `2px solid ${cfg.accent}40`, paddingBottom: 8, marginBottom: 16, marginTop: 24, fontFamily: 'var(--font-heading)' }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ fontSize: 20, fontWeight: 700, color: cfg.accent, borderBottom: `1px solid ${cfg.accent}25`, paddingBottom: 6, marginBottom: 12, marginTop: 20, fontFamily: 'var(--font-heading)' }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#cbd5e1', marginBottom: 8, marginTop: 16 }}>{children}</h3>
    ),
    p: ({ children }) => (
      <p style={{ fontSize: 15, lineHeight: 1.85, color: '#cbd5e1', marginBottom: 14 }}>{children}</p>
    ),
    ul: ({ children }) => <ul style={{ paddingLeft: 22, marginBottom: 14 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ paddingLeft: 22, marginBottom: 14 }}>{children}</ol>,
    li: ({ children }) => (
      <li style={{ fontSize: 15, lineHeight: 1.8, color: '#cbd5e1', marginBottom: 4 }}>{children}</li>
    ),
    strong: ({ children }) => <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{children}</strong>,
    em: ({ children }) => <em style={{ color: '#94a3b8', fontStyle: 'italic' }}>{children}</em>,
    blockquote: ({ children }) => (
      <blockquote style={{
        borderLeft: `3px solid ${cfg.accent}`, padding: '10px 16px',
        color: 'var(--text-secondary)', fontStyle: 'italic', margin: '12px 0',
        background: `${cfg.accent}08`, borderRadius: '0 8px 8px 0',
      }}>
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      if (className) {
        return <code className={className} style={{ fontFamily: 'monospace', fontSize: 13 }}>{children}</code>;
      }
      return (
        <code style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '2px 6px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace' }}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre style={{ background: 'rgba(15,23,42,0.9)', borderRadius: 10, padding: 16, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th style={{ padding: '8px 12px', background: `${cfg.accent}15`, color: cfg.accent, fontWeight: 700, textAlign: 'left', borderBottom: `1px solid ${cfg.accent}30` }}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td style={{ padding: '8px 12px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{children}</td>
    ),
    hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '20px 0' }} />,
    a: ({ href, children }) => (
      <a href={href} style={{ color: cfg.accent, textDecoration: 'underline' }} target="_blank" rel="noreferrer">{children}</a>
    ),
  };

  return (
    <div className="slide-right">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-ghost" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Quay lại
        </button>
        <button className="btn-ghost" onClick={() => window.print()} style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          🖨 In / Xuất PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Main Content */}
        <div className="glass print-content" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ height: 4, background: `linear-gradient(90deg,${cfg.accent},${cfg.accent}60)` }} />

          {/* Header (hidden on print) */}
          <div className="no-print" style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ padding: '5px 14px', borderRadius: 8, background: `${cfg.accent}15`, color: cfg.accent, fontSize: 12, fontWeight: 800 }}>
                {cfg.icon} {item.type}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'monospace' }}>{item.id}</span>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                background: item.status === 'Published' ? 'rgba(34,197,94,0.12)' : item.status === 'Archived' ? 'rgba(107,114,128,0.12)' : item.status === 'Suggested' ? 'rgba(168,85,247,0.12)' : 'rgba(234,179,8,0.12)',
                color: item.status === 'Published' ? '#4ade80' : item.status === 'Archived' ? '#9ca3af' : item.status === 'Suggested' ? '#c084fc' : '#facc15',
              }}>{item.status}</span>
              <span style={{ fontSize: 11, color: cfg.accent, fontWeight: 700 }}>📖 {readingTime}</span>
              {item.isStale && item.status !== 'Archived' && (
                <span title="Chưa cập nhật hơn 12 tháng" style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: 'rgba(251,146,60,0.1)', color: '#fb923c' }}>⚠ Cần cập nhật</span>
              )}

              {isManager && item.status === 'Suggested' && (
                <button className="btn-ghost" style={{ padding: '3px 12px', fontSize: 11, color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }} onClick={handleAccept}>✓ Chấp nhận</button>
              )}
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

          {/* Print-only header */}
          <div className="print-only" style={{ padding: '20px 28px', borderBottom: '1px solid #ddd' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{item.type} · {item.id} · {item.status}</div>
            <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>{item.title}</h1>
            <div style={{ fontSize: 12, color: '#555' }}>
              Tác giả: {item.author} · Version: {item.version} · Cập nhật: {item.updatedDate}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 28px', maxWidth: '72ch' }}>
            {item.type === 'Checklist'
              ? <ChecklistView content={item.content} />
              : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSlug]}
                  components={mdComponents}
                >
                  {item.content}
                </ReactMarkdown>
              )
            }
          </div>
        </div>

        {/* Sidebar */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Table of Contents */}
          {item.type !== 'Checklist' && <TableOfContents content={item.content || ''} />}

          {/* Info */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Thông tin</h3>
            {[
              ['Tác giả', item.author],
              ['Version', 'v' + item.version],
              ['Thời gian đọc', readingTime],
              ['Đối tượng', item.audience],
              ['Ngày tạo', item.createdDate],
              ['Cập nhật', item.updatedDate],
              item.viewCount > 0 ? ['Lượt xem', `👁 ${item.viewCount}`] : null,
              item.suggestedBy ? ['Đề xuất bởi', item.suggestedBy] : null,
            ].filter(Boolean).map(([k, v], i, arr) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: k === 'Thời gian đọc' ? cfg.accent : 'var(--text-primary)' }}>{v}</span>
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
