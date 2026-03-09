import { useState, useEffect } from 'react';
import { authAPI, tagsAPI, itemsAPI } from '../../services/api';
import { useToast } from '../UI/Toast';
import { ROLE_COLORS, TAG_COLORS } from '../../services/constants';

export default function AdminPanel() {
  const { notify } = useToast();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create user form
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', email: '', department: '', role: 'USER' });

  // Change password form
  const [changePw, setChangePw] = useState({ userId: '', newPassword: '' });

  // Tags state
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState({ name: '', description: '' });
  const [editingTag, setEditingTag] = useState(null); // { originalName, name, description }

  const fetchTags = async () => {
    try {
      const data = await tagsAPI.getAll();
      setTags(data);
    } catch (err) { notify(err.message, 'error'); }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) { notify('Tên tag không được để trống', 'error'); return; }
    try {
      await tagsAPI.create(newTag);
      notify(`Tạo tag "${newTag.name}" thành công!`);
      setNewTag({ name: '', description: '' });
      fetchTags();
    } catch (err) { notify(err.message, 'error'); }
  };

  const handleUpdateTag = async () => {
    if (!editingTag.name.trim()) { notify('Tên tag không được để trống', 'error'); return; }
    try {
      await tagsAPI.update(editingTag.originalName, { name: editingTag.name, description: editingTag.description });
      notify(`Cập nhật tag thành công!`);
      setEditingTag(null);
      fetchTags();
    } catch (err) { notify(err.message, 'error'); }
  };

  const handleDeleteTag = async (tagName) => {
    if (!window.confirm(`Xóa tag "${tagName}"?`)) return;
    try {
      await tagsAPI.delete(tagName);
      notify(`Đã xóa tag "${tagName}"`);
      fetchTags();
    } catch (err) { notify(err.message, 'error'); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await authAPI.getUsers();
      setUsers(data);
    } catch (err) { notify(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); fetchTags(); }, []);

  // Toggle active status
  const toggleActive = async (user) => {
    try {
      await authAPI.updateUser(user.id, { active: !user.active });
      notify(`${user.active ? 'Vô hiệu hóa' : 'Kích hoạt'} ${user.username}`);
      fetchUsers();
    } catch (err) { notify(err.message, 'error'); }
  };

  // Delete user
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Xóa user "${user.username}"? Thao tác không thể hoàn tác.`)) return;
    try {
      await authAPI.deleteUser(user.id);
      notify(`Đã xóa ${user.username}`);
      fetchUsers();
    } catch (err) { notify(err.message, 'error'); }
  };

  // Create user
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      notify('Vui lòng điền Username, Password, Họ tên', 'error');
      return;
    }
    try {
      await authAPI.createUser(newUser);
      notify(`Tạo user "${newUser.username}" thành công! 🎉`);
      setNewUser({ username: '', password: '', fullName: '', email: '', department: '', role: 'USER' });
      fetchUsers();
    } catch (err) { notify(err.message, 'error'); }
  };

  // Change password (admin — no old password needed)
  const handleChangePassword = async () => {
    if (!changePw.userId || !changePw.newPassword) {
      notify('Chọn user và nhập mật khẩu mới', 'error');
      return;
    }
    try {
      await authAPI.changePassword(changePw.userId, changePw.newPassword);
      const target = users.find((u) => u.id === Number(changePw.userId));
      notify(`Đã đổi password cho ${target?.username || 'user'} ✅`);
      setChangePw({ userId: '', newPassword: '' });
    } catch (err) { notify(err.message, 'error'); }
  };

  // Bulk archive state
  const [staleItems, setStaleItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [staleLoading, setStaleLoading] = useState(false);

  const fetchStaleItems = async () => {
    setStaleLoading(true);
    try {
      const data = await itemsAPI.getStale(12);
      setStaleItems(data);
      setSelectedIds(new Set());
    } catch (err) { notify(err.message, 'error'); }
    finally { setStaleLoading(false); }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) { notify('Chọn ít nhất 1 bài', 'error'); return; }
    if (!window.confirm(`Archive ${selectedIds.size} bài đã chọn?`)) return;
    try {
      await itemsAPI.bulkArchive([...selectedIds]);
      notify(`Đã archive ${selectedIds.size} bài 📦`);
      fetchStaleItems();
    } catch (err) { notify(err.message, 'error'); }
  };

  const TABS = [
    { key: 'users', label: '👥 Danh sách Users' },
    { key: 'adduser', label: '➕ Tạo User' },
    { key: 'changepass', label: '🔑 Đổi Password' },
    { key: 'tags', label: '🏷 Quản lý Tags' },
    { key: 'bulkarchive', label: '📦 Bulk Archive' },
  ];

  return (
    <div className="glass fade-in" style={{ borderRadius: 'var(--radius-xl)', padding: 32 }}>
      {/* Header */}
      <h2 style={{
        margin: '0 0 24px', fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-heading)',
        background: 'linear-gradient(135deg,#f87171,#fb923c)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>⚙ Quản trị hệ thống</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map((t) => (
          <button key={t.key} className="btn-ghost"
            onClick={() => setTab(t.key)}
            style={tab === t.key ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ========== USER LIST ========== */}
      {tab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⏳ Đang tải...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
              <thead>
                <tr>
                  {['ID', 'Username', 'Họ tên', 'Email', 'Dept', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="glass-light" style={{ borderRadius: 12 }}>
                    <td style={{ padding: '12px 14px', borderRadius: '12px 0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{u.id}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{u.username}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{u.fullName}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{u.department}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                        background: ROLE_COLORS[u.role]?.bg, color: ROLE_COLORS[u.role]?.color,
                      }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: 99, display: 'inline-block',
                        background: u.active ? '#22c55e' : '#ef4444',
                        boxShadow: u.active ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(239,68,68,0.5)',
                      }} />
                      <span style={{ fontSize: 11, marginLeft: 6, color: u.active ? '#4ade80' : '#f87171' }}>
                        {u.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', borderRadius: '0 12px 12px 0' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => toggleActive(u)}>
                          {u.active ? 'Disable' : 'Enable'}
                        </button>
                        <button className="btn-ghost btn-danger" style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleDeleteUser(u)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========== CREATE USER ========== */}
      {tab === 'adduser' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
          {[
            ['username', 'Username *', 'text'],
            ['password', 'Password *', 'password'],
            ['fullName', 'Họ tên *', 'text'],
            ['email', 'Email', 'text'],
            ['department', 'Phòng ban', 'text'],
          ].map(([key, label, type]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                className="input" type={type}
                value={newUser[key]}
                onChange={(e) => setNewUser((p) => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="label">Role</label>
            <select className="input" value={newUser.role}
              onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
              style={{ cursor: 'pointer' }}>
              <option value="USER">USER</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <button className="btn-primary" onClick={handleCreateUser}>Tạo User</button>
          </div>
        </div>
      )}

      {/* ========== TAGS ========== */}
      {tab === 'tags' && (
        <div>
          {/* Create tag form */}
          <div className="glass-light" style={{ borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Tạo tag mới</h4>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: '0 0 160px' }}>
                <label className="label">Tên tag *</label>
                <input className="input" value={newTag.name}
                  onChange={(e) => setNewTag((p) => ({ ...p, name: e.target.value }))}
                  placeholder="vd: recruitment" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Mô tả</label>
                <input className="input" value={newTag.description}
                  onChange={(e) => setNewTag((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả ngắn về tag này" />
              </div>
              <button className="btn-primary" onClick={handleCreateTag} style={{ whiteSpace: 'nowrap' }}>Tạo tag</button>
            </div>
          </div>

          {/* Tag list */}
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
            <thead>
              <tr>
                {['ID', 'Tên tag', 'Mô tả', 'Ngày tạo', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => {
                const color = TAG_COLORS[tag.name] || '#94a3b8';
                const isEditing = editingTag?.originalName === tag.name;
                return (
                  <tr key={tag.id} className="glass-light" style={{ borderRadius: 12 }}>
                    <td style={{ padding: '12px 14px', borderRadius: '12px 0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{tag.id}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {isEditing ? (
                        <input className="input" value={editingTag.name} style={{ padding: '4px 8px', fontSize: 12 }}
                          onChange={(e) => setEditingTag((p) => ({ ...p, name: e.target.value }))} />
                      ) : (
                        <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: `${color}15`, color }}>{tag.name}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {isEditing ? (
                        <input className="input" value={editingTag.description} style={{ padding: '4px 8px', fontSize: 12 }}
                          onChange={(e) => setEditingTag((p) => ({ ...p, description: e.target.value }))} />
                      ) : (
                        tag.description || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{tag.createdDate || '—'}</td>
                    <td style={{ padding: '12px 14px', borderRadius: '0 12px 12px 0' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {isEditing ? (
                          <>
                            <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11, color: '#4ade80' }}
                              onClick={handleUpdateTag}>Lưu</button>
                            <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}
                              onClick={() => setEditingTag(null)}>Hủy</button>
                          </>
                        ) : (
                          <>
                            <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}
                              onClick={() => setEditingTag({ originalName: tag.name, name: tag.name, description: tag.description || '' })}>Sửa</button>
                            <button className="btn-ghost btn-danger" style={{ padding: '4px 10px', fontSize: 11 }}
                              onClick={() => handleDeleteTag(tag.name)}>Xóa</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tags.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)', fontSize: 13 }}>Chưa có tag nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========== BULK ARCHIVE ========== */}
      {tab === 'bulkarchive' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Bài chưa cập nhật hơn 12 tháng — chọn và archive hàng loạt
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={fetchStaleItems} style={{ fontSize: 12 }}>
                🔄 Tải danh sách
              </button>
              {selectedIds.size > 0 && (
                <button className="btn-ghost btn-danger" onClick={handleBulkArchive} style={{ fontSize: 12 }}>
                  📦 Archive {selectedIds.size} bài đã chọn
                </button>
              )}
            </div>
          </div>

          {staleLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⏳ Đang tải...</div>
          ) : staleItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              {staleItems.length === 0 && selectedIds.size === 0 ? 'Nhấn "Tải danh sách" để xem bài stale' : '✅ Không có bài stale nào'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    <input type="checkbox"
                      checked={selectedIds.size === staleItems.length && staleItems.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(staleItems.map(i => i.id)) : new Set())}
                    />
                  </th>
                  {['ID', 'Tiêu đề', 'Loại', 'Cập nhật lần cuối', 'Trạng thái'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staleItems.map((item) => (
                  <tr key={item.id} className="glass-light" style={{ borderRadius: 12, opacity: selectedIds.has(item.id) ? 1 : 0.7 }}>
                    <td style={{ padding: '12px 14px', borderRadius: '12px 0 0 12px' }}>
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: '#f97316', fontWeight: 700 }}>{item.id}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{item.title}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{item.type}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#fb923c' }}>{item.updatedDate}</td>
                    <td style={{ padding: '12px 14px', borderRadius: '0 12px 12px 0', fontSize: 12, color: 'var(--text-secondary)' }}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========== CHANGE PASSWORD (Admin, no old password) ========== */}
      {tab === 'changepass' && (
        <div style={{ maxWidth: 500 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Admin đặt lại mật khẩu cho user — <strong>không cần mật khẩu cũ</strong>
          </p>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label className="label">Chọn User</label>
              <select className="input" value={changePw.userId}
                onChange={(e) => setChangePw((p) => ({ ...p, userId: e.target.value }))}
                style={{ cursor: 'pointer' }}>
                <option value="">-- Chọn user --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} — {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Mật khẩu mới</label>
              <input className="input" type="password" value={changePw.newPassword}
                onChange={(e) => setChangePw((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Nhập mật khẩu mới" />
            </div>
            <button className="btn-primary" onClick={handleChangePassword}>Đổi mật khẩu</button>
          </div>
        </div>
      )}
    </div>
  );
}
