import React, { useMemo } from 'react';
import { MeasurementSheet, ProjectInfo } from '../types';
import { formatNumber } from '../utils';
import { FileText, Printer, Info } from 'lucide-react';

interface Props {
  sheets: MeasurementSheet[];
  previousQuantities: Record<string, number>; 
  setPreviousQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  projectInfo: ProjectInfo;
}

export const PaymentSummary: React.FC<Props> = ({ sheets, previousQuantities, setPreviousQuantities, projectInfo }) => {
  
  // --- VERİ HESAPLAMA VE GRUPLAMA ---
 // --- VERİ HESAPLAMA VE GRUPLAMA ---
  const summaryData = useMemo(() => {
    const grouped: Record<string, any> = {};

    sheets.forEach(sheet => {
      // Benzersiz gruplama anahtarı: Poz No + Cetvel Adı
      const groupKey = `${sheet.code}_${sheet.groupName}`;

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          code: sheet.code,
          description: sheet.groupName, // İcmalde İşin Cinsi olarak Cetvel Adı görünsün
          unit: sheet.unit,
          unitPrice: sheet.unitPrice,
          totalQuantity: 0,
          prevQuantity: 0 
        };
      }
      grouped[groupKey].totalQuantity += sheet.totalAmount;
      grouped[groupKey].prevQuantity += (previousQuantities[sheet.id] || 0); 
    });

    return Object.values(grouped).map(item => {
      const currentQty = item.totalQuantity - item.prevQuantity;    
      
      return {
        ...item,
        currentQuantity: currentQty,
        prevAmount: item.prevQuantity * item.unitPrice,
        currentAmount: currentQty * item.unitPrice,
        totalAmount: item.totalQuantity * item.unitPrice
      };
    });
  }, [sheets, previousQuantities]);

  const totalPrevAmount = summaryData.reduce((acc, row) => acc + row.prevAmount, 0);
  const totalCurrentAmount = summaryData.reduce((acc, row) => acc + row.currentAmount, 0);
  const totalGrandAmount = summaryData.reduce((acc, row) => acc + row.totalAmount, 0);

  return (
    <div className="bg-white p-4 md:p-8 rounded-xl border border-slate-200 shadow-sm min-h-full font-sans">
      
      {/* Üst Başlık */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 no-print gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
               <FileText size={20} />
            </div>
            Hakediş İcmal Özeti
          </h2>
          <p className="text-slate-500 text-xs mt-2 max-w-2xl flex items-center gap-1.5">
            <Info size={14} className="text-blue-500" />
            "Önceki Dönem" metrajlarını Yeşil Defter sekmesinden güncelleyebilirsiniz. İcmal tablosundaki değerler otomatik olarak hesaplanır.
          </p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition text-sm font-medium shadow-sm"
        >
          <Printer size={16} /> Tabloyu Yazdır
        </button>
      </div>

      {/* --- TABLO --- */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
          <thead>
            {/* 1. Satır: Ana Başlıklar */}
            <tr>
              <th colSpan={4} className="p-3 border-b border-r border-slate-200 bg-slate-50 text-center font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                İş Kalemi Bilgileri
              </th>
              <th colSpan={3} className="p-3 border-b border-r border-slate-200 bg-blue-50/50 text-center font-bold text-blue-800 uppercase tracking-wider text-[10px]">
                Yapılan İş Miktarı
              </th>
              <th colSpan={3} className="p-3 border-b border-slate-200 bg-emerald-50/50 text-center font-bold text-emerald-800 uppercase tracking-wider text-[10px]">
                Yapılan İş Tutarı (TL)
              </th>
            </tr>
            
            {/* 2. Satır: Alt Başlıklar */}
            <tr className="bg-slate-50 text-center text-[10px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <th className="border-r border-slate-200 p-2 w-24">Poz No</th>
              <th className="border-r border-slate-200 p-2 text-left">İşin Cinsi</th>
              <th className="border-r border-slate-200 p-2 w-16">Birim</th>
              <th className="border-r border-slate-200 p-2 w-24 text-right">Birim Fiyat</th>
              
              {/* Miktar */}
              <th className="border-r border-slate-200 p-2 w-24 bg-amber-50/50 text-amber-700">Önceki Dönem</th>
              <th className="border-r border-slate-200 p-2 w-24 bg-blue-50 text-blue-700">Bu Dönem</th>
              <th className="border-r border-slate-200 p-2 w-24">Toplam</th>
              
              {/* Tutar */}
              <th className="border-r border-slate-200 p-2 w-28">Önceki Dönem</th>
              <th className="border-r border-slate-200 p-2 w-28 bg-emerald-50 text-emerald-700">Bu Dönem</th>
              <th className="p-2 w-28">Toplam</th>
            </tr>
          </thead>

          <tbody className="text-slate-700 divide-y divide-slate-100">
            {summaryData.length > 0 ? (
              summaryData.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="border-r border-slate-100 p-2.5 font-mono text-center text-slate-500">{row.code}</td>
                  <td className="border-r border-slate-100 p-2.5 truncate max-w-[200px]" title={row.description}>{row.description}</td>
                  <td className="border-r border-slate-100 p-2.5 text-center text-slate-500">{row.unit}</td>
                  <td className="border-r border-slate-100 p-2.5 text-right font-mono text-slate-600">
                    {formatNumber(row.unitPrice, 2)}
                  </td>

                  {/* 1. ÖNCEKİ (Yeşil Defterden Gelir - Sadece Okuma) */}
                  <td className="border-r border-slate-100 p-2.5 text-right font-mono font-medium text-amber-700 bg-amber-50/10">
                    {formatNumber(row.prevQuantity, 3)}
                  </td>

                  {/* 2. BU DÖNEM */}
                  <td className="border-r border-slate-100 p-2.5 text-right font-mono font-semibold text-blue-600 bg-blue-50/10">
                    {formatNumber(row.currentQuantity, 3)}
                  </td>

                  {/* 3. TOPLAM */}
                  <td className="border-r border-slate-200 p-2.5 text-right font-mono font-medium bg-slate-50/50">
                    {formatNumber(row.totalQuantity, 3)}
                  </td>

                  {/* TUTARLAR */}
                  <td className="border-r border-slate-100 p-2.5 text-right font-mono text-slate-500">
                    {formatNumber(row.prevAmount, 2)}
                  </td>
                  <td className="border-r border-slate-100 p-2.5 text-right font-mono font-semibold text-emerald-600 bg-emerald-50/10">
                    {formatNumber(row.currentAmount, 2)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-semibold text-slate-800 bg-slate-50/50">
                    {formatNumber(row.totalAmount, 2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText size={32} className="text-slate-200" />
                    <span className="text-sm">Henüz hesaplama yapılacak veri bulunamadı.</span>
                    <span className="text-xs">Metraj Cetvelleri sekmesinden yeni veri ekleyebilirsiniz.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>

          {/* DİP TOPLAM */}
          {summaryData.length > 0 && (
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={4} className="border-r border-slate-200 p-3 text-right font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Genel Toplam
                </td>
                <td className="border-r border-slate-200 bg-white"></td>
                <td className="border-r border-slate-200 bg-white"></td>
                <td className="border-r border-slate-200 bg-white"></td>
                
                <td className="border-r border-slate-200 p-3 text-right font-mono font-medium text-slate-500">
                  {formatNumber(totalPrevAmount, 2)}
                </td>
                <td className="border-r border-slate-200 p-3 text-right font-mono font-bold text-emerald-600 text-sm">
                  {formatNumber(totalCurrentAmount, 2)}
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-800 text-sm">
                  {formatNumber(totalGrandAmount, 2)} <span className="text-[10px] text-slate-500 font-sans ml-1">TL</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* DİNAMİK İMZA BLOĞU (Sadece Çıktıda Görünür) */}
      <div className="mt-16 hidden print:grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 px-8 text-sm print:gap-x-4 w-full">
         {(projectInfo?.signatories || []).map((sig, index) => (
           <div key={index} className="text-center flex flex-col items-center min-w-0">
              <div className="w-full border-b border-black pb-1 mb-4 flex items-end justify-center min-h-[2em]">
                  <p className="font-bold uppercase break-words w-full text-xs text-black">
                    {sig.title}
                  </p>
              </div>
              <p className="break-words w-full text-xs text-black">
                 {sig.name ? sig.name : '...................................'}
              </p>
           </div>
         ))}
      </div>

    </div>
  );
};