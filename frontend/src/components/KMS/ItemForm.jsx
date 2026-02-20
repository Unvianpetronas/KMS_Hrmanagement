import { useState } from 'react';
import { ALL_TAGS, TAG_COLORS } from '../../services/constants';
import { itemsAPI } from '../../services/api';
import { useToast } from '../UI/Toast';
import ChecklistView from './ChecklistView';

const TEMPLATES = {
  Policy: `MỤC TIÊU: [Mục tiêu của chính sách]

PHẠM VI: [Đối tượng áp dụng]

QUY ĐỊNH CHÍNH:
• [Quy định 1]
• [Quy định 2]
• [Quy định 3]

VÍ DỤ TÌNH HUỐNG: [Mô tả tình huống cụ thể]

LIÊN HỆ: [Bộ phận] – [Email] – [Ext]`,
  FAQ: `HỎI: [Câu hỏi thường gặp]

ĐÁP: [Câu trả lời chi tiết]`,
  Checklist: `CHECKLIST TIÊU ĐỀ

☐ Bước 1: [Mô tả]
☐ Bước 2: [Mô tả]
☐ Bước 3: [Mô tả]
☐ Bước 4: [Mô tả]
☐ Bước 5: [Mô tả]`,
};

export default function ItemForm({ editItem, onDone, onCancel }) {
  const { notify } = useToast();
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
          }}>{editItem ? '✏ Chỉnh sửa bài' : '＋ Tạo bài mới'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {editItem ? `Đang sửa: ${editItem.id}` : 'Điền đầy đủ thông tin bên dưới'}
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
          <h3 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>{form.title || 'Chưa có tiêu đề'}</h3>
          {form.type === 'Checklist' ? (
            <ChecklistView content={form.content} />
          ) : (
            form.content.split('\n').map((line, i) => {
              if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
              const isSection = line.match(/^(MỤC TIÊU|PHẠM VI|QUY ĐỊNH CHÍNH|VÍ DỤ TÌNH HUỐNG|LIÊN HỆ|HỎI|ĐÁP):/);
              if (isSection) return <div key={i} style={{ fontSize: 12, fontWeight: 900, color: '#3b82f6', marginTop: i ? 16 : 0, textTransform: 'uppercase', letterSpacing: 1 }}>{line}</div>;
              if (line.startsWith('•')) return <div key={i} style={{ fontSize: 14, lineHeight: 1.8, color: '#cbd5e1', paddingLeft: 8 }}>● {line.slice(2)}</div>;
              return <div key={i} style={{ fontSize: 14, lineHeight: 1.8, color: '#cbd5e1' }}>{line}</div>;
            })
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
              {ALL_TAGS.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)} style={{
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.3s',
                  border: `2px solid ${form.tags.includes(tag) ? TAG_COLORS[tag] : 'rgba(255,255,255,0.08)'}`,
                  background: form.tags.includes(tag) ? `${TAG_COLORS[tag]}15` : 'transparent',
                  color: form.tags.includes(tag) ? TAG_COLORS[tag] : 'var(--text-dim)',
                  fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
                }}>{tag}</button>
              ))}
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
              {loading ? 'Đang lưu...' : editItem ? 'Cập nhật' : 'Tạo bài mới'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
