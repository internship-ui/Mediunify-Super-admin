'use client';

import React, { createContext, useContext, useState } from 'react';
import { ThemeProvider } from './ThemeProvider';

const NotificationContext = createContext({
  notify: () => {},
});

export function AppProviders({ children }) {
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <ThemeProvider>
      <NotificationContext.Provider value={{ notify }}>
        {children}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-bottom-5 transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                toast.type === 'error'
                  ? 'bg-rose-500'
                  : toast.type === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ×
            </button>
          </div>
        )}
      </NotificationContext.Provider>
    </ThemeProvider>
  );
}

export const useNotification = () => useContext(NotificationContext);
