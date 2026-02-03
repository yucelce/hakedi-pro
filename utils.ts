import { WorkItem, Measurement } from './types';

// Generate a random ID
export const generateId = (): string => Math.random().toString(36).substr(2, 9);

// Calculate volume/area for a single measurement line
export const calculateMeasurementTotal = (m: Measurement): number => {
  // If a dimension is 0, we treat it as 1 for multiplication identity if it's not relevant, 
  // but standard metraj usually implies multiplication. 
  // Safety check: if inputs are empty, default to 0 for the result.
  const w = m.width === 0 ? 1 : m.width;
  const l = m.length === 0 ? 1 : m.length;
  const h = m.height === 0 ? 1 : m.height;
  const c = m.count === 0 ? 0 : m.count; // If count is 0, total is 0
  
  // Logic: Some items might be m2, so height might be entered as 0 or 1.
  // We will assume 0 means "ignore dimension" (treat as 1), UNLESS all dimensions are 0.
  if (m.width === 0 && m.length === 0 && m.height === 0) return 0;

  return w * l * h * c;
};

// Calculate total current quantity for a work item
export const calculateItemCurrentQuantity = (item: WorkItem): number => {
  return item.measurements.reduce((acc, m) => acc + calculateMeasurementTotal(m), 0);
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

// Formatter for numbers (quantities)
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};