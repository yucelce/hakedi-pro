export interface Measurement {
  id: string;
  description: string;
  width: number | undefined;
  length: number | undefined;
  height: number | undefined;
  count: number;
  subtotal: number;
}

export interface MeasurementSheet {
  id: string;
  groupName: string;
  code: string;
  description: string;
  unit: string;
  unitPrice: number;
  measurements: Measurement[];
  totalAmount: number;
  calculatedCost: number;
}

export interface Signatory {
  title: string;
  name: string;
}

export interface ProjectInfo {
  projectName: string;
  contractor: string;
  employer: string;
  period: string;
  date: string;
  signatories: Signatory[];
}

// --- YENİ EKLENEN TİPLER ---
export interface CoverRow {
  id: string;
  description: string;
  prevAmount: number;    // Önceki Dönem Tutarı
  currentAmount: number; // Bu Dönem Tutarı
}

export interface CoverData {
  kdvRate: number;              // KDV Oranı
  extraPayments: CoverRow[];    // A) Bölümüne eklenecek manuel satırlar
  deductions: CoverRow[];       // B) Kesintiler bölümüne eklenecek manuel satırlar
}

export type TabView = 'input' | 'summary' | 'cover' | 'report' | 'settings';