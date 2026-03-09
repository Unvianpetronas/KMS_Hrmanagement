import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TAG_COLORS } from '../../services/constants';
import { itemsAPI, tagsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../UI/Toast';
import ChecklistView from './ChecklistView';

const TEMPLATES = {
  Policy: `## Mục tiêu
[Nêu mục tiêu của chính sách]

## Phạm vi áp dụng
[Đối tượng áp dụng]

## Quy định chính
- **Quy định 1:** mô tả chi tiết
- **Quy định 2:** mô tả chi tiết
- **Quy định 3:** mô tả chi tiết

## Ví dụ tình huống
[Mô tả tình huống cụ thể]

## Liên hệ
Bộ phận HR – hr@company.vn – Ext. 1001`,
  FAQ: `## Câu hỏi
[Câu hỏi thường gặp]

## Trả lời
[Câu trả lời chi tiết, có thể dùng danh sách:]

- Điểm 1
- Điểm 2`,
  Checklist: `CHECKLIST TIÊU ĐỀ

☐ Bước 1: [Mô tả]
☐ Bước 2: [Mô tả]
☐ Bước 3: [Mô tả]
☐ Bước 4: [Mô tả]
☐ Bước 5: [Mô tả]`,
  Lesson: `## Bối cảnh
[Mô tả tình huống hoặc dự án phát sinh bài học]

## Điều đã làm
[Mô tả cách tiếp cận, hành động thực hiện]

## Kết quả & Bài học
- **Bài học 1:** mô tả cụ thể
- **Bài học 2:** mô tả cụ thể

## Khuyến nghị
[Những gì nên/không nên làm trong tương lai]`,
};

export default function ItemForm({ editItem, onDone, onCancel }) {
  const { notify } = useToast();
  const { isManager } = useAuth();
  const [form, setForm] = useState({
    title: editItem?.title || '',
    type: editItem?.type || 'Policy',
    tags: editItem?.tags || [],
    audience: editItem?.audience || '',
    content: editItem?.content || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    tagsAPI.getAll().then(setAvailableTags).catch(() => {});
  }, []);

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const toggleTag = (tag) =>
    update('tags', form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]);

  const handleTypeChange = (type) => {
    update('type', type);
    // Auto-fill template if content is empty
    if (!form.content.trim()) {
      update('content', TEMPLATES[type] || '');
    }
  };

  const handleSubmit = async () => {
    const errs = {};
    if (!form.title.trim()) errs.title = true;
    if (!form.content.trim()) errs.content = true;
    if (form.tags.length === 0) errs.tags = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        tags: form.tags,
        audience: form.audience,
        content: form.content,
      };

      if (editItem) {
        await itemsAPI.update(editItem.id, payload);
        notify('Cập nhật thành công! ✅');
      } else {
        await itemsAPI.create(payload);
        notify('Tạo bài mới thành công! 🎉');
      }
      onDone();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass fade-in" style={{ borderRadius: 'var(--radius-xl)', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{
            margin: 0, fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg,#a78bfa,#6366f1)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{editItem ? '✏ Chỉnh sửa bài' : isManager ? '＋ Tạo bài mới' : '💡 Đề xuất bài mới'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {editItem ? `Đang sửa: ${editItem.id}` : isManager ? 'Điền đầy đủ thông tin bên dưới' : 'Đề xuất sẽ được Manager xem xét trước khi xuất bản'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => setShowPreview(!showPreview)}
            style={showPreview ? { background: 'rgba(59,130,246,0.1)', color: '#60a5fa' } : {}}>
            {showPreview ? '📝 Sửa' : '👁 Preview'}
          </button>
          <button className="btn-ghost" onClick={onCancel} style={{ fontSize: 20, padding: '4px 12px' }}>×</button>
        </div>
      </div>

      {showPreview ? (
        /* PREVIEW MODE */
        <div style={{ padding: 20, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16, minHeight: 200 }}>
          <h3 style={{ marginBottom: 16, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{form.title || 'Chưa có tiêu đề'}</h3>
          {form.type === 'Checklist' ? (
            <ChecklistView content={form.content} />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => <h2 style={{ fontSize: 16, fontWeight: 700, color: '#60a5fa', borderBottom: '1px solid rgba(96,165,250,0.2)', paddingBottom: 4, marginBottom: 10, marginTop: 16 }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginBottom: 6, marginTop: 12 }}>{children}</h3>,
                p: ({ children }) => <p style={{ fontSize: 14, lineHeight: 1.8, color: '#cbd5e1', marginBottom: 10 }}>{children}</p>,
                ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 10 }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 10 }}>{children}</ol>,
                li: ({ children }) => <li style={{ fontSize: 14, lineHeight: 1.7, color: '#cbd5e1', marginBottom: 3 }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{children}</strong>,
                code: ({ children, className }) => className
                  ? <code style={{ fontFamily: 'monospace', fontSize: 12 }}>{children}</code>
                  : <code style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '1px 5px', borderRadius: 3, fontSize: 12, fontFamily: 'monospace' }}>{children}</code>,
                pre: ({ children }) => <pre style={{ background: 'rgba(15,23,42,0.8)', borderRadius: 8, padding: 12, fontSize: 12, lineHeight: 1.6, overflowX: 'auto', marginBottom: 12 }}>{children}</pre>,
              }}
            >
              {form.content}
            </ReactMarkdown>
          )}
        </div>
      ) : (
        /* EDIT MODE */
        <div style={{ display: 'grid', gap: 18 }}>
          {/* Title */}
          <div>
            <label className="label">Tiêu đề *</label>
            <input className={`input ${errors.title ? 'input-error' : ''}`} value={form.title}
              onChange={(e) => update('title', e.target.value)} placeholder="Ví dụ: Chính sách nghỉ thai sản" />
          </div>

          {/* Type + Audience */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Loại bài</label>
              <select className="input" value={form.type} onChange={(e) => handleTypeChange(e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="Policy">📋 Policy / SOP</option>
                <option value="FAQ">❓ FAQ</option>
                <option value="Checklist">✅ Checklist</option>
                <option value="Lesson">💡 Bài học kinh nghiệm</option>
              </select>
            </div>
            <div>
              <label className="label">Đối tượng</label>
              <input className="input" value={form.audience}
                onChange={(e) => update('audience', e.target.value)} placeholder="All employees" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label">
              Tags * {errors.tags && <span style={{ color: 'var(--accent-red)', textTransform: 'none' }}>(chọn ít nhất 1)</span>}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {availableTags.map((tag) => {
                const color = TAG_COLORS[tag.name] || '#94a3b8';
                const active = form.tags.includes(tag.name);
                return (
                  <button key={tag.name} onClick={() => toggleTag(tag.name)} title={tag.description || ''} style={{
                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.3s',
                    border: `2px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
                    background: active ? `${color}15` : 'transparent',
                    color: active ? color : 'var(--text-dim)',
                    fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
                  }}>{tag.name}</button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label className="label" style={{ margin: 0 }}>Nội dung *</label>
              {!form.content.trim() && (
                <button className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }}
                  onClick={() => update('content', TEMPLATES[form.type])}>
                  📋 Dùng template
                </button>
              )}
            </div>
            <textarea
              className={`input ${errors.content ? 'input-error' : ''}`}
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              rows={12}
              style={{ resize: 'vertical', lineHeight: 1.7 }}
              placeholder={TEMPLATES[form.type]}
            />
            {form.type === 'Checklist' && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
                💡 Mỗi item bắt đầu bằng <code style={{ color: '#4ade80' }}>☐</code> hoặc <code style={{ color: '#4ade80' }}>-</code> hoặc <code style={{ color: '#4ade80' }}>1.</code>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={onCancel}>Hủy</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Đang lưu...' : editItem ? 'Cập nhật' : isManager ? 'Tạo bài mới' : 'Gửi đề xuất'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
