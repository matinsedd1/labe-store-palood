import React, { useEffect, useState } from 'react';
import { Product, User } from './types';
import { fetchSheetData } from './api';
import Dashboard from './components/Dashboard';
import ActivityLogModal from './components/ActivityLogModal';
import LoginModal from './components/LoginModal';

const DEFAULT_SPREADSHEET_ID = '16HGoTsqt6QoWrBgyBnGgf43uemn8GTtgwW5-4_H6nbc';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [spreadsheetId, setSpreadsheetId] = useState(() => {
    const saved = localStorage.getItem('spreadsheetId');
    return saved && saved !== 'local' ? saved : DEFAULT_SPREADSHEET_ID;
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch(e) {}
    }
    return null;
  });

  const [showLogs, setShowLogs] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const loadData = async () => {
    if (!spreadsheetId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchSheetData(spreadsheetId);
      setProducts(data);
      localStorage.setItem('spreadsheetId', spreadsheetId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && products.length === 0) {
      loadData();
    }
  }, [currentUser, spreadsheetId]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('auth_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <>
      <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-100 font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white print:text-black">
        {!currentUser ? (
          <LoginModal 
            spreadsheetId={spreadsheetId}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <main className="flex-1 flex overflow-hidden p-0 m-0 w-full h-full print:p-0 print:m-0 relative z-0">
            <Dashboard 
              products={products} 
              onRefresh={loadData} 
              loading={loading} 
              spreadsheetId={spreadsheetId}
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenLogs={() => setShowLogs(true)}
            />
          </main>
        )}
        {showLogs && <ActivityLogModal spreadsheetId={spreadsheetId} onClose={() => setShowLogs(false)} />}
      </div>
    </>
  );
}
