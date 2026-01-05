import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastClose, ToastDescription, ToastTitle } from '@/components/ui/toast';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration (default 5 seconds)
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    addToast({ title, description, variant: 'success' });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({ title, description, variant: 'destructive' });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast({ title, description, variant: 'default' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} variant={toast.variant}>
            <div className="flex-1">
              <ToastTitle>{toast.title}</ToastTitle>
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
            </div>
            <ToastClose onClick={() => removeToast(toast.id)} />
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
