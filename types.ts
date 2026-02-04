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

// YENİ: İmza yetkilisi yapısı
export interface Signatory {
  title: string; // Örn: YÜKLENİCİ
  name: string;  // Örn: Ali Veli
}

export interface ProjectInfo {
  projectName: string;
  contractor: string;
  employer: string;
  period: string;
  date: string;
  signatories: Signatory[]; // YENİ EKLENEN ALAN
}

export type TabView = 'input' | 'summary' | 'cover' | 'report' | 'settings';