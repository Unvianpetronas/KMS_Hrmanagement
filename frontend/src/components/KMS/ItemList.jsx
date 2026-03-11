import { useState, useEffect, useCallback, useRef } from 'react';
import { itemsAPI, tagsAPI } from '../../services/api';
import { TAG_COLORS, TYPE_CONFIG } from '../../services/constants';
import { useToast } from '../UI/Toast';
import ItemCard from './ItemCard';

export default function ItemList({ onSelect, onEdit, refreshKey }) {
  const { notify } = useToast();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterTags, setFilterTags] = useState([]);
  const [filterStale, setFilterStale] = useState(false);
  const [sortBy, setSortBy] = useState('updated');
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState([]);
  const debounceTimer = useRef(null);

  useEffect(() => {
    tagsAPI.getAll().then(setAvailableTags).catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  const stableNotify = useCallback(notify, []); // eslint-disable-line

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (filterStale) {
        data = await itemsAPI.getStale(12);
      } else {
        const hasFilters = debouncedSearch || filterType !== 'All' || filterTags.length > 0;
        data = hasFilters
          ? await itemsAPI.search({ query: debouncedSearch, type: filterType, tags: filterTags, sort: sortBy })
          : await itemsAPI.getAll(sortBy);
      }
      setItems(data);
    } catch (err) {
      stableNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterType, filterTags, sortBy, filterStale, stableNotify]);

  useEffect(() => { fetchItems(); }, [fetchItems, refreshKey]);

  const handlePublish = async (id) => {
    try { await itemsAPI.publish(id); notify('Đã publish ✅'); fetchItems(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm(`Xóa bài "${id}"?`)) return;
    try { await itemsAPI.delete(id); notify('Đã xóa thành công'); fetchItems(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleAccept = async (id) => {
    try { await itemsAPI.accept(id); notify('Đã chấp nhận đề xuất ✅'); fetchItems(); }
    catch (err) { notify(err.message, 'error'); }
  };

  const toggleTag = (tag) => {
    setFilterTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);
  };

  return (
    <div className="fade-in">
      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-md p-4 mb-4">
        {/* Search + sort row */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              className="input pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề, nội dung, ID..."
            />
          </div>
          <select
            className="input w-auto cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="updated">Mới nhất</option>
            <option value="rating">Rating cao</option>
            <option value="title">A → Z</option>
          </select>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">Loại:</span>
          {['All', 'Policy', 'FAQ', 'Checklist', 'Lesson'].map((t) => {
            const isActive = filterType === t && !filterStale;
            const accent = t === 'All' ? '#047857' : TYPE_CONFIG[t]?.accent;
            return (
              <button
                key={t}
                onClick={() => { setFilterType(t); setFilterStale(false); }}
                className="px-2.5 py-1 text-xs font-medium rounded border cursor-pointer transition-colors"
                style={{
                  background: isActive ? `${accent}10` : '#fff',
                  color: isActive ? accent : '#6b7280',
                  borderColor: isActive ? `${accent}40` : '#e5e7eb',
                }}
              >
                {t === 'All' ? 'Tất cả' : `${TYPE_CONFIG[t].icon} ${t}`}
              </button>
            );
          })}

          {/* Stale filter */}
          <button
            onClick={() => { setFilterStale((p) => !p); setFilterType('All'); }}
            className="px-2.5 py-1 text-xs font-medium rounded border cursor-pointer transition-colors"
            style={{
              background: filterStale ? '#fffbeb' : '#fff',
              color: filterStale ? '#92400e' : '#6b7280',
              borderColor: filterStale ? '#fde68a' : '#e5e7eb',
            }}
          >
            ⚠ Stale
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-gray-200 mx-1" />

          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">Tags:</span>
          {availableTags.map((tag) => {
            const color = TAG_COLORS[tag.name] || '#64748b';
            const active = filterTags.includes(tag.name);
            return (
              <button
                key={tag.name}
                onClick={() => toggleTag(tag.name)}
                title={tag.description || ''}
                className="px-2 py-0.5 text-xs font-medium rounded border cursor-pointer transition-colors"
                style={{
                  background: active ? `${color}10` : '#fff',
                  color: active ? color : '#6b7280',
                  borderColor: active ? `${color}40` : '#e5e7eb',
                }}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Count line */}
      <div className="mb-3 text-sm text-slate-500">
        <strong className="text-slate-900">{items.length}</strong> bài tri thức
        {filterStale && (
          <span className="ml-2 text-amber-700 text-xs font-semibold">
            ⚠ Đang xem bài chưa cập nhật &gt;12 tháng
          </span>
        )}
        {loading && <span className="ml-2 text-xs">⏳ Đang tải...</span>}
      </div>

      {/* Grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
        {items.map((item, i) => (
          <ItemCard
            key={item.id}
            item={item}
            index={i}
            onClick={onSelect}
            onPublish={handlePublish}
            onEdit={onEdit}
            onDelete={handleDelete}
            onAccept={handleAccept}
          />
        ))}
      </div>

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-sm font-semibold text-slate-500">Không tìm thấy bài nào</div>
          <div className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa</div>
        </div>
      )}
    </div>
  );
}
