import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const borderColor = toast?.type === 'error' ? '#dc2626' : toast?.type === 'info' ? '#1d4ed8' : '#047857';
  const textColor   = toast?.type === 'error' ? '#dc2626' : toast?.type === 'info' ? '#1d4ed8' : '#047857';

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {toast && (
        <div
          className="fade-in fixed top-5 right-5 z-[9999] bg-white border border-gray-200 rounded-md px-4 py-3 text-sm font-medium max-w-xs"
          style={{ borderLeftWidth: 3, borderLeftColor: borderColor, color: textColor }}
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
