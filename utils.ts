// utils.ts
import { MeasurementSheet, Measurement } from './types';

// Benzersiz ID üretici
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Sayı Formatlayıcı
export const formatNumber = (num: number | undefined, decimals: number = 2): string => {
  if (num === undefined || num === null || isNaN(num)) return '0,00';
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Para Formatlayıcı
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount);
};

// Tek bir metraj satırının hacmini hesaplar (En x Boy x Yük x Adet)
export const calculateMeasurementRow = (m: Measurement): number => {
  // Değer 0, null, undefined veya NaN ise 1 kabul et (Etkisiz eleman)
  const w = m.width || 1;
  const l = m.length || 1;
  const h = m.height || 1;
  // Adet 0 girilse bile çarpımı sıfırlamasın diye 1 kabul ediyoruz (kullanıcı isteği)
  const c = m.count || 1; 
  
  // Eğer boyut girilmemişse (sadece açıklama varsa) 0 döndür
  // Not: Kullanıcı 0 girmişse bu defined sayılır, yukarıda 1'e çevrilir ve hesaplanır.
  if (m.width === undefined && m.length === undefined && m.height === undefined) return 0;
  
  return w * l * h * c;
};

// Bir Metraj Cetvelinin (Sayfanın) Toplamını Hesaplar
export const calculateSheetTotal = (sheet: MeasurementSheet): number => {
  return sheet.measurements.reduce((acc, m) => acc + calculateMeasurementRow(m), 0);
};