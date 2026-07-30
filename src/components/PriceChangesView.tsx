import React, { useState } from 'react';
import { Product } from '../types';
import { Tag, Plus, FileSpreadsheet, Filter, ArrowUpDown } from 'lucide-react';
import { toPersianDigits, formatPricePersian, parsePrice } from '../utils/formatters';

interface PriceChangesViewProps {
  products: Product[];
  printedCodes?: Set<string>;
  onAddMultipleToQueue: (products: { product: Product, quantity: number }[]) => void;
  onOpenQueueModal: (product?: Product) => void;
}

type SortOption = 'discount_desc' | 'discount_asc' | 'price_desc' | 'price_asc';
type FilterStatus = 'all' | 'printed' | 'unprinted';

export default function PriceChangesView({ 
  products, 
  printedCodes = new Set(), 
  onAddMultipleToQueue, 
  onOpenQueueModal 
}: PriceChangesViewProps) {
  const [sortOption, setSortOption] = useState<SortOption>('discount_desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Filter products that have a valid discount
  let discountedProducts = products.filter(p => {
    const sp = parsePrice(p.sellingPrice);
    const cp = parsePrice(p.consumerPrice);
    return sp > 0 && cp > 0 && sp < cp;
  });

  // Filter by printed status
  if (filterStatus === 'printed') {
    discountedProducts = discountedProducts.filter(p => printedCodes.has(p.code));
  } else if (filterStatus === 'unprinted') {
    discountedProducts = discountedProducts.filter(p => !printedCodes.has(p.code));
  }

  // Sort products
  discountedProducts.sort((a, b) => {
    const aDisc = parseFloat(a.discountPercentage) || 0;
    const bDisc = parseFloat(b.discountPercentage) || 0;
    const aPrice = parsePrice(a.sellingPrice);
    const bPrice = parsePrice(b.sellingPrice);

    if (sortOption === 'discount_desc') return bDisc - aDisc;
    if (sortOption === 'discount_asc') return aDisc - bDisc;
    if (sortOption === 'price_desc') return bPrice - aPrice;
    if (sortOption === 'price_asc') return aPrice - bPrice;
    return 0;
  });

  const handleAddAll = () => {
    const items = discountedProducts.map(p => ({ product: p, quantity: 1 }));
    onAddMultipleToQueue(items);
  };

  const handleAddSingle = (product: Product) => {
    onAddMultipleToQueue([{ product, quantity: 1 }]);
  };

  const handleAddAndOpenModal = (product: Product) => {
    onAddMultipleToQueue([{ product, quantity: 1 }]);
    onOpenQueueModal(product);
  };

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden h-full">
      
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center bg-slate-50 dark:bg-slate-800/40 gap-3">
        <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-amber-500" />
          تغییرات قیمتی (تخفیف‌دار)
        </h2>

        {/* Action Button */}
        <button 
          onClick={handleAddAll}
          disabled={discountedProducts.length === 0}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
        >
          افزودن همه به صف چاپ ({toPersianDigits(discountedProducts.length)})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>وضعیت چاپ:</span>
          <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg transition-all ${filterStatus === 'all' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
              همه
            </button>
            <button 
              onClick={() => setFilterStatus('unprinted')}
              className={`px-3 py-1 rounded-lg transition-all ${filterStatus === 'unprinted' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
              چاپ نشده
            </button>
            <button 
              onClick={() => setFilterStatus('printed')}
              className={`px-3 py-1 rounded-lg transition-all ${filterStatus === 'printed' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
              چاپ شده
            </button>
          </div>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span>مرتب‌سازی:</span>
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer shadow-sm"
          >
            <option value="discount_desc">بیشترین تخفیف</option>
            <option value="discount_asc">کمترین تخفیف</option>
            <option value="price_desc">بیشترین قیمت</option>
            <option value="price_asc">پایین‌ترین قیمت</option>
          </select>
        </div>
      </div>
      
      {/* Content Grid */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {discountedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <Tag className="w-12 h-12 mb-3 opacity-40 text-amber-500" />
            <p className="font-bold">محصولی با فیلتر انتخابی یافت نشد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {discountedProducts.map((p, idx) => {
              const isPrinted = printedCodes.has(p.code);
              return (
                <div 
                  key={idx} 
                  className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col relative transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  {/* Golden / Yellow Dot for Printed Items (Matching image 2 & 3) */}
                  {isPrinted && (
                    <div 
                      className="absolute top-3 left-3 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-900 shadow-md shadow-amber-400/50 z-10" 
                      title="این کالا قبلاً چاپ شده است"
                    />
                  )}

                  <div className="flex justify-between items-start mb-2 pl-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight flex-1">{p.name}</h3>
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 font-bold text-xs px-2 py-1 rounded-lg shrink-0 mr-2">
                      {toPersianDigits(Math.round(parseFloat(p.discountPercentage)))}٪ تخفیف
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mb-4">{p.code}</div>
                  
                  <div className="flex items-end justify-between mt-auto pt-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 line-through decoration-rose-500/50">
                        {formatPricePersian(p.consumerPrice)}
                      </span>
                      <span className="font-black text-lg text-slate-800 dark:text-slate-200">
                        {formatPricePersian(p.sellingPrice)} <span className="text-[10px] font-normal text-slate-500">تومان</span>
                      </span>
                    </div>

                    {/* Action Buttons: Add (+) and Excel Grid Icon */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700/80 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600">
                      <button 
                        onClick={() => handleAddSingle(p)}
                        className="w-8 h-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 rounded-lg flex items-center justify-center transition-colors text-slate-700 dark:text-slate-200"
                        title="افزودن به صف"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAddAndOpenModal(p)}
                        className="w-8 h-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 rounded-lg flex items-center justify-center transition-colors text-emerald-600 dark:text-emerald-400"
                        title="افزودن و باز کردن جدول ویرایشگر صف"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
