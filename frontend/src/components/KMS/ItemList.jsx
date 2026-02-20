import { useState, useEffect, useCallback } from 'react';
import { itemsAPI } from '../../services/api';
import { ALL_TAGS, TAG_COLORS, TYPE_CONFIG } from '../../services/constants';
import { useToast } from '../UI/Toast';
import ItemCard from './ItemCard';

export default function ItemList({ onSelect, onEdit, refreshKey }) {
  const { notify } = useToast();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterTags, setFilterTags] = useState([]);
  const [sortBy, setSortBy] = useState('updated');
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const hasFilters = search || filterType !== 'All' || filterTags.length > 0;
      let data;
      if (hasFilters) {
        data = await itemsAPI.search({ query: search, type: filterType, tags: filterTags, sort: sortBy });
      } else {
        data = await itemsAPI.getAll(sortBy);
      }
      setItems(data);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterTags, sortBy, notify]);

  useEffect(() => { fetchItems(); }, [fetchItems, refreshKey]);

  const handlePublish = async (id) => {
    try {
      await itemsAPI.publish(id);
      notify('Đã publish ✅');
      fetchItems();
    } catch (err) { notify(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Xóa bài "${id}"?`)) return;
    try {
      await itemsAPI.delete(id);
      notify('Đã xóa thành công');
      fetchItems();
    } catch (err) { notify(err.message, 'error'); }
  };

  const toggleTag = (tag) => {
    setFilterTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);
  };

  return (
    <div className="fade-in">
      {/* Search & Filter Bar */}
      <div className="glass" style={{ borderRadius: 16, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, opacity: 0.3 }}>🔍</span>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề, nội dung, ID..."
              style={{ paddingLeft: 42 }}
            />
          </div>
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 'auto', cursor: 'pointer' }}>
            <option value="updated">Mới nhất</option>
            <option value="rating">Rating cao</option>
            <option value="title">A → Z</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginRight: 4 }}>Loại:</span>
          {['All', 'Policy', 'FAQ', 'Checklist'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                padding: '5px 14px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.3s',
                border: `1px solid ${filterType === t ? (t === 'All' ? '#6366f1' : TYPE_CONFIG[t]?.accent) : 'rgba(255,255,255,0.08)'}`,
                background: filterType === t ? `${t === 'All' ? '#6366f1' : TYPE_CONFIG[t]?.accent}12` : 'transparent',
                color: filterType === t ? (t === 'All' ? '#a78bfa' : TYPE_CONFIG[t]?.accent) : 'var(--text-dim)',
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
              }}
            >
              {t === 'All' ? 'Tất cả' : `${TYPE_CONFIG[t].icon} ${t}`}
            </button>
          ))}

          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.06)', margin: '0 6px' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginRight: 4 }}>Tags:</span>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                padding: '4px 11px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.3s',
                border: `1px solid ${filterTags.includes(tag) ? TAG_COLORS[tag] + '50' : 'rgba(255,255,255,0.06)'}`,
                background: filterTags.includes(tag) ? `${TAG_COLORS[tag]}12` : 'transparent',
                color: filterTags.includes(tag) ? TAG_COLORS[tag] : '#374151',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)',
              }}
            >{tag}</button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>{items.length}</strong> bài tri thức
        {loading && <span style={{ marginLeft: 8, fontSize: 12 }}>⏳ Đang tải...</span>}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(370px,1fr))', gap: 16 }}>
        {items.map((item, i) => (
          <ItemCard
            key={item.id}
            item={item}
            index={i}
            onClick={onSelect}
            onPublish={handlePublish}
            onEdit={onEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Không tìm thấy bài nào</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Thử thay đổi bộ lọc hoặc từ khóa</div>
        </div>
      )}
    </div>
  );
}
