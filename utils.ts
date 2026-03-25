import { MeasurementSheet, Measurement, SheetType } from './types'; // SheetType eklendi

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

// Tek bir metraj satırının hacmini veya ağırlığını hesaplar
// Tek bir metraj satırının hacmini veya ağırlığını hesaplar
export const calculateMeasurementRow = (m: Measurement, sheetType: SheetType = 'standard'): number => {
  
  // YARDIMCI FONKSİYON: Değer tanımsız, boş veya NaN ise varsayılan (defaultVal) değeri al.
  // Açıkça 0 (sıfır) girilmişse 0 değerini korur.
  const getVal = (val: number | undefined, defaultVal: number) => {
    return (val === undefined || val === null || Number.isNaN(val)) ? defaultVal : val;
  };

  if (sheetType === 'rebar') {
    const l = getVal(m.length, 0);
    const c = getVal(m.count, 1);
    
    let weightPerMeter = m.unitWeight;
    if ((!weightPerMeter || Number.isNaN(weightPerMeter)) && m.diameter && !Number.isNaN(m.diameter)) {
      weightPerMeter = (m.diameter * m.diameter) / 162; 
    }
    
    return l * c * getVal(weightPerMeter, 0);
  }

  // Boş bırakılanları "1" kabul et, 0 yazılanları "0" al.
  const w = getVal(m.width, 1);
  const l = getVal(m.length, 1);
  const h = getVal(m.height, 1);
  const c = getVal(m.count, 1); 
  
  // Sadece en, boy ve yüksekliğin ÜÇÜ DE boş/tanımsız ise sonucu 0 döndür
  const isEmpty = (val: number | undefined) => val === undefined || val === null || Number.isNaN(val);
  if (isEmpty(m.width) && isEmpty(m.length) && isEmpty(m.height)) return 0;
  
  return w * l * h * c;
};
// Bir Metraj Cetvelinin (Sayfanın) Toplamını Hesaplar
export const calculateSheetTotal = (sheet: MeasurementSheet): number => {
  return sheet.measurements.reduce((acc, m) => acc + calculateMeasurementRow(m, sheet.type), 0);
};