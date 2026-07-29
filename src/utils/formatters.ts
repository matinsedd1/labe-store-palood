/**
 * Shared formatting utilities for the label printing system.
 * Centralized from LabelPreview.tsx to eliminate code duplication.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/**
 * Convert Latin digits to Persian digits.
 */
export const toPersianDigits = (str: string | number | undefined | null): string => {
  if (!str) return '';
  return str.toString().replace(/\d/g, (x) => PERSIAN_DIGITS[parseInt(x)]);
};

/**
 * Format a price value with Persian digit locale separators.
 */
export const formatPricePersian = (price: string | number | undefined | null): string => {
  if (!price) return '';
  const num = Number(price.toString().replace(/\D/g, ''));
  if (isNaN(num) || num === 0) return toPersianDigits(price);
  return num.toLocaleString('fa-IR');
};

/**
 * Parse a price string to a numeric value, stripping non-digit characters.
 */
export const parsePrice = (priceStr: string | undefined | null): number => {
  if (!priceStr) return 0;
  return Number(priceStr.replace(/[^0-9]/g, ''));
};

/**
 * Validate whether a barcode string is a valid EAN-13 format (12-13 digits).
 */
export const isValidEAN = (barcode: string | undefined | null): boolean => {
  if (!barcode) return false;
  return /^\d{12,13}$/.test(barcode.trim());
};
