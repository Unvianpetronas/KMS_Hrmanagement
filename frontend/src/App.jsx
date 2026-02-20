import { useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import Header from './components/Layout/Header';
import StatsBar from './components/KMS/StatsBar';
import ItemList from './components/KMS/ItemList';
import ItemDetail from './components/KMS/ItemDetail';
import ItemForm from './components/KMS/ItemForm';
import AdminPanel from './components/Admin/AdminPanel';
import ParticleBG from './components/UI/ParticleBG';

/**
 * App — Main view router
 * Views: list | detail | create | edit | admin
 */
export default function App() {
  const { isLoggedIn } = useAuth();
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Navigation handler
  const navigate = useCallback((target, data) => {
    switch (target) {
      case 'list':
        setView('list');
        setSelectedId(null);
        setEditItem(null);
        break;
      case 'detail':
        setView('detail');
        setSelectedId(data);
        break;
      case 'create':
        setView('create');
        setEditItem(null);
        break;
      case 'edit':
        setView('edit');
        setEditItem(data);
        break;
      case 'admin':
        setView('admin');
        break;
      default:
        setView('list');
    }
  }, []);

  // Not logged in → Login page
  if (!isLoggedIn) return <LoginPage />;

  // Current view label for header
  const headerView = view === 'edit' ? 'create' : view;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <ParticleBG />
      <Header currentView={headerView} onNavigate={navigate} />

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px', position: 'relative', zIndex: 1 }}>
        {/* Stats always visible */}
        <StatsBar key={refreshKey} />

        {/* ===== LIST VIEW ===== */}
        {view === 'list' && (
          <ItemList
            refreshKey={refreshKey}
            onSelect={(item) => navigate('detail', item.id)}
            onEdit={(item) => navigate('edit', item)}
          />
        )}

        {/* ===== DETAIL VIEW ===== */}
        {view === 'detail' && selectedId && (
          <ItemDetail
            itemId={selectedId}
            onBack={() => navigate('list')}
            onNavigate={(id) => navigate('detail', id)}
            onEdit={(item) => navigate('edit', item)}
          />
        )}

        {/* ===== CREATE / EDIT VIEW ===== */}
        {(view === 'create' || view === 'edit') && (
          <ItemForm
            key={editItem?.id || 'new'}
            editItem={editItem}
            onDone={() => { navigate('list'); refresh(); }}
            onCancel={() => navigate('list')}
          />
        )}

        {/* ===== ADMIN VIEW ===== */}
        {view === 'admin' && <AdminPanel />}
      </main>

      <footer style={{ textAlign: 'center', padding: 20, fontSize: 11, color: '#334155', position: 'relative', zIndex: 1 }}>
        HR Knowledge Hub © 2025 — Spring Boot + React + JWT + PostgreSQL
      </footer>
    </div>
  );
}
