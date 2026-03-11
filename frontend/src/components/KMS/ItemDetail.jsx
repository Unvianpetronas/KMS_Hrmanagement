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
    .filter((line) => /^#{2,3}\s/.test(line))
    .map((line) => ({
      level: line.startsWith('###') ? 3 : 2,
      text: line.replace(/^#{2,3}\s+/, '').trim(),
    }));

  if (headings.length < 3) return null;

  const scrollTo = (text) => {
    const els = document.querySelectorAll('h1, h2, h3');
    const target = Array.from(els).find((el) => el.textContent.trim() === text);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Mục lục</h3>
      <div className="space-y-0.5">
        {headings.map((h, i) => (
          <button
            key={i}
            onClick={() => scrollTo(h.text)}
            className="block w-full text-left text-xs text-slate-500 hover:text-emerald-700 py-1 border-0 bg-transparent cursor-pointer border-l-2 border-gray-200 hover:border-emerald-500 transition-colors"
            style={{ paddingLeft: h.level === 3 ? 16 : 8, fontWeight: h.level === 2 ? 600 : 400 }}
          >
            {h.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Published: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    Draft:     { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
    Archived:  { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
    Suggested: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span
      className="text-xs font-semibold rounded px-2 py-0.5"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  );
}

export default function ItemDetail({ itemId, onBack, onNavigate, onEdit }) {
  const { isManager, isAdmin } = useAuth();
  const { notify } = useToast();
  const [item, setItem] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([itemsAPI.getById(itemId), itemsAPI.getMyRating(itemId)])
      .then(([data, myRating]) => {
        setItem(data);
        setUserRating(myRating.stars || 0);
        setHasRated(myRating.hasRated || false);
        itemsAPI.recordView(itemId);
      })
      .catch((err) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [itemId, notify]);

  if (loading) return <div className="text-center py-16 text-slate-400">⏳ Đang tải...</div>;
  if (!item)   return <div className="text-center py-16 text-slate-400">Không tìm thấy bài viết</div>;

  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Policy;
  const readingTime = estimateReadingTime(item.content);

  const handleRate    = async (stars) => {
    try { const u = await itemsAPI.rate(item.id, stars); setItem(u); setUserRating(stars); setHasRated(true); notify(hasRated ? 'Đã cập nhật đánh giá ⭐' : 'Đã đánh giá ⭐'); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleComment = async () => {
    if (!commentText.trim()) return;
    try { const u = await itemsAPI.addComment(item.id, commentText); setItem(u); setCommentText(''); notify('Đã thêm bình luận 💬'); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handlePublish = async () => {
    try { setItem(await itemsAPI.publish(item.id)); notify('Đã publish ✅'); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleArchive = async () => {
    try { setItem(await itemsAPI.archive(item.id)); notify('Đã archive 📦'); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleAccept  = async () => {
    try { setItem(await itemsAPI.accept(item.id)); notify('Đã chấp nhận đề xuất ✅'); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleDelete  = async () => {
    if (!window.confirm(`Xóa "${item.id}"?`)) return;
    try { await itemsAPI.delete(item.id); notify('Đã xóa'); onBack(); }
    catch (err) { notify(err.message, 'error'); }
  };

  // Markdown component map — clean flat enterprise styling
  const mdComponents = {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-slate-900 border-b border-gray-200 pb-2 mb-4 mt-6">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-semibold pb-1.5 mb-3 mt-5 border-b"
        style={{ color: cfg.accent, borderColor: `${cfg.accent}25` }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-semibold text-slate-700 mb-2 mt-4">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-sm text-slate-600 leading-relaxed mb-3">{children}</p>
    ),
    ul: ({ children }) => <ul className="pl-5 mb-3 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="pl-5 mb-3 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-sm text-slate-600 leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
    em: ({ children }) => <em className="italic text-slate-500">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote
        className="pl-4 py-2 my-3 text-sm text-slate-600 italic"
        style={{ borderLeft: `3px solid ${cfg.accent}`, background: `${cfg.accent}06` }}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => className
      ? <code className={`${className} font-mono text-xs`}>{children}</code>
      : <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
    pre: ({ children }) => (
      <pre className="bg-slate-50 border border-gray-200 rounded-md p-4 overflow-x-auto text-xs text-slate-700 leading-relaxed mb-3">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse border border-gray-200">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th
        className="px-3 py-2 text-left text-xs font-semibold border-b border-gray-200"
        style={{ background: `${cfg.accent}10`, color: cfg.accent }}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-slate-600 border-b border-gray-100 text-sm">{children}</td>
    ),
    hr: () => <hr className="border-t border-gray-200 my-5" />,
    a: ({ href, children }) => (
      <a href={href} style={{ color: cfg.accent }} className="underline" target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
  };

  const infoRows = [
    ['Tác giả', item.author],
    ['Version', 'v' + item.version],
    ['Thời gian đọc', readingTime],
    ['Đối tượng', item.audience],
    ['Ngày tạo', item.createdDate],
    ['Cập nhật', item.updatedDate],
    item.viewCount > 0 ? ['Lượt xem', `👁 ${item.viewCount}`] : null,
    item.suggestedBy ? ['Đề xuất bởi', item.suggestedBy] : null,
  ].filter(Boolean);

  return (
    <div className="slide-right">
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between mb-4">
        <button className="btn-ghost gap-1.5" onClick={onBack}>← Quay lại</button>
        <button className="btn-ghost text-xs" onClick={() => window.print()}>🖨 In / Xuất PDF</button>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 340px' }}>
        {/* Main content */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden print-content">
          {/* Accent line */}
          <div className="h-[3px]" style={{ background: cfg.accent }} />

          {/* Header */}
          <div className="no-print px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {/* Type */}
              <span
                className="text-xs font-semibold rounded px-2 py-0.5"
                style={{ background: `${cfg.accent}12`, color: cfg.accent, border: `1px solid ${cfg.accent}25` }}
              >
                {cfg.icon} {item.type}
              </span>
              {/* ID */}
              <span className="text-xs text-slate-400 font-mono">{item.id}</span>
              {/* Status */}
              <StatusBadge status={item.status} />
              {/* Reading time */}
              <span className="text-xs font-medium" style={{ color: cfg.accent }}>📖 {readingTime}</span>
              {/* Stale */}
              {item.isStale && item.status !== 'Archived' && (
                <span className="text-xs font-semibold rounded px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                  ⚠ Cần cập nhật
                </span>
              )}
              {/* Actions */}
              {isManager && item.status === 'Suggested' && (
                <button
                  className="btn-ghost px-2 py-0.5 text-xs"
                  style={{ color: '#6d28d9', borderColor: '#ddd6fe' }}
                  onClick={handleAccept}
                >
                  ✓ Chấp nhận
                </button>
              )}
              {isManager && item.status === 'Draft' && (
                <button className="btn-ghost btn-success px-2 py-0.5 text-xs" onClick={handlePublish}>
                  Publish
                </button>
              )}
              {isManager && (
                <button className="btn-ghost px-2 py-0.5 text-xs" onClick={() => onEdit(item)}>✏ Sửa</button>
              )}
              {isAdmin && item.status !== 'Archived' && (
                <button
                  className="btn-ghost px-2 py-0.5 text-xs"
                  style={{ color: '#b45309', borderColor: '#fde68a' }}
                  onClick={handleArchive}
                >
                  📦 Archive
                </button>
              )}
              {isManager && (
                <button className="btn-ghost btn-danger px-2 py-0.5 text-xs" onClick={handleDelete}>🗑 Xóa</button>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-snug mb-3">{item.title}</h1>
            <div className="flex flex-wrap gap-1.5">
              {item.tags?.map((t) => <TagBadge key={t} tag={t} />)}
            </div>
          </div>

          {/* Print-only header */}
          <div className="print-only px-6 py-4 border-b border-gray-200">
            <div className="text-xs text-slate-500 mb-1">{item.type} · {item.id} · {item.status}</div>
            <h1 className="text-2xl font-bold mb-1">{item.title}</h1>
            <div className="text-xs text-slate-500">
              Tác giả: {item.author} · Version: {item.version} · Cập nhật: {item.updatedDate}
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5" style={{ maxWidth: '72ch' }}>
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
        <div className="no-print flex flex-col gap-3">
          {/* TOC */}
          {item.type !== 'Checklist' && <TableOfContents content={item.content || ''} />}

          {/* Info panel */}
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thông tin</h3>
            {infoRows.map(([k, v], i) => (
              <div
                key={k}
                className={`flex justify-between py-2 ${i < infoRows.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="text-xs text-slate-400">{k}</span>
                <span
                  className="text-xs font-semibold text-slate-900"
                  style={k === 'Thời gian đọc' ? { color: cfg.accent } : {}}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>

          {/* Rating */}
          <div className="bg-white border border-gray-200 rounded-md p-4 text-center">
            <div className="text-3xl font-bold text-amber-500 leading-none">{item.rating?.toFixed(1)}</div>
            <div className="mt-1"><Stars rating={item.rating} size={20} /></div>
            <div className="text-xs text-slate-400 mt-1">{item.ratingCount} đánh giá</div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-slate-400 mb-2">
                {hasRated ? 'Cập nhật đánh giá' : 'Đánh giá của bạn'}
              </div>
              <Stars rating={userRating} onRate={handleRate} size={26} />
              {hasRated && (
                <div className="text-xs text-slate-400 mt-1">Bạn đã chọn {userRating} sao</div>
              )}
            </div>
          </div>

          {/* Related */}
          {item.relatedItems?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Liên quan</h3>
              {item.relatedItems.map((rid) => (
                <div
                  key={rid}
                  onClick={() => onNavigate(rid)}
                  className="px-3 py-2 mb-1.5 rounded border border-gray-200 hover:border-emerald-300 cursor-pointer transition-colors text-xs font-mono font-semibold"
                  style={{ color: cfg.accent }}
                >
                  {rid}
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Bình luận ({item.comments?.length || 0})
            </h3>
            {item.comments?.map((c, i) => (
              <div
                key={i}
                className={`py-3 ${i < item.comments.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: cfg.accent }}
                  >
                    {c.userName?.split(' ').pop()?.[0] || '?'}
                  </div>
                  <span className="text-xs font-semibold text-slate-900">{c.userName}</span>
                  <span className="text-xs text-slate-400">{c.createdDate}</span>
                </div>
                <div className="text-sm text-slate-600 leading-relaxed pl-8">{c.text}</div>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <input
                className="input flex-1"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                placeholder="Viết bình luận..."
              />
              <button className="btn-primary px-4" onClick={handleComment}>Gửi</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
