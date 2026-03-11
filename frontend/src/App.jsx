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

export default function App() {
  const { isLoggedIn } = useAuth();
  const [view, setView] = useState(VIEWS.LIST);
  const [selectedId, setSelectedId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const navigate = useCallback((target, data) => {
    switch (target) {
      case VIEWS.LIST:   setView(VIEWS.LIST); setSelectedId(null); setEditItem(null); break;
      case VIEWS.DETAIL: setView(VIEWS.DETAIL); setSelectedId(data); break;
      case VIEWS.CREATE: setView(VIEWS.CREATE); setEditItem(null); break;
      case VIEWS.EDIT:   setView(VIEWS.EDIT); setEditItem(data); break;
      case VIEWS.ADMIN:  setView(VIEWS.ADMIN); break;
      case VIEWS.CHAT:   setView(VIEWS.CHAT); break;
      default:           setView(VIEWS.LIST);
    }
  }, []);

  if (!isLoggedIn) return <LoginPage />;

  const headerView = view === VIEWS.EDIT ? VIEWS.CREATE : view;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentView={headerView} onNavigate={navigate} />

      <main className="flex-1 max-w-screen-xl w-full mx-auto px-6 py-6">
        {view === VIEWS.LIST && (
          <StatsBar key={refreshKey} onSelectItem={(id) => navigate(VIEWS.DETAIL, id)} />
        )}
        {view === VIEWS.LIST && (
          <ItemList
            refreshKey={refreshKey}
            onSelect={(item) => navigate(VIEWS.DETAIL, item.id)}
            onEdit={(item) => navigate(VIEWS.EDIT, item)}
          />
        )}
        {view === VIEWS.DETAIL && selectedId && (
          <ItemDetail
            itemId={selectedId}
            onBack={() => navigate(VIEWS.LIST)}
            onNavigate={(id) => navigate(VIEWS.DETAIL, id)}
            onEdit={(item) => navigate(VIEWS.EDIT, item)}
          />
        )}
        {(view === VIEWS.CREATE || view === VIEWS.EDIT) && (
          <ItemForm
            key={editItem?.id || 'new'}
            editItem={editItem}
            onDone={() => { navigate(VIEWS.LIST); refresh(); }}
            onCancel={() => navigate(VIEWS.LIST)}
          />
        )}
        {view === VIEWS.ADMIN && <AdminPanel />}
        {view === VIEWS.CHAT && <ChatPanel onNavigate={navigate} />}
      </main>

      <footer className="border-t border-gray-200 bg-white py-3 text-center text-xs text-slate-400">
        HR Knowledge Hub © 2025 — Spring Boot + React + JWT + PostgreSQL
      </footer>
    </div>
  );
}
