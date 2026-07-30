import React, { useState } from 'react';
import { User } from '../types';
import { fetchUsers } from '../api';
import { Lock, User as UserIcon, LogIn, Loader2, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  spreadsheetId: string;
  onLoginSuccess: (user: User) => void;
}

export default function LoginModal({ spreadsheetId, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rows = await fetchUsers(spreadsheetId);
      if (!rows || rows.length <= 1) {
        throw new Error('لیست کاربران دریافت نشد.');
      }

      // Skip header row
      const headers = rows[0].map((h: string) => (h || '').trim().toLowerCase());
      
      let roleIdx = headers.indexOf('role');
      if (roleIdx === -1) roleIdx = headers.findIndex(h => h.includes('نقش'));
      if (roleIdx === -1) roleIdx = 0; // fallback to user's layout

      let userIdx = headers.indexOf('username');
      if (userIdx === -1) userIdx = headers.findIndex(h => h.includes('نام کاربری') || h.includes('کاربری'));
      if (userIdx === -1) userIdx = 1;

      let passIdx = headers.indexOf('password');
      if (passIdx === -1) passIdx = headers.findIndex(h => h.includes('رمز'));
      if (passIdx === -1) passIdx = 2;

      let nameIdx = headers.indexOf('name');
      if (nameIdx === -1) nameIdx = headers.findIndex(h => h.includes('نام') && !h.includes('کاربری'));
      if (nameIdx === -1) nameIdx = 3;

      const usersData = rows.slice(1);
      const matchedRow = usersData.find(row => {
        const u = (row[userIdx] || '').trim().toLowerCase();
        const p = (row[passIdx] || '').trim();
        return u === username.trim().toLowerCase() && p === password.trim();
      });

      if (matchedRow) {
        let role = (matchedRow[roleIdx] || '').trim().toLowerCase();
        if (role !== 'admin' && role !== 'operator') {
          role = 'operator';
        }
        
        const userObj: User = {
          username: matchedRow[userIdx] || username,
          name: matchedRow[nameIdx] || matchedRow[userIdx] || username,
          role: role as 'admin' | 'operator',
        };
        onLoginSuccess(userObj);
      } else {
        setError('نام کاربری یا رمز عبور اشتباه است.');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">ورود به سیستم پالود</h2>
          <p className="text-xs text-slate-400">لطفاً نام کاربری و رمز عبور خود را وارد نمایید</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">نام کاربری</label>
            <div className="relative">
              <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: admin یا operator"
                className="w-full pr-12 pl-4 py-3 bg-slate-800 border border-slate-700/80 rounded-2xl text-sm font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">رمز عبور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-12 pl-4 py-3 bg-slate-800 border border-slate-700/80 rounded-2xl text-sm font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-950/50 border border-red-800/50 text-red-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {loading ? 'در حال بررسی...' : 'ورود به حساب کاربری'}
          </button>
        </form>
      </div>
    </div>
  );
}
