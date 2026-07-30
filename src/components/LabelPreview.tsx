import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { Printer, Loader2 } from 'lucide-react';
import Barcode from 'react-barcode';
import { appendLog } from '../api';
import { tomanIcon, oldPriceIcon, badgeBg } from "../utils/images";
import { toPersianDigits, formatPricePersian, parsePrice, isValidEAN } from '../utils/formatters';

interface LabelPreviewProps {
  product: Product;
  spreadsheetId?: string;
  onAddToQueue?: (product: Product, quantity: number) => void;
  isBatchPrinting?: boolean;
  operatorName?: string;
}


const AutoTextScaler = ({ text }: { text: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;
    
    const container = containerRef.current;
    const textNode = textRef.current;
    
    let currentSize = 16;
    textNode.style.fontSize = `${currentSize}px`;
    
    while (textNode.scrollWidth > container.clientWidth && currentSize > 6) {
      currentSize -= 0.5;
      textNode.style.fontSize = `${currentSize}px`;
    }
  }, [text]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden text-right whitespace-nowrap" dir="rtl">
      <span ref={textRef} className="font-bold inline-block leading-tight">
        {text}
      </span>
    </div>
  );
};

/**
 * Renders the product date: uses productionDate or expirationDate from the product
 * if available, otherwise falls back to today's date.
 */
const getProductDate = (product: Product): string => {
  if (product.expirationDate) {
    return product.expirationDate;
  }
  if (product.productionDate) {
    return product.productionDate;
  }
  // Fallback to today's date in Persian calendar
  return new Date().toLocaleDateString('fa-IR').replace(/\//g, '.');
};

export const ThermalLabelUI = ({ product }: { product: Product }) => {
  const sellingPriceNum = parsePrice(product.sellingPrice);
  const consumerPriceNum = parsePrice(product.consumerPrice);
  const hasDiscount = sellingPriceNum > 0 && consumerPriceNum > 0 && sellingPriceNum < consumerPriceNum;

  return (
    <div className="bg-white relative print:border-none print:shadow-none mx-auto overflow-hidden batch-printable printable-label" 
         style={{ width: '72mm', height: '40mm', direction: 'rtl' }}>
         
      <div 
        className="w-full h-full bg-white text-black box-border flex flex-col justify-between overflow-hidden p-[2.5mm] break-inside-avoid print:break-inside-avoid"
        style={{ fontFamily: '"Vazirmatn", "IRANSansX", sans-serif', direction: 'rtl' }}
      >
        {/* 1. Header: Product Name & Code */}
        <div className="flex flex-col items-start leading-tight mb-1 w-full shrink-0 mt-[1px]">
          <AutoTextScaler text={toPersianDigits(product.name || 'نام کالا نامشخص')} />
          <span className="text-[11px] pt-[1px] font-medium text-black mt-0.5">
            {toPersianDigits(product.code || '')}
          </span>
        </div>

        {/* 2. Middle Row: Prices & Discount Badge */}
        <div className="flex-1 flex justify-between items-start w-full mt-0 mb-0">
          {/* Discount Badge (Right) */}
          <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: '80px', height: '50px', marginTop: '-2px' }}>
            {(() => {
              const isOldPrice = product.isOldPrice;
              const showDiscount = hasDiscount && product.discountPercentage && product.discountPercentage !== '0' && product.discountPercentage !== '0.00%' && product.discountPercentage !== '0%';
              
              if (isOldPrice && showDiscount) {
                return (
                  <>
                    <img src={oldPriceIcon} alt="قیمت قدیم" className="w-full h-full object-contain print:color-adjust-exact" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />
                    <div 
                      className="absolute -top-1 -left-2 w-[30px] h-[30px] -ml-[8px] -mt-[6px] mb-0 rounded-full bg-gray-300 flex items-center justify-center z-10 print:color-adjust-exact"
                      style={{ 
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }}
                    >
                      <span className="text-[14px] font-black leading-none text-black print:text-black mt-0.5" dir="ltr" style={{ WebkitTextFillColor: 'black' }}>
                        {toPersianDigits(Math.round(parseFloat(product.discountPercentage as string)))}٪
                      </span>
                    </div>
                  </>
                );
              } else if (isOldPrice) {
                return <img src={oldPriceIcon} alt="قیمت قدیم" className="w-full h-full object-contain print:color-adjust-exact" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />;
              } else if (showDiscount) {
                return (
                  <div 
                    className="flex flex-col items-center justify-center bg-no-repeat bg-contain bg-center print:color-adjust-exact mt-0 mb-0"
                    style={{ 
                      width: '58px', 
                      height: '42px',
                      backgroundImage: `url(${badgeBg})`,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
                    <span className="text-[20px] font-black leading-none text-white print:text-white mt-1" dir="ltr" style={{ WebkitTextFillColor: 'white' }}>
                      {toPersianDigits(Math.round(parseFloat(product.discountPercentage as string)))}٪
                    </span>
                  </div>
                );
              } else {
                return <div style={{ width: '10px' }}></div>;
              }
            })()}
          </div>

          {/* Prices (Left) */}
          <div className="flex flex-col items-end mr-auto shrink-0 -mt-[3px]">
            {hasDiscount ? (
              <>
                {/* Old Price */}
                <div className="flex items-center gap-1 -mt-[2px] mb-0 pt-[2px]">
                  <span className="text-[22px] font-bold text-black/80 leading-none line-through decoration-slate-700 decoration-2">
                    {formatPricePersian(product.consumerPrice)}
                  </span>
                  <img src={tomanIcon} alt="تومان" className="w-[18px] h-[18px] object-contain opacity-70" />
                </div>
                {/* New Price */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[34px] font-black tracking-tighter leading-none">
                    {formatPricePersian(product.sellingPrice)}
                  </span>
                  <img src={tomanIcon} alt="تومان" className="w-[24px] h-[24px] object-contain" />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[34px] font-black tracking-tighter leading-none">
                  {formatPricePersian(product.sellingPrice) || '-'}
                </span>
                {product.sellingPrice && <img src={tomanIcon} alt="تومان" className="w-[24px] h-[24px] object-contain" />}
              </div>
            )}
          </div>
        </div>

        {/* 3. Footer: Date & Barcode */}
        <div className="flex justify-between items-end w-full shrink-0 mt-0 mb-[1px] pb-0.5">
          {/* Bottom Right: Barcode — uses CODE128 format with width=2 */}
          <div className="flex flex-col items-center break-inside-avoid print:break-inside-avoid">
            {product.barcode ? (
              <div className="flex flex-col items-center justify-center shrink-0" style={{ maxWidth: '100%' }}>
                <div className="font-normal flex items-center justify-center shrink-0" dir="ltr">
                  <Barcode 
                     value={product.barcode.trim()} 
                     format={/^\d{13}$/.test(product.barcode.trim()) ? "EAN13" : "CODE128"}
                     width={/^\d{13}$/.test(product.barcode.trim()) ? 1.8 : 1.5} 
                     height={30} 
                     margin={1} 
                     background="transparent" 
                     lineColor="#000000"
                     displayValue={true}
                     fontSize={12}
                  />
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-medium">بدون بارکد</div>
            )}
          </div>

          {/* Bottom Left: Date — uses product date fields instead of today */}
          <div className="text-[10px] font-medium text-black leading-none mb-0.5">
            {toPersianDigits(getProductDate(product))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LabelPreview({ product, spreadsheetId, onAddToQueue, isBatchPrinting, operatorName }: LabelPreviewProps) {
  const [editableProduct, setEditableProduct] = useState<Product>(product);
  const [quantity, setQuantity] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    setEditableProduct(product);
  }, [product]);

const handlePrint = async () => {
    setIsPrinting(true);
    
    try {
      const label = document.querySelector('#single-print-label-container .printable-label');
      if (label) {
          const clone = label.cloneNode(true) as HTMLElement;
          
          const wrapper = document.createElement('div');
          wrapper.className = 'batch-print-portal batch-page-wrapper';
          wrapper.style.position = 'static';
          wrapper.style.visibility = 'visible';
          wrapper.style.zIndex = '999999';
          
          wrapper.appendChild(clone);
          document.body.appendChild(wrapper);
          
          document.body.classList.add('is-batch-printing');
          
          setTimeout(() => {
            window.print();
            document.body.classList.remove('is-batch-printing');
            document.body.removeChild(wrapper);
            setIsPrinting(false);
            
            if (spreadsheetId) {
              try {
                appendLog(spreadsheetId, 'چاپ لیبل', editableProduct, operatorName).catch(err => {
                  console.warn('Failed to log print action', err);
                });
              } catch (err) {
                console.warn('Failed to log print action', err);
              }
            }
          }, 500);
      } else {
          setIsPrinting(false);
      }
    } catch (err) {
      console.error('Print error:', err);
      alert("خطا در چاپ: " + String(err));
      setIsPrinting(false);
    }
  };

  const handleChange = (field: keyof Product, value: string) => {
    setEditableProduct(prev => ({ ...prev, [field]: value }));
  };

  const sellingPriceNum = parsePrice(editableProduct.sellingPrice);
  const consumerPriceNum = parsePrice(editableProduct.consumerPrice);
  const hasDiscount = sellingPriceNum > 0 && consumerPriceNum > 0 && sellingPriceNum < consumerPriceNum;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-full">
      {/* Top Action Bar */}
      <div className="bg-slate-50/80 dark:bg-slate-800/40 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <h2 className="font-extrabold text-base flex items-center gap-2.5 text-slate-800 dark:text-white">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Printer className="w-5 h-5" />
          </div>
          ویرایشگر لیبل حرارتی (72×40mm)
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <span className="text-xs font-bold text-slate-400">تعداد:</span>
            <input 
              type="number" 
              min="1"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-10 h-7 text-center text-sm font-black bg-transparent border-none outline-none text-slate-800 dark:text-white"
            />
          </div>

          <button 
            onClick={() => {
              onAddToQueue?.(editableProduct, quantity);
              setQuantity(1);
            }}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md transition-all whitespace-nowrap active:scale-95"
          >
            افزودن به صف
          </button>

          <button 
            onClick={() => handlePrint()}
            disabled={isPrinting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap flex items-center justify-center min-w-[110px] active:scale-95 disabled:opacity-50"
          >
            {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'چاپ سریع'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-50/50 dark:bg-slate-950 p-4 lg:p-6 flex flex-col lg:flex-row gap-6 overflow-y-auto print:bg-transparent print:p-0">

        {/* Live Preview Area - Displayed prominently */}
        <div id="single-print-label-container" className={`w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-inner print:w-full print:block print:bg-transparent print:p-0 print:border-none ${isBatchPrinting ? 'print:hidden' : ''}`}>
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 print:hidden tracking-wider uppercase">پیش‌نمایش خروجی چاپ</div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl print:p-0 print:bg-transparent print:border-none print:shadow-none">
            <ThermalLabelUI product={editableProduct} />
          </div>
        </div>

        {/* Editor Form */}
        <div id="label-editor-section" className="w-full lg:w-1/2 flex flex-col gap-4 print:hidden bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">مشخصات کالا</span>
            <span className="text-[11px] font-medium text-slate-400">ویرایش زنده</span>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400">نام کالا</label>
            <textarea 
              value={editableProduct.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400">قیمت فروش (تومان)</label>
              <input 
                type="text" 
                value={editableProduct.sellingPrice}
                onChange={(e) => handleChange('sellingPrice', e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400">قیمت مصرف‌کننده (تومان)</label>
              <input 
                type="text" 
                value={editableProduct.consumerPrice}
                onChange={(e) => handleChange('consumerPrice', e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400">درصد تخفیف</label>
              <input 
                type="text" 
                value={editableProduct.discountPercentage}
                onChange={(e) => handleChange('discountPercentage', e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400">کد کالا</label>
              <input 
                type="text" 
                value={editableProduct.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between gap-4 pt-1">
              <div className="flex-1">
                <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400">بارکد</label>
                <input 
                  type="text" 
                  value={editableProduct.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2 mt-5 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <input 
                  type="checkbox" 
                  id="isOldPrice"
                  checked={editableProduct.isOldPrice || false}
                  onChange={(e) => handleChange('isOldPrice', e.target.checked as any)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isOldPrice" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  قیمت قدیم
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
