import React, { useState } from 'react';
import { User } from '../types';
import { X, Store, User as UserIcon, Save, ShieldCheck } from 'lucide-react';

interface UserSettingsModalProps {
  currentUser: User | null;
  onClose: () => void;
  onSave: (storeName: string, fullName: string) => void;
  initialStoreName: string;
  initialFullName: string;
}

export default function UserSettingsModal({
  currentUser,
  onClose,
  onSave,
  initialStoreName,
  initialFullName,
}: UserSettingsModalProps) {
  const [storeName, setStoreName] = useState(initialStoreName);
  const [fullName, setFullName] = useState(initialFullName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(storeName, fullName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-2xl flex flex-col gap-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">تنظیمات مشخصات و فروشگاه</h3>
              <p className="text-xs text-slate-400">اطلاعات قابل نمایش در هدر برنامه</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Login Info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>نام کاربری سیستم (اکسل):</span>
            <strong className="font-mono">{currentUser?.username}</strong>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold text-[11px]">
            {currentUser?.role === 'admin' ? 'مدیر' : 'اپراتور'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              نام فروشگاه / شعبه
            </label>
            <div className="relative">
              <Store className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="مثال: فروشگاه فردوسی شمالی"
                className="w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              نام و نام خانوادگی مسئول
            </label>
            <div className="relative">
              <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: آقای قنادیان"
                className="w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              ذخیره تغییرات
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
