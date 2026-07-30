import * as XLSX from 'xlsx';
import { Product } from '../types';

export interface PrintQueueExportItem {
  product: Product;
  quantity: number;
}

export function exportQueueToExcel(printQueue: PrintQueueExportItem[]) {
  const data = printQueue.map((item, index) => ({
    'ردیف': index + 1,
    'نام کالا': item.product.name || '',
    'کد کالا': item.product.code || '',
    'بارکد': item.product.barcode || '',
    'قیمت فروش (تومان)': item.product.sellingPrice || '',
    'قیمت مصرف‌کننده (تومان)': item.product.consumerPrice || '',
    'درصد تخفیف': item.product.discountPercentage || '0%',
    'تعداد چاپ': item.quantity || 1,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'صف چاپ');

  const colWidths = [
    { wch: 6 },
    { wch: 35 },
    { wch: 15 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
  ];
  worksheet['!cols'] = colWidths;

  const fileName = `صف_چاپ_پالود_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportLogsToExcel(logs: any[]) {
  const data = logs.map((log, index) => ({
    'ردیف': index + 1,
    'تاریخ و زمان': log.timestamp || '',
    'نوع عملیات': log.action || '',
    'نام کالا': log.productName || '',
    'کد کالا': log.productCode || '',
    'بارکد': log.barcode || '',
    'قیمت فروش': log.sellingPrice || '',
    'قیمت مصرف‌کننده': log.consumerPrice || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'تاریخچه چاپ');

  const colWidths = [
    { wch: 6 },
    { wch: 22 },
    { wch: 15 },
    { wch: 35 },
    { wch: 15 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
  ];
  worksheet['!cols'] = colWidths;

  const fileName = `تاریخچه_چاپ_پالود_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
