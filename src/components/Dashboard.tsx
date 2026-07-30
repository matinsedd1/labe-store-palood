import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../types';
import { Search, RefreshCw, Camera, Keyboard, X, Printer, Loader2, LayoutDashboard, Layers, Settings, FileText, Download, Zap, LogOut, History, Tag, User as UserIcon } from 'lucide-react';
import CameraScanner from './CameraScanner';
import LabelPreview, { ThermalLabelUI } from './LabelPreview';
import QueueEditorView from './QueueEditorView';
import PriceChangesView from './PriceChangesView';
import UserSettingsModal from './UserSettingsModal';
import ToastNotification, { ToastMessage } from './ToastNotification';
import { exportQueueToExcel } from '../utils/excelExporter';
import { User } from '../types';
import { appendLog, fetchLogs } from '../api';

interface PrintQueueItem {
  id: string;
  product: Product;
  quantity: number;
}

interface DashboardProps {
  products: Product[];
  onRefresh: () => void;
  loading: boolean;
  spreadsheetId: string;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenLogs?: () => void;
}

export default function Dashboard({ products, onRefresh, loading, spreadsheetId, currentUser, onLogout, onOpenLogs }: DashboardProps) {
  const [query, setQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [scannerMode, setScannerMode] = useState<'none' | 'camera'>('none');
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);
  const [isBatchPrintingLoading, setIsBatchPrintingLoading] = useState(false);
  const [autoPrintOnScan, setAutoPrintOnScan] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'price_changes'>('dashboard');
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showUserSettingsModal, setShowUserSettingsModal] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [printedCodes, setPrintedCodes] = useState<Set<string>>(new Set());

  const triggerToast = (title: string, message?: string) => {
    setToast({ id: Math.random().toString(), title, message });
  };

  useEffect(() => {
    if (spreadsheetId) {
      fetchLogs(spreadsheetId).then((logs: string[][]) => {
        if (logs && logs.length > 1) {
          // Log rows: [timestamp, action, code, name, price, operator]
          const codes = new Set<string>();
          logs.slice(1).forEach(row => {
            if (row[2]) codes.add(row[2].trim());
          });
          setPrintedCodes(codes);
        }
      }).catch(err => console.warn('Failed to load print logs for indicators', err));
    }
  }, [spreadsheetId]);

  const [storeName, setStoreName] = useState(() => {
    return localStorage.getItem('store_name') || 'فروشگاه فردوسی شمالی';
  });
  const [fullName, setFullName] = useState(() => {
    return localStorage.getItem('user_full_name') || (currentUser?.name || 'آقای قنادیان');
  });

  const handleSaveUserSettings = (newStoreName: string, newFullName: string) => {
    setStoreName(newStoreName);
    setFullName(newFullName);
    localStorage.setItem('store_name', newStoreName);
    localStorage.setItem('user_full_name', newFullName);
  };

  const usbBufferRef = useRef('');

  const handleAddToQueue = (product: Product, quantity: number) => {
    setPrintQueue(prev => {
      const existing = prev.find(item => item.product.code === product.code);
      if (existing) {
        return prev.map(item => item.id === existing.id ? { ...item, quantity: item.quantity + quantity, product } : item);
      }
      return [...prev, { id: Math.random().toString(36).substring(7), product, quantity }];
    });
    triggerToast('موفقیت', `${product.name} به صف چاپ اضافه شد`);
  };

  const updateQueueItemQuantity = (id: string, quantity: number) => {
    setPrintQueue(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item));
  };

  const removeFromQueue = (id: string) => {
    setPrintQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleBatchPrint = async () => {
    if (printQueue.length === 0) return;

    setIsBatchPrinting(true);
    setIsBatchPrintingLoading(true);
    document.body.classList.add('is-batch-printing');
    
    try {
      setTimeout(() => {
        window.print();
        document.body.classList.remove('is-batch-printing');
        setIsBatchPrinting(false);
        setIsBatchPrintingLoading(false);
      }, 500);
    } catch (err) {
      console.error('Batch print error:', err); alert("خطا در چاپ: " + String(err));
      document.body.classList.remove('is-batch-printing');
      setIsBatchPrinting(false);
      setIsBatchPrintingLoading(false);
    }
  };

  // Handle unified search
  useEffect(() => {
    if (!query) {
      setFilteredProducts([]);
      return;
    }
    const q = query.toLowerCase();
    const results = products.filter(p => 
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.barcode2 && p.barcode2.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q))
    );
    setFilteredProducts(results.slice(0, 50)); // Limit results
  }, [query, products]);

  const handleScan = useCallback((rawScannedCode: string) => {
    if (!rawScannedCode) return;
    
    const scannedCode = rawScannedCode.trim();
    if (!scannedCode) return;
    
    setScannerMode('none');
    setQuery(scannedCode);
    
    const match = products.find(p => {
      if (p.barcode === scannedCode || p.code === scannedCode) return true;
      if (p.barcode2 && p.barcode2.includes(scannedCode)) return true;
      return false;
    });

    if (match) {
      setSelectedProduct(match);
      if (autoPrintOnScan) {
        setTimeout(() => {
          window.print();
        }, 400);
      }
    } else {
      // Not found
    }
  }, [products, autoPrintOnScan]);

  // Global keydown handler to auto-focus search input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if already typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // If it's a character key, focus the search input
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const searchInput = document.getElementById('main-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuery('');
    setTimeout(() => {
      document.getElementById('label-editor-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex-1 flex w-full h-full bg-[#f3f4f6] dark:bg-slate-950 p-2 lg:p-4 gap-4 font-sans text-slate-800 dark:text-slate-200 print:bg-white print:p-0 print:block overflow-hidden">
      
      {/* Sidebar (Right side in RTL) */}
      <aside className="hidden lg:flex w-[260px] bg-white dark:bg-slate-900 rounded-[32px] p-6 flex-col shadow-sm border border-slate-100 dark:border-slate-800 print:hidden shrink-0">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-emerald-500/20">PL</div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800 dark:text-white">پالود لیبل</span>
        </div>
        
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 px-2">منو اصلی</div>
        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-[20px] font-bold transition-all relative ${
              currentView === 'dashboard' 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
            }`}
          >
            {currentView === 'dashboard' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-600 rounded-r-full"></div>}
            <LayoutDashboard className="w-5 h-5" />
            داشبورد
          </button>
          
          <button 
            onClick={() => setCurrentView('price_changes')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-[20px] font-bold transition-all relative ${
              currentView === 'price_changes' 
                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
            }`}
          >
            {currentView === 'price_changes' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-amber-500 rounded-r-full"></div>}
            <Tag className="w-5 h-5" />
            تغییرات قیمتی
          </button>

          <button 
            onClick={() => setShowQueueModal(true)}
            className="flex items-center gap-3 px-4 py-3.5 text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 rounded-[20px] font-bold transition-all relative"
          >
            <Settings className="w-5 h-5" />
            ویرایشگر صف چاپ
          </button>
          <button 
            onClick={onOpenLogs}
            className="flex items-center gap-3 px-4 py-3.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-[20px] font-medium transition-colors"
          >
            <History className="w-5 h-5" />
            تاریخچه فعالیت‌ها
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-[20px] font-medium transition-colors mt-auto"
          >
            <LogOut className="w-5 h-5" />
            خروج از حساب
          </button>
        </nav>
      </aside>

      {/* Main Section */}
      <main className="flex-1 flex flex-col gap-4 overflow-hidden print:overflow-visible">
        
        {/* Top Header */}
        <header className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-full px-4 lg:px-6 py-3 shadow-sm border border-slate-100 dark:border-slate-800 print:hidden shrink-0">
          
          {/* Search */}
          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              id="main-search"
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleScan(e.currentTarget.value);
                }
              }}
              placeholder="جستجوی کالا، کد یا بارکد..."
              className="w-full pr-12 pl-12 py-3 bg-slate-50 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-200 dark:focus:border-emerald-700 focus:ring-4 focus:ring-emerald-500/10 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-all outline-none"
            />
            {query && (
              <button 
                onClick={() => {
                  setQuery('');
                  setSelectedProduct(null);
                  setScannerMode('none');
                }}
                className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50 pointer-events-none">
              <kbd className="hidden sm:inline-block bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 text-[10px] font-sans font-bold shadow-sm">Enter</kbd>
            </div>

            {/* Search Results Dropdown */}
            {query && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[100] max-h-[350px] flex flex-col">
                <div className="overflow-y-auto custom-scrollbar p-2">
                  {filteredProducts.map((p, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectProduct(p)}
                      className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer rounded-2xl transition-colors last:border-0"
                    >
                      <div className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 mb-1">{p.name}</div>
                      <div className="text-xs text-slate-500 flex justify-between items-center mt-2">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">کد: {p.code}</span>
                        <div className="flex items-center gap-2">
                          {p.barcode && <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{p.barcode}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {query && filteredProducts.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-2xl border border-slate-100 dark:border-slate-800 text-center text-slate-500 font-medium z-[100]">
                نتیجه‌ای یافت نشد.
              </div>
            )}
          </div>
          
          {/* Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-4 mr-4">
            <button 
              onClick={onRefresh} 
              disabled={loading}
              title="به‌روزرسانی شیت"
              className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
               <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div 
              onClick={() => setShowUserSettingsModal(true)}
              className="flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
              title="تنظیمات مشخصات کاربر و فروشگاه"
            >
               <div className="text-right leading-tight hidden lg:block" dir="rtl">
                 <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                   {currentUser?.role === 'admin' ? 'مدیر' : 'اوپراتور'} : {storeName} {fullName}
                 </div>
                 <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                   (ویرایش مشخصات)
                 </div>
               </div>
               <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-extrabold text-base shadow-inner shrink-0">
                 {fullName ? fullName.slice(0, 2) : (currentUser?.name?.slice(0, 2) || 'PL')}
               </div>
               <button 
                 onClick={onLogout}
                 title="خروج از حساب"
                 className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-full transition-colors lg:hidden"
               >
                 <LogOut className="w-5 h-5" />
               </button>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden print:overflow-visible">
          
          {currentView === 'price_changes' && (
            <PriceChangesView 
              products={products}
              printedCodes={printedCodes}
              onOpenQueueModal={(p) => {
                setShowQueueModal(true);
              }}
              onAddMultipleToQueue={(items) => {
                setPrintQueue(prev => {
                  const newQueue = [...prev];
                  items.forEach(item => {
                    const existing = newQueue.find(q => q.product.code === item.product.code);
                    if (existing) {
                      existing.quantity += item.quantity;
                    } else {
                      newQueue.push({ id: Math.random().toString(36).substring(7), product: item.product, quantity: item.quantity });
                    }
                  });
                  return newQueue;
                });
                triggerToast('موفقیت', `${items.length} کالا به صف چاپ اضافه شد`);
              }}
            />
          )}

          {currentView === 'dashboard' && (
            <>
              {/* Left/Main Column - Label Editor */}
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative print:rounded-none print:border-none print:shadow-none">
                
                  {selectedProduct ? (
                    <div className="h-full overflow-y-auto custom-scrollbar p-2 sm:p-6" id="label-editor-section">
                      <LabelPreview 
                        product={selectedProduct} 
                        spreadsheetId={spreadsheetId} 
                        onAddToQueue={handleAddToQueue}
                        isBatchPrinting={isBatchPrinting}
                        operatorName={currentUser?.name}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-24 h-24 mb-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-8 border-white dark:border-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3">محصولی انتخاب نشده است</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                        برای شروع کار، یک محصول را از نوار جستجوی بالا پیدا کنید یا از اسکنر استفاده نمایید.
                      </p>
                    </div>
                  )}
              </div>
              
              {/* Right Column - Scanner & Queue */}
              <div className="w-full lg:w-[320px] flex flex-col gap-4 shrink-0 overflow-y-auto lg:overflow-hidden print:hidden custom-scrollbar">
                  
                  {/* Scanner Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">اسکنر</h3>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">آماده</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setScannerMode(scannerMode === 'camera' ? 'none' : 'camera')}
                      className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                        scannerMode === 'camera'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Camera className="w-5 h-5" />
                      {scannerMode === 'camera' ? 'بستن دوربین' : 'باز کردن دوربین'}
                    </button>

                    {/* Auto Print Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Zap className={`w-4 h-4 ${autoPrintOnScan ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">چاپ خودکار پس از اسکن</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={autoPrintOnScan}
                          onChange={(e) => setAutoPrintOnScan(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded cursor-pointer focus:ring-emerald-500"
                        />
                    </div>

                    {scannerMode === 'camera' && (
                      <div className="w-full aspect-square bg-black rounded-2xl overflow-hidden relative shadow-inner">
                          <CameraScanner onScan={handleScan} />
                      </div>
                    )}
                  </div>
                  
                  {/* Print Queue Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex-1 flex flex-col max-h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">صف چاپ</h3>
                      <div className="flex items-center gap-2">
                        {printQueue.length > 0 && (
                          <button 
                            onClick={() => exportQueueToExcel(printQueue)}
                            title="خروجی اکسل"
                            className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1 text-xs font-bold px-2.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            اکسل
                          </button>
                        )}
                        <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center text-xs font-bold">
                          {printQueue.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 flex flex-col gap-3">
                      {printQueue.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                          <FileText className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-sm">صف خالی است</span>
                        </div>
                      ) : (
                        printQueue.map(item => (
                          <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{item.product.name}</div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">{item.product.code}</div>
                            </div>
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-700 rounded-xl p-1 shadow-sm shrink-0 border border-slate-100 dark:border-slate-600">
                              <input 
                                type="number" 
                                min="1" 
                                value={item.quantity}
                                onChange={(e) => updateQueueItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-8 h-6 bg-transparent border-none text-center text-sm font-bold text-slate-700 dark:text-slate-200 outline-none p-0"
                              />
                              <button 
                                onClick={() => removeFromQueue(item.id)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {printQueue.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                        <button 
                          onClick={() => setPrintQueue([])}
                          className="text-xs font-bold text-slate-400 hover:text-red-500 text-center py-2 transition-colors"
                        >
                          پاکسازی لیست
                        </button>
                        <button 
                          onClick={handleBatchPrint}
                          disabled={isBatchPrintingLoading}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isBatchPrintingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                          {isBatchPrintingLoading ? 'آماده‌سازی...' : `چاپ ${printQueue.reduce((sum, item) => sum + item.quantity, 0)} لیبل`}
                        </button>
                      </div>
                    )}
                  </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Hidden Batch Print Area */}
      {isBatchPrinting && createPortal(
        <div id="batch-print-portal" className="batch-print-portal">
          {printQueue.map((item) => 
            Array.from({ length: item.quantity }).map((_, i) => (
              <div key={`${item.id}-${i}`} className="batch-page-wrapper">
                <ThermalLabelUI product={item.product} />
              </div>
            ))
          )}
        </div>,
        document.body
      )}

      {/* Queue Modal */}
      {showQueueModal && (
        <QueueEditorView 
          queue={printQueue}
          setQueue={setPrintQueue}
          onBatchPrint={handleBatchPrint}
          isPrinting={isBatchPrintingLoading}
          onClose={() => setShowQueueModal(false)}
        />
      )}

      {/* User Settings Modal */}
      {showUserSettingsModal && (
        <UserSettingsModal 
          currentUser={currentUser || null}
          initialStoreName={storeName}
          initialFullName={fullName}
          onClose={() => setShowUserSettingsModal(false)}
          onSave={(s, f) => {
            handleSaveUserSettings(s, f);
            triggerToast('موفقیت', 'تنظیمات مشخصات با موفقیت ذخیره شد');
          }}
        />
      )}

      {/* Toast Notification Container */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
