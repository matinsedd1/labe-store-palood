import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastNotificationProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export default function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // wait for fade out animation
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [toast, onClose]);

  if (!toast && !visible) return null;

  return (
    <div 
      className={`fixed bottom-6 left-6 z-50 transition-all duration-300 transform ${
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
      dir="rtl"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white rounded-2xl p-4 min-w-[300px] max-w-md shadow-2xl relative overflow-hidden flex items-center justify-between gap-4">
        
        {/* Right Icon & Text */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-right">
            <span className="font-extrabold text-sm text-white">{toast?.title}</span>
            {toast?.message && (
              <span className="text-xs text-slate-400 mt-0.5">{toast.message}</span>
            )}
          </div>
        </div>

        {/* Left Close Button */}
        <button 
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress Bar at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-[3000ms] ease-linear"
            style={{ width: visible ? '0%' : '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
