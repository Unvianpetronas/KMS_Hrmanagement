import { useAuth } from '../../contexts/AuthContext';
import { ROLE_COLORS } from '../../services/constants';

function NavBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium rounded-none border-0 border-b-2 cursor-pointer transition-colors -mb-px ${
        active
          ? 'border-emerald-600 text-emerald-700 bg-white'
          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-gray-50 bg-transparent'
      }`}
    >
      {children}
    </button>
  );
}

export default function Header({ currentView, onNavigate }) {
  const { user, logout, isAdmin, isManager } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 flex items-center h-14 gap-6">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
          onClick={() => onNavigate('list')}
        >
          <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white text-base">
            📚
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 leading-tight">HR Knowledge Hub</div>
            <div className="text-xs text-slate-400 leading-tight">Onboarding & Policy KMS</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200" />

        {/* Nav — tab style, flush with bottom border */}
        <nav className="flex items-end h-full gap-0.5">
          <NavBtn active={currentView === 'list'} onClick={() => onNavigate('list')}>
            Repository
          </NavBtn>
          {isManager ? (
            <NavBtn active={currentView === 'create'} onClick={() => onNavigate('create')}>
              + Tạo mới
            </NavBtn>
          ) : (
            <NavBtn active={currentView === 'create'} onClick={() => onNavigate('create')}>
              Đề xuất
            </NavBtn>
          )}
          <NavBtn active={currentView === 'chat'} onClick={() => onNavigate('chat')}>
            AI Chat
          </NavBtn>
          {isAdmin && (
            <NavBtn active={currentView === 'admin'} onClick={() => onNavigate('admin')}>
              Admin
            </NavBtn>
          )}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {/* User info */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.fullName.split(' ').pop()[0]}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">{user.fullName}</div>
              <div
                className="text-xs font-medium leading-tight"
                style={{ color: ROLE_COLORS[user.role]?.color }}
              >
                {user.role}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200" />

          <button
            className="btn-ghost btn-danger text-xs px-2.5 py-1"
            onClick={logout}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
