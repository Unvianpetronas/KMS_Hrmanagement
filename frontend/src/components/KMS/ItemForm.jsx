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
    if (!form.content.trim()) update('content', TEMPLATES[type] || '');
  };

  const handleSubmit = async () => {
    const errs = {};
    if (!form.title.trim()) errs.title = true;
    if (!form.content.trim()) errs.content = true;
    if (form.tags.length === 0) errs.tags = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = { title: form.title, type: form.type, tags: form.tags, audience: form.audience, content: form.content };
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

  const previewComponents = {
    h2: ({ children }) => <h2 className="text-base font-semibold text-emerald-700 border-b border-emerald-100 pb-1 mb-2 mt-4">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-700 mb-1.5 mt-3">{children}</h3>,
    p: ({ children }) => <p className="text-sm text-slate-600 leading-relaxed mb-2">{children}</p>,
    ul: ({ children }) => <ul className="pl-5 mb-2 space-y-0.5">{children}</ul>,
    ol: ({ children }) => <ol className="pl-5 mb-2 space-y-0.5">{children}</ol>,
    li: ({ children }) => <li className="text-sm text-slate-600">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
    code: ({ children, className }) => className
      ? <code className="font-mono text-xs">{children}</code>
      : <code className="bg-slate-100 text-slate-700 px-1 rounded text-xs font-mono">{children}</code>,
    pre: ({ children }) => (
      <pre className="bg-slate-50 border border-gray-200 rounded p-3 text-xs text-slate-700 overflow-x-auto mb-2">
        {children}
      </pre>
    ),
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md fade-in">
      {/* Form header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {editItem ? '✏ Chỉnh sửa bài' : isManager ? '+ Tạo bài mới' : '💡 Đề xuất bài mới'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {editItem
              ? `Đang sửa: ${editItem.id}`
              : isManager
              ? 'Điền đầy đủ thông tin bên dưới'
              : 'Đề xuất sẽ được Manager xem xét trước khi xuất bản'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`btn-ghost text-xs ${showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? '📝 Sửa' : '👁 Preview'}
          </button>
          <button className="btn-ghost text-base px-2.5 py-1" onClick={onCancel}>×</button>
        </div>
      </div>

      <div className="p-6">
        {showPreview ? (
          /* Preview mode */
          <div className="bg-gray-50 border border-gray-200 rounded-md p-5 min-h-[200px]">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{form.title || 'Chưa có tiêu đề'}</h3>
            {form.type === 'Checklist'
              ? <ChecklistView content={form.content} />
              : <ReactMarkdown remarkPlugins={[remarkGfm]} components={previewComponents}>{form.content}</ReactMarkdown>
            }
          </div>
        ) : (
          /* Edit mode */
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="label">Tiêu đề *</label>
              <input
                className={`input ${errors.title ? 'input-error' : ''}`}
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Ví dụ: Chính sách nghỉ thai sản"
              />
            </div>

            {/* Type + Audience */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Loại bài</label>
                <select
                  className="input cursor-pointer"
                  value={form.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="Policy">📋 Policy / SOP</option>
                  <option value="FAQ">❓ FAQ</option>
                  <option value="Checklist">✅ Checklist</option>
                  <option value="Lesson">💡 Bài học kinh nghiệm</option>
                </select>
              </div>
              <div>
                <label className="label">Đối tượng</label>
                <input
                  className="input"
                  value={form.audience}
                  onChange={(e) => update('audience', e.target.value)}
                  placeholder="All employees"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="label">
                Tags *{' '}
                {errors.tags && (
                  <span className="text-red-500 normal-case font-normal">(chọn ít nhất 1)</span>
                )}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const color = TAG_COLORS[tag.name] || '#64748b';
                  const active = form.tags.includes(tag.name);
                  return (
                    <button
                      key={tag.name}
                      onClick={() => toggleTag(tag.name)}
                      title={tag.description || ''}
                      className="px-2.5 py-1 text-xs font-medium rounded border cursor-pointer transition-colors"
                      style={{
                        background: active ? `${color}12` : '#fff',
                        color: active ? color : '#6b7280',
                        borderColor: active ? `${color}40` : '#e5e7eb',
                        borderWidth: active ? 2 : 1,
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Nội dung *</label>
                {!form.content.trim() && (
                  <button
                    className="btn-ghost text-xs px-2 py-0.5"
                    onClick={() => update('content', TEMPLATES[form.type])}
                  >
                    📋 Dùng template
                  </button>
                )}
              </div>
              <textarea
                className={`input font-mono text-xs leading-relaxed resize-y ${errors.content ? 'input-error' : ''}`}
                value={form.content}
                onChange={(e) => update('content', e.target.value)}
                rows={14}
                placeholder={TEMPLATES[form.type]}
              />
              {form.type === 'Checklist' && (
                <div className="mt-1.5 text-xs text-slate-400">
                  Mỗi item bắt đầu bằng <code className="bg-slate-100 px-1 rounded">☐</code> hoặc{' '}
                  <code className="bg-slate-100 px-1 rounded">-</code> hoặc{' '}
                  <code className="bg-slate-100 px-1 rounded">1.</code>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button className="btn-ghost" onClick={onCancel}>Hủy</button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : editItem ? 'Cập nhật' : isManager ? 'Tạo bài mới' : 'Gửi đề xuất'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
