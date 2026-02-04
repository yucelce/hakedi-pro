import { WorkItem, Measurement } from './types';

// Calculate volume/area for a single measurement line
export const calculateMeasurementTotal = (m: Measurement): number => {
  const w = m.width ?? 1;
  const l = m.length ?? 1;
  const h = m.height ?? 1;
  const c = m.count ?? 0;
  
  // If no dimensions are provided, return 0
  if (m.width === undefined && m.length === undefined && m.height === undefined) return 0;

  return w * l * h * c;
};

// Calculate total current quantity for a work item (sum of all sheets)
export const calculateItemCurrentQuantity = (item: WorkItem): number => {
  if (!item.sheets) return 0;
  return item.sheets.reduce((acc, sheet) => {
    return acc + sheet.measurements.reduce((mAcc, m) => mAcc + calculateMeasurementTotal(m), 0);
  }, 0);
};

// Calculate total amount (Price * Quantity)
export const calculateItemCurrentAmount = (item: WorkItem): number => {
  const qty = calculateItemCurrentQuantity(item);
  return qty * item.unitPrice;
};

// Formatter for currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount);
};

// Benzersiz ID üretici
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// İnşaat standartlarına uygun sayı formatlayıcı
export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};