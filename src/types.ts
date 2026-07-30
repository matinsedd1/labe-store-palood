export interface Product {
  code: string; // کد کالا
  name: string; // نام کالا
  discountPercentage: string; // درصد تخفیف
  sellingPrice: string; // قیمت فروش فعلی
  consumerPrice: string; // قیمت مصرفکننده
  barcode: string; // بارکد
  barcode2?: string; // بارکد دوم
  productionDate?: string; // تاریخ تولید
  expirationDate?: string; // تاریخ انقضا
  isOldPrice?: boolean; // نشان قیمت قدیم
}

export type Role = 'admin' | 'operator';

export interface User {
  username: string;
  password?: string;
  name: string;
  role: Role;
}

export type Theme = 'light' | 'dark';
