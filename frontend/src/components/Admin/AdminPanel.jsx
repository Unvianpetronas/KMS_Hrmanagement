import { useState, useEffect } from 'react';
import { authAPI, tagsAPI, itemsAPI } from '../../services/api';
import { useToast } from '../UI/Toast';
import { ROLE_COLORS, TAG_COLORS } from '../../services/constants';

const TABS = [
  { key: 'users',       label: 'Danh sách Users' },
  { key: 'adduser',     label: 'Tạo User' },
  { key: 'changepass',  label: 'Đổi Password' },
  { key: 'tags',        label: 'Quản lý Tags' },
  { key: 'bulkarchive', label: 'Bulk Archive' },
];

function Th({ children }) {
  return (
    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-gray-200 bg-gray-50">
      {children}
    </th>
  );
}
function Td({ children, className = '' }) {
  return (
    <td className={`px-3 py-3 text-sm border-b border-gray-100 ${className}`}>{children}</td>
  );
}

export default function AdminPanel() {
  const { notify } = useToast();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', email: '', department: '', role: 'USER' });
  const [changePw, setChangePw] = useState({ userId: '', newPassword: '' });
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState({ name: '', description: '' });
  const [editingTag, setEditingTag] = useState(null);
  const [staleItems, setStaleItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [staleLoading, setStaleLoading] = useState(false);

  const fetchTags = async () => {
    try { setTags(await tagsAPI.getAll()); } catch (err) { notify(err.message, 'error'); }
  };
  const fetchUsers = async () => {
    setLoading(true);
    try { setUsers(await authAPI.getUsers()); } catch (err) { notify(err.message, 'error'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); fetchTags(); }, []);

  const toggleActive = async (user) => {
    try { await authAPI.updateUser(user.id, { active: !user.active }); notify(`${user.active ? 'Vô hiệu hóa' : 'Kích hoạt'} ${user.username}`); fetchUsers(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Xóa user "${user.username}"?`)) return;
    try { await authAPI.deleteUser(user.id); notify(`Đã xóa ${user.username}`); fetchUsers(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.fullName) { notify('Vui lòng điền Username, Password, Họ tên', 'error'); return; }
    try { await authAPI.createUser(newUser); notify(`Tạo user "${newUser.username}" thành công!`); setNewUser({ username: '', password: '', fullName: '', email: '', department: '', role: 'USER' }); fetchUsers(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleChangePassword = async () => {
    if (!changePw.userId || !changePw.newPassword) { notify('Chọn user và nhập mật khẩu mới', 'error'); return; }
    try { await authAPI.changePassword(changePw.userId, changePw.newPassword); const t = users.find((u) => u.id === Number(changePw.userId)); notify(`Đã đổi password cho ${t?.username || 'user'} ✅`); setChangePw({ userId: '', newPassword: '' }); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleCreateTag = async () => {
    if (!newTag.name.trim()) { notify('Tên tag không được để trống', 'error'); return; }
    try { await tagsAPI.create(newTag); notify(`Tạo tag "${newTag.name}" thành công!`); setNewTag({ name: '', description: '' }); fetchTags(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleUpdateTag = async () => {
    if (!editingTag.name.trim()) { notify('Tên tag không được để trống', 'error'); return; }
    try { await tagsAPI.update(editingTag.originalName, { name: editingTag.name, description: editingTag.description }); notify('Cập nhật tag thành công!'); setEditingTag(null); fetchTags(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const handleDeleteTag = async (tagName) => {
    if (!window.confirm(`Xóa tag "${tagName}"?`)) return;
    try { await tagsAPI.delete(tagName); notify(`Đã xóa tag "${tagName}"`); fetchTags(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const fetchStaleItems = async () => {
    setStaleLoading(true);
    try { setStaleItems(await itemsAPI.getStale(12)); setSelectedIds(new Set()); }
    catch (err) { notify(err.message, 'error'); } finally { setStaleLoading(false); }
  };
  const toggleSelect = (id) => setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) { notify('Chọn ít nhất 1 bài', 'error'); return; }
    if (!window.confirm(`Archive ${selectedIds.size} bài đã chọn?`)) return;
    try { await itemsAPI.bulkArchive([...selectedIds]); notify(`Đã archive ${selectedIds.size} bài 📦`); fetchStaleItems(); }
    catch (err) { notify(err.message, 'error'); }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-slate-900">Quản trị hệ thống</h2>
        <p className="text-xs text-slate-500 mt-0.5">Quản lý users, tags và nội dung</p>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-gray-200 px-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-0 border-b-2 cursor-pointer transition-colors bg-transparent -mb-px ${
              tab === t.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">

        {/* ===== USERS ===== */}
        {tab === 'users' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-10 text-slate-400">⏳ Đang tải...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {['ID', 'Username', 'Họ tên', 'Email', 'Dept', 'Role', 'Trạng thái', 'Thao tác'].map((h) => (
                      <Th key={h}>{h}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <Td className="text-slate-400 font-mono text-xs">{u.id}</Td>
                      <Td><span className="font-mono text-slate-900">{u.username}</span></Td>
                      <Td className="font-medium text-slate-900">{u.fullName}</Td>
                      <Td className="text-slate-500">{u.email}</Td>
                      <Td className="text-slate-500">{u.department}</Td>
                      <Td>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: ROLE_COLORS[u.role]?.bg, color: ROLE_COLORS[u.role]?.color }}
                        >
                          {u.role}
                        </span>
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.active ? 'text-emerald-700' : 'text-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex gap-1">
                          <button className="btn-ghost px-2 py-0.5 text-xs" onClick={() => toggleActive(u)}>
                            {u.active ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn-ghost btn-danger px-2 py-0.5 text-xs" onClick={() => handleDeleteUser(u)}>
                            Xóa
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ===== CREATE USER ===== */}
        {tab === 'adduser' && (
          <div className="max-w-lg">
            <div className="grid grid-cols-2 gap-3">
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
                    className="input"
                    type={type}
                    value={newUser[key]}
                    onChange={(e) => setNewUser((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="label">Role</label>
                <select className="input cursor-pointer" value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}>
                  <option value="USER">USER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="col-span-2">
                <button className="btn-primary" onClick={handleCreateUser}>Tạo User</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== CHANGE PASSWORD ===== */}
        {tab === 'changepass' && (
          <div className="max-w-sm">
            <p className="text-sm text-slate-500 mb-4">
              Admin đặt lại mật khẩu cho user — <strong className="text-slate-900">không cần mật khẩu cũ</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="label">Chọn User</label>
                <select className="input cursor-pointer" value={changePw.userId} onChange={(e) => setChangePw((p) => ({ ...p, userId: e.target.value }))}>
                  <option value="">-- Chọn user --</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.username} — {u.fullName} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Mật khẩu mới</label>
                <input className="input" type="password" value={changePw.newPassword} onChange={(e) => setChangePw((p) => ({ ...p, newPassword: e.target.value }))} placeholder="Nhập mật khẩu mới" />
              </div>
              <button className="btn-primary" onClick={handleChangePassword}>Đổi mật khẩu</button>
            </div>
          </div>
        )}

        {/* ===== TAGS ===== */}
        {tab === 'tags' && (
          <div>
            {/* Create tag */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Tạo tag mới</h4>
              <div className="flex gap-2 items-end">
                <div className="w-44">
                  <label className="label">Tên tag *</label>
                  <input className="input" value={newTag.name} onChange={(e) => setNewTag((p) => ({ ...p, name: e.target.value }))} placeholder="vd: recruitment" />
                </div>
                <div className="flex-1">
                  <label className="label">Mô tả</label>
                  <input className="input" value={newTag.description} onChange={(e) => setNewTag((p) => ({ ...p, description: e.target.value }))} placeholder="Mô tả ngắn về tag" />
                </div>
                <button className="btn-primary whitespace-nowrap" onClick={handleCreateTag}>Tạo tag</button>
              </div>
            </div>

            {/* Tag list */}
            <table className="w-full">
              <thead>
                <tr>{['ID', 'Tên tag', 'Mô tả', 'Ngày tạo', 'Thao tác'].map((h) => <Th key={h}>{h}</Th>)}</tr>
              </thead>
              <tbody>
                {tags.map((tag) => {
                  const color = TAG_COLORS[tag.name] || '#64748b';
                  const isEditing = editingTag?.originalName === tag.name;
                  return (
                    <tr key={tag.id} className="hover:bg-gray-50">
                      <Td className="text-slate-400 font-mono text-xs">{tag.id}</Td>
                      <Td>
                        {isEditing
                          ? <input className="input py-1 text-xs" value={editingTag.name} onChange={(e) => setEditingTag((p) => ({ ...p, name: e.target.value }))} />
                          : <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>{tag.name}</span>
                        }
                      </Td>
                      <Td className="text-slate-500">
                        {isEditing
                          ? <input className="input py-1 text-xs" value={editingTag.description} onChange={(e) => setEditingTag((p) => ({ ...p, description: e.target.value }))} />
                          : (tag.description || <span className="text-slate-300 italic">—</span>)
                        }
                      </Td>
                      <Td className="text-slate-400">{tag.createdDate || '—'}</Td>
                      <Td>
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <button className="btn-ghost btn-success px-2 py-0.5 text-xs" onClick={handleUpdateTag}>Lưu</button>
                              <button className="btn-ghost px-2 py-0.5 text-xs" onClick={() => setEditingTag(null)}>Hủy</button>
                            </>
                          ) : (
                            <>
                              <button className="btn-ghost px-2 py-0.5 text-xs" onClick={() => setEditingTag({ originalName: tag.name, name: tag.name, description: tag.description || '' })}>Sửa</button>
                              <button className="btn-ghost btn-danger px-2 py-0.5 text-xs" onClick={() => handleDeleteTag(tag.name)}>Xóa</button>
                            </>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
                {tags.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">Chưa có tag nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== BULK ARCHIVE ===== */}
        {tab === 'bulkarchive' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">Bài chưa cập nhật hơn 12 tháng — chọn và archive hàng loạt</p>
              <div className="flex gap-2">
                <button className="btn-ghost text-xs" onClick={fetchStaleItems}>🔄 Tải danh sách</button>
                {selectedIds.size > 0 && (
                  <button className="btn-ghost btn-danger text-xs" onClick={handleBulkArchive}>
                    📦 Archive {selectedIds.size} bài đã chọn
                  </button>
                )}
              </div>
            </div>

            {staleLoading ? (
              <div className="text-center py-10 text-slate-400">⏳ Đang tải...</div>
            ) : staleItems.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">
                {selectedIds.size === 0 ? 'Nhấn "Tải danh sách" để xem bài stale' : '✅ Không có bài stale nào'}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === staleItems.length && staleItems.length > 0}
                        onChange={(e) => setSelectedIds(e.target.checked ? new Set(staleItems.map((i) => i.id)) : new Set())}
                      />
                    </Th>
                    {['ID', 'Tiêu đề', 'Loại', 'Cập nhật lần cuối', 'Trạng thái'].map((h) => <Th key={h}>{h}</Th>)}
                  </tr>
                </thead>
                <tbody>
                  {staleItems.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(item.id) ? 'bg-amber-50' : ''}`}>
                      <Td>
                        <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="cursor-pointer" />
                      </Td>
                      <Td className="font-mono text-xs text-amber-700 font-semibold">{item.id}</Td>
                      <Td className="font-medium text-slate-900">{item.title}</Td>
                      <Td className="text-slate-500">{item.type}</Td>
                      <Td className="text-amber-700">{item.updatedDate}</Td>
                      <Td className="text-slate-500">{item.status}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
