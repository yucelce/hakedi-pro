export interface Measurement {
  id: string;
  description: string;
  width: number; // En
  length: number; // Boy
  height: number; // Yükseklik
  count: number; // Adet (Benzer)
}

export interface WorkItem {
  id: string;
  code: string; // Poz No (örn: 15.120.100)
  description: string; // Tanım
  unit: string; // Birim (m3, m2, vb)
  unitPrice: number; // Birim Fiyat
  previousQuantity: number; // Önceki Miktar (Kümülatiften gelen)
  measurements: Measurement[]; // Metraj satırları
}

export interface ProjectInfo {
  projectName: string;
  contractor: string; // Yüklenici
  employer: string; // İdare/İşveren
  period: string; // Hakediş Dönemi (örn: 1 Nolu Hakediş)
  date: string;
}

export type TabView = 'input' | 'report';