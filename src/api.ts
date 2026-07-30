import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    code: '1001',
    name: 'پنیر سفید پاستوریزه ۴۰۰ گرمی پالود',
    discountPercentage: '10',
    sellingPrice: '45000',
    consumerPrice: '50000',
    barcode: '6260123456789',
    barcode2: '6260123456790',
    productionDate: '1403/05/01',
    expirationDate: '1403/08/01',
  },
  {
    code: '1002',
    name: 'شیر کم چرب ۱ لیتر پالود',
    discountPercentage: '15',
    sellingPrice: '29750',
    consumerPrice: '35000',
    barcode: '6260123456791',
    barcode2: '6260123456795',
    productionDate: '1403/05/05',
    expirationDate: '1403/05/10',
  },
  {
    code: '1003',
    name: 'ماست دبه‌ای پرچرب ۲.۵ کیلوگرم پالود',
    discountPercentage: '5',
    sellingPrice: '114000',
    consumerPrice: '120000',
    barcode: '6260123456792',
    productionDate: '1403/04/20',
    expirationDate: '1403/05/20',
  },
  {
    code: '1004',
    name: 'خامه صبحانه ۲۰۰ گرم پالود',
    discountPercentage: '0',
    sellingPrice: '38000',
    consumerPrice: '38000',
    barcode: '6260123456793',
    productionDate: '1403/05/02',
    expirationDate: '1403/05/17',
  },
  {
    code: '1005',
    name: 'کره حیوانی ۱۰۰ گرم پالود',
    discountPercentage: '20',
    sellingPrice: '32000',
    consumerPrice: '40000',
    barcode: '6260123456794',
    productionDate: '1403/04/15',
    expirationDate: '1403/10/15',
  }
];

export async function fetchSheetData(spreadsheetId: string): Promise<Product[]> {
  const getCached = () => {
    try {
      const cached = localStorage.getItem(`cached_products_${spreadsheetId}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  };

  let res: Response;
  try {
    res = await fetch(`/api/sheets/${spreadsheetId}`);
  } catch (err) {
    const cached = getCached();
    if (cached) return cached;
    throw new Error('اتصال اینترنت قطع است و داده ذخیره‌شده‌ای یافت نشد');
  }

  let text = '';
  try {
    text = await res.text();
  } catch(e) {
    const cached = getCached();
    if (cached) return cached;
    throw new Error('Failed to read response body');
  }

  if (!res.ok) {
    const cached = getCached();
    if (cached) return cached;

    let errorMsg = 'خطا در دریافت اطلاعات شیت';
    try {
      const error = JSON.parse(text);
      errorMsg = error.error || errorMsg;
    } catch(e) {
      console.error('Raw error response:', text);
      errorMsg = `خطای سرور (${res.status}): ${text.substring(0, 100)}`;
    }
    throw new Error(errorMsg);
  }

  let rows: string[][] = [];
  try {
    rows = JSON.parse(text);
  } catch(e) {
    console.error('Failed to parse JSON, raw response:', text);
    throw new Error('پاسخ سرور نامعتبر است (JSON)');
  }

  if (!rows || rows.length === 0) return [];

  // Parse headers
  const headers = rows[0].map(h => h.trim());
  
  // Find column indexes using fuzzy matching based on expected column names
  const codeIdx = headers.findIndex(h => h.includes('کد کالا'));
  const nameIdx = headers.findIndex(h => h.includes('نام کالا'));
  const discountIdx = headers.findIndex(h => h.includes('تخفیف'));
  const sellingPriceIdx = headers.findIndex(h => h.includes('قیمت فروش'));
  const consumerPriceIdx = headers.findIndex(h => h.includes('قیمت مصرف'));
  
  // Barcode 1 logic: check for "پیش فرض" (primary), but exclude "غیر پیش فرض" (non-primary)
  const barcodeIdx = headers.findIndex(h => h.includes('پیش فرض') && !h.includes('غیر'));
  // Barcode 2 logic: check for "غیر پیش فرض" (secondary)
  const barcode2Idx = headers.findIndex(h => h.includes('غیر پیش فرض'));
  // Production and Expiration dates
  const prodDateIdx = headers.findIndex(h => h.includes('تاریخ تولید'));
  const expDateIdx = headers.findIndex(h => h.includes('تاریخ انقضا') || h.includes('تاریخ انقضاء'));

  const products: Product[] = [];

  const processPrice = (val: string) => {
    if (!val) return '';
    const cleaned = val.replace(/[^\d.-]/g, '');
    if (cleaned !== '' && !isNaN(Number(cleaned))) {
      return (Number(cleaned) / 10).toString();
    }
    return val;
  };

  const processDiscount = (val: string) => {
    if (!val) return '';
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return Math.round(num).toString();
    }
    return val;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    let sellingPrice = sellingPriceIdx !== -1 ? (row[sellingPriceIdx] || '') : '';
    let consumerPrice = consumerPriceIdx !== -1 ? (row[consumerPriceIdx] || '') : '';
    let discountPercentage = discountIdx !== -1 ? (row[discountIdx] || '') : '';

    products.push({
      code: codeIdx !== -1 ? (row[codeIdx] || '') : '',
      name: nameIdx !== -1 ? (row[nameIdx] || '') : '',
      discountPercentage: processDiscount(discountPercentage),
      sellingPrice: processPrice(sellingPrice),
      consumerPrice: processPrice(consumerPrice),
      barcode: barcodeIdx !== -1 ? (row[barcodeIdx] || '') : '',
      barcode2: barcode2Idx !== -1 ? (row[barcode2Idx] || '') : '',
      productionDate: prodDateIdx !== -1 ? (row[prodDateIdx] || '') : '',
      expirationDate: expDateIdx !== -1 ? (row[expDateIdx] || '') : '',
    });
  }

  // Save to offline cache
  try {
    localStorage.setItem(`cached_products_${spreadsheetId}`, JSON.stringify(products));
  } catch (e) {
    console.warn('Failed to cache products locally', e);
  }

  return products;
}

export async function fetchUsers(spreadsheetId: string) {
  if (!spreadsheetId || spreadsheetId === 'local') {
    return [
      ['نام کاربری', 'رمز عبور', 'نام و نام خانوادگی', 'نقش'],
      ['admin', 'admin123', 'مدیر سیستم', 'admin'],
      ['operator', '1234', 'اپراتور انبار', 'operator']
    ];
  }

  try {
    const res = await fetch(`/api/sheets/${spreadsheetId}/users`);
    let text = await res.text();
    if (!res.ok) {
      return [
        ['نام کاربری', 'رمز عبور', 'نام و نام خانوادگی', 'نقش'],
        ['admin', 'admin123', 'مدیر سیستم', 'admin'],
        ['operator', '1234', 'اپراتور انبار', 'operator']
      ];
    }
    return JSON.parse(text);
  } catch (e) {
    console.warn('Could not fetch users, fallback to default:', e);
    return [
      ['نام کاربری', 'رمز عبور', 'نام و نام خانوادگی', 'نقش'],
      ['admin', 'admin123', 'مدیر سیستم', 'admin'],
      ['operator', '1234', 'اپراتور انبار', 'operator']
    ];
  }
}

export async function fetchLogs(spreadsheetId: string) {
  if (!spreadsheetId || spreadsheetId === 'local') {
    const localLogs = localStorage.getItem('local_logs');
    if (localLogs) {
      try { return JSON.parse(localLogs); } catch(e) {}
    }
    return [
      [new Date().toLocaleString('fa-IR'), 'چاپ لیبل', '1001', 'پنیر سفید پاستوریزه ۴۰۰ گرمی پالود', '45000', 'مدیر سیستم'],
      [new Date().toLocaleString('fa-IR'), 'اسکن کالا', '1002', 'شیر کم چرب ۱ لیتر پالود', '29750', 'اپراتور انبار']
    ];
  }

  try {
    const res = await fetch(`/api/sheets/${spreadsheetId}/logs`);
    let text = await res.text();
    if (!res.ok) {
      return [];
    }
    return JSON.parse(text);
  } catch (e) {
    console.warn('Could not fetch remote logs, using local fallback:', e);
    return [];
  }
}

export async function appendLog(spreadsheetId: string, action: string, product: Product, operatorName?: string) {
  if (!spreadsheetId || spreadsheetId === 'local') {
    const existing = JSON.parse(localStorage.getItem('local_logs') || '[]');
    const newEntry = [new Date().toLocaleString('fa-IR'), action, product.code, product.name, product.sellingPrice, operatorName || 'ناشناس'];
    existing.unshift(newEntry);
    localStorage.setItem('local_logs', JSON.stringify(existing));
    return { success: true };
  }

  try {
    const res = await fetch(`/api/sheets/${spreadsheetId}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        code: product.code,
        name: product.name,
        price: product.sellingPrice,
        operator: operatorName || 'ناشناس',
      }),
    });

    let text = await res.text();
    if (!res.ok) return { success: false };
    return JSON.parse(text);
  } catch (e) {
    console.warn('Could not append remote log:', e);
    return { success: false };
  }
}
