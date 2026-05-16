// Contexto de notificaciones (toasts).
// Permite mostrar mensajes de exito, error o informacion desde cualquier componente.

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

type AddToast = (msg: string, type?: ToastType) => void;

const ToastContext = createContext<AddToast | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Agrega un toast y lo elimina automaticamente despues de 4 segundos
  const add: AddToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const colorMap: Record<ToastType, string> = {
    success: 'border-green-400 text-green-400',
    error:   'border-red-400 text-red-400',
    info:    'border-blue-400 text-blue-400',
  };

  return (
    <ToastContext.Provider value={add}>
      {children}
      {/* Contenedor fijo en la esquina inferior derecha */}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-enter bg-surface border-l-4 px-4 py-3.5 rounded-lg text-sm font-medium max-w-xs ${colorMap[t.type]}`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): AddToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
