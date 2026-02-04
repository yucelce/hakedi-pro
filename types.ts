export interface Measurement {
  id: string;
  description: string;
  width: number | undefined;
  length: number | undefined;
  height: number | undefined;
  count: number;
  subtotal: number;
}

// Artık her şey bu yapıda tutulacak
export interface MeasurementSheet {
  id: string;
  groupName: string;   // Örn: "A Blok Temel" (Ekranda görünecek ana başlık)
  code: string;        // Örn: "15.120.100" (Raporlama için)
  description: string; // Örn: "C25/30 Hazır Beton" (Teknik tanım)
  unit: string;        // Birim
  unitPrice: number;   // Birim Fiyat (Gizli)
  measurements: Measurement[];
  totalAmount: number;
  calculatedCost: number;
}

export interface ProjectInfo {
  projectName: string;
  contractor: string;
  employer: string;
  period: string;
  date: string;
}

// types.ts
export type TabView = 'input' | 'summary' | 'cover' | 'report';

// Diğer tipler (MeasurementSheet, Measurement vb.) aynı kalıyor.