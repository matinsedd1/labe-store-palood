import React from 'react';
import { Product } from '../types';
import { Printer, X } from 'lucide-react';
import { toPersianDigits, formatPricePersian } from '../utils/formatters';

interface PrintQueueItem {
  id: string;
  product: Product;
  quantity: number;
}

interface QueueEditorViewProps {
  queue: PrintQueueItem[];
  setQueue: React.Dispatch<React.SetStateAction<PrintQueueItem[]>>;
  onBatchPrint: () => void;
  isPrinting: boolean;
  onClose?: () => void;
}

export default function QueueEditorView({ queue, setQueue, onBatchPrint, isPrinting, onClose }: QueueEditorViewProps) {
  const updateItem = (id: string, field: keyof Product, value: string) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, product: { ...item.product, [field]: value } } : item
    ));
  };

  const updateQuantity = (id: string, qty: number) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
    ));
  };

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  if (queue.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 text-center h-full">
        <Printer className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">صف چاپ خالی است</h2>
        <p className="text-slate-500">لطفاً ابتدا کالاهایی را به صف چاپ اضافه کنید.</p>
      </div>
    );
  }

  const content = (
    <div className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden h-full max-h-[85vh] w-full max-w-5xl">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
        <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <Printer className="w-5 h-5 text-emerald-600" />
          ویرایش گروهی صف چاپ
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBatchPrint}
            disabled={isPrinting || queue.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isPrinting ? 'در حال چاپ...' : `چاپ همه (${toPersianDigits(queue.reduce((a, b) => a + b.quantity, 0))} لیبل)`}
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 z-10 rounded-t-xl">
            <tr>
              <th className="py-3 px-2 font-bold w-12 text-center rounded-tr-xl">ردیف</th>
              <th className="py-3 px-2 font-bold w-20">تعداد</th>
              <th className="py-3 px-2 font-bold w-24">کد</th>
              <th className="py-3 px-2 font-bold min-w-[200px]">نام کالا</th>
              <th className="py-3 px-2 font-bold w-32">بارکد</th>
              <th className="py-3 px-2 font-bold w-32">قیمت (تومان)</th>
              <th className="py-3 px-2 font-bold w-32">قیمت قدیم</th>
              <th className="py-3 px-2 font-bold w-10 rounded-tl-xl text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {queue.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-2 text-center font-medium text-slate-500">{toPersianDigits(index + 1)}</td>
                <td className="py-2 px-2">
                  <input 
                    type="number" 
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold outline-none focus:border-emerald-500"
                  />
                </td>
                <td className="py-2 px-2">
                  <input 
                    type="text" 
                    value={item.product.code}
                    onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </td>
                <td className="py-2 px-2">
                  <input 
                    type="text" 
                    value={item.product.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 text-xs font-bold"
                  />
                </td>
                <td className="py-2 px-2">
                  <input 
                    type="text" 
                    value={item.product.barcode}
                    onChange={(e) => updateItem(item.id, 'barcode', e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </td>
                <td className="py-2 px-2">
                  <input 
                    type="text" 
                    value={item.product.sellingPrice}
                    onChange={(e) => updateItem(item.id, 'sellingPrice', e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 font-bold text-xs"
                  />
                </td>
                <td className="py-2 px-2">
                  <input 
                    type="text" 
                    value={item.product.consumerPrice}
                    onChange={(e) => updateItem(item.id, 'consumerPrice', e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 font-bold text-xs"
                  />
                </td>
                <td className="py-2 px-2 text-center">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
        {content}
      </div>
    );
  }

  return content;
}
