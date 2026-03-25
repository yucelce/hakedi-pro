export interface Measurement {
  id: string;
  description: string;
  count: number;
  subtotal: number;
  // --- Standart Metraj Alanları ---
  width?: number;
  length?: number;
  height?: number;
  // --- Donatı Metrajı Alanları (YENİ) ---
  diameter?: number;    // Çap (Ø)
  unitWeight?: number;  // Birim Ağırlık (kg/m)
}

export type SheetType = 'standard' | 'rebar';

export interface MeasurementSheet {
  id: string;
  type?: SheetType; // Cetvelin tipi (eski veriler için undefined 'standard' sayılır)
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
  // --- YENİ EKLENEN SÖZLEŞME BİLGİLERİ ---
  ikn?: string;             // İhale Kayıt Numarası
  contractDate?: string;    // Sözleşme Tarihi
  siteDeliveryDate?: string;// Yer Teslim Tarihi
  duration?: string;        // İşin Süresi
  contractAmount?: number;  // Sözleşme Bedeli (KDV Hariç)
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

export type TabView = 'input' | 'summary' | 'cover' | 'report' | 'settings' | 'greenbook' | 'projects';