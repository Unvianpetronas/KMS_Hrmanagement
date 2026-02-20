import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {toast && (
        <div
          className="glass fade-in"
          style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            padding: '14px 24px', borderRadius: 14, fontSize: 14, fontWeight: 600,
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            color: toast.type === 'error' ? '#f87171' : toast.type === 'info' ? '#60a5fa' : '#4ade80',
            borderLeft: `3px solid ${toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#22c55e'}`,
          }}
        >
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
