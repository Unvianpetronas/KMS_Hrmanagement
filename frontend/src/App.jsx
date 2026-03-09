import { useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { VIEWS } from './utils/views';
import LoginPage from './components/Auth/LoginPage';
import Header from './components/Layout/Header';
import StatsBar from './components/KMS/StatsBar';
import ItemList from './components/KMS/ItemList';
import ItemDetail from './components/KMS/ItemDetail';
import ItemForm from './components/KMS/ItemForm';
import AdminPanel from './components/Admin/AdminPanel';
import ChatPanel from './components/Chat/ChatPanel';
import ParticleBG from './components/UI/ParticleBG';

/**
 * App — Main view router
 * Views: list | detail | create | edit | admin
 */
export default function App() {
  const { isLoggedIn } = useAuth();
  const [view, setView] = useState(VIEWS.LIST);
  const [selectedId, setSelectedId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Navigation handler
  const navigate = useCallback((target, data) => {
    switch (target) {
      case VIEWS.LIST:
        setView(VIEWS.LIST);
        setSelectedId(null);
        setEditItem(null);
        break;
      case VIEWS.DETAIL:
        setView(VIEWS.DETAIL);
        setSelectedId(data);
        break;
      case VIEWS.CREATE:
        setView(VIEWS.CREATE);
        setEditItem(null);
        break;
      case VIEWS.EDIT:
        setView(VIEWS.EDIT);
        setEditItem(data);
        break;
      case VIEWS.ADMIN:
        setView(VIEWS.ADMIN);
        break;
      case VIEWS.CHAT:
        setView(VIEWS.CHAT);
        break;
      default:
        setView(VIEWS.LIST);
    }
  }, []);

  // Not logged in → Login page
  if (!isLoggedIn) return <LoginPage />;

  // Current view label for header
  const headerView = view === VIEWS.EDIT ? VIEWS.CREATE : view;


  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <ParticleBG />
      <Header currentView={headerView} onNavigate={navigate} />

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px', position: 'relative', zIndex: 1 }}>
        {/* Stats — hidden on chat/detail/form views */}
        {view === VIEWS.LIST && <StatsBar key={refreshKey} onSelectItem={(id) => navigate(VIEWS.DETAIL, id)} />}

        {/* ===== LIST VIEW ===== */}
        {view === VIEWS.LIST && (
          <ItemList
            refreshKey={refreshKey}
            onSelect={(item) => navigate(VIEWS.DETAIL, item.id)}
            onEdit={(item) => navigate(VIEWS.EDIT, item)}
          />
        )}

        {/* ===== DETAIL VIEW ===== */}
        {view === VIEWS.DETAIL && selectedId && (
          <ItemDetail
            itemId={selectedId}
            onBack={() => navigate(VIEWS.LIST)}
            onNavigate={(id) => navigate(VIEWS.DETAIL, id)}
            onEdit={(item) => navigate(VIEWS.EDIT, item)}
          />
        )}

        {/* ===== CREATE / EDIT VIEW ===== */}
        {(view === VIEWS.CREATE || view === VIEWS.EDIT) && (
          <ItemForm
            key={editItem?.id || 'new'}
            editItem={editItem}
            onDone={() => { navigate(VIEWS.LIST); refresh(); }}
            onCancel={() => navigate(VIEWS.LIST)}
          />
        )}

        {/* ===== ADMIN VIEW ===== */}
        {view === VIEWS.ADMIN && <AdminPanel />}

        {/* ===== CHAT VIEW ===== */}
        {view === VIEWS.CHAT && <ChatPanel onNavigate={navigate} />}
      </main>

      <footer style={{ textAlign: 'center', padding: 20, fontSize: 11, color: '#334155', position: 'relative', zIndex: 1 }}>
        HR Knowledge Hub © 2025 — Spring Boot + React + JWT + PostgreSQL
      </footer>
    </div>
  );
}
