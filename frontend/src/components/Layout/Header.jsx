import { useAuth } from '../../contexts/AuthContext';
import { ROLE_COLORS } from '../../services/constants';

export default function Header({ currentView, onNavigate }) {
  const { user, logout, isAdmin, isManager, isLoggedIn } = useAuth();

  return (
    <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, padding: '0 28px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => onNavigate('list')}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>📚</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: -0.5 }}>HR Knowledge Hub</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -2 }}>Onboarding & Policy KMS</div>
          </div>
        </div>

        {/* Nav + User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className={`btn-ghost ${currentView === 'list' ? 'active' : ''}`} onClick={() => onNavigate('list')}>
            📂 Repository
          </button>
          {isManager && (
            <button className={`btn-ghost ${currentView === 'create' ? 'active' : ''}`} onClick={() => onNavigate('create')}
              style={currentView === 'create' ? { background: 'rgba(99,102,241,0.12)', color: '#a78bfa', borderColor: 'rgba(139,92,246,0.3)' } : {}}>
              ＋ Tạo mới
            </button>
          )}
          {!isManager && (
            <button className={`btn-ghost ${currentView === 'create' ? 'active' : ''}`} onClick={() => onNavigate('create')}
              style={currentView === 'create' ? { background: 'rgba(168,85,247,0.1)', color: '#c084fc', borderColor: 'rgba(168,85,247,0.3)' } : {}}>
              💡 Đề xuất
            </button>
          )}
          <button className={`btn-ghost ${currentView === 'chat' ? 'active' : ''}`} onClick={() => onNavigate('chat')}
            style={currentView === 'chat' ? { background: 'rgba(20,184,166,0.1)', color: '#2dd4bf', borderColor: 'rgba(20,184,166,0.3)' } : {}}>
            🤖 AI Chat
          </button>
          {isAdmin && (
            <button className={`btn-ghost ${currentView === 'admin' ? 'active' : ''}`} onClick={() => onNavigate('admin')}
              style={currentView === 'admin' ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' } : {}}>
              ⚙ Admin
            </button>
          )}

          <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

          {/* User avatar + info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
              {user.fullName.split(' ').pop()[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{user.fullName}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: ROLE_COLORS[user.role]?.color }}>{user.role}</div>
            </div>
          </div>

          <button className="btn-ghost btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
