import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Database, ShieldCheck, Check } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface SaveSuccessModalState {
  isOpen: boolean;
  title: string;
  details?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showSaveSuccessModal: (title: string, details?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [successModal, setSuccessModal] = useState<SaveSuccessModalState>({
    isOpen: false,
    title: '',
  });

  const showSaveSuccessModal = (title: string, details?: string) => {
    setSuccessModal({
      isOpen: true,
      title,
      details,
    });

    setTimeout(() => {
      setSuccessModal((prev) => ({ ...prev, isOpen: false }));
    }, 3500);
  };

  const showToast = (message: string, type: ToastType = 'success') => {
    if (type === 'success') {
      showSaveSuccessModal('¡Guardado con Éxito!', message);
    }

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showSaveSuccessModal }}>
      {children}

      {/* Ventana Modal de Guardado con Éxito */}
      {successModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-emerald-950/80 text-center space-y-5 relative overflow-hidden transform scale-100 transition-all">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Icon */}
            <div className="relative mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Check className="w-9 h-9 text-emerald-400 stroke-[3]" />
              <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping pointer-events-none" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" />
                <span>Base de Datos Actualizada</span>
              </div>

              <h3 className="text-xl font-black text-white tracking-tight">
                {successModal.title}
              </h3>

              {successModal.details && (
                <p className="text-sm font-medium text-slate-300 leading-relaxed">
                  {successModal.details}
                </p>
              )}
            </div>

            {/* Security Badge */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sincronizado correctamente con Firebase Firestore</span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSuccessModal((prev) => ({ ...prev, isOpen: false }))}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-950/50 cursor-pointer uppercase tracking-wider"
            >
              ¡Excelente, Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Toasts for Errors and Info */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-2xl border text-sm font-medium transition-all transform translate-y-0 ${
              toast.type === 'success'
                ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-slate-900 border-red-500/40 text-red-300'
                : 'bg-slate-900 border-blue-500/40 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
